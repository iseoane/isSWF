import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const sdkRoot = join(source, 'tooling/host-tests/node_modules/@earendil-works/pi-coding-agent');
const require = createRequire(join(sdkRoot, 'package.json'));
const sdk = require(sdkRoot);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-pi-git-identity-')));
const workspace = join(root, 'repo');
const profile = join(root, 'profile');
const gitPath = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath, 'Git executable must be locatable');
const git = await realpath(gitPath);
// Fixture commits must keep CRLF/BOM bytes even when CI sets core.autocrlf=true.
const noEolConversion = ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', '-c', 'core.safecrlf=false'];
const command = (bin, args, cwd) => {
  const result = spawnSync(bin, bin === git ? [...noEolConversion, ...args] : args, { cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${bin} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result.stdout.trim();
};
let session;
const originalBinding = process.env.PI_SUBAGENT_EXTENSION_BINDINGS;
try {
  await Promise.all([mkdir(workspace), mkdir(profile)]);
  command(git, ['init', '-q'], workspace);
  await writeFile(join(workspace, 'tracked.txt'), 'bound Pi identity\n');
  await writeFile(join(workspace, 'binary.dat'), Buffer.from([0, 255, 10]));
  await writeFile(join(workspace, 'exact.txt'), Buffer.from([0xef, 0xbb, 0xbf, 0x62, 0x61, 0x73, 0x65, 0x0d, 0x0a]));
  const nearLimit = 'x'.repeat(63) + '\n';
  await writeFile(join(workspace, 'near-limit.txt'), nearLimit.repeat(1024));
  // Valid UTF-8 at exactly the raw limit whose JSON text view roughly doubles in size.
  await writeFile(join(workspace, 'escape-heavy.txt'), '"'.repeat(65536));
  command(git, ['add', '-A'], workspace);
  command(git, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'candidate'], workspace);
  const head = command(git, ['rev-parse', 'HEAD'], workspace);
  await writeFile(join(workspace, 'tracked.txt'), 'review this committed change\n');
  command(git, ['add', 'tracked.txt'], workspace);
  command(git, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'changed candidate'], workspace);
  const candidate = command(git, ['rev-parse', 'HEAD'], workspace);
  const binding = { version: 1, repository: workspace, baseSha: head, candidateSha: candidate, gitExecutable: git, timeoutMs: 5000, outputBytes: 4096 };
  const diffBinding = { ...binding, outputBytes: 22000 };
  const contentBinding = { ...binding, outputBytes: 65536, paths: ['tracked.txt', 'binary.dat', 'exact.txt', 'near-limit.txt', 'escape-heavy.txt'] };
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({ 'isswf.git-evidence/1': binding, 'isswf.git-evidence.diff/1': diffBinding, 'isswf.git-evidence.content/1': contentBinding });

  const settings = sdk.SettingsManager.create(workspace, profile);
  const runtime = await sdk.ModelRuntime.create({ authPath: join(profile, 'auth.json'), modelsPath: join(profile, 'models.json'), modelsStorePath: join(profile, 'model-cache.json'), allowModelNetwork: false });
  const loader = new sdk.DefaultResourceLoader({
    cwd: workspace, agentDir: profile, settingsManager: settings,
    noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true,
    additionalExtensionPaths: [join(source, 'tools/git-evidence-pi-extension.mjs')],
  });
  await loader.reload();
  assert.deepEqual(loader.getExtensions().errors, []);
  ({ session } = await sdk.createAgentSession({
    cwd: workspace, agentDir: profile, modelRuntime: runtime, settingsManager: settings,
    sessionManager: sdk.SessionManager.inMemory(workspace), resourceLoader: loader,
    tools: [],
  }));
  const bindErrors = [];
  await session.bindExtensions({ mode: 'sdk', onError: error => bindErrors.push(String(error)) });
  assert.deepEqual(bindErrors, []);
  const loaded = loader.getExtensions().extensions.find(extension => extension.tools.has('isswf_git_identity'));
  const tool = loaded?.tools.get('isswf_git_identity')?.definition;
  assert.ok(tool, 'Pi SDK must register the child-only identity tool');
  assert.deepEqual(Object.keys(tool.parameters.properties ?? {}), [], 'Model schema exposes no binding arguments');
  const contentTool = loaded?.tools.get('isswf_git_content')?.definition;
  assert.ok(contentTool, 'Pi SDK must register the committed content tool');
  assert.deepEqual(Object.keys(contentTool.parameters.properties ?? {}).sort(), ['path', 'slot'], 'content model schema exposes only bound selection');
  const diffTool = loaded?.tools.get('isswf_git_diff')?.definition;
  assert.ok(diffTool, 'Pi SDK must register the child-only committed diff tool');
  assert.deepEqual(Object.keys(diffTool.parameters.properties ?? {}), [], 'Diff model schema exposes no binding arguments');
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({ 'isswf.git-evidence/1': { ...binding, repository: root } });
  const result = await tool.execute('identity-test', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('identity-test', undefined));
  const evidence = JSON.parse(result.content[0].text);
  assert.equal(evidence.status, 'ok');
  assert.equal(evidence.repository, workspace);
  assert.equal(evidence.observedHeadSha, candidate);
  const patchResult = await diffTool.execute('diff-test', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('diff-test', undefined));
  const patchEvidence = JSON.parse(patchResult.content[0].text);
  assert.equal(patchEvidence.status, 'ok');
  assert.equal(patchEvidence.operation, 'diff');
  assert.equal(patchEvidence.patchEncoding, 'base64');
  const decodedPatch = Buffer.from(patchEvidence.patch, 'base64').toString('utf8');
  assert.match(decodedPatch, /\+review this committed change\n/u);
  assert.equal(patchResult.content[1]?.text, decodedPatch, 'reviewer receives the exact valid UTF-8 patch without decoding code execution');
  assert.equal(patchResult.details.patchIntegrity, 'verified', 'native consumer validates decoded byte length and digest');
  const contentResult = await contentTool.execute('content-test', { slot: 'candidate', path: 'tracked.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-test', undefined));
  const contentEvidence = JSON.parse(contentResult.content[0].text);
  assert.equal(contentEvidence.status, 'ok');
  assert.equal(contentEvidence.contentIntegrity, 'verified');
  assert.equal(contentEvidence.contentTextEncoding, 'utf8');
  assert.equal(contentResult.content[1].text, 'review this committed change\n');
  const exactResult = await contentTool.execute('content-exact-utf8', { slot: 'candidate', path: 'exact.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-exact-utf8', undefined));
  assert.equal(exactResult.content[1].text, '\uFEFFbase\r\n', 'fatal UTF-8 view preserves BOM and CRLF');
  const nearLimitResult = await contentTool.execute('content-near-limit', { slot: 'candidate', path: 'near-limit.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-near-limit', undefined));
  assert.equal(nearLimitResult.isError, undefined, 'a 65,536-byte UTF-8 blob fits the documented raw limit');
  assert.equal(nearLimitResult.details.contentBytes, 65536);
  assert.equal(nearLimitResult.details.contentIntegrity, 'verified');
  assert.equal(nearLimitResult.content[1].text, nearLimit.repeat(1024), 'the exact near-limit text view is returned without truncation');
  await assert.rejects(() => contentTool.execute('content-escape-heavy', { slot: 'candidate', path: 'escape-heavy.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-escape-heavy', undefined)), /bounded display envelope/u, 'escape-heavy text beyond the display envelope fails closed with no partial content');
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({});
  const baseContent = await contentTool.execute('content-base-after-env-change', { slot: 'base', path: 'tracked.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-base-after-env-change', undefined));
  assert.equal(JSON.parse(baseContent.content[0].text).status, 'ok', 'the base slot returns exact committed base content');
  assert.equal(JSON.parse(baseContent.content[0].text).commitSha, head);
  const binaryResult = await contentTool.execute('content-binary', { slot: 'base', path: 'binary.dat' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-binary', undefined));
  const binaryEvidence = JSON.parse(binaryResult.content[0].text);
  assert.equal(binaryEvidence.contentTextEncoding, 'unavailable-non-utf8');
  assert.equal(binaryEvidence.content, 'AP8K');
  assert.equal(binaryResult.content.length, 1, 'invalid UTF-8 remains base64-only');
  const refusedPath = await contentTool.execute('content-not-allowed', { slot: 'candidate', path: 'unlisted.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-not-allowed', undefined));
  assert.equal(refusedPath.isError, true);
  assert.equal(JSON.parse(refusedPath.content[0].text).reason, 'content-path-not-allowed');
  await assert.rejects(() => contentTool.execute('content-extra-args', { slot: 'candidate', path: 'tracked.txt', repository: workspace }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('content-extra-args', undefined)), /allowlisted path/u);
  const capturedResult = await diffTool.execute('diff-captured-binding', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('diff-captured-binding', undefined));
  assert.equal(JSON.parse(capturedResult.content[0].text).bindingSha256, patchEvidence.bindingSha256, 'later ambient environment changes cannot replace the startup-captured binding');
  await assert.rejects(() => diffTool.execute('diff-extra-args', { repository: workspace }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('diff-extra-args', undefined)), /accepts no arguments/u);
  await assert.rejects(() => tool.execute('extra-args', { repository: workspace }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('extra-args', undefined)), /accepts no arguments/u);
  assert.equal(await readFile(join(workspace, 'tracked.txt'), 'utf8'), 'review this committed change\n');

  await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
  session.dispose();
  session = undefined;
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({});
  const unboundExtension = join(root, 'unbound-extension.mjs');
  await copyFile(join(source, 'tools/git-evidence-pi-extension.mjs'), unboundExtension);
  await copyFile(join(source, 'tools/git-evidence-invoke.mjs'), join(root, 'git-evidence-invoke.mjs'));
  await copyFile(join(source, 'tools/git-evidence.mjs'), join(root, 'git-evidence.mjs'));
  const missingLoader = new sdk.DefaultResourceLoader({
    cwd: workspace, agentDir: profile, settingsManager: settings,
    noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true,
    additionalExtensionPaths: [unboundExtension],
  });
  await missingLoader.reload();
  ({ session } = await sdk.createAgentSession({ cwd: workspace, agentDir: profile, modelRuntime: runtime, settingsManager: settings, sessionManager: sdk.SessionManager.inMemory(workspace), resourceLoader: missingLoader, tools: [] }));
  await session.bindExtensions({ mode: 'sdk' });
  const missingExtensionResult = missingLoader.getExtensions();
  const missingExtension = missingExtensionResult.extensions.find(extension => extension.tools.has('isswf_git_identity'));
  const unavailable = missingExtension?.tools.get('isswf_git_identity')?.definition;
  assert.ok(unavailable, JSON.stringify({ errors: missingExtensionResult.errors.map(error => String(error.error ?? error)), paths: missingExtensionResult.extensions.map(extension => extension.path) }));
  await assert.rejects(() => unavailable.execute('missing-binding', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('missing-binding', undefined)), /binding is missing/u);
  const unavailableContent = missingExtension?.tools.get('isswf_git_content')?.definition;
  assert.ok(unavailableContent, 'content remains registered but unavailable without its trusted binding');
  await assert.rejects(() => unavailableContent.execute('missing-content-binding', { slot: 'candidate', path: 'tracked.txt' }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('missing-content-binding', undefined)), /binding is missing/u);
  const unavailableDiff = missingExtension?.tools.get('isswf_git_diff')?.definition;
  assert.ok(unavailableDiff, 'diff remains registered but unavailable without its trusted binding');
  await assert.rejects(() => unavailableDiff.execute('missing-diff-binding', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('missing-diff-binding', undefined)), /binding is missing/u);
  await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
  session.dispose();
  session = undefined;
  // A substituted CLI returns tampered or mismatched results; the invoker must verify them itself.
  const fakeUrl = pathToFileURL(join(source, 'tools/git-evidence.mjs')).href;
  await writeFile(join(root, 'git-evidence.mjs'), `import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export { validateDiffBinding, validateBinding, validateContentBinding } from ${JSON.stringify(fakeUrl)};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = Buffer.concat(chunks).toString('utf8');
  const binding = JSON.parse(input);
  const [, , , slot, path] = process.argv;
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const bytes = Buffer.from('original\\n');
  const evidence = {
    version: 1, status: 'ok', operation: 'content', repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha,
    commitSha: slot === 'base' ? binding.baseSha : binding.candidateSha, path, bindingSha256: sha(input), contentEncoding: 'base64',
    contentBytes: bytes.length, contentSha256: sha(bytes), content: bytes.toString('base64'), limits: {},
  };
  if (path === 'bad-sha') evidence.contentSha256 = sha('other');
  if (path === 'bad-length') evidence.contentBytes += 1;
  if (path === 'wrong-commit') evidence.commitSha = binding.baseSha;
  if (path === 'wrong-path') evidence.path = 'other.txt';
  if (path === 'wrong-binding') evidence.bindingSha256 = '0'.repeat(64);
  process.stdout.write(JSON.stringify(evidence) + '\\n');
}
`);
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({ 'isswf.git-evidence.content/1': contentBinding });
  const tamperLoader = new sdk.DefaultResourceLoader({
    cwd: workspace, agentDir: profile, settingsManager: settings,
    noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true,
    additionalExtensionPaths: [unboundExtension],
  });
  await tamperLoader.reload();
  ({ session } = await sdk.createAgentSession({ cwd: workspace, agentDir: profile, modelRuntime: runtime, settingsManager: settings, sessionManager: sdk.SessionManager.inMemory(workspace), resourceLoader: tamperLoader, tools: [] }));
  await session.bindExtensions({ mode: 'sdk' });
  const tamperTool = tamperLoader.getExtensions().extensions.find(extension => extension.tools.has('isswf_git_content'))?.tools.get('isswf_git_content')?.definition;
  assert.ok(tamperTool, 'content tool loads against the substituted CLI');
  const runTamper = path => tamperTool.execute(`tamper-${path}`, { slot: 'candidate', path }, new AbortController().signal, () => {}, session.extensionRunner.createToolContext(`tamper-${path}`, undefined));
  const control = await runTamper('control.txt');
  assert.equal(control.details.contentIntegrity, 'verified', 'the substituted CLI control is accepted when its evidence is consistent');
  assert.equal(control.content[1].text, 'original\n');
  for (const [path, expected] of [['bad-sha', /integrity check failed/u], ['bad-length', /integrity check failed/u], ['wrong-commit', /mismatched bound provenance/u], ['wrong-path', /mismatched bound provenance/u], ['wrong-binding', /mismatched bound provenance/u]]) {
    await assert.rejects(() => runTamper(path), expected, `${path} evidence is rejected by the invoker`);
  }
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, piVersion: JSON.parse(await readFile(join(sdkRoot, 'package.json'), 'utf8')).version, checks: ['real Pi SDK loads extension and registers identity, diff and bounded path/slot content tools', 'startup-captured namespaced bindings return exact identity, patch and committed content with verified readable UTF-8 view', 'extra model tool arguments rejected', 'missing identity, diff and content bindings fail closed', 'tampered or mismatched content evidence rejected by the invoker', 'escape-heavy text beyond the display envelope fails closed'] }));
} finally {
  if (session) {
    await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
    session.dispose();
  }
  if (originalBinding === undefined) delete process.env.PI_SUBAGENT_EXTENSION_BINDINGS;
  else process.env.PI_SUBAGENT_EXTENSION_BINDINGS = originalBinding;
  await rm(root, { recursive: true, force: true });
}
