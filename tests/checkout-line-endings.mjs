import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const attributes = await readFile(join(source, '.gitattributes')).catch(error => { if (error.code === 'ENOENT') return Buffer.alloc(0); throw error; });
const root = await mkdtemp(join(tmpdir(), 'isswf-checkout-eol-'));
const repository = join(root, 'repository');
const samples = new Map([
  ['runtime.mjs', Buffer.from('#!/usr/bin/env node\nconsole.log("fixture");\n')],
  ['SKILL.md', Buffer.from('---\nname: fixture\ndescription: Synthetic skill\n---\n')],
  ['models.json', Buffer.from('{"version":1}\n')],
  ['quality.yml', Buffer.from('name: fixture\n')],
  ['binary.dat', Buffer.from([0, 13, 10, 255, 13, 10, 0])],
]);
function git(...args) {
  const result = spawnSync('git', args, { encoding: 'buffer', timeout: 15000, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' } });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr.toString()); return result.stdout;
}
let passed = false;
try {
  await mkdir(repository);
  git('init', '-q', repository);
  await writeFile(join(repository, '.gitattributes'), attributes);
  for (const [path, bytes] of samples) await writeFile(join(repository, path), bytes);
  git('-C', repository, '-c', 'core.autocrlf=false', 'add', '.');
  git('-C', repository, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Synthetic checkout policy');
  for (const autocrlf of ['true', 'false']) {
    const checkout = join(root, 'checkout-' + autocrlf);
    git('-c', 'core.autocrlf=' + autocrlf, 'clone', '-q', '--no-hardlinks', repository, checkout);
    for (const [path, original] of samples) {
      assert.deepEqual(await readFile(join(checkout, path)), original, `${path}: checkout changed under core.autocrlf=${autocrlf}`);
      assert.deepEqual(git('-C', checkout, 'show', 'HEAD:' + path), original);
    }
    assert.equal(git('-C', checkout, 'status', '--porcelain').toString(), '');
  }
  passed = true;
  console.log('PASS repository LF policy preserves executable/resource Git bytes and binary bytes with core.autocrlf=true and false');
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained failing checkout fixture: ${root}`);
}
