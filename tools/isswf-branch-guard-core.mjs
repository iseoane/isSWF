// No Node imports and no `process` access, like the other guard cores: the Claude hooks module and the Pi extension share it.
// The host supplies the three things that touch the machine: `observe` (what a directory's checkout is on), the expected-branch
// `store` and, inside `observeBranch`, `git` and `read`.
import { tokenize } from './isswf-command-core.mjs';

// A checkout is on `{ branch }` or on `{ detached: <sha> }`; `observe(dir)` returns `{ top, state }` or undefined when it cannot tell.
const SWITCHERS = new Set(['switch', 'checkout']);
const ABSOLUTE = /^(?:\/|[A-Za-z]:\/)/u;

/** A directory as text with forward slashes, `.` and `..` resolved and a lower-case drive letter, so one repository has one key. */
export function resolveDir(base, path) {
  const target = path.replaceAll('\\', '/');
  const full = ABSOLUTE.test(target) ? target : `${base.replaceAll('\\', '/')}/${target}`;
  const drive = /^[A-Za-z]:/u.exec(full)?.[0] ?? '';
  const parts = [];
  for (const part of full.slice(drive.length).split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `${drive.toLowerCase()}/${parts.join('/')}`;
}

function parseHead(text) {
  const head = text.trim();
  const branch = /^ref:\s*refs\/heads\/(.+)$/u.exec(head)?.[1];
  // A reftable repository keeps this placeholder in HEAD and its real branch elsewhere.
  if (branch) return branch === '.invalid' ? undefined : { branch };
  return /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/u.test(head) ? { detached: head } : undefined;
}

const tryRead = async (read, path) => {
  try {
    return await read(path);
  } catch {
    return undefined;
  }
};

/** Reads HEAD from the files of the checkout that holds `dir`: its `.git` directory, or the directory a linked worktree's `.git` file names. */
export async function observeFromFiles(dir, read) {
  for (let at = resolveDir(dir, '.'); ; ) {
    const dotGit = `${at === '/' ? '' : at}/.git`;
    let head = await tryRead(read, `${dotGit}/HEAD`);
    if (head === undefined) {
      const pointer = /^gitdir:\s*(.+?)\s*$/mu.exec((await tryRead(read, dotGit)) ?? '')?.[1];
      if (pointer) head = await tryRead(read, `${resolveDir(at, pointer)}/HEAD`);
    }
    if (head !== undefined) {
      const state = parseHead(head);
      return state && { top: at, state };
    }
    const parent = resolveDir(at, '..');
    if (parent === at) return undefined;
    at = parent;
  }
}

/** Asks Git (`git(argv, cwd)` gives `{ exitCode, stdout }`) and falls back to the files when Git cannot answer. */
export async function observeBranch(dir, { git, read }) {
  try {
    const [top, head] = await Promise.all([git(['rev-parse', '--show-toplevel'], dir), git(['symbolic-ref', '--short', '-q', 'HEAD'], dir)]);
    const topDir = top.stdout.trim();
    if (top.exitCode === 0 && topDir) {
      if (head.exitCode === 0 && head.stdout.trim()) return { top: resolveDir(topDir, '.'), state: { branch: head.stdout.trim() } };
      const commit = head.exitCode === 1 ? await git(['rev-parse', 'HEAD'], dir) : undefined;
      if (commit?.exitCode === 0 && commit.stdout.trim()) return { top: resolveDir(topDir, '.'), state: { detached: commit.stdout.trim() } };
    }
  } catch {
    // Git is missing or failed to start; the files answer instead.
  }
  return observeFromFiles(dir, read);
}

// The directory a `git` segment acts on, or undefined when the command does not spell it out.
function targetDir(cwd, { cd, git }) {
  let dir = resolveDir(cwd, '.');
  for (const path of [...cd, ...git.dirs]) {
    if (path === null) return undefined;
    dir = resolveDir(dir, path);
  }
  if (git.workTree === null || git.gitDir === null) return undefined;
  if (git.workTree !== undefined) return resolveDir(dir, git.workTree);
  if (git.gitDir !== undefined) {
    const gitDir = resolveDir(dir, git.gitDir);
    return gitDir.endsWith('/.git') ? resolveDir(gitDir, '..') : gitDir;
  }
  return dir;
}

const keyOf = (loop, top) => `${loop}\t${top}`;
const sameState = (a, b) => (a.branch !== undefined ? a.branch === b.branch : b.detached !== undefined);
const describe = state => (state.branch !== undefined ? `"${state.branch}"` : `a detached HEAD at ${state.detached.slice(0, 7)}`);
const adoption = state => (state.branch !== undefined ? `git switch ${state.branch}` : 'git switch --detach');

function refusal(top, current, expected) {
  return `isSWF branch guard: git commit refused in ${top}. The checkout is on ${describe(current)}, but this session selected ${describe(expected)}; another actor may have switched the checkout. The guard switches, stashes or resets nothing. To commit on the selected branch, run your own \`${adoption(expected)}\` first; to continue on the current one on purpose, run \`${adoption(current)}\`, which adopts it. This is a process rule, not a retry signal: do not rephrase the command to get past it.`;
}

/**
 * Decides, before a shell command runs, whether a `git commit` in it would land on a branch the session did not select.
 * Returns `{ deny, reobserve: [] }` with the refusal text, or `{ reobserve }` with the directories where the command contains a
 * `git switch` or `git checkout`, which `refreshBranches` looks at again after the call.
 * It fails open: this guard enforces a process rule, not an authority, so a fault allows the command and updates nothing.
 */
export async function checkBranch({ command, cwd, loop, store, observe }) {
  try {
    const calls = tokenize(command)
      .filter(segment => segment.git && (segment.git.subcommand === 'commit' || SWITCHERS.has(segment.git.subcommand)))
      .map(segment => ({ commit: segment.git.subcommand === 'commit', dir: targetDir(cwd, segment) }))
      .filter(call => call.dir !== undefined);
    const entries = await store.read();
    const first = !Object.keys(entries).some(key => key.startsWith(`${loop}\t`));
    const seen = new Map();
    // A repository the loop has not touched yet is expected to stay on the branch it is on now.
    const look = async dir => {
      if (!seen.has(dir)) {
        const found = await observe(dir);
        if (found && entries[keyOf(loop, found.top)] === undefined) {
          entries[keyOf(loop, found.top)] = found.state;
          await store.set(keyOf(loop, found.top), found.state);
        }
        seen.set(dir, found);
      }
      return seen.get(dir);
    };
    if (first) await look(cwd);
    const reobserve = [];
    const switched = new Set();
    for (const { commit, dir } of calls) {
      if (!commit) {
        reobserve.push(dir);
        const found = await look(dir);
        if (found) switched.add(found.top);
        continue;
      }
      const found = await look(dir);
      // A switch earlier in the same command re-selects the branch of that repository, so a commit after it is not checked.
      if (found && switched.has(found.top)) continue;
      if (found && !sameState(entries[keyOf(loop, found.top)], found.state)) return { deny: refusal(found.top, found.state, entries[keyOf(loop, found.top)]), reobserve: [] };
    }
    return { reobserve: [...new Set(reobserve)] };
  } catch {
    return { reobserve: [] };
  }
}

/** After a call that contained `git switch` or `git checkout`, whatever its outcome: the checkout's branch is now the one the session selected. */
export async function refreshBranches({ dirs, loop, store, observe }) {
  try {
    for (const dir of dirs) {
      const found = await observe(dir);
      if (found) await store.set(keyOf(loop, found.top), found.state);
    }
  } catch {
    // A fault leaves the expected branches as they were.
  }
}
