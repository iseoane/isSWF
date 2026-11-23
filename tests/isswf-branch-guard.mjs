import { initRepository } from './support/git-fixture.mjs';
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
const { default: registerPi } = await load('tools/isswf-command-guard-pi-extension.mjs');
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
    initRepository(repo, ['-b', 'main']);
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
    // A host that says the checkout has no isSWF state directory turns the unassigned check off; one that says it has keeps it.
    const plainCheck = usesIsswf => checkBranch({ command: 'git commit -m two', cwd: repo, loop: 'main', store: s.store, observe, usesIsswf });
    assert.equal((await plainCheck(async () => false)).deny, undefined, label('a checkout without isSWF state is not checked'));
    refusal(await plainCheck(async () => true), 'other', 'main');
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
    // The exemption compares repository top levels, not directory text.
    {
      const other = join(base, 'other-repo').replaceAll('\\', '/');
      mkdirSync(other);
      initRepository(other, ['-b', 'main']);
      writeFileSync(join(other, 'b.txt'), 'b\n');
      sh(other, 'add', '.');
      sh(other, 'commit', '-q', '-m', 'first');
      mkdirSync(join(repo, 'sub'));
      assert.equal((await s.check('git -C ../other-repo commit -m x', repo)).deny, undefined, label('the other repository is first seen on its branch'));
      const otherBranch = sh(other, 'branch', '--show-current').trim();
      sh(repo, 'switch', '-q', 'other');
      sh(other, 'switch', '-q', '-c', 'peer');
      assert.equal((await s.check('git switch main && cd sub && git commit -m x', repo)).deny, undefined, label('a commit in a subdirectory of the switched repository follows the switch'));
      refusal(await s.check('git switch main && git -C ../other-repo commit -m x', repo), 'peer', otherBranch);
      sh(other, 'switch', '-q', otherBranch);
      sh(repo, 'switch', '-q', 'main');
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
    'c:/q/.git/HEAD': 'ref: refs/heads/.invalid\n',
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
  assert.equal(await observeFromFiles('c:/q', read), undefined, 'a reftable repository keeps no branch in HEAD');
}

// Pi: the extension refuses on `tool_call`, looks again on `tool_result` and starts afresh on `session_start`.
{
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), 'isswf-branch-pi-')));
  try {
    const repo = join(base, 'repo');
    mkdirSync(join(repo, '.factory'), { recursive: true });
    initRepository(repo, ['-b', 'main']);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    writeFileSync(join(repo, '.factory', 'project-setup.md'), '# Setup\n');
    sh(repo, 'add', '.');
    sh(repo, 'commit', '-q', '-m', 'first');
    const handlers = {};
    registerPi({ on: (name, handler) => { handlers[name] = handler; } });
    assert.deepEqual(Object.keys(handlers).sort(), ['input', 'session_start', 'tool_call', 'tool_result']);
    const ctx = { cwd: repo };
    const call = (toolName, id, command) => handlers.tool_call({ type: 'tool_call', toolName, toolCallId: id, input: { command } }, ctx);
    const result = (toolName, id, command, isError = false) => handlers.tool_result({ type: 'tool_result', toolName, toolCallId: id, input: { command }, isError, content: [] }, ctx);
    await handlers.session_start({ type: 'session_start', reason: 'startup' }, ctx);

    assert.equal(await call('bash', 'c1', 'git commit -m one'), undefined);
    sh(repo, 'switch', '-q', '-c', 'other');
    for (const toolName of ['bash', 'powershell']) {
      const blocked = await call(toolName, 'c2', 'git commit -m two');
      assert.equal(blocked.block, true, toolName);
      for (const part of ['"other"', '"main"', 'another actor', 'git switch main', 'git switch other']) assert.ok(blocked.reason.includes(part), `${toolName}: ${part}`);
    }
    assert.equal(await call('read', 'c3', 'git commit -m two'), undefined, 'only shell tools are guarded');
    assert.equal(await call('bash', 'c4', 'git status'), undefined);
    assert.match((await call('bash', 'c5', 'npx x')).reason, /package-acquisition/u, 'the command guard still refuses first');
    assert.equal(await handlers.tool_call({ toolName: 'bash', toolCallId: 'c6', input: { command: 'git commit -m x' } }, {}), undefined, 'a call without a session directory is left alone');
    assert.equal(await handlers.tool_call({ toolName: 'bash', input: {} }, ctx), undefined);
    assert.equal(await handlers.tool_call(undefined, ctx), undefined);

    // A failed switch still adopts the checkout's branch.
    assert.equal(await call('bash', 'c7', 'git switch nothing'), undefined);
    await result('bash', 'c7', 'git switch nothing', true);
    assert.equal(await call('bash', 'c8', 'git commit -m three'), undefined, 'the checkout was adopted after the switch call');
    sh(repo, 'switch', '-q', 'main');
    assert.equal((await call('bash', 'c9', 'git commit -m four')).block, true);
    assert.equal(await call('bash', 'c10', 'git switch main'), undefined);
    await result('bash', 'c10', 'git switch main');
    assert.equal(await call('bash', 'c11', 'git commit -m five'), undefined);
    await result('bash', 'unknown-call', 'git commit -m five');
    await result('bash', undefined, 'git commit -m five');
    assert.equal(await handlers.tool_result(undefined, ctx), undefined);

    // A new session expects the branch it starts on.
    sh(repo, 'switch', '-q', 'other');
    assert.equal((await call('bash', 'c12', 'git commit -m six')).block, true);
    await handlers.session_start({ type: 'session_start', reason: 'new' }, ctx);
    assert.equal(await call('bash', 'c13', 'git commit -m seven'), undefined);
    sh(repo, 'switch', '-q', 'main');
    const moved = await call('bash', 'c14', 'git commit -m eight');
    assert.ok(moved.reason.includes('The checkout is on "main", but this session selected "other"'), moved.reason);
    // Without a state directory the checkout is not an isSWF project, so the same commit runs.
    rmSync(join(repo, '.factory'), { recursive: true, force: true });
    assert.equal(await call('bash', 'c15', 'git commit -m nine'), undefined, 'a checkout without isSWF state is not checked');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// An assigned loop (a worker the coordinator bound to a checkout and branch) may commit only there, whatever branch the loop selected first.
{
  const repos = {
    '/p': { top: '/p', state: { branch: 'feat/a' } },
    '/wt': { top: '/wt', state: { branch: 'feat/a' } },
    'c:/work/wt': { top: 'c:/work/wt', state: { branch: 'feat/a' } },
  };
  const at = (dir, state) => async path => (path === dir || path.startsWith(`${dir}/`) ? { ...repos[dir], state: state ?? repos[dir].state } : undefined);
  const guarded = (assignment, observe, command, cwd) => checkBranch({ command, cwd, loop: 'agent-1', store: makeStore(), observe, assignment });
  const assignment = { checkout: '/wt', branch: 'feat/a' };
  const label = (verdict, ...parts) => {
    assert.equal(typeof verdict.deny, 'string');
    for (const part of parts) assert.ok(verdict.deny.includes(part), `${part} in ${verdict.deny}`);
  };

  assert.equal((await guarded(assignment, at('/wt'), 'git commit -m x', '/wt')).deny, undefined, 'a commit in the assigned checkout on the assigned branch runs');
  label(await guarded(assignment, at('/p'), 'git commit -m x', '/p'), '/wt', '/p', 'feat/a', 'not a retry signal');
  label(await guarded(assignment, observe => at('/p')(observe), 'git -C /p commit -m x', '/wt'), '/wt', '/p');
  assert.equal((await guarded(assignment, at('/p'), 'git status', '/p')).deny, undefined, 'only a commit is refused');
  assert.equal((await guarded(undefined, at('/p'), 'git commit -m x', '/p')).deny, undefined, 'a loop without an assignment is unchanged');
  label(await guarded(assignment, at('/wt', { branch: 'other' }), 'git commit -m x', '/wt'), '"other"', '"feat/a"', '/wt');
  label(await guarded(assignment, at('/wt', { detached: 'a'.repeat(40) }), 'git commit -m x', '/wt'), 'detached HEAD', '"feat/a"');
  label(await guarded(assignment, at('/p'), 'git switch feat/a && git commit -m x', '/p'), '/wt', '/p');
  assert.equal((await guarded(assignment, at('/wt', { branch: 'other' }), 'git switch feat/a && git commit -m x', '/wt')).deny, undefined, 'a switch in the same command re-selects the assigned branch');
  assert.equal((await guarded({ checkout: 'C:\\Work\\Wt\\', branch: 'feat/a' }, at('c:/work/wt'), 'git commit -m x', 'C:\\Work\\Wt')).deny, undefined, 'a Windows spelling of the assigned checkout is the same checkout');
  // Git reports its own spelling of a Windows path, so the host answers that spelling while the assignment names the same checkout in another case.
  const reported = { top: 'c:/Users/Me/Repo', state: { branch: 'feat/a' } };
  const spelled = path => (path.startsWith('c:/') ? reported : undefined);
  assert.equal((await guarded({ checkout: 'C:\\users\\me\\REPO', branch: 'feat/a' }, spelled, 'git commit -m x', 'c:/Users/Me/Repo')).deny, undefined, 'a drive path differing only in case is the same checkout');
  label(await guarded({ checkout: 'C:\\Users\\Me\\Other', branch: 'feat/a' }, spelled, 'git commit -m x', 'c:/Users/Me/Repo'), 'c:/Users/Me/Other', 'c:/Users/Me/Repo');
  label(await guarded({ checkout: '/Wt', branch: 'feat/a' }, at('/wt'), 'git commit -m x', '/wt'), '/Wt', '/wt');
  assert.equal((await guarded(assignment, async () => undefined, 'git commit -m x', '/p')).deny, undefined, 'an unreadable checkout fails open');
}

// The assignment is two lines of a dispatch prompt: an absolute checkout path and a branch name.
{
  const { assignmentOf } = await load('tools/isswf-branch-guard-core.mjs');
  assert.deepEqual(assignmentOf('Work on J001.\ncheckout: /work/wt\nbranch: feat/a\nmore'), { checkout: '/work/wt', branch: 'feat/a' });
  assert.deepEqual(assignmentOf('checkout: C:\\work\\wt \r\nbranch: feat/a\r\n'), { checkout: 'C:\\work\\wt', branch: 'feat/a' });
  for (const text of ['branch: feat/a', 'checkout: /w', 'checkout: relative/wt\nbranch: feat/a', 'checkout: /w\nbranch: bad name', 'checkout: /w\nbranch: -x', 'see checkout: /w and branch: x', undefined, 42]) {
    assert.equal(assignmentOf(text), undefined, String(text));
  }
}

// Pi: a worker's extension binds the session to the checkout and branch its task names, on the first task that is an isSWF dispatch.
{
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), 'isswf-assign-pi-')));
  try {
    const repo = join(base, 'repo');
    const tree = join(base, 'wt');
    mkdirSync(repo);
    initRepository(repo, ['-b', 'main']);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    sh(repo, 'add', '.');
    sh(repo, 'commit', '-q', '-m', 'first');
    sh(repo, 'worktree', 'add', '-q', '-b', 'feat/a', tree);
    const handlers = {};
    registerPi({ on: (name, handler) => { handlers[name] = handler; } });
    const task = (checkout, branch) => `Work on the brief .factory/initiatives/I0001/jobs/J001/brief-r1.md.\nInput checkpoint ${'a1'.repeat(20)}.\nTarget base: main ${'b2'.repeat(20)}.\ncheckout: ${checkout}\nbranch: ${branch}`;
    const call = (cwd, command) => handlers.tool_call({ type: 'tool_call', toolName: 'bash', toolCallId: 'c', input: { command } }, { cwd });
    const start = () => handlers.session_start({ type: 'session_start', reason: 'startup' }, { cwd: repo });

    await start();
    assert.equal(await call(repo, 'git commit --allow-empty -m x'), undefined, 'an unassigned session commits where it is');
    await start();
    await handlers.input({ type: 'input', text: 'checkout: ' + repo + '\nbranch: main', source: 'interactive' });
    assert.equal(await call(tree, 'git commit --allow-empty -m x'), undefined, 'text that is not a dispatch assigns nothing');
    await handlers.input({ type: 'input', text: task(tree, 'feat/a'), source: 'rpc' });
    assert.equal(await call(tree, 'git commit --allow-empty -m x'), undefined, 'the assigned checkout and branch commit');
    const blocked = await call(repo, 'git commit --allow-empty -m x');
    assert.equal(blocked.block, true, 'another checkout is refused');
    for (const part of [tree.replaceAll('\\', '/').toLowerCase(), 'feat/a']) assert.ok(blocked.reason.toLowerCase().includes(part), `${part} in ${blocked.reason}`);
    assert.equal((await call(tree, `git -C ${repo.replaceAll('\\', '/')} commit --allow-empty -m x`)).block, true, 'a -C into another checkout is refused');
    await handlers.input({ type: 'input', text: task(repo, 'main'), source: 'rpc' });
    assert.equal((await call(repo, 'git commit --allow-empty -m x')).block, true, 'a later task does not rebind the session');
    await start();
    assert.equal(await call(repo, 'git commit --allow-empty -m x'), undefined, 'a new session starts unassigned');
    assert.equal(await handlers.input(undefined), undefined);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// Claude: the one `tool.call` hook refuses `Bash` and `PowerShell` after the command guard and before `next(e)`, whatever the pane option
// is, for the main loop (`main`) and for a child (`agentId`), and looks again after `next(e)` without touching its result.
// register.tsx has no runner here, so the hook is a source check; the live check covers the host.
{
  const hooks = await readFile(join(source, 'hooks/register.tsx'), 'utf8');
  const hook = hooks.slice(hooks.indexOf("on('tool.call'"));
  const imported = /import \{([^}]*)\} from '\.\.\/tools\/isswf-branch-guard-core\.mjs'/u.exec(hooks)?.[1] ?? '';
  for (const name of ['checkBranch', 'observeBranch', 'refreshBranches']) assert.ok(new RegExp(`\\b${name}\\b`, 'u').test(imported), `the hook imports ${name} from the core`);
  const commandAt = hook.indexOf('guardCommand(');
  const checkAt = hook.indexOf('await checkBranch(');
  const nextAt = hook.indexOf('await next(e)');
  const refreshAt = hook.indexOf('await refreshBranches(');
  const paneAt = hook.indexOf('options?.initiativesPane === true');
  assert.ok(commandAt > 0 && commandAt < checkAt && checkAt < nextAt, 'the branch check runs after the command guard and before the tool is called');
  assert.ok(nextAt < refreshAt && refreshAt < paneAt, 'the branches are looked at again after the tool, ahead of the pane and independent of its option');
  const before = hook.slice(0, nextAt);
  assert.ok(before.includes("e.tool === 'Bash' || e.tool === 'PowerShell'"), 'both shell tools are checked');
  assert.ok(hooks.includes("loop: e.agentId ?? 'main'"), 'the main loop and each child have their own expected branches');
  assert.ok(/return \{ deny: branch\.deny \}/u.test(before), 'a refusal is a deny');
  assert.ok(/await gitRun\(\$, argv, cwd\)/u.test(hook) && hook.includes('$.fs.read(file)'), 'Git runs through the host and the files are the fallback');
  assert.ok(/assignmentOf/u.test(imported), 'the hook imports assignmentOf from the core');
  assert.ok(/key: 'assigned'/u.test(hooks) && /assigned: IsswfAssigned/u.test(await readFile(join(source, 'types/index.d.ts'), 'utf8')), 'the assignments are one declared plugin state key');
  const checked = before.slice(checkAt, before.indexOf('\n', checkAt));
  assert.ok(checked.includes('assignment') && before.includes('(await $.state.get(ASSIGNED)).value?.[e.agentId]'), 'a child is checked against the assignment stored under its agent id');
  const remembered = hook.slice(nextAt, refreshAt);
  assert.ok(remembered.includes('ran.deny === undefined && !ran.isError') && remembered.includes('assignmentOf(') && remembered.includes('update($, ASSIGNED'), 'an accepted role dispatch stores its assignment under the run id the host returned');
  const afterNext = hook.slice(nextAt, refreshAt);
  assert.ok(!/return|ran\s*=/u.test(afterNext.replace('const ran = await next(e)', '')), 'looking again never changes or ends the call');
  assert.ok(/key: 'branches'/u.test(hooks), 'the expected branches are one plugin state key');
  const types = await readFile(join(source, 'types/index.d.ts'), 'utf8');
  assert.ok(/branches: IsswfBranches/u.test(types), 'the state key is declared through PluginState');
}

// Packaging: the core ships next to the command core, Knip and the quality check know it, and the quality check runs this test.
{
  const read = path => readFile(join(source, path), 'utf8');
  assert.ok((await read('tools/factory-package.mjs')).includes('"tools/isswf-branch-guard-core.mjs"'), 'the package allowlist ships the core');
  assert.ok(JSON.parse(await read('tooling/quality/knip.json')).entry.includes('tools/isswf-branch-guard-core.mjs'), 'Knip treats the core as an entry');
  assert.ok((await read('tools/check-quality.mjs')).includes("'tests/isswf-branch-guard.mjs'"), 'the quality check runs this test');
}

console.log('PASS branch guard');
