// No Node imports: tools/isswf-snapshot-core.mjs loads this in runtimes without Node built-ins.
export const planStates = Object.freeze(['pending', 'in-progress', 'blocked', 'in-review', 'awaiting-human', 'completed']);
export const hasEvidence = values => values.some(item => item.trim() && item.trim() !== 'None.');
// A plan error keeps its code as the message and says where it is: the job, the field and the 1-based line, when known.
const planError = (code, where = {}) => Object.assign(Error(code), { code }, Object.fromEntries(Object.entries(where).filter(([, value]) => value !== undefined)));
/** Where a plan error is, as JSON: its code and, when known, the job, field and 1-based line. */
export const planErrorDetail = error => ({ code: error?.code ?? String(error?.message ?? error), ...['job', 'field', 'line'].reduce((at, key) => (error?.[key] === undefined ? at : { ...at, [key]: error[key] }), {}) });
export function validateDependencyGraph(jobs) {
  const byId = new Map(jobs.map(job => [job.id, job])), visiting = new Set(), visited = new Set();
  function visit(job) {
    if (visiting.has(job.id)) throw planError('cyclic job dependencies', { job: job.id, field: 'Depends on', line: job.lines?.['Depends on'] });
    if (visited.has(job.id)) return;
    visiting.add(job.id);
    for (const dep of job.dependencies) visit(byId.get(dep));
    visiting.delete(job.id); visited.add(job.id);
  }
  for (const job of jobs) visit(job);
}
const FIELDS = ['Objective', 'Depends on', 'Brief', 'Blocker', 'Next step'];
export function parsePlan(markdown) {
  const jobs = [], seen = new Set(); let current, section, type, typeLine;
  for (const [index, line] of markdown.replaceAll('\r\n', '\n').split('\n').entries()) {
    const lineNo = index + 1;
    if (!current && line.startsWith('Type:')) {
      if (type !== undefined) throw planError('invalid-plan-type', { field: 'Type', line: lineNo });
      type = line.slice('Type:'.length).trim(); typeLine = lineNo;
      if (!['bug', 'enhancement', 'maintenance', 'research'].includes(type)) throw planError('invalid-plan-type', { field: 'Type', line: lineNo });
    }
    const header = /^## ([A-Z][A-Z0-9-]{0,63})$/u.exec(line);
    if (header) {
      if (seen.has(header[1])) throw planError('duplicate-job', { job: header[1], line: lineNo });
      seen.add(header[1]); current = { id: header[1], acceptance: [], evidence: [], line: lineNo, lines: {} }; jobs.push(current); section = null;
    } else if (current) {
      const field = section ? null : /^- (Status|Objective|Depends on|Brief|Blocker|Next step): (.+)$/u.exec(line);
      if (field) {
        if (Object.hasOwn(current, field[1])) throw planError('duplicate-field', { job: current.id, field: field[1], line: lineNo });
        current[field[1]] = field[2]; current.lines[field[1]] = lineNo;
      } else if (line === '### Acceptance') section = 'acceptance';
      else if (line === '### Evidence') section = 'evidence';
      else if (section && line.startsWith('- ')) current[section].push(line.slice(2));
    }
  }
  if (type === undefined) throw planError('invalid-plan-type', { field: 'Type', line: typeLine });
  if (!jobs.length || jobs.length > 100) throw planError('invalid-plan');
  const parsed = jobs.map(job => {
    const at = field => ({ job: job.id, field, line: job.lines[field] ?? job.line });
    if (!planStates.includes(job.Status)) throw planError('invalid-job', at('Status'));
    const missing = FIELDS.find(field => !job[field]);
    if (missing) throw planError('invalid-job', at(missing));
    if (!job.acceptance.length) throw planError('invalid-job', at('Acceptance'));
    const brief = /^\[brief-r([1-9][0-9]*)\.md\]\(jobs\/([A-Z][A-Z0-9-]{0,63})\/brief-r\1\.md\)(?: \(pending until prepared\))?$/u.exec(job.Brief);
    if (!brief || brief[2] !== job.id) throw planError('unsafe-brief-reference', at('Brief'));
    const dependencies = job['Depends on'] === 'None' ? [] : job['Depends on'].split(', ');
    if (new Set(dependencies).size !== dependencies.length || dependencies.some(dep => !seen.has(dep) || dep === job.id)) throw planError('invalid-dependency', at('Depends on'));
    const evidence = job.evidence.filter(item => item.trim() !== 'None.');
    if (job.Status === 'completed' && !hasEvidence(evidence)) throw planError('completed jobs require evidence', at('Evidence'));
    return { id: job.id, reportedStatus: job.Status, objective: job.Objective, dependencies, blocker: job.Blocker, nextStep: job['Next step'], acceptance: job.acceptance, evidence, briefName: `brief-r${brief[1]}.md`, lines: job.lines };
  });
  validateDependencyGraph(parsed);
  return parsed.map(({ lines, ...job }) => job);
}
