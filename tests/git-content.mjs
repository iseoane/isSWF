import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const gitPath = spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath);
const git = await realpath(gitPath);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-git-content-')));
const cli = join(source, 'tools/git-evidence.mjs');
function gitRun(args, expected = 0) {
  const result = spawnSync(git, args, { cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, expected, `${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}
async function assertStalledContentInput() {
  const child = spawn(process.execPath, [cli, 'content', 'candidate', 'known file.txt'], { cwd: source, stdio: ['pipe', 'pipe', 'ignore'] });
  let stdout = '', forced = false;
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stdin.on('error', () => {});
  const closed = new Promise((done, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => done({ code, signal }));
  });
  const guard = setTimeout(() => { forced = true; child.kill('SIGKILL'); }, 5000);
  try {
    child.stdin.write('{"version":1}');
    const result = await closed;
    assert.equal(forced, false, 'content input must time out before the fixture kill guard');
    assert.equal(result.signal, null);
    assert.equal(result.code, 2);
    const evidence = JSON.parse(stdout);
    assert.equal(evidence.operation, 'content');
    assert.equal(evidence.reason, 'binding-input-timeout');
  } finally {
    clearTimeout(guard);
    child.stdin.destroy();
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await closed;
    }
  }
}
function invoke(binding, args = ['content']) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: source, input: JSON.stringify(binding), encoding: 'utf8', timeout: 15000, maxBuffer: 263168 });
  assert.ifError(result.error);
  return { status: result.status, output: JSON.parse(result.stdout) };
}
try {
  await assertStalledContentInput();
  gitRun(['init', '-q']);
  const bytes = Buffer.from([0xef, 0xbb, 0xbf, 0x41, 0x0d, 0x0a, 0xff, 0x00]);
  await writeFile(join(root, 'known file.txt'), bytes);
  await writeFile(join(root, 'empty.bin'), Buffer.alloc(0));
  await writeFile(join(root, 'large.bin'), Buffer.alloc(2048).fill(0x61));
  const unicodeBytes = Buffer.from([0, 0xfe, 0x80, 10]);
  await writeFile(join(root, 'naïve ñ.bin'), unicodeBytes);
  gitRun(['add', '-A']);
  gitRun(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'base']);
  const baseSha = gitRun(['rev-parse', 'HEAD']);
  await writeFile(join(root, 'known file.txt'), 'candidate\n');
  await rm(join(root, 'empty.bin'));
  await writeFile(join(root, 'added.txt'), 'added\r\n');
  gitRun(['add', '-A']);
  gitRun(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'candidate']);
  let candidateSha = gitRun(['rev-parse', 'HEAD']);
  const linkObject = gitRun(['hash-object', '-w', 'known file.txt']);
  gitRun(['update-index', '--add', '--cacheinfo', `120000,${linkObject},link-entry`]);
  gitRun(['update-index', '--add', '--cacheinfo', `160000,${baseSha},submodule-entry`]);
  gitRun(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'unsupported entry fixtures']);
  candidateSha = gitRun(['rev-parse', 'HEAD']);
  const binding = { version: 1, repository: root, baseSha, candidateSha, gitExecutable: git, timeoutMs: 5000, outputBytes: 8192, paths: ['known file.txt', 'empty.bin', 'large.bin', 'naïve ñ.bin', 'added.txt', 'absent.txt', 'link-entry', 'submodule-entry'] };
  const protectedFiles = ['known file.txt', 'large.bin', 'naïve ñ.bin', 'added.txt', '.git/index', '.git/config'];
  const before = await Promise.all(protectedFiles.map(path => readFile(join(root, path))));

  const result = invoke(binding, ['content', 'base', 'known file.txt']);
  assert.equal(result.status, 0, 'public content CLI returns a bound regular committed blob');
  assert.deepEqual({ status: result.output.status, operation: result.output.operation, commitSha: result.output.commitSha, path: result.output.path, contentEncoding: result.output.contentEncoding, contentBytes: result.output.contentBytes, contentSha256: result.output.contentSha256 }, {
    status: 'ok', operation: 'content', commitSha: baseSha, path: 'known file.txt', contentEncoding: 'base64', contentBytes: bytes.length, contentSha256: createHash('sha256').update(bytes).digest('hex'),
  });
  assert.equal(Buffer.from(result.output.content, 'base64').compare(bytes), 0, 'BOM, CRLF, invalid UTF-8 and NUL remain byte-exact');
  const unicodePath = invoke(binding, ['content', 'base', 'naïve ñ.bin']);
  assert.equal(unicodePath.status, 0);
  assert.equal(unicodePath.output.path, 'naïve ñ.bin');
  assert.deepEqual(Buffer.from(unicodePath.output.content, 'base64'), unicodeBytes, 'Unicode and spaces in committed paths resolve exactly');
  const empty = invoke(binding, ['content', 'base', 'empty.bin']);
  assert.equal(empty.status, 0);
  assert.equal(empty.output.contentBytes, 0, 'present empty blob is not absence');
  assert.equal(empty.output.contentSha256, createHash('sha256').update(Buffer.alloc(0)).digest('hex'));
  assert.equal(empty.output.content, '');
  const absent = invoke(binding, ['content', 'base', 'absent.txt']);
  assert.equal(absent.status, 0);
  assert.equal(absent.output.status, 'absent', 'a missing tree path is distinct from empty content and refusal');
  assert.equal(absent.output.path, 'absent.txt');
  const deleted = invoke(binding, ['content', 'candidate', 'empty.bin']);
  assert.equal(deleted.status, 0);
  assert.equal(deleted.output.status, 'absent', 'a path deleted by the selected commit is absent');
  const added = invoke(binding, ['content', 'candidate', 'added.txt']);
  assert.equal(added.status, 0);
  assert.deepEqual(Buffer.from(added.output.content, 'base64'), Buffer.from('added\r\n'));
  const oversized = invoke({ ...binding, outputBytes: 1024 }, ['content', 'base', 'large.bin']);
  assert.notEqual(oversized.status, 0);
  assert.equal(oversized.output.reason, 'content-output-limit');
  assert.equal(Object.hasOwn(oversized.output, 'content'), false, 'oversized blobs are never partially returned');
  for (const path of ['link-entry', 'submodule-entry']) {
    const unsupported = invoke(binding, ['content', 'candidate', path]);
    assert.notEqual(unsupported.status, 0);
    assert.equal(unsupported.output.reason, 'content-entry-type-refused', `${path} is not a regular blob`);
  }
  const originalConfig = await readFile(join(root, '.git/config'));
  await writeFile(join(root, '.git/config'), `${originalConfig}[core]\nfsmonitor = !touch ${join(root, 'helper-ran').replaceAll('\\', '/')}\n`);
  const helperRefusal = invoke(binding, ['content', 'base', 'known file.txt']);
  assert.notEqual(helperRefusal.status, 0);
  assert.equal(helperRefusal.output.reason, 'executable-or-external-git-configuration-refused');
  assert.deepEqual(await readFile(join(root, '.git/config')), Buffer.from(`${originalConfig}[core]\nfsmonitor = !touch ${join(root, 'helper-ran').replaceAll('\\', '/')}\n`));
  await writeFile(join(root, '.git/config'), originalConfig);
  await assert.rejects(readFile(join(root, 'helper-ran')), { code: 'ENOENT' }, 'configured helper cannot execute');
  const invalidSlot = invoke(binding, ['content', 'HEAD', 'known file.txt']);
  assert.notEqual(invalidSlot.status, 0);
  assert.equal(invalidSlot.output.reason, 'invalid-content-slot');
  for (const path of ['../known file.txt', '/known file.txt', 'C:/known file.txt', '\\\\server\\share', ':(top)known file.txt', 'known*.txt']) {
    const refused = invoke(binding, ['content', 'base', path]);
    assert.notEqual(refused.status, 0, `${path} must be refused`);
    assert.equal(refused.output.status, 'error');
    assert.equal(refused.output.operation, 'content');
  }
  const notAllowed = invoke(binding, ['content', 'base', 'unknown.txt']);
  assert.notEqual(notAllowed.status, 0);
  assert.equal(notAllowed.output.reason, 'content-path-not-allowed');
  const missingBinding = invoke(null, ['content', 'base', 'known file.txt']);
  assert.notEqual(missingBinding.status, 0);
  assert.equal(missingBinding.output.operation, 'content');
  const malformedAllowlist = invoke({ ...binding, paths: ['../escape'] }, ['content', 'base', 'known file.txt']);
  assert.notEqual(malformedAllowlist.status, 0);
  assert.equal(malformedAllowlist.output.reason, 'invalid-content-path-allowlist');
  assert.deepEqual(await Promise.all(protectedFiles.map(path => readFile(join(root, path)))), before, 'success and refusals do not change worktree, index or config');
  await assert.rejects(readFile(join(root, 'empty.bin')), { code: 'ENOENT' }, 'content reads do not restore a deleted worktree path');
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, cases: ['exact committed bytes', 'empty versus absent', 'unauthorized path refusal'] }));
} finally {
  await rm(root, { recursive: true, force: true });
}
