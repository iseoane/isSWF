import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm, chmod, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-worktree-location-'));
const project = join(root, 'project with spaces');
const worktreeRoot = join(root, 'external worktrees');
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
function git(path, ...args) {
  const result = spawnSync('git', ['-C', path, ...args], { env, encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
try {
  await mkdir(project);
  git(project, 'init', '-q');
  await writeFile(join(project, 'source.txt'), 'baseline\n');
  git(project, 'add', '.');
  git(project, 'commit', '-qm', 'baseline');
  const base = git(project, 'rev-parse', 'HEAD');
  const reference = await readFile(join(source, '.agents/roles/references/worktrees.md'), 'utf8');
  const commands = [...reference.matchAll(/```sh\n([\s\S]*?)\n```/gu)].map(match => match[1]);
  assert.equal(commands.length, 2, 'Configuration and creation recipes must remain executable');
  const assignment = { ...env, PROJECT: project, WORKTREE_ROOT: worktreeRoot, WORKTREE_ID: 'worker-one', WORKTREE_BRANCH: 'worker-one', BASE_SHA: base };
  function recipe(text) {
    const result = spawnSync('sh', ['-eu', '-c', text], { env: assignment, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  assert.equal(recipe(commands[0]), worktreeRoot);
  assert.equal(recipe(commands[0]), worktreeRoot, 'Settled configuration does not add duplicate values');
  assert.equal(git(project, 'config', '--local', '--get-all', 'isswf.worktreeRoot'), worktreeRoot);
  assert.equal(git(project, 'status', '--porcelain'), '', 'A private absolute preference must not create tracked setup changes');
  await mkdir(worktreeRoot, { mode: 0o700 });
  recipe(commands[1]);
  const checkout = join(worktreeRoot, assignment.WORKTREE_ID);
  assert.equal(git(checkout, 'rev-parse', 'HEAD'), base);
  assert.equal(git(checkout, 'config', '--local', '--get-all', 'isswf.worktreeRoot'), worktreeRoot, 'Linked worktrees share the local choice');
  await writeFile(join(checkout, 'source.txt'), 'unique dirty work\n');
  await writeFile(join(checkout, 'private.txt'), 'unique untracked work\n');
  await chmod(join(checkout, 'private.txt'), 0o700);
  const before = git(checkout, 'status', '--porcelain');
  const moved = join(worktreeRoot, 'preserved-worker');
  git(project, 'worktree', 'move', '--', checkout, moved);
  assert.equal(git(moved, 'status', '--porcelain'), before);
  assert.equal(await readFile(join(moved, 'private.txt'), 'utf8'), 'unique untracked work\n');
  assert.equal((await stat(join(moved, 'private.txt'))).mode & 0o777, 0o700);
  assert.equal(await readFile(join(moved, 'source.txt'), 'utf8'), 'unique dirty work\n');
  assert.equal(await readFile(join(project, 'source.txt'), 'utf8'), 'baseline\n');
  const listed = git(project, 'worktree', 'list', '--porcelain');
  assert.ok(listed.includes('worktree ' + moved));
  assert.ok(!listed.includes('worktree ' + checkout + '\n'));
  console.log('PASS documented native Git recipes: private local preference, idempotent selection, paths with spaces, external checkout and byte/mode-preserving dirty relocation. Not a host dispatch or automatic policy-enforcement test.');
} finally {
  await rm(root, { recursive: true, force: true });
}
