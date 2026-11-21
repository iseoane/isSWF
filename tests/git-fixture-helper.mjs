import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cloneRepository, gitFixtureArgs, initRepository } from './support/git-fixture.mjs';

const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const gitPath = spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath, 'Git executable must be locatable');
const git = await realpath(gitPath);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-git-fixture-')));
const run = (args, encoding = 'utf8') => {
  const result = spawnSync(git, gitFixtureArgs(args), {
    cwd: root,
    env: { ...process.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'true' },
    encoding,
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}`);
  return encoding === null ? result.stdout : result.stdout.trim();
};
try {
  const callerArgs = ['status', '--porcelain'];
  assert.deepEqual(gitFixtureArgs(callerArgs).slice(8), callerArgs);
  assert.deepEqual(callerArgs, ['status', '--porcelain'], 'the helper does not mutate caller argv');
  initRepository(root, [], { git });
  assert.equal(run(['config', '--local', '--get', 'core.fsmonitor']), 'false', 'a fixture repository keeps fsmonitor off');
  const blobs = new Map([
    ['crlf.txt', Buffer.from('one\r\ntwo\r\n')],
    ['bom.txt', Buffer.from([0xef, 0xbb, 0xbf, 0x41, 0x0d, 0x0a])],
    ['binary.bin', Buffer.from([0, 255, 13, 10, 128])],
    ['empty.bin', Buffer.alloc(0)],
  ]);
  for (const [path, bytes] of blobs) await writeFile(join(root, path), bytes);
  run(['add', '-A']);
  for (const [path, bytes] of blobs) {
    assert.deepEqual(run(['show', `:${path}`], null), bytes, `index blob ${path} remains exact`);
  }
  run(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'exact fixture blobs']);
  for (const [path, bytes] of blobs) {
    const result = spawnSync(git, gitFixtureArgs(['show', `HEAD:${path}`]), { cwd: root, encoding: null, timeout: 10000, maxBuffer: 1024 * 1024 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `committed blob ${path}: ${result.stderr}`);
    assert.deepEqual(result.stdout, bytes, `committed blob ${path} remains byte-exact`);
  }
  const clone = join(root, 'clone');
  cloneRepository(root, clone, ['--no-hardlinks'], { git });
  assert.equal(spawnSync(git, ['-C', clone, 'config', '--local', '--get', 'core.fsmonitor'], { encoding: 'utf8' }).stdout.trim(), 'false', 'a fixture clone keeps fsmonitor off');
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, blobs: [...blobs].map(([path, bytes]) => ({ path, bytes: bytes.length })) }));
} finally {
  await rm(root, { recursive: true, force: true });
}
