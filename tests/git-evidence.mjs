import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const gitPath = spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath, 'Git executable must be locatable for this fixture');
const git = await realpath(gitPath);
const cli = join(source, 'tools/git-evidence.mjs');
const root = await mkdtemp(join(tmpdir(), 'isswf-git-identity-'));
function command(bin, args, cwd = root, expected = 0) {
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, expected, `${bin} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result.stdout.trim();
}
function commit(message) {
  command(git, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', message]);
  return command(git, ['rev-parse', 'HEAD']);
}
function invoke(binding, args = ['identity']) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: source, input: JSON.stringify(binding), encoding: 'utf8', timeout: 15000, maxBuffer: 16384, env: { PATH: process.env.PATH, HOME: process.env.HOME } });
  assert.ifError(result.error);
  let output;
  try { output = JSON.parse(result.stdout); } catch { assert.fail(`invalid CLI output: ${result.stdout}`); }
  return { status: result.status, output };
}
async function fingerprint(paths) {
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(join(root, path))).digest('hex')])));
}
try {
  command(git, ['init', '-q']);
  await writeFile(join(root, 'tracked.txt'), 'initial\n');
  command(git, ['add', 'tracked.txt']);
  const baseSha = commit('base');
  await writeFile(join(root, 'tracked.txt'), 'candidate\n');
  command(git, ['add', 'tracked.txt']);
  const candidateSha = commit('candidate');
  const binding = { version: 1, repository: root, baseSha, candidateSha, gitExecutable: git, timeoutMs: 5000, outputBytes: 4096 };
  const protectedPaths = ['tracked.txt', '.git/index', '.git/config'];
  const before = await fingerprint(protectedPaths);
  const valid = invoke(binding);
  assert.equal(valid.status, 0);
  assert.deepEqual({ status: valid.output.status, operation: valid.output.operation, repository: valid.output.repository, baseSha: valid.output.baseSha, candidateSha: valid.output.candidateSha, observedHeadSha: valid.output.observedHeadSha }, { status: 'ok', operation: 'identity', repository: root, baseSha, candidateSha, observedHeadSha: candidateSha });
  assert.match(valid.output.bindingSha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(await fingerprint(protectedPaths), before, 'identity must preserve worktree, index, and local config bytes');

  for (const [name, bad] of [
    ['missing binding', null],
    ['extra binding field', { ...binding, argv: ['status'] }],
    ['revision expression', { ...binding, baseSha: 'HEAD~1' }],
    ['non-canonical repository', { ...binding, repository: root + '/.' }],
    ['unsupported timeout', { ...binding, timeoutMs: 30000 }],
    ['malformed stdin operation', binding],
  ]) {
    const result = invoke(bad, name === 'malformed stdin operation' ? ['status'] : ['identity']);
    assert.notEqual(result.status, 0, `${name} must fail closed`);
    assert.equal(result.output.status, 'error', name);
  }
  const missingSha = 'f'.repeat(40);
  const missingObject = invoke({ ...binding, candidateSha: missingSha });
  assert.notEqual(missingObject.status, 0);
  assert.equal(missingObject.output.status, 'error');
  assert.deepEqual({ operation: missingObject.output.operation, repository: missingObject.output.repository, baseSha: missingObject.output.baseSha, candidateSha: missingObject.output.candidateSha }, { operation: 'identity', repository: root, baseSha, candidateSha: missingSha }, 'failure output must retain the exact bound context identity');

  const helper = join(root, 'helper-ran');
  const included = join(root, 'included-config');
  await writeFile(included, `[core]\nfsmonitor = !touch ${helper}\n`);
  const config = await readFile(join(root, '.git/config'), 'utf8');
  await writeFile(join(root, '.git/config'), config + `[include]\npath = ${included}\n`);
  const hostile = invoke(binding);
  assert.notEqual(hostile.status, 0);
  assert.match(hostile.output.reason, /configuration-refused/u);
  await assert.rejects(lstat(helper), { code: 'ENOENT' }, 'hostile configured helper must not execute');

  await rm(join(root, '.git/config'));
  await writeFile(join(root, '.git/config'), config);
  await mkdir(join(root, '.git/objects/info'), { recursive: true });
  await writeFile(join(root, '.git/objects/info/alternates'), '/outside/object-store\n');
  const alternate = invoke(binding);
  assert.notEqual(alternate.status, 0);
  assert.equal(alternate.output.reason, 'alternate-object-store-refused');
  assert.deepEqual(await fingerprint(['tracked.txt', '.git/index']), Object.fromEntries(Object.entries(before).filter(([key]) => key !== '.git/config')));

  await rm(join(root, '.git/objects/info/alternates'));
  const externalPack = join(root, 'external-pack');
  await mkdir(externalPack);
  await writeFile(join(externalPack, 'sentinel'), 'outside-object-store\n');
  const packPath = join(root, '.git/objects/pack');
  await rm(packPath, { recursive: true });
  await symlink(externalPack, packPath, process.platform === 'win32' ? 'junction' : 'dir');
  const linkedStore = invoke(binding);
  assert.notEqual(linkedStore.status, 0, 'object database directory links must be refused');
  assert.equal(linkedStore.output.reason, 'unsupported-object-store-topology');
  assert.equal(await readFile(join(externalPack, 'sentinel'), 'utf8'), 'outside-object-store\n', 'outside object-store sentinel must remain unchanged');
  console.log(JSON.stringify({ status: 'PASS', cases: ['bound exact identities and observed HEAD', 'malformed/extra args/revision expressions/root/bounds/missing objects fail closed', 'hostile include/helper config refused without execution', 'alternate object store refused', 'linked pack store refused without outside mutation', 'worktree/index/config bytes preserved on successful identity'], platform: process.platform, gitVersion: command(git, ['--version'], source) }));
} finally {
  await rm(root, { recursive: true, force: true });
}
