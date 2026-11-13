// No Node imports: tools/isswf-snapshot-core.mjs loads this in runtimes without Node built-ins.
export const planStates = Object.freeze(['pending', 'in-progress', 'blocked', 'in-review', 'awaiting-human', 'completed']);
export const hasEvidence = values => values.some(item => item.trim() && item.trim() !== 'None.');
export function validateDependencyGraph(jobs) {
  const byId = new Map(jobs.map(job => [job.id, job])), visiting = new Set(), visited = new Set();
  function visit(job) {
    if (visiting.has(job.id)) throw Error('cyclic job dependencies');
    if (visited.has(job.id)) return;
    visiting.add(job.id);
    for (const dep of job.dependencies) visit(byId.get(dep));
    visiting.delete(job.id); visited.add(job.id);
  }
  for (const job of jobs) visit(job);
}
export function parsePlan(markdown) {
  const jobs = [], seen = new Set(); let current, section, type;
  for (const line of markdown.replaceAll('\r\n', '\n').split('\n')) {
    if (!current && line.startsWith('Type:')) {
      if (type !== undefined) throw Error('invalid-plan-type');
      type = line.slice('Type:'.length).trim();
      if (!['bug', 'enhancement', 'maintenance', 'research'].includes(type)) throw Error('invalid-plan-type');
    }
    const header = /^## ([A-Z][A-Z0-9-]{0,63})$/u.exec(line);
    if (header) {
      if (seen.has(header[1])) throw Error('duplicate-job');
      seen.add(header[1]); current = { id: header[1], acceptance: [], evidence: [] }; jobs.push(current); section = null;
    } else if (current) {
      const field = section ? null : /^- (Status|Objective|Depends on|Brief|Blocker|Next step): (.+)$/u.exec(line);
      if (field) {
        if (Object.hasOwn(current, field[1])) throw Error('duplicate-field');
        current[field[1]] = field[2];
      } else if (line === '### Acceptance') section = 'acceptance';
      else if (line === '### Evidence') section = 'evidence';
      else if (section && line.startsWith('- ')) current[section].push(line.slice(2));
    }
  }
  if (type === undefined) throw Error('invalid-plan-type');
  if (!jobs.length || jobs.length > 100) throw Error('invalid-plan');
  const parsed = jobs.map(job => {
    if (!planStates.includes(job.Status) || ['Objective', 'Depends on', 'Brief', 'Blocker', 'Next step'].some(field => !job[field]) || !job.acceptance.length) throw Error('invalid-job');
    const brief = /^\[brief-r([1-9][0-9]*)\.md\]\(jobs\/([A-Z][A-Z0-9-]{0,63})\/brief-r\1\.md\)(?: \(pending until prepared\))?$/u.exec(job.Brief);
    if (!brief || brief[2] !== job.id) throw Error('unsafe-brief-reference');
    const dependencies = job['Depends on'] === 'None' ? [] : job['Depends on'].split(', ');
    if (new Set(dependencies).size !== dependencies.length || dependencies.some(dep => !seen.has(dep) || dep === job.id)) throw Error('invalid-dependency');
    const evidence = job.evidence.filter(item => item.trim() !== 'None.');
    if (job.Status === 'completed' && !hasEvidence(evidence)) throw Error('completed jobs require evidence');
    return { id: job.id, reportedStatus: job.Status, objective: job.Objective, dependencies, blocker: job.Blocker, nextStep: job['Next step'], acceptance: job.acceptance, evidence, briefName: `brief-r${brief[1]}.md` };
  });
  validateDependencyGraph(parsed);
  return parsed;
}
