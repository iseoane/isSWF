// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { parseRunLine } from './isswf-snapshot-core.mjs';

// Callers pass Windows or POSIX paths, so the file name is split on both separators.
const baseName = path => path.split(/[\\/]/).pop();

function planViolations(text) {
  try {
    parsePlan(text);
    return [];
  } catch (error) {
    const { code, job, field, line } = planErrorDetail(error);
    const where = [job, field].filter(Boolean).join(' ');
    const detail = `${where ? ` at ${where}` : ''}${line === undefined ? '' : ` (line ${line})`}`;
    return [{ code, ...(job && { job }), ...(field && { field }), ...(line !== undefined && { line }), message: `${code}${detail}` }];
  }
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

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path, text }) {
  const name = baseName(path);
  const violations = name === 'plan.md' ? planViolations(text) : /^[AV]\d{3}\.md$/.test(name) ? runViolations(text) : [];
  return { ok: violations.length === 0, violations };
}
