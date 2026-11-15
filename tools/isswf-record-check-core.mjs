// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { parseRunLine } from './isswf-snapshot-core.mjs';

// Callers pass Windows or POSIX paths, so the file name is split on both separators.
const baseName = path => path.split(/[\\/]/).pop();
const RECORD_NAME = /^[AV]\d{3}\.md$/;

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

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`. `jobFiles` maps a job ID to the file names in its directory and is
 * only read when `path` is a plan.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path, text, jobFiles }) {
  const name = baseName(path);
  let violations = [];
  if (name === 'plan.md') violations = planViolations(text, jobFiles);
  else if (RECORD_NAME.test(name)) violations = [...runViolations(text), ...fieldViolations(name[0], text)];
  return { ok: violations.length === 0, violations };
}
