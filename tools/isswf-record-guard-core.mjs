// No Node imports and no `process` access, like tools/isswf-record-check-core.mjs: the Claude hooks module has
// only an injected fs. The Pi extension and hooks/register.tsx pass their own `read` and `list` and share this
// path matching and message.
import { checkRecord } from './isswf-record-check-core.mjs';
import { resolveDir } from './isswf-branch-guard-core.mjs';
import { isRecordPath, joiner, RECORD_NAME } from './isswf-snapshot-core.mjs';

// The same ceiling as tools/isswf-record-check.mjs.
const MAX_CHARS = 1024 * 1024;
// A missing or unreadable directory is no listing, as in the CLI.
async function names(list, dir, kind) {
  try {
    return (await list(dir)).filter(entry => entry.kind === kind).map(entry => entry.name);
  } catch {
    return [];
  }
}

async function jobFilesFor(planPath, list) {
  const join = joiner(planPath);
  const jobsDir = `${planPath.slice(0, -'plan.md'.length)}jobs`;
  const jobFiles = {};
  for (const job of await names(list, jobsDir, 'dir')) jobFiles[job] = await names(list, join(jobsDir, job), 'file');
  return jobFiles;
}

function describe({ code, job, field, line, message }) {
  const place = [job, field].filter(Boolean).join(' ');
  const head = `${code}${place ? ` at ${place}` : ''}${line === undefined ? '' : ` (line ${line})`}`;
  return `- ${message === head ? head : `${head}: ${message}`}`;
}

/**
 * Checks the plan or record at `path` after a write and returns the text to show the model, or `undefined`
 * when there is nothing to report. `path` may use `\` or `/`. `read(path)` returns the file's text and
 * `list(dir)` returns `{ name, kind }` entries, as Claude's `$.fs` does. It only reports: it never edits,
 * grants or starts anything, and it never throws, so a failing guard cannot change the tool result.
 * @returns {Promise<string | undefined>}
 */
export async function guardRecord({ path, read, list } = {}) {
  try {
    if (typeof path !== 'string' || !isRecordPath(path.replaceAll('\\', '/'))) return undefined;
    const text = await read(path);
    if (typeof text !== 'string' || text.length > MAX_CHARS) return undefined;
    const isPlan = path.endsWith('plan.md');
    const { violations } = checkRecord({ path, text, jobFiles: isPlan ? await jobFilesFor(path, list) : undefined });
    if (!violations.length) return undefined;
    return [`The isSWF record check found ${violations.length} violation(s) in ${path}. It only reports: nothing was changed.`, ...violations.map(describe)].join('\n');
  } catch {
    return undefined;
  }
}

// Windows paths (a drive letter) are case-insensitive; other paths compare exactly.
const within = (path, directory) => (/^[a-z]:/u.test(directory) ? path.toLowerCase().startsWith(`${directory.toLowerCase()}/`) : path.startsWith(`${directory}/`));

/**
 * Decides, before a write, whether a child bound to a checkout (`assignment` as `assignmentOf` returns it) writes an attempt or review record
 * (`A###.md` or `V###.md` under a state directory's initiatives folder) outside that checkout: `{ deny }` names the checkout, `{}` allows.
 * Without an assignment (the coordinator, or a child whose binding is unknown), for another file, for a relative `path` or on any fault it allows,
 * because this is a process rule and not an authority. `path` may use `\` or `/`.
 * @returns {{ deny?: string }}
 */
export function checkRecordLocation({ path, assignment } = {}) {
  try {
    if (typeof path !== 'string' || typeof assignment?.checkout !== 'string') return {};
    const slashed = path.replaceAll('\\', '/');
    if (!isRecordPath(slashed) || !RECORD_NAME.test(slashed.slice(slashed.lastIndexOf('/') + 1))) return {};
    if (!/^(?:\/|[A-Za-z]:\/)/u.test(slashed)) return {};
    const bound = assignment.checkout.replaceAll('\\', '/');
    const checkout = resolveDir(bound, '.');
    if (within(resolveDir(checkout, slashed), checkout)) return {};
    return { deny: `isSWF record guard: writing ${path} refused. This session is assigned checkout ${bound}, and an attempt or review record belongs inside it. Write the record in the assigned checkout, or ask the coordinator to change the assignment. This is a process rule, not a retry signal: do not rephrase the write to get past it.` };
  } catch {
    return {};
  }
}
