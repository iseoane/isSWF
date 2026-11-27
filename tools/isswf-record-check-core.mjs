// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { parseRole, parseRunLine, RECORD_NAME, roleOfAgent } from './isswf-snapshot-core.mjs';

// Callers pass Windows or POSIX paths, so the file name is split on both separators.
const baseName = path => path.split(/[\\/]/).pop();

function planViolations(text, jobFiles) {
  let jobs;
  try {
    jobs = parsePlan(text);
  } catch (error) {
    const { code, job, field, line } = planErrorDetail(error);
    const where = [job, field].filter(Boolean).join(' ');
    const detail = `${where ? ` at ${where}` : ''}${line === undefined ? '' : ` (line ${line})`}`;
    return [{ code, ...(job && { job }), ...(field && { field }), ...(line !== undefined && { line }), message: `${code}${detail}` }];
  }
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  // parsePlan does not return line numbers for valid jobs; the Status field follows its job header.
  const statusLine = id => {
    const header = lines.indexOf(`## ${id}`);
    return header + 1 + lines.slice(header).findIndex(line => line.startsWith('- Status: '));
  };
  const violations = [];
  for (const { id, reportedStatus } of jobs) {
    if (reportedStatus !== 'pending' && reportedStatus !== 'blocked') continue;
    const record = (jobFiles?.[id] ?? []).find(name => RECORD_NAME.test(name));
    if (record) violations.push({ code: 'records-for-unstarted-job', job: id, field: 'Status', line: statusLine(id), message: `${id} is ${reportedStatus} but its directory holds ${record}` });
  }
  return violations;
}

// A line that reads as a launch identity but that the pane's parser rejects is silently dropped from the pane.
const RUN_CANDIDATE = /^\s*-\s*Run:/;
const RUN_MESSAGE = 'Run: line is ignored by the pane: use "- Run: <claude agent|claude session|pi child>=<id>" alone on the line';

function runViolations(text) {
  const violations = [];
  for (const [index, line] of text.split('\n').entries()) {
    if (!RUN_CANDIDATE.test(line)) continue;
    const run = parseRunLine(line);
    if (!run) violations.push({ code: 'run-line-unparsed', field: 'Run:', line: index + 1, message: RUN_MESSAGE });
    else if (run.id === '<id>') violations.push({ code: 'run-id-unfilled', field: 'Run:', line: index + 1, message: 'Run: line still has the template placeholder <id>: copy the launch ID or omit the line' });
    else if (run.id === 'unknown') violations.push({ code: 'run-id-unknown', field: 'Run:', line: index + 1, message: 'Run: line has no known ID: omit the line when the ID is unknown' });
  }
  return violations;
}

// A launch the host accepted and gave a run identity needs that identity on a `Run:` line of some record of its job. Only a record that has
// no `Run:` line is refused, and only for a launch of its own kind (an attempt for a non-reviewer role, a review for the reviewer) of the brief,
// checkpoint and job it names, whose identity no record of the job carries yet. A coordinator acting as writer launches nothing, and a launch
// without a returned identity is not in `launches`.
export function launchViolations({ path, text, name, launches, siblings, offerRunFlag = false }) {
  const runsIn = record => record.split('\n').map(parseRunLine).filter(Boolean);
  if (!launches?.length || runsIn(text).length || parseRole(text) === 'coordinator') return [];
  const claimed = new Set([text, ...(siblings ?? [])].flatMap(record => runsIn(record)).map(({ id }) => id));
  const open = launches.filter(({ agent, initiative, job, path: brief, checkpoint, run }) => run && !claimed.has(run)
    && (roleOfAgent(agent) === 'reviewer') === (name[0] === 'V')
    && path.replaceAll('\\', '/').includes(`/${initiative}/jobs/${job}/`)
    && text.includes(baseName(brief)) && text.includes(checkpoint));
  return open.map(({ run }) => ({ code: 'run-line-missing', field: 'Run:', message: `the host returned run ${run} for an accepted launch of this brief and the record has no Run: line. That launch may belong to an earlier record of this job (a foreground child's ID reaches the session only after it finishes): add "- Run: claude agent=${run}" to the record that launch produced${offerRunFlag ? ', or pass --run when it is this one' : ''}` }));
}

// Labels of the current templates (.factory/templates/attempt.md and review.md), matched at the start of a line.
export const REQUIRED_FIELDS = {
  A: ['Deviations from required procedure and consequence:', 'Process deviations observed:'],
  V: ['Unreviewed areas and evidence limits:', 'Convergence advice:', 'Process deviations observed:'],
};

function fieldViolations(kind, text) {
  const lines = text.split('\n');
  return REQUIRED_FIELDS[kind]
    .filter(label => !lines.some(line => line.replace(/^\s*(?:[-*]\s+)?/, '').startsWith(label)))
    .map(label => ({ code: 'missing-field', field: label, message: `record lacks the template field "${label}"` }));
}

export const RESOLUTIONS = ['fixed', 'wrong', 'known-limit', 'not-material', 'dismissed'];
const RESOLUTION_LABEL = /^\s*(?:[-*]\s+)?Finding resolutions\b[^:]*:/u;
const RESOLUTION_ENTRY = new RegExp(`^[A-Z]+\\d+ (?:${RESOLUTIONS.join('|')}): \\S`, 'u');

// The label's own text plus the nested bullets under it, each split into entries at "; <ID> ". An unfilled
// template placeholder or "None." names no resolution.
function resolutionViolations(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => RESOLUTION_LABEL.test(line));
  if (start < 0) return [];
  const entries = [];
  const add = (index, raw) => {
    const value = raw.trim().replace(/^`([^`]*)`\.?$/u, '$1');
    if (value === '' || value.startsWith('<') || value === 'None.') return;
    for (const entry of value.split(/;\s+(?=[A-Za-z]+\d+ )/u)) entries.push({ index, entry: entry.trim() });
  };
  add(start, lines[start].replace(RESOLUTION_LABEL, ''));
  for (let index = start + 1; index < lines.length && /^\s+[-*]\s/u.test(lines[index]); index++) add(index, lines[index].replace(/^\s+[-*]\s+/u, ''));
  return entries
    .filter(({ entry }) => !RESOLUTION_ENTRY.test(entry))
    .map(({ index, entry }) => ({ code: 'finding-resolution-invalid', field: 'Finding resolutions', line: index + 1, message: `finding resolution "${entry}" is not "<ID> <${RESOLUTIONS.join('|')}>: <reason>"` }));
}

const CHECKS_LABEL = /^\s*(?:[-*]\s+)?Checks run and observed results\b[^:]*:/u;
const COMMIT = /(?<![0-9a-f])[0-9a-f]{40}(?![0-9a-f])/u;
// An entry reports a check as run when it states an outcome; "not run" or "skipped" beside an outcome does not exempt it.
const OUTCOME = /\bexits? \d+\b|\b(?:pass(?:es|ed)?|fail(?:s|ed)?|clean|ok)\b/iu;

/**
 * The checks an attempt record reports as run: the entries of its checks field (the label's own text and the bullets nested
 * under it, each split at "; ") that state an outcome. `named` is set when the entry or the
 * label's own text carries a full commit SHA.
 * @returns {{ line: number, entry: string, named: boolean }[]}
 */
export function reportedChecks(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => CHECKS_LABEL.test(line));
  if (start < 0) return [];
  const [label] = CHECKS_LABEL.exec(lines[start]);
  const checks = [];
  const add = (index, raw) => {
    for (const piece of raw.split(/;\s+/u)) {
      const entry = piece.trim();
      if (entry !== '' && !/^`?</u.test(entry) && OUTCOME.test(entry)) checks.push({ line: index + 1, entry, named: COMMIT.test(label) || COMMIT.test(entry) });
    }
  };
  add(start, lines[start].slice(label.length));
  for (let index = start + 1; index < lines.length && /^\s+[-*]\s/u.test(lines[index]); index++) add(index, lines[index].replace(/^\s+[-*]\s+/u, ''));
  return checks;
}

function checkViolations(text) {
  return reportedChecks(text)
    .filter(({ named }) => !named)
    .map(({ line, entry }) => ({ code: 'check-without-commit', field: 'Checks run and observed results', line, message: `check reported as run names no full commit SHA: "${entry.slice(0, 160)}"` }));
}

const ROUND_LABEL = 'Review round in this job, and prior review IDs:';
const AGGREGATE_LABEL = "Aggregate verdict, copied verbatim from the reviewer's report header:";
const recordLines = text => text.split('\n').map(line => line.replace(/^\s*(?:[-*]\s+)?/u, ''));
const labelValue = (text, label) => recordLines(text).find(line => line.startsWith(label))?.slice(label.length).trim() ?? '';
const recordNumber = name => Number(/^[AV](\d+)/u.exec(name)[1]);
const isRecord = (record, kind) => new RegExp(`^${kind}\\d+\\.md$`, 'u').test(record.name);

// A review that states a round after the first is legal when the earlier review with the highest number either failed, or passed and the round has a
// matching correction (a correction attempt stating that round, whose candidate is the review's), or when it chains from that review: its base is the
// earlier candidate and its candidate differs (a delta after a pass or an inconclusive result), or an inconclusive review's candidate repeats (a re-run).
// A candidate that names no 40-hex commit (a snapshot identity) has nothing to compare, so only a correction attempt of the round can justify it.
function roundViolations({ text, name, jobRecords }) {
  const round = Number(/^\d+/u.exec(labelValue(text, ROUND_LABEL))?.[0]);
  if (!jobRecords || !(round > 1)) return [];
  const violation = (code, message) => [{ code, field: ROUND_LABEL, line: recordLines(text).findIndex(line => line.startsWith(ROUND_LABEL)) + 1, message }];
  const prior = jobRecords.filter(record => isRecord(record, 'V') && recordNumber(record.name) < recordNumber(name)).sort((a, b) => recordNumber(a.name) - recordNumber(b.name)).at(-1);
  const verdict = prior && /^\W*(\w+)/u.exec(labelValue(prior.text, AGGREGATE_LABEL))?.[1].toLowerCase();
  if (!['fail', 'pass', 'inconclusive'].includes(verdict)) return violation('review-round-without-prior', `round ${round} follows ${prior ? `${prior.name}, which has no aggregate verdict` : 'no earlier review of this job'}`);
  const commit = (record, label) => COMMIT.exec(labelValue(record, label))?.[0];
  const candidate = commit(text, 'Candidate commit SHA, or reproducible snapshot identity:');
  const corrections = jobRecords.filter(record => isRecord(record, 'A') && Number(/^\d+/u.exec(labelValue(record.text, 'Review round:'))?.[0]) === round);
  const corrected = corrections.some(record => !candidate || commit(record.text, 'Candidate commit SHA:') === candidate);
  const priorCandidate = commit(prior.text, 'Candidate commit SHA, or reproducible snapshot identity:');
  const chained = candidate && commit(text, 'Base commit SHA:') === priorCandidate && candidate !== priorCandidate;
  const rerun = verdict === 'inconclusive' && candidate === priorCandidate;
  if (verdict === 'fail' ? corrected : corrected || chained || rerun) return [];
  if (verdict === 'fail' && !corrections.length) return violation('review-round-without-correction', `round ${round} follows the failed ${prior.name} and has no correction attempt that states "Review round: ${round}"`);
  if (corrections.length) return violation('review-candidate-mismatch', `candidate ${candidate} is not the candidate of a round ${round} correction attempt (${corrections.map(record => record.name).join(', ')}); a merge after a correction needs its own chained delta round`);
  return violation('review-round-unchained', `round ${round} follows the ${verdict} ${prior.name} and is neither a delta (base ${priorCandidate}, a different candidate) nor a re-run after an inconclusive result nor the review of a round ${round} correction attempt`);
}

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`. `jobFiles` maps a job ID to the file names in its directory and is
 * only read when `path` is a plan. `newRecord` is true for a record absent at the base; only a new
 * review is held to the finding resolution vocabulary and only a new attempt to naming the commit of each check it reports as run.
 * `jobRecords` are the job's other records as `{ name, text }`; only a new review's round sequence reads them.
 * `launches` are the accepted dispatches with their run identity (see compaction notes) and `siblings` the texts of the job's other records.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path, text, jobFiles, newRecord, launches, siblings, jobRecords }) {
  const name = baseName(path);
  let violations = [];
  if (name === 'plan.md') violations = planViolations(text, jobFiles);
  else if (RECORD_NAME.test(name)) violations = [...runViolations(text), ...launchViolations({ path, text, name, launches, siblings }), ...fieldViolations(name[0], text), ...(newRecord === true && name[0] === 'V' ? [...resolutionViolations(text), ...roundViolations({ text, name, jobRecords })] : []), ...(newRecord === true && name[0] === 'A' ? checkViolations(text) : [])];
  return { ok: violations.length === 0, violations };
}
