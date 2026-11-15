import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { tokenize } = await load('tools/isswf-command-core.mjs');
const { resolveDir, observeFromFiles, observeBranch, checkBranch, refreshBranches } = await load('tools/isswf-branch-guard-core.mjs');

// Git parsing: a segment whose command is `git` carries its global options and its subcommand, and every segment carries the
// directories that earlier `cd` and `pushd` segments of the same command moved to at the same depth.
const gitOf = command => tokenize(command).flatMap(segment => (segment.git ? [segment.git] : []));
const git = (subcommand, args = [], options = {}) => ({ dirs: [], config: [], gitDir: undefined, workTree: undefined, ...options, subcommand, args });

assert.deepEqual(gitOf('git commit -m x'), [git('commit', ['-m', 'x'])]);
assert.deepEqual(gitOf('git -C repo -c user.name=x --no-pager commit -m x'), [git('commit', ['-m', 'x'], { dirs: ['repo'], config: ['user.name=x'] })]);
assert.deepEqual(gitOf('git -C a -C b switch main'), [git('switch', ['main'], { dirs: ['a', 'b'] })]);
assert.deepEqual(gitOf('git --git-dir=a/.git --work-tree=a commit'), [git('commit', [], { gitDir: 'a/.git', workTree: 'a' })]);
assert.deepEqual(gitOf('git --git-dir a/.git --work-tree a commit'), [git('commit', [], { gitDir: 'a/.git', workTree: 'a' })]);
assert.deepEqual(gitOf('git -P -p --no-optional-locks status'), [git('status')]);
assert.deepEqual(gitOf('git --namespace ns --exec-path=/x checkout -b new'), [git('checkout', ['-b', 'new'])]);
assert.deepEqual(gitOf('git'), [git(undefined)]);
assert.deepEqual(gitOf('git --version'), [git(undefined)]);
assert.deepEqual(gitOf('sudo git -C /r commit'), [git('commit', [], { dirs: ['/r'] })]);
assert.deepEqual(gitOf('/usr/bin/git.exe commit -a'), [git('commit', ['-a'])]);
assert.deepEqual(gitOf('git commit -m x 2>&1 | tail -1'), [git('commit', ['-m', 'x'])]);
assert.deepEqual(gitOf('git add . && git commit -m x; git status').map(entry => entry.subcommand), ['add', 'commit', 'status']);

// Quoted text and heredocs that mention a git command are not git segments.
assert.deepEqual(gitOf('gh pr create --title "git commit" --body "run git commit now"'), []);
assert.deepEqual(gitOf("echo 'git commit -m x'"), []);
assert.deepEqual(gitOf('gh pr create --body-file - <<EOF\nthen git commit -m x\ngit switch main\nEOF'), []);
assert.deepEqual(gitOf('git commit -F - <<EOF\nfix: git switch main\nEOF').map(entry => entry.subcommand), ['commit']);
assert.deepEqual(gitOf('git commit -m "fix: git switch main && git checkout x"').map(entry => entry.subcommand), ['commit']);
assert.deepEqual(gitOf('echo git commit'), []);
assert.deepEqual(gitOf('# git commit'), []);

// Directory changes, as typed, per depth; `null` stands for a directory the command does not spell out.
const cdOf = command => tokenize(command).filter(segment => segment.git).map(segment => segment.cd);
assert.deepEqual(cdOf('git commit'), [[]]);
assert.deepEqual(cdOf('cd sub && git commit'), [['sub']]);
assert.deepEqual(cdOf('cd a && cd b && git commit'), [['a', 'b']]);
assert.deepEqual(cdOf('pushd x; git commit'), [['x']]);
assert.deepEqual(cdOf('cd /d C:/r && git commit'), [['C:/r']]);
assert.deepEqual(cdOf('Set-Location -Path r; git commit'), [['r']]);
assert.deepEqual(cdOf('(cd sub; git commit); git status'), [['sub'], []]);
assert.deepEqual(cdOf('cd a; (cd b; git commit); git status'), [['a', 'b'], ['a']]);
assert.deepEqual(cdOf('cd; git commit'), [[null]]);
assert.deepEqual(cdOf('cd - && git commit'), [[null]]);
assert.deepEqual(cdOf('cd $HOME && git commit'), [[null]]);
assert.deepEqual(cdOf('cd ~/repo && git commit'), [[null]]);
assert.deepEqual(cdOf('cd "my repo" && git commit'), [[null]]);
assert.deepEqual(cdOf('cd -- sub && git commit'), [['sub']]);

// Paths: the guard resolves directories as text, with forward slashes and a lower-case drive letter, on every platform.
assert.equal(resolveDir('/a/b', '../c'), '/a/c');
assert.equal(resolveDir('/a/b/', './c/'), '/a/b/c');
assert.equal(resolveDir('/a/b', '/x/y'), '/x/y');
assert.equal(resolveDir('C:\\work\\repo', '..\\other'), 'c:/work/other');
assert.equal(resolveDir('C:/work', 'D:\\x'), 'd:/x');
assert.equal(resolveDir('/', '..'), '/');
assert.equal(resolveDir('c:/', '..'), 'c:/');

const run = promisify(execFile);
const sh = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...args], { cwd, stdio: 'pipe', encoding: 'utf8' });
const gitProcess = async (argv, cwd) => {
  try {
    return { exitCode: 0, stdout: (await run('git', argv, { cwd })).stdout };
  } catch (error) {
    if (typeof error.code !== 'number') throw error;
    return { exitCode: error.code, stdout: error.stdout ?? '' };
  }
};
const readText = path => readFile(path, 'utf8');
const observers = {
  'git process': dir => observeBranch(dir, { git: gitProcess, read: readText }),
  'files only': dir => observeFromFiles(dir, readText),
  'files after a failed process': dir => observeBranch(dir, { git: async () => ({ exitCode: 128, stdout: '' }), read: readText }),
  'files after a process fault': dir => observeBranch(dir, { git: async () => { throw new Error('no git'); }, read: readText }),
};
const makeStore = () => {
  const entries = {};
  return { entries, read: async () => ({ ...entries }), set: async (key, value) => { entries[key] = value; } };
};
// A host: the guard runs before the command, the test then performs what the command would do, and the guard looks again.
const session = (observe, loop = 'main') => {
  const store = makeStore();
  return {
    store,
    check: (command, cwd) => checkBranch({ command, cwd, loop, store, observe }),
    refresh: dirs => refreshBranches({ dirs, loop, store, observe }),
  };
};
const refusal = (verdict, current, expected) => {
  assert.equal(typeof verdict.deny, 'string', `refused: ${current} against ${expected}`);
  for (const part of [`"${current}"`, `"${expected}"`, 'another actor', 'switches, stashes or resets nothing', `git switch ${expected}`, `git switch ${current}`, 'not a retry signal']) assert.ok(verdict.deny.includes(part), `${part} in ${verdict.deny}`);
};

for (const [mode, observe] of Object.entries(observers)) {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), 'isswf-branch-')));
  try {
    const repo = join(base, 'repo').replaceAll('\\', '/');
    mkdirSync(repo);
    sh(repo, 'init', '-q');
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    sh(repo, 'add', '.');
    sh(repo, 'commit', '-q', '-m', 'first');
    const outside = base.replaceAll('\\', '/');
    const label = text => `${mode}: ${text}`;

    // A commit on the branch the session started on runs; a branch switched outside the session refuses it, naming both.
    const s = session(observe);
    assert.equal((await s.check('git commit -m one', repo)).deny, undefined, label('first commit'));
    assert.equal((await s.check('ls', repo)).deny, undefined);
    sh(repo, 'switch', '-q', '-c', 'other');
    refusal(await s.check('git commit -m two', repo), 'other', 'main');
    refusal(await s.check('git add . && git commit -am two', repo), 'other', 'main');
    refusal(await s.check('git -c core.editor=true commit --amend', repo), 'other', 'main');
    assert.equal((await s.check('git status', repo)).deny, undefined, label('only commits are refused'));
    assert.equal((await s.check('git merge main', repo)).deny, undefined, label('merge is a known limit'));
    assert.equal((await s.check('git log --oneline -3', repo)).deny, undefined);

    // Text that mentions a commit is not a commit.
    assert.equal((await s.check('gh pr create --title "git commit" --body "then run git commit"', repo)).deny, undefined);
    assert.equal((await s.check('git log -1 --format=%s -- "git commit"', repo)).deny, undefined);
    assert.equal((await s.check('echo git commit', repo)).deny, undefined);
    assert.equal((await s.check('gh pr create --body-file - <<EOF\ngit commit -m x\nEOF', repo)).deny, undefined);

    // The session re-selects the branch itself, in one command or two; the guard re-observes after the call.
    {
      const chained = await s.check('git switch main && git commit -m three', repo);
      assert.equal(chained.deny, undefined, label('a switch earlier in the same command re-selects the branch'));
      assert.deepEqual(chained.reobserve, [resolveDir(repo, '.')]);
      sh(repo, 'switch', '-q', 'main');
      await s.refresh(chained.reobserve);
      assert.equal((await s.check('git commit -m four', repo)).deny, undefined);
    }
    sh(repo, 'switch', '-q', 'other');
    {
      const adopt = await s.check('git switch other', repo);
      assert.equal(adopt.deny, undefined);
      assert.deepEqual(adopt.reobserve, [resolveDir(repo, '.')]);
      await s.refresh(adopt.reobserve);
      assert.equal((await s.check('git commit -m on-other', repo)).deny, undefined, label('adopting the current branch on purpose'));
    }
    for (const [command, perform] of [
      ['git switch -c made', () => sh(repo, 'switch', '-q', '-c', 'made')],
      ['git checkout -b made2', () => sh(repo, 'checkout', '-q', '-b', 'made2')],
      ['git checkout other', () => sh(repo, 'checkout', '-q', 'other')],
    ]) {
      const verdict = await s.check(command, repo);
      assert.equal(verdict.deny, undefined, command);
      perform();
      await s.refresh(verdict.reobserve);
      const expected = sh(repo, 'branch', '--show-current').trim();
      const peer = expected === 'main' ? 'made' : 'main';
      assert.equal((await s.check('git commit -m x', repo)).deny, undefined, label(`commit after ${command}`));
      sh(repo, 'switch', '-q', peer);
      refusal(await s.check('git commit -m x', repo), peer, expected);
      sh(repo, 'switch', '-q', expected);
    }

    // A failed switch still adopts what the checkout is on, whatever the outcome.
    {
      sh(repo, 'switch', '-q', 'main');
      const failing = await s.check('git switch does-not-exist', repo);
      assert.equal(failing.deny, undefined);
      await s.refresh(failing.reobserve);
      assert.equal((await s.check('git commit -m y', repo)).deny, undefined, label('adopted after a failed switch'));
    }

    // The target directory: -C, an earlier cd, a subshell cd and the session directory.
    {
      const t = session(observe);
      assert.equal((await t.check('git -C repo commit -m x', outside)).deny, undefined);
      sh(repo, 'switch', '-q', 'other');
      refusal(await t.check('git -C repo commit -m x', outside), 'other', 'main');
      refusal(await t.check('git -C ./repo/ commit -m x', outside), 'other', 'main');
      refusal(await t.check('cd repo && git commit -m x', outside), 'other', 'main');
      refusal(await t.check('cd repo; git add -A; git commit -m x', outside), 'other', 'main');
      refusal(await t.check('(cd repo && git commit -m x)', outside), 'other', 'main');
      refusal(await t.check(`git --git-dir=${repo}/.git --work-tree=${repo} commit -m x`, outside), 'other', 'main');
      refusal(await t.check(`git --work-tree ${repo} commit -m x`, outside), 'other', 'main');
      refusal(await t.check('mkdir -p sub && cd sub/.. && git -C repo commit -m x', outside), 'other', 'main');
      assert.equal((await t.check('git commit -m x', outside)).deny, undefined, label('the session directory is not a repository'));
      assert.equal((await t.check('cd repo && cd .. && git commit -m x', outside)).deny, undefined, label('the last cd wins'));
      assert.equal((await t.check('(cd repo); git commit -m x', outside)).deny, undefined, label('a subshell cd does not outlive it'));
      assert.equal((await t.check('cd $SOMEWHERE && git commit -m x', repo)).deny, undefined, label('a directory the guard cannot read allows the command'));
      assert.equal((await t.check('git -C "my repo" commit -m x', repo)).deny, undefined);
      assert.equal((await t.check('git -C nowhere commit -m x', outside)).deny, undefined, label('a directory outside Git'));
      sh(repo, 'switch', '-q', 'main');
    }

    // A linked worktree has its own checkout and its own expected branch.
    {
      const wt = join(base, 'wt').replaceAll('\\', '/');
      sh(repo, 'worktree', 'add', '-q', wt, '-b', 'wtb');
      const t = session(observe);
      assert.equal((await t.check('git commit -m x', wt)).deny, undefined);
      assert.equal((await t.check('git commit -m x', repo)).deny, undefined);
      sh(wt, 'switch', '-q', '-c', 'wt2');
      refusal(await t.check('git commit -m x', wt), 'wt2', 'wtb');
      assert.equal((await t.check('git commit -m x', repo)).deny, undefined, label('the main checkout is untouched'));
      refusal(await t.check(`git -C ${wt} commit -m x`, repo), 'wt2', 'wtb');
      sh(wt, 'switch', '-q', 'wtb');
    }

    // A detached HEAD is expected as detached, whatever commit it is on.
    {
      const t = session(observe);
      const detach = await t.check('git switch --detach', repo);
      sh(repo, 'switch', '-q', '--detach');
      await t.refresh(detach.reobserve);
      assert.equal((await t.check('git commit --allow-empty -m d1', repo)).deny, undefined);
      sh(repo, 'commit', '-q', '--allow-empty', '-m', 'd1');
      assert.equal((await t.check('git commit --allow-empty -m d2', repo)).deny, undefined, label('a new commit moves a detached HEAD'));
      sh(repo, 'switch', '-q', 'main');
      const moved = await t.check('git commit -m x', repo);
      assert.match(moved.deny, /"main"/u);
      assert.match(moved.deny, /detached HEAD/u);
      sh(repo, 'switch', '-q', 'main');
      const fresh = session(observe);
      assert.equal((await fresh.check('git commit -m x', repo)).deny, undefined);
      sh(repo, 'switch', '-q', '--detach');
      const detached = await fresh.check('git commit -m x', repo);
      assert.match(detached.deny, /"main"/u);
      assert.match(detached.deny, /detached HEAD/u);
      assert.match(detached.deny, /git switch --detach/u);
      sh(repo, 'switch', '-q', 'main');
    }

    // Each agent loop keeps its own expected branch.
    {
      const store = makeStore();
      const as = loop => command => checkBranch({ command, cwd: repo, loop, store, observe });
      assert.equal((await as('main')('git commit -m x')).deny, undefined);
      sh(repo, 'switch', '-q', 'other');
      assert.equal((await as('agent-1')('git commit -m x')).deny, undefined, label('a child starts from its own first look'));
      refusal(await as('main')('git commit -m x'), 'other', 'main');
      sh(repo, 'switch', '-q', 'main');
      refusal(await as('agent-1')('git commit -m x'), 'main', 'other');
      assert.equal((await as('main')('git commit -m x')).deny, undefined);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// Fail open: a fault while reading the branch or inside the guard allows the command and leaves the store as it was.
{
  const faulty = session(async () => { throw new Error('unreadable'); });
  assert.deepEqual(await faulty.check('git commit -m x', '/r'), { reobserve: [] });
  await faulty.refresh(['/r']);
  assert.deepEqual(faulty.store.entries, {});
  const none = session(async () => undefined);
  assert.deepEqual(await none.check('git commit -m x', '/r'), { reobserve: [] });
  assert.deepEqual(none.store.entries, {});
  const broken = { read: async () => { throw new Error('store'); }, set: async () => { throw new Error('store'); } };
  assert.deepEqual(await checkBranch({ command: 'git commit -m x', cwd: '/r', loop: 'main', store: broken, observe: async () => ({ top: '/r', state: { branch: 'main' } }) }), { reobserve: [] });
  assert.deepEqual(await checkBranch({ command: undefined, cwd: '/r', loop: 'main', store: makeStore(), observe: async () => undefined }), { reobserve: [] });
}

// Reading HEAD from files: a plain repository, a linked worktree whose .git file points at its private directory, a relative pointer and no repository.
{
  const files = {
    'c:/p/.git/HEAD': 'ref: refs/heads/feature/x\n',
    'c:/w/.git': 'gitdir: C:/p/.git/worktrees/w\n',
    'c:/p/.git/worktrees/w/HEAD': 'ref: refs/heads/wtb\n',
    'c:/r/.git': 'gitdir: ../elsewhere/gitdir\n',
    'c:/elsewhere/gitdir/HEAD': '0123456789abcdef0123456789abcdef01234567\n',
    'c:/u/.git/HEAD': 'ref: refs/remotes/origin/x\n',
  };
  const read = async path => {
    if (!(path in files)) throw new Error(`ENOENT ${path}`);
    return files[path];
  };
  assert.deepEqual(await observeFromFiles('C:\\p\\src\\deep', read), { top: 'c:/p', state: { branch: 'feature/x' } });
  assert.deepEqual(await observeFromFiles('c:/w', read), { top: 'c:/w', state: { branch: 'wtb' } });
  assert.deepEqual(await observeFromFiles('c:/r', read), { top: 'c:/r', state: { detached: '0123456789abcdef0123456789abcdef01234567' } });
  assert.equal(await observeFromFiles('c:/u', read), undefined, 'a HEAD that is not a branch or a commit is not read');
  assert.equal(await observeFromFiles('c:/none/deeper', read), undefined);
}

console.log('PASS branch guard');
