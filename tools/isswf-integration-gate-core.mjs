// No Node imports, like isswf-records-push-guard-core.mjs: the caller passes a `git` runner and a `read` function.
import { targetDir } from './isswf-branch-guard-core.mjs';
import { tokenize } from './isswf-command-core.mjs';
import { parsePush } from './isswf-records-push-guard-core.mjs';

const MODE_LINE = /^- Integration gate: (off|observe|enforce)\s*$/mu;
const STATE_DIRECTORIES = ['.isswf', '.factory'];
const STAMP_TIERS = new Set(['job', 'initiative']);
// Without a base ref to stop at, a walk looks at this many commits of the head's history.
const WALK_LIMIT = 200;
const MERGE_VALUE_OPTIONS = new Set(['-m', '-F', '-s', '-X', '--message', '--file', '--strategy', '--strategy-option', '--into-name', '--cleanup']);
const MERGE_CONTROL = new Set(['--abort', '--continue', '--quit']);
const GH_VALUE_FLAGS = new Set(['-R', '--repo']);

/** The commit operands of a `git merge`, or none for a control flag. */
function mergeOperands(args) {
  const operands = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (MERGE_CONTROL.has(arg)) return [];
    if (arg === '--') { operands.push(...args.slice(index + 1)); break; }
    if (MERGE_VALUE_OPTIONS.has(arg)) { index += 1; continue; }
    if (!arg.startsWith('-')) operands.push(arg);
  }
  return operands;
}

/** The refs a `git push` publishes to a branch other than `base`; an empty refspec list pushes the current branch, which is `HEAD`. */
function pushedRefs(refspecs, base, current) {
  if (!refspecs.length) return current === undefined || current === base ? [] : ['HEAD'];
  const refs = [];
  for (const refspec of refspecs) {
    const [from, named] = refspec.replace(/^\+/u, '').split(':');
    // A delete has no source; a push to the base stays with the records push guard.
    const to = named ?? (from === 'HEAD' || from === '@' ? current : from);
    if (from && to !== base && to !== `refs/heads/${base}`) refs.push(from);
  }
  return refs;
}

/** The `--head` branch of a `gh pr create` (after gh's own flags such as `--repo X`), or undefined for another command; `head` is undefined without the flag or for a `owner:branch` fork head. */
function ghPrCreate(args) {
  let index = 0;
  while (args[index]?.startsWith('-')) index += GH_VALUE_FLAGS.has(args[index]) ? 2 : 1;
  if (args[index] !== 'pr' || args[index + 1] !== 'create') return undefined;
  const rest = args.slice(index + 2);
  const at = rest.findIndex(arg => arg === '--head' || arg === '-H' || arg.startsWith('--head='));
  const value = at < 0 ? undefined : rest[at].startsWith('--head=') ? rest[at].slice('--head='.length) : rest[at + 1];
  return { head: value === undefined || value.includes(':') ? undefined : value, forked: value?.includes(':') === true };
}

/** The integration commands of `command` as `{ kind, dir, remote, refs }`; `refs` are the heads they publish or merge, resolved later against the checkout's HEAD. */
async function integrationsIn(command, cwd, git) {
  const found = [];
  for (const segment of tokenize(command)) {
    let kind;
    let operands = [];
    let remote = 'origin';
    if (segment.git?.subcommand === 'merge') {
      kind = 'git merge';
      operands = mergeOperands(segment.git.args);
    } else if (segment.git?.subcommand === 'push') {
      const push = parsePush(segment.git.args);
      if (push === undefined) continue;
      kind = 'git push';
      remote = push.remote;
      operands = push.refspecs;
    } else if (segment.command === 'gh') {
      const create = ghPrCreate(segment.args);
      if (create === undefined) continue;
      kind = 'gh pr create';
      operands = create.forked ? [] : [create.head ?? 'HEAD'];
    } else continue;
    const dir = targetDir(cwd, segment.git ? segment : { cd: segment.cd, git: { dirs: [] } });
    if (dir === undefined) continue;
    const top = await git(['rev-parse', '--show-toplevel'], dir);
    if (top.exitCode !== 0) continue;
    const root = top.stdout.trim();
    const configured = await git(['config', '--get', 'isswf.baseBranch'], root);
    const base = configured.exitCode === 0 && configured.stdout.trim() ? configured.stdout.trim() : 'main';
    const current = await git(['symbolic-ref', '--short', '-q', 'HEAD'], root);
    const branch = current.exitCode === 0 ? current.stdout.trim() : undefined;
    let refs = operands;
    if (kind === 'git push') refs = pushedRefs(operands, base, branch);
    else if (kind === 'gh pr create' && operands[0] === 'HEAD' && (branch === undefined || branch === base)) refs = [];
    found.push({ kind, root, remote, base, refs: refs.filter(ref => !ref.startsWith('-')) });
  }
  return found;
}

// The selected state and gate mode from the setup record on `ref`: `.isswf` when its project-setup.md exists there, else `.factory`; undefined when the ref has neither.
async function readSetupAt(root, ref, git) {
  for (const state of STATE_DIRECTORIES) {
    const shown = await git(['show', `${ref}:${state}/project-setup.md`], root);
    if (shown.exitCode === 0) return { state, mode: MODE_LINE.exec(shown.stdout)?.[1] ?? 'observe' };
  }
  return undefined;
}

// The base ref decides, so a commit of the branch under review cannot change the rule it is judged by; HEAD answers only when the base ref is missing.
// A repository with no state directory at the base ref nor at HEAD does not use isSWF, so the gate is off for it.
async function readSetup(root, baseRef, git) {
  const found = (await readSetupAt(root, baseRef, git)) ?? (await readSetupAt(root, 'HEAD', git));
  if (found) return found;
  for (const ref of [baseRef, 'HEAD']) {
    for (const state of STATE_DIRECTORIES) {
      if ((await git(['cat-file', '-e', `${ref}:${state}`], root)).exitCode === 0) return { state: '.factory', mode: 'observe' };
    }
  }
  return { state: '.factory', mode: 'off' };
}

async function hasStamp(root, sha, git, read) {
  const common = await git(['rev-parse', '--git-common-dir'], root);
  if (common.exitCode !== 0) return false;
  const dir = common.stdout.trim();
  const base = /^(?:[A-Za-z]:|[\\/])/u.test(dir) ? dir : `${root}/${dir}`;
  try {
    const stamp = JSON.parse(await read(`${base}/isswf/verification-stamps/${sha}.json`));
    return stamp?.candidate === sha && STAMP_TIERS.has(stamp.tier) && Array.isArray(stamp.checks);
  } catch {
    return false;
  }
}

/** The first commit that needs a stamp and has none on the first-parent history of `sha` above `baseRef`, or undefined when the head is covered. */
async function unstampedCommit(root, sha, baseRef, state, git, read) {
  const onBase = await git(['merge-base', '--is-ancestor', sha, baseRef], root);
  if (onBase.exitCode === 0) return undefined;
  const walk = await git(['rev-list', '--first-parent', ...(onBase.exitCode === 1 ? [sha, '--not', baseRef] : ['-n', String(WALK_LIMIT), sha])], root);
  if (walk.exitCode !== 0) return undefined;
  for (const commit of walk.stdout.split('\n').filter(Boolean)) {
    if (await hasStamp(root, commit, git, read)) return undefined;
    const listed = await git(['diff-tree', '-r', '--root', '--name-only', '--no-commit-id', '-z', '-m', commit], root);
    if (listed.exitCode !== 0) return undefined;
    // A records-only commit needs no stamp of its own when the code commit below it has one.
    if (listed.stdout.split('\0').some(path => path && !path.startsWith(`${state}/initiatives/`))) return commit;
  }
  return undefined;
}

/**
 * Warns about, or refuses, an integration command whose branch head has no verification stamp, before it runs: `git merge <branch>`, a `git push` of a branch other than
 * the base, and `gh pr create`. The stamp is the file `isswf-verify --tier job` writes for a clean, fully passing run at that commit. A head that is already on
 * `<remote>/<base>` is integrated; a records-only head is covered by the stamp of the first commit below it that changes anything but work records.
 * The mode is the `- Integration gate: off|observe|enforce` line of the selected state's `project-setup.md` on `<remote>/<base>`, or at HEAD when that ref is missing (a missing line is `observe`): `observe` returns a
 * `note` for the caller to show after the run, `enforce` a `deny`. It fails open on a git fault: this guard enforces a process rule, not an authority.
 * `git(argv, cwd)` resolves to `{ exitCode, stdout }`; `read(path)` resolves to a file's text or rejects.
 * A `git push` also reports commits no recorded review covers when the caller passes `coverage({ root, head, base })`, which resolves to those commit SHAs (both hosts pass `gateCoverage` from
 * isswf-handoff-coverage-core.mjs); a caller without it checks stamps only.
 */
export async function checkIntegrationGate({ command, cwd, git, read, coverage }) {
  try {
    const problems = [];
    const unreviewed = [];
    for (const { kind, root, remote, base, refs } of await integrationsIn(command, cwd, git)) {
      if (!refs.length) continue;
      const baseRef = `${remote}/${base}`;
      const { state, mode } = await readSetup(root, baseRef, git);
      if (mode === 'off') continue;
      for (const ref of refs) {
        const resolved = await git(['rev-parse', '--verify', '-q', `${ref}^{commit}`], root);
        if (resolved.exitCode !== 0) continue;
        const missing = await unstampedCommit(root, resolved.stdout.trim(), baseRef, state, git, read);
        if (missing !== undefined && !problems.some(problem => problem.sha === missing)) problems.push({ kind, sha: missing, mode });
        if (kind !== 'git push' || coverage === undefined) continue;
        for (const sha of await unreviewedCommits({ coverage, git, root, head: resolved.stdout.trim(), baseRef })) {
          if (!unreviewed.some(item => item.sha === sha)) unreviewed.push({ sha, mode });
        }
      }
    }
    if (!problems.length && !unreviewed.length) return {};
    const reasons = [];
    if (problems.length) reasons.push(`No verification stamp for ${problems.map(({ kind, sha }) => `${kind}: ${sha.slice(0, 7)}`).join('; ')}. Run \`node tools/isswf-verify.mjs --project <project> --tier job\` on a clean tree at that commit, which writes the stamp, then repeat the command.`);
    if (unreviewed.length) reasons.push(`Unreviewed commits: ${unreviewed.map(({ sha }) => sha.slice(0, 7)).join(', ')}. Run \`node tools/isswf-handoff.mjs coverage --project <project>\`, obtain a delta review of them and record it, then repeat the command.`);
    const all = [...problems, ...unreviewed];
    if (all.some(problem => problem.mode === 'enforce')) return { deny: `isSWF integration gate: refused. ${reasons.join(' ')} This is a process rule, not a retry signal: do not rephrase the command to get past it.` };
    return { note: `isSWF integration gate (observe): the command ran, and enforce mode would refuse it. ${reasons.join(' ')}` };
  } catch {
    return {};
  }
}

/** The commits of `head` above the base that no recorded review covers, from the injected `coverage({ root, head, base })`; none when the base or the check cannot be read. */
async function unreviewedCommits({ coverage, git, root, head, baseRef }) {
  try {
    const from = await git(['merge-base', head, baseRef], root);
    if (from.exitCode !== 0) return [];
    return await coverage({ root, head, base: from.stdout.trim() });
  } catch {
    return [];
  }
}
