// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';

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

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`. `jobFiles` maps a job ID to the file names in its directory and is
 * only read when `path` is a plan.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path, text }) {
  const violations = baseName(path) === 'plan.md' ? planViolations(text) : [];
  return { ok: violations.length === 0, violations };
}
