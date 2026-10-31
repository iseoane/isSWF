import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const gitPath = spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath, 'Git executable must be locatable for this fixture');
const git = await realpath(gitPath);
const cli = join(source, 'tools/git-evidence.mjs');
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-git-identity-')));
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
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: source, input: JSON.stringify(binding), encoding: 'utf8', timeout: 15000, maxBuffer: 263168, env: { PATH: process.env.PATH, HOME: process.env.HOME } });
  assert.ifError(result.error);
  let output;
  try { output = JSON.parse(result.stdout); } catch { assert.fail(`invalid CLI output: ${result.stdout}`); }
  return { status: result.status, output };
}
async function assertStalledInputRefused(operation, partial) {
  const started = Date.now();
  const child = spawn(process.execPath, [cli, operation], { cwd: source, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', forced = false;
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdin.on('error', () => {});
  const closed = new Promise((done, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => done({ code, signal }));
  });
  const guard = setTimeout(() => { forced = true; child.kill('SIGKILL'); }, 5000);
  try {
    if (partial) child.stdin.write(partial);
    // Deliberately keep this process's stdin open: the public CLI must cease itself.
    const result = await closed;
    assert.equal(forced, false, `${operation} must refuse an open input stream before the fixture kills it`);
    assert.equal(result.signal, null, stderr);
    assert.equal(result.code, 2, stderr);
    assert.ok(Date.now() - started < 5000, 'input collection has a finite wall-clock deadline');
    assert.ok(Buffer.byteLength(stdout) <= 512, 'input refusal is bounded');
    const evidence = JSON.parse(stdout);
    assert.equal(evidence.operation, operation);
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
async function fingerprint(paths) {
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(join(root, path))).digest('hex')])));
}
try {
  await assertStalledInputRefused('diff', '{"version":1}');
  await assertStalledInputRefused('identity', '');
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
  const diff = invoke(binding, ['diff']);
  assert.equal(diff.status, 0, 'the public CLI must return a committed diff for a supported binding');
  assert.equal(diff.output.operation, 'diff');
  assert.equal(diff.output.patchEncoding, 'base64');
  assert.equal(Buffer.from(diff.output.patch, 'base64').toString('utf8'), `diff --git a/tracked.txt b/tracked.txt\nindex e79c5e8f964493290a409888d5413a737e8e5dd5..02e8acdcc44da4d68465994d590e44bcab3296b2 100644\n--- a/tracked.txt\n+++ b/tracked.txt\n@@ -1 +1 @@\n-initial\n+candidate\n`);
  const valid = invoke(binding);
  assert.equal(valid.status, 0);
  assert.deepEqual({ status: valid.output.status, operation: valid.output.operation, repository: valid.output.repository, baseSha: valid.output.baseSha, candidateSha: valid.output.candidateSha, observedHeadSha: valid.output.observedHeadSha }, { status: 'ok', operation: 'identity', repository: root, baseSha, candidateSha, observedHeadSha: candidateSha });
  assert.match(valid.output.bindingSha256, /^[0-9a-f]{64}$/u);
  assert.deepEqual(await fingerprint(protectedPaths), before, 'identity must preserve worktree, index, and local config bytes');
  const empty = invoke({ ...binding, baseSha: candidateSha }, ['diff']);
  assert.equal(empty.status, 0);
  assert.equal(empty.output.patchEncoding, 'base64');
  assert.equal(empty.output.patch, '');
  assert.equal(empty.output.patchBytes, 0);
  assert.equal(empty.output.patchSha256, createHash('sha256').update(Buffer.alloc(0)).digest('hex'));

  await writeFile(join(root, 'removed.txt'), 'remove me\n');
  command(git, ['add', 'removed.txt']);
  const diffBase = commit('diff fixture base');
  await rm(join(root, 'removed.txt'));
  await writeFile(join(root, 'payload.bin'), Buffer.from([0, 255, 1, 10, 128]));
  await writeFile(join(root, 'strange name-é.txt'), 'added fixture\n');
  command(git, ['add', '-A']);
  const diffCandidate = commit('binary add delete and unusual path');
  const fixtureBinding = { ...binding, baseSha: diffBase, candidateSha: diffCandidate };
  const fixtureIndexBefore = await readFile(join(root, '.git/index'));
  const fixtureConfigBefore = await readFile(join(root, '.git/config'));
  const fixtureResult = invoke(fixtureBinding, ['diff']);
  assert.deepEqual(await readFile(join(root, '.git/index')), fixtureIndexBefore);
  assert.deepEqual(await readFile(join(root, '.git/config')), fixtureConfigBefore);
  assert.equal(fixtureResult.status, 0);
  assert.ok(Buffer.byteLength(JSON.stringify(fixtureResult.output) + '\n') <= 32768, 'complete successful response stays within the wire cap');
  const fixtureBytes = Buffer.from(fixtureResult.output.patch, 'base64');
  assert.equal(fixtureResult.output.patchEncoding, 'base64');
  assert.equal(fixtureResult.output.patchBytes, fixtureBytes.length);
  assert.equal(fixtureResult.output.patchSha256, createHash('sha256').update(fixtureBytes).digest('hex'));
  const fixtureText = fixtureBytes.toString('utf8');
  assert.match(fixtureText, /deleted file mode 100644[\s\S]*remove me/u);
  assert.match(fixtureText, /GIT binary patch/u);
  assert.ok(fixtureText.includes('strange name-\\303\\251.txt'), 'Git quoted unusual filename bytes without UTF-8 normalization');
  await writeFile(join(root, '.gitattributes'), '*.bin diff=unexpected\n');
  const dirtyAttributes = invoke(fixtureBinding, ['diff']);
  assert.equal(dirtyAttributes.status, 0, 'working-tree attributes cannot change a committed diff');
  assert.equal(dirtyAttributes.output.patch, fixtureResult.output.patch);
  const localAttributes = join(root, '.git/info/attributes');
  await writeFile(localAttributes, '*.txt -diff\n');
  const localAttributeDiff = invoke(fixtureBinding, ['diff']);
  assert.notEqual(localAttributeDiff.status, 0, 'uncommitted local info attributes cannot silently influence the committed patch');
  assert.equal(localAttributeDiff.output.reason, 'local-attributes-refused');
  assert.equal(await readFile(localAttributes, 'utf8'), '*.txt -diff\n');
  await rm(localAttributes);
  const diffProtectedPaths = ['tracked.txt', 'payload.bin', 'strange name-é.txt', '.gitattributes', '.git/index', '.git/config'];
  await assert.rejects(lstat(join(root, 'removed.txt')), { code: 'ENOENT' }, 'the committed deletion remains absent from the worktree');
  const diffProtectedBefore = await fingerprint(diffProtectedPaths);
  const missingDiffBinding = invoke(null, ['diff']);
  assert.notEqual(missingDiffBinding.status, 0);
  assert.equal(missingDiffBinding.output.status, 'error');
  const alteredDiffBinding = invoke({ ...fixtureBinding, repository: root + '/.' }, ['diff']);
  assert.notEqual(alteredDiffBinding.status, 0);
  assert.equal(alteredDiffBinding.output.reason, 'repository-binding-not-canonical');
  const extraDiffBinding = invoke({ ...fixtureBinding, argv: ['status'] }, ['diff']);
  assert.notEqual(extraDiffBinding.status, 0);
  assert.equal(extraDiffBinding.output.reason, 'invalid-binding-shape');
  const extraDiffArguments = invoke(fixtureBinding, ['diff', '--stat']);
  assert.notEqual(extraDiffArguments.status, 0);
  assert.equal(extraDiffArguments.output.reason, 'supported-operation-required');
  assert.equal(extraDiffArguments.output.operation, 'diff', 'refused diff invocations must retain their operation identity');
  const smallBound = invoke({ ...fixtureBinding, outputBytes: 512 }, ['diff']);
  assert.notEqual(smallBound.status, 0);
  assert.equal(smallBound.output.reason, 'diff-output-limit');
  assert.equal(smallBound.output.status, 'error');
  assert.ok(!Object.hasOwn(smallBound.output, 'patch'), 'oversized patch is refused, never returned partially');
  assert.ok(Buffer.byteLength(JSON.stringify(smallBound.output) + '\n') <= 32768);
  const attributeFile = join(root, 'external-attributes');
  await writeFile(attributeFile, '*.txt diff=unexpected\n');
  const cleanConfig = await readFile(join(root, '.git/config'), 'utf8');
  await writeFile(join(root, '.git/config'), `${cleanConfig}[core]\nattributesFile = ${attributeFile.replaceAll('\\', '/')}\n`);
  const externalAttributes = invoke(fixtureBinding, ['diff']);
  assert.notEqual(externalAttributes.status, 0);
  assert.equal(externalAttributes.output.reason, 'executable-or-external-git-configuration-refused');
  await writeFile(join(root, '.git/config'), cleanConfig);
  assert.deepEqual(await fingerprint(diffProtectedPaths), diffProtectedBefore, 'diff success, refusal, and attribute checks must preserve all protected bytes');
  await assert.rejects(lstat(join(root, 'removed.txt')), { code: 'ENOENT' }, 'diff must not restore the deleted worktree file');

  const largeLines = Array.from({ length: 700 }, (_, index) => `large-diff-line ${index} ${'x'.repeat(40)}`);
  await writeFile(join(root, 'large-text.txt'), largeLines.join('\n') + '\n');
  command(git, ['add', 'large-text.txt']);
  const largeCandidate = commit('large bounded diff');
  const largeResult = invoke({ ...binding, baseSha: diffCandidate, candidateSha: largeCandidate, outputBytes: 131072 }, ['diff']);
  assert.equal(largeResult.status, 0, 'a bounded diff larger than 22KB must remain usable for an exact-candidate review');
  const largePatch = Buffer.from(largeResult.output.patch, 'base64');
  assert.ok(largePatch.length > 22000);
  assert.equal(largeResult.output.patchBytes, largePatch.length);
  assert.equal(largeResult.output.patchSha256, createHash('sha256').update(largePatch).digest('hex'));
  const addedLargeLines = largePatch.toString('utf8').split('\n').filter(line => line.startsWith('+large-diff-line '));
  assert.deepEqual(addedLargeLines, largeLines.map(line => '+' + line), 'all known lines survive transport without truncation');
  assert.ok(Buffer.byteLength(JSON.stringify(largeResult.output) + '\n') <= 262144);

  const externalCommon = join(root, 'external-common.git');
  await cp(join(root, '.git'), externalCommon, { recursive: true });
  const commonConfigBefore = await readFile(join(externalCommon, 'config'));
  await writeFile(join(root, '.git/commondir'), externalCommon + '\n');
  const common = invoke(binding);
  assert.notEqual(common.status, 0, 'external common Git storage must be refused');
  assert.equal(common.output.reason, 'common-git-storage-refused');
  assert.equal(invoke(binding, ['diff']).output.reason, 'common-git-storage-refused');
  assert.deepEqual(await readFile(join(externalCommon, 'config')), commonConfigBefore);
  await rm(join(root, '.git/commondir'));

  const longBinding = { ...binding, repository: join(root, 'x'.repeat(1024)), outputBytes: 512 };
  const longError = invoke(longBinding);
  assert.notEqual(longError.status, 0);
  assert.equal(longError.output.status, 'error');
  assert.ok(Buffer.byteLength(JSON.stringify(longError.output) + '\n') <= longBinding.outputBytes, 'every error must fit its declared wire output bound');
  assert.equal(longError.output.reason, 'binding-context-exceeds-output-bound');
  assert.equal(longError.output.bindingSha256, createHash('sha256').update(JSON.stringify(longBinding)).digest('hex'), 'oversized-context refusal retains the binding digest without exposing long paths');

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
  const includedConfig = `[core]\nfsmonitor = !touch ${helper.replaceAll('\\', '/')}\n`;
  await writeFile(included, includedConfig);
  command(git, ['config', '--file', included, '--no-includes', '--list']);
  const config = await readFile(join(root, '.git/config'), 'utf8');
  const condition = root.replaceAll('\\', '/');
  await writeFile(join(root, '.git/config'), config + `[includeIf "gitdir:${condition}/.git/"]\npath = ${included.replaceAll('\\', '/')}\n`);
  const conditionalBefore = await readFile(join(root, '.git/config'));
  const conditional = invoke(binding);
  assert.notEqual(conditional.status, 0, 'conditional external configuration must be refused');
  assert.equal(conditional.output.reason, 'executable-or-external-git-configuration-refused');
  const conditionalDiff = invoke(binding, ['diff']);
  assert.equal(conditionalDiff.output.reason, 'executable-or-external-git-configuration-refused');
  assert.deepEqual(await readFile(join(root, '.git/config')), conditionalBefore);
  assert.equal(await readFile(included, 'utf8'), includedConfig);
  await assert.rejects(lstat(helper), { code: 'ENOENT' });
  await writeFile(join(root, '.git/config'), config + `[include]\npath = ${included.replaceAll('\\', '/')}\n`);
  const hostile = invoke(binding);
  assert.notEqual(hostile.status, 0);
  assert.match(hostile.output.reason, /configuration-refused/u);
  const hostileDiff = invoke(binding, ['diff']);
  assert.match(hostileDiff.output.reason, /configuration-refused/u);
  await assert.rejects(lstat(helper), { code: 'ENOENT' }, 'hostile configured helper must not execute');

  await rm(join(root, '.git/config'));
  await writeFile(join(root, '.git/config'), config);
  const beforeAlternate = await fingerprint(['tracked.txt', '.git/index']);
  await mkdir(join(root, '.git/objects/info'), { recursive: true });
  await writeFile(join(root, '.git/objects/info/alternates'), '/outside/object-store\n');
  const alternate = invoke(binding);
  assert.notEqual(alternate.status, 0);
  assert.equal(alternate.output.reason, 'alternate-object-store-refused');
  assert.equal(invoke(binding, ['diff']).output.reason, 'alternate-object-store-refused');
  assert.deepEqual(await fingerprint(['tracked.txt', '.git/index']), beforeAlternate);

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
  assert.equal(invoke(binding, ['diff']).output.reason, 'unsupported-object-store-topology');
  assert.equal(await readFile(join(externalPack, 'sentinel'), 'utf8'), 'outside-object-store\n', 'outside object-store sentinel must remain unchanged');
  console.log(JSON.stringify({ status: 'PASS', cases: ['stalled zero/partial stdin refuses and self-ceases within fixed input deadline', 'bound exact identities and observed HEAD', 'known text diff and successful empty diff preserve exact bytes, length and digest', 'binary/add/delete/unusual-name committed diff returned without truncation', 'dirty attributes ignored and external attributes config refused', 'missing/altered/extra bindings and extra operation args fail closed', 'patch overflow returns bounded error without partial data', 'external common Git storage refused', 'all error output bounded with binding digest', 'conditional external includes refused', 'hostile include/helper config refused without execution', 'alternate object store refused', 'linked pack store refused without outside mutation', 'worktree/index/config bytes preserved and outside sentinel unchanged'], platform: process.platform, gitVersion: command(git, ['--version'], source) }));
} finally {
  await rm(root, { recursive: true, force: true });
}
