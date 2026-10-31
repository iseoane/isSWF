import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
const command = (bin, args, cwd) => {
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
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
  command(git, ['add', 'tracked.txt'], workspace);
  command(git, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'candidate'], workspace);
  const head = command(git, ['rev-parse', 'HEAD'], workspace);
  await writeFile(join(workspace, 'tracked.txt'), 'review this committed change\n');
  command(git, ['add', 'tracked.txt'], workspace);
  command(git, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'changed candidate'], workspace);
  const candidate = command(git, ['rev-parse', 'HEAD'], workspace);
  const binding = { version: 1, repository: workspace, baseSha: head, candidateSha: candidate, gitExecutable: git, timeoutMs: 5000, outputBytes: 4096 };
  const diffBinding = { ...binding, outputBytes: 22000 };
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({ 'isswf.git-evidence/1': binding, 'isswf.git-evidence.diff/1': diffBinding });

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
  process.env.PI_SUBAGENT_EXTENSION_BINDINGS = JSON.stringify({});
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
  const unavailableDiff = missingExtension?.tools.get('isswf_git_diff')?.definition;
  assert.ok(unavailableDiff, 'diff remains registered but unavailable without its trusted binding');
  await assert.rejects(() => unavailableDiff.execute('missing-diff-binding', {}, new AbortController().signal, () => {}, session.extensionRunner.createToolContext('missing-diff-binding', undefined)), /binding is missing/u);
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, piVersion: JSON.parse(await readFile(join(sdkRoot, 'package.json'), 'utf8')).version, checks: ['real Pi SDK loads extension and registers argument-free identity and diff tools', 'startup-captured namespaced bindings return exact identity and byte-encoded nonempty patch with verified readable UTF-8 view despite later environment changes', 'extra model tool arguments rejected', 'missing identity and diff bindings fail closed'] }));
} finally {
  if (session) {
    await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
    session.dispose();
  }
  if (originalBinding === undefined) delete process.env.PI_SUBAGENT_EXTENSION_BINDINGS;
  else process.env.PI_SUBAGENT_EXTENSION_BINDINGS = originalBinding;
  await rm(root, { recursive: true, force: true });
}
