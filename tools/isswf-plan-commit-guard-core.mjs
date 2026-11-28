// No Node imports, like isswf-branch-guard-core.mjs: the Claude hooks module passes `$.process` and `$.fs`, and Pi passes `execFile` and `readFile`.
import { targetDir } from './isswf-branch-guard-core.mjs';
import { tokenize } from './isswf-command-core.mjs';
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { checkRecord } from './isswf-record-check-core.mjs';
import { isRecordPath, RECORD_NAME } from './isswf-snapshot-core.mjs';

// The same ceiling as tools/isswf-record-check.mjs: a larger record is not checked.
const MAX_RECORD_CHARS = 1024 * 1024;
const PLAN_PATH = /^(\.isswf|\.factory)\/initiatives\/(I\d+)\/plan\.md$/u;
const SHA = /^[0-9a-f]{40}$/u;
const ALL_FLAG = arg => arg === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/u.test(arg);
const VALUE_OPTIONS = new Set(['-m', '-F', '-C', '-c', '-t', '--message', '--file', '--author', '--date', '--template', '--reuse-message', '--reedit-message', '--fixup', '--squash', '--cleanup', '--trailer']);

/** True when the commit records working-tree files: -a/--all, a pathspec, or --pathspec-from-file. */
export function readsWorkingTree(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') return index + 1 < args.length;
    if (ALL_FLAG(arg) || arg.startsWith('--pathspec-from-file')) return true;
    if (VALUE_OPTIONS.has(arg)) { index += 1; continue; }
    if (!arg.startsWith('-')) return true;
  }
  return false;
}

/** Reads a plan as isswf-status does: the parser accepts it and the heading names the initiative with a title. */
function readBack(text, initiative) {
  const heading = text.split(/\r?\n/u, 1)[0], prefix = `# ${initiative}: `;
  const title = heading.startsWith(prefix) ? heading.slice(prefix.length) : '';
  if (!title.trim() || title.length > 4000 || /[\x00-\x1f\x7f]/u.test(title)) return { code: 'invalid-title', line: 1 };
  try { parsePlan(text); return undefined; } catch (error) { return planErrorDetail(error); }
}

const allCompleted = text => {
  try { return parsePlan(text).every(job => job.reportedStatus === 'completed'); } catch { return false; }
};

/** Returns the problems with a close record's own fields, or the parsed record when it is valid. */
function recordProblems(text, initiative) {
  let record;
  try { record = JSON.parse(text); } catch { return ['the record is invalid: not JSON']; }
  if (record?.schema !== 'isswf.close-verification' || record.schemaVersion !== 1) return ['the record is invalid: schema must be isswf.close-verification, schemaVersion 1'];
  const problems = [];
  if (record.initiative !== initiative) problems.push(`the record is for ${record.initiative}, not ${initiative}`);
  if (!SHA.test(record.head)) problems.push('the record head is not a full commit SHA');
  if (!['local', 'ci'].includes(record.source)) problems.push('the record source must be local or ci');
  else if (record.source === 'ci' && !/^https?:\/\//u.test(record.runUrl)) problems.push('a ci record needs the run URL');
  if (!Array.isArray(record.checks) || record.checks.some(check => typeof check?.id !== 'string' || typeof check.status !== 'string')) problems.push('the record is invalid: checks must list {id, status}');
  else {
    const bad = record.checks.filter(check => check.status !== 'passed');
    if (!record.checks.length) problems.push('the record has no checks');
    else if (bad.length) problems.push(`checks are not passed: ${bad.map(check => `${check.id} (${check.status})`).join(', ')}; record a passing CI run (source "ci") or run isswf-verify --record on a platform where those checks run`);
  }
  return problems.length ? problems : record;
}

/**
 * The problems that keep a commit from closing an initiative, or [] when it is not a close.
 * A close is a plan whose jobs are all completed where HEAD's plan was not. It needs a passing record whose head is at or after the newest commit outside the initiatives directory, and changes nothing outside that directory itself.
 * Every check must have passed; a `not run` check refuses the record.
 */
async function closeProblems({ state, initiative, path, plan, all, root, listed, git, read }) {
  if (!allCompleted(plan)) return [];
  const before = await git(['show', `HEAD:${path}`], root);
  if (before.exitCode !== 0 || allCompleted(before.stdout)) return [];
  const recordPath = `${state}/initiatives/${initiative}/close-verification.json`;
  let text;
  if (all) { try { text = await read(`${root}/${recordPath}`); } catch { /* reported as missing */ } }
  else {
    // An empty listing means the index has no record; a failed lookup is a fault, which allows the commit.
    const listing = await git(['ls-files', '--', recordPath], root);
    if (listing.exitCode !== 0) throw Error('git ls-files failed');
    if (listing.stdout.trim()) {
      const staged = await git(['show', `:${recordPath}`], root);
      if (staged.exitCode !== 0) throw Error('git show failed');
      text = staged.stdout;
    }
  }
  if (text === undefined) return [`${recordPath} is missing`];
  const record = recordProblems(text, initiative);
  if (Array.isArray(record)) return record;
  const problems = [];
  const outside = listed.filter(item => !item.startsWith(`${state}/initiatives/`));
  // A commit that reads the working tree (-a, a pathspec, a chained command) lists its tracked changes, which can include ones it will not record.
  if (outside.length) problems.push(`this commit also changes files outside the initiatives directory (${outside.join(', ')}), which the verified head does not cover${all ? '; this commit reads the working tree, so unstaged changes count: stage only the plan and the record and commit them alone' : ''}`);
  // With --quiet, exit 1 means the object is absent; any other failure is a fault.
  const known = await git(['rev-parse', '--verify', '--quiet', `${record.head}^{commit}`], root);
  if (known.exitCode === 1) return [...problems, `the record head ${record.head} is not a commit of this repository`];
  if (known.exitCode !== 0) throw Error('git rev-parse failed');
  const inHistory = await git(['merge-base', '--is-ancestor', record.head, 'HEAD'], root);
  if (inHistory.exitCode === 1) problems.push(`the record head ${record.head} is not in the history of HEAD`);
  else if (inHistory.exitCode !== 0) throw Error('git history lookup failed');
  const newest = await git(['log', '-1', '--format=%H', 'HEAD', '--', '.', `:(exclude)${state}/initiatives`], root);
  if (newest.exitCode !== 0) throw Error('git log failed');
  const latest = newest.stdout.trim();
  if (latest) {
    const covers = await git(['merge-base', '--is-ancestor', latest, record.head], root);
    if (covers.exitCode === 1) problems.push(`the record head ${record.head} is older than the newest commit outside the initiatives directory (${latest})`);
    else if (covers.exitCode !== 0) throw Error('git history lookup failed');
  }
  return problems;
}

const describe = (path, { code, job, field, line }) => `${path}: ${code}${[job, field].filter(Boolean).length ? ` at ${[job, field].filter(Boolean).join(' ')}` : ''}${line === undefined ? '' : ` (line ${line})`}`;

const isAttemptOrReview = path => isRecordPath(path) && RECORD_NAME.test(path.slice(path.lastIndexOf('/') + 1));

const violationKey = ({ code, job, field, message }) => JSON.stringify([code, job, field, message]);

/**
 * The record check's violations of an attempt or review record, from the inputs the post-write guard uses (path and text), so a commit never refuses
 * what that guard accepts. The rules for a new record, which need the base commit, and the launch notes stay with `isswf-record-check`.
 * A violation the `before` text (the record at HEAD) already has is not reported, so editing a historical record that predates a newer rule is not refused;
 * each earlier violation excuses one equal violation, whatever its line.
 */
function recordViolations(path, text, before) {
  if (text.length > MAX_RECORD_CHARS) return [];
  const known = new Map();
  if (before !== undefined && before.length <= MAX_RECORD_CHARS) for (const violation of checkRecord({ path, text: before }).violations) known.set(violationKey(violation), (known.get(violationKey(violation)) ?? 0) + 1);
  return checkRecord({ path, text }).violations.filter(violation => {
    const key = violationKey(violation), left = known.get(key) ?? 0;
    if (left > 0) known.set(key, left - 1);
    return left === 0;
  }).map(violation => `${describe(path, violation)}: ${violation.message}`);
}

/**
 * Refuses a `git commit` that would record a plan `isswf-status` cannot read back, before it runs: the staged plan, or the working-tree plan with `-a`, a pathspec, or an earlier command in the same call.
 * It refuses a commit that would record an attempt or review record (`A###.md`, `V###.md`) that the record check rejects, read the same way.
 * It also refuses the commit that makes every job of an initiative completed unless that initiative's close verification record is passing and current (`closeProblems`).
 * It fails open: this guard enforces a process rule, not an authority, so a fault allows the command.
 * `git(argv, cwd)` resolves to `{ exitCode, stdout }`; `read(path)` resolves to a working-tree file's text.
 */
export async function checkPlanCommit({ command, cwd, git, read, platform = globalThis.process?.platform }) {
  try {
    const problems = [], closes = [], violations = [];
    const segments = tokenize(command);
    for (const [position, segment] of segments.entries()) {
      if (segment.git?.subcommand !== 'commit') continue;
      const dir = targetDir(cwd, segment);
      if (dir === undefined) continue;
      // Before the command runs, an earlier segment (a `git add`, an edit) has not changed the index yet, so read the working tree then too.
      const all = position > 0 || readsWorkingTree(segment.git.args);
      const top = await git(['rev-parse', '--show-toplevel'], dir);
      if (top.exitCode !== 0) continue;
      const root = top.stdout.trim();
      // Paths the commit would record with content: staged, plus tracked working-tree changes with -a. Deletions are left out.
      const listed = await git(['diff', '--name-only', '-z', '--no-renames', '--diff-filter=d', ...(all ? ['HEAD'] : ['--cached'])], root);
      if (listed.exitCode !== 0) continue;
      // An earlier command in the same call (`git add -A`) can add a new, still untracked plan that the commit then records.
      const added = segments.slice(0, position).some(earlier => earlier.git?.subcommand === 'add') ? await git(['ls-files', '--others', '--exclude-standard', '-z'], root) : { exitCode: 0, stdout: '' };
      if (added.exitCode !== 0) continue;
      const paths = [...listed.stdout.split('\0'), ...added.stdout.split('\0')];
      for (const path of paths) {
        const match = PLAN_PATH.exec(path);
        if (!match && isAttemptOrReview(path)) {
          const record = all ? { exitCode: 0, stdout: await read(`${root}/${path}`) } : await git(['show', `:${path}`], root);
          // An empty listing means HEAD has no such record (a new file); a failed lookup is a fault, which allows the commit.
          const tracked = record.exitCode === 0 ? await git(['ls-tree', 'HEAD', '--', path], root) : undefined;
          const before = tracked?.exitCode === 0 && tracked.stdout.trim() ? await git(['show', `HEAD:${path}`], root) : undefined;
          if (tracked?.exitCode === 0 && (before === undefined || before.exitCode === 0)) violations.push(...recordViolations(path, record.stdout, before?.stdout));
          continue;
        }
        if (!match) continue;
        const [, state, initiative] = match;
        const content = all ? { exitCode: 0, stdout: await read(`${root}/${path}`) } : await git(['show', `:${path}`], root);
        if (content.exitCode !== 0) continue;
        const problem = readBack(content.stdout, initiative);
        if (problem) { problems.push(describe(path, problem)); continue; }
        // A fault in the close lookup allows the commit, like every other fault of this guard.
        try {
          const found = await closeProblems({ state, initiative, path, plan: content.stdout, all, root, listed: listed.stdout.split('\0').filter(Boolean), git, read });
          if (found.length) closes.push({ initiative, found });
        } catch { /* fail open */ }
      }
    }
    if (!problems.length && !closes.length && !violations.length) return {};
    const unreadable = problems.length ? `isSWF plan commit guard: git commit refused. isswf-status cannot read back ${problems.length === 1 ? 'this plan' : 'these plans'}:\n${problems.map(item => `- ${item}`).join('\n')}\nFix the plan with tools/isswf-plan-edit.mjs or by hand, stage it, and commit again.` : '';
    // A local record often cannot pass on Windows, where checks limited to other platforms do not run, so the CI record leads there.
    const route = initiative => (platform === 'win32'
      ? `Record a passing CI run with \`source: "ci"\` and its run URL (or run \`isswf-verify --tier initiative --record ${initiative}\` if every check runs on Windows)`
      : `Run the initiative tier with \`isswf-verify --tier initiative --record ${initiative}\` (or record a passing CI run with \`source: "ci"\` and its run URL)`);
    const malformed = violations.length ? `isSWF plan commit guard: git commit refused. The isSWF record check rejects ${violations.length === 1 ? 'this record' : 'these records'} as the commit would record ${violations.length === 1 ? 'it' : 'them'}:\n${violations.map(item => `- ${item}`).join('\n')}\nFix the record, stage it and commit again; \`node tools/isswf-record-check.mjs\` reports the same violations.` : '';
    const open = closes.map(({ initiative, found }) => `isSWF plan commit guard: git commit refused. This commit completes every job of ${initiative}, and its close verification is not recorded at the closing head:\n${found.map(item => `- ${item}`).join('\n')}\n${route(initiative)}, commit the record, and commit the plan again.`);
    return { deny: `${[unreadable, malformed, ...open].filter(Boolean).join('\n\n').trim()}\nThis is a process rule, not a retry signal: do not rephrase the command to get past it.` };
  } catch {
    return {};
  }
}
