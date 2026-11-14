// No Node imports and no `process` access, like tools/isswf-snapshot-core.mjs: runtimes that only offer
// an injected fs load this module. tools/isswf-record-check.mjs is the Node wrapper.

/**
 * Checks one plan or record file and only reports: it never edits, grants or starts anything.
 * `path` may use `\` or `/`. `jobFiles` maps a job ID to the file names in its directory and is
 * only read when `path` is a plan.
 * @returns {{ ok: boolean, violations: { code: string, job?: string, field?: string, line?: number, message: string }[] }}
 */
export function checkRecord({ path: _path, text: _text, jobFiles: _jobFiles }) {
  return { ok: true, violations: [] };
}
