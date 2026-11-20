// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { parseRunLine, RECORD_NAME } from './isswf-snapshot-core.mjs';

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
    const value = raw.trim().replace(/^`([^`]*)`$/u, '$1');
    if (value === '' || value.startsWith('<') || value === 'None.') return;
    for (const entry of value.split(/;\s+(?=[A-Za-z]+\d+ )/u)) entries.push({ index, entry: entry.trim() });
  };
  add(start, lines[start].replace(RESOLUTION_LABEL, ''));
  for (let index = start + 1; index < lines.length && /^\s+[-*]\s/u.test(lines[index]); index++) add(index, lines[index].replace(/^\s+[-*]\s+/u, ''));
  return entries
    .filter(({ entry }) => !RESOLUTION_ENTRY.test(entry))
    .map(({ index, entry }) => ({ code: 'finding-resolution-invalid', field: 'Finding resolutions', line: index + 1, message: `finding resolution "${entry}" is not "<ID> <${RESOLUTIONS.join('|')}>: <reason>"` }));
}

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`. `jobFiles` maps a job ID to the file names in its directory and is
 * only read when `path` is a plan. `newRecord` is true for a record absent at the base; only a new
 * review is held to the finding resolution vocabulary.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path, text, jobFiles, newRecord }) {
  const name = baseName(path);
  let violations = [];
  if (name === 'plan.md') violations = planViolations(text, jobFiles);
  else if (RECORD_NAME.test(name)) violations = [...runViolations(text), ...fieldViolations(name[0], text), ...(newRecord === true && name[0] === 'V' ? resolutionViolations(text) : [])];
  return { ok: violations.length === 0, violations };
}
