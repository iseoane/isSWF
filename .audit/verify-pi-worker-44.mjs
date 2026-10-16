#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, lstat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchesBoundaryControls } from '../tools/pi-worker-task.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASELINE = '37a56ebc902e94f21fc10666f33fceac44946af7';
const NODE = process.execPath;
const SDK = '/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent';
const LIFECYCLE = join(ROOT, 'tools/worker-lifecycle.mjs');
const PI_PREPARER = join(ROOT, 'tools/pi-worker-task.mjs');
const run = (command, args, cwd, env = process.env) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env, timeout: 15000, maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args[0]} failed: ${(result.stderr || result.error?.message || '').slice(0, 500)}`);
  return result.stdout.trim();
};
const git = (repo, ...args) => run('git', ['-C', repo, ...args], repo, { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1' });
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

git(ROOT, 'cat-file', '-e', `${BASELINE}^{commit}`);
const expectedControls = { fakeEnvAbsent: true, outsideRead: 'ENOENT', outsideWrite: 'ENOENT', factoryWrite: 'EROFS', sdkWrite: 'EROFS', network: 'ECONNREFUSED' };
assert.equal(matchesBoundaryControls(expectedControls), true, 'shared control comparator accepts the exact six-field boundary result');
assert.equal(matchesBoundaryControls({ ...expectedControls, extra: true }), false, 'shared control comparator rejects extra boundary fields');
assert.equal(matchesBoundaryControls(Object.fromEntries(Object.entries(expectedControls).slice(1))), false, 'shared control comparator rejects missing boundary fields');
const fixtureRoot = await mkdtemp(join(tmpdir(), 'isSWF-pi44-'));
const repo = join(fixtureRoot, 'repo'), runStore = join(fixtureRoot, 'runs');
await mkdir(repo); git(repo, 'init', '-q');
git(repo, 'config', 'user.name', 'Pi worker verifier'); git(repo, 'config', 'user.email', 'pi-worker-verifier@invalid');
await mkdir(join(repo, 'src'), { recursive: true });
await mkdir(join(repo, '.factory/jobs/J44'), { recursive: true });
await writeFile(join(repo, 'src/math.mjs'), 'export const add = (a, b) => a - b;\n');
await writeFile(join(repo, 'check.mjs'), "import assert from 'node:assert/strict'; import { add } from './src/math.mjs'; assert.equal(add(7, 3), 10); assert.equal(add(-2, 3), 1); console.log('arithmetic checks pass');\n");
const originalBrief = '\ufeffCorrect src/math.mjs so check.mjs passes. Do not modify other files.\n';
await writeFile(join(repo, '.factory/jobs/J44/brief.md'), originalBrief);
await writeFile(join(repo, '.factory/jobs/J44/empty.md'), '');
await writeFile(join(repo, '.factory/jobs/J44/oversized.md'), 'x'.repeat(32001));
await writeFile(join(repo, '.factory/jobs/J44/invalid-utf8.md'), Buffer.from([0xff]));
await symlink('brief.md', join(repo, '.factory/jobs/J44/link.md'));
git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'disposable red arithmetic fixture');
const fixtureSha = git(repo, 'rev-parse', 'HEAD');
const profileFiles = ['.agents/roles/worker.md', '.agents/roles/references/design-principles.md', '.agents/roles/references/verification-principles.md', '.agents/roles/references/code-quality.md', '.agents/roles/references/comments.md'];
const configPath = join(fixtureRoot, 'trusted.json'), taskPath = join(fixtureRoot, 'task.mjs');
const config = {
  version: 1, mode: 'offline', sdkPath: SDK, nodeBinary: NODE,
  authPath: '/home/iseoane/.pi/agent/auth.json',
  profile: { repo: ROOT, sha: BASELINE, files: profileFiles },
  brief: { repo, inputSha: fixtureSha, path: '.factory/jobs/J44/brief.md' },
  expectedMutablePaths: ['src/math.mjs'], protectedCheckCommand: 'node check.mjs',
  checks: [
    { name: 'bug-is-red', command: 'node check.mjs', expectedExitCode: 1 },
    { name: 'deterministic-fix', command: "node -e \"const fs=require('node:fs');fs.writeFileSync('src/math.mjs',fs.readFileSync('src/math.mjs','utf8').replace('a - b','a + b'))\"", expectedExitCode: 0 },
    { name: 'bug-is-green', command: 'node check.mjs', expectedExitCode: 0 },
  ],
};
await writeFile(configPath, JSON.stringify(config), { mode: 0o600, flag: 'wx' });
const rejected = [];
const expectPrepareFailure = async (name, variant, reason) => {
  const input = join(fixtureRoot, `${name}.json`), output = join(fixtureRoot, `${name}.mjs`);
  await writeFile(input, JSON.stringify(variant), { mode: 0o600, flag: 'wx' });
  const attempt = spawnSync(NODE, [PI_PREPARER, 'prepare', '--config', input, '--output', output], { cwd: ROOT, encoding: 'utf8', env: process.env, timeout: 15000, maxBuffer: 1024 * 1024 });
  assert.notEqual(attempt.status, 0, `${name} must be refused during preparation`);
  assert.equal(attempt.error, undefined, `${name} rejection must complete without timeout`);
  assert.match(attempt.stderr, reason, `${name} must fail for the intended reason`);
  assert.equal(await lstat(output).then(() => true, error => { assert.equal(error.code, 'ENOENT'); return false; }), false, 'rejected preparation must not publish a task');
  rejected.push(name);
};
await expectPrepareFailure('missing-node', { ...config, nodeBinary: join(fixtureRoot, 'missing-node') }, /ENOENT/);
await expectPrepareFailure('missing-real-auth', { ...config, mode: 'real', authPath: join(fixtureRoot, 'missing-auth') }, /real mode authPath must name a host auth file/);
await expectPrepareFailure('legacy-brief', { ...config, brief: undefined, briefText: 'untrusted replacement' }, /legacy briefText is not accepted/);
await expectPrepareFailure('ambiguous-brief', { ...config, briefText: 'untrusted replacement' }, /legacy briefText is not accepted/);
await expectPrepareFailure('missing-brief', { ...config, brief: undefined }, /brief must contain exactly/);
await expectPrepareFailure('wrong-brief-sha', { ...config, brief: { ...config.brief, inputSha: 'A'.repeat(40) } }, /full lowercase commit SHA/);
await expectPrepareFailure('unknown-brief-sha', { ...config, brief: { ...config.brief, inputSha: '0'.repeat(40) } }, /pinned Git read failed/);
await expectPrepareFailure('unsafe-brief-path', { ...config, brief: { ...config.brief, path: '../brief.md' } }, /safe relative path/);
for (const [name, reason] of [['missing', /committed regular-file blob/], ['link', /committed regular-file blob/], ['empty', /non-empty/], ['oversized', /<=32KB/], ['invalid-utf8', /encoded data was not valid/]]) {
  await expectPrepareFailure(`${name}-brief-blob`, { ...config, brief: { ...config.brief, path: `.factory/jobs/J44/${name}.md` } }, reason);
}
await writeFile(join(repo, config.brief.path), 'Changed working-tree brief must not replace the pinned input.\n');
const prepared = JSON.parse(run(NODE, [PI_PREPARER, 'prepare', '--config', configPath, '--output', taskPath], ROOT));
assert.equal(prepared.prepared, true); assert.equal(prepared.mode, 'offline'); assert.match(prepared.taskSha256, /^[0-9a-f]{64}$/);
const briefBytes = Buffer.from(originalBrief);
const briefSha256 = createHash('sha256').update(briefBytes).digest('hex');
const generatedConfig = JSON.parse((await readFile(taskPath, 'utf8')).split('\n')[1].slice('const CONFIG='.length, -1));
assert.equal(generatedConfig.briefText, originalBrief, 'task embeds the committed brief exactly, including BOM and trailing newline');
assert.notEqual(await readFile(join(repo, config.brief.path), 'utf8'), generatedConfig.briefText, 'working-tree edits cannot change pinned inputs');
git(repo, 'add', config.brief.path); git(repo, 'commit', '-qm', 'new brief default after old pin');
const newInputSha = git(repo, 'rev-parse', 'HEAD');
const newConfigPath = join(fixtureRoot, 'new-input.json'), newTaskPath = join(fixtureRoot, 'new-input.mjs');
await writeFile(newConfigPath, JSON.stringify({ ...config, brief: { ...config.brief, inputSha: newInputSha } }), { flag: 'wx', mode: 0o600 });
const newPrepared = JSON.parse(run(NODE, [PI_PREPARER, 'prepare', '--config', newConfigPath, '--output', newTaskPath], ROOT));
assert.notEqual(newPrepared.briefSha256, briefSha256, 'new checkpoint selects new bytes');
assert.equal(createHash('sha256').update(await readFile(taskPath)).digest('hex'), prepared.taskSha256, 'old task stays pinned after a new checkpoint');
assert.deepEqual({ briefPath: prepared.briefPath, inputSha: prepared.inputSha, briefSha256: prepared.briefSha256 }, { briefPath: config.brief.path, inputSha: fixtureSha, briefSha256 });
const launched = JSON.parse(run(NODE, [LIFECYCLE, 'launch', '--repo', repo, '--input-sha', fixtureSha, '--brief', '.factory/jobs/J44/brief.md', '--target-base', fixtureSha, '--attempt-id', 'pi44-offline-a1', '--runs-store', runStore, '--grant-ref', 'offline-verifier', '--task-script', taskPath, '--timeout-ms', '120000', '--output-bytes', '16384'], ROOT));
let observation;
for (let attempt = 0; attempt < 160; attempt += 1) {
  await sleep(250);
  observation = JSON.parse(run(NODE, [LIFECYCLE, 'read', '--runs-store', runStore, '--attempt-id', 'pi44-offline-a1'], ROOT));
  if (observation.state === 'terminal') break;
}
assert.equal(observation?.state, 'terminal', 'lifecycle must publish terminal evidence');
assert.equal(observation.terminal.outcome, 'success', 'task process must complete successfully');
const workspace = join(launched.attemptDir, 'workspace');
assert.match(await readFile(join(workspace, 'src/math.mjs'), 'utf8'), /a \+ b/);
assert.match(await readFile(join(workspace, 'check.mjs'), 'utf8'), /assert\.equal/);
const taskResult = JSON.parse(await readFile(join(launched.attemptDir, 'pi-result.json'), 'utf8'));
assert.equal(taskResult.status, 'completed');
assert.equal(taskResult.mode, 'offline');
assert.deepEqual({ briefPath: taskResult.briefPath, inputSha: taskResult.inputSha, briefSha256: taskResult.briefSha256 }, { briefPath: config.brief.path, inputSha: fixtureSha, briefSha256 });
assert.equal(taskResult.providerPromptStarted, false);
assert.equal(taskResult.sdkInitialized, true);
assert.equal(taskResult.toolBridgeReady, true);
assert.equal(taskResult.boundaryCheckPassed, true);
assert.deepEqual(taskResult.boundaryControls, { fakeEnvAbsent: true, outsideRead: 'ENOENT', outsideWrite: 'ENOENT', factoryWrite: 'EROFS', sdkWrite: 'EROFS', network: 'ECONNREFUSED' });
assert.equal(taskResult.hostTcpPositive, true);
assert.equal(taskResult.outsideHashPreserved, true);
assert.equal(taskResult.protectedHashesPreserved, true);
assert.equal(taskResult.fixtureCheckExitCode, 0);
assert.equal(taskResult.acceptance, false, 'offline success is setup/control proof, not model acceptance');
assert.deepEqual(taskResult.offlineChecks.map(check => check.name), ['bug-is-red', 'deterministic-fix', 'bug-is-green']);
process.stdout.write(`${JSON.stringify({ mode: 'verify-pi-worker-44', status: 'PASS', baseline: BASELINE, fixtureSha, preparedTaskSha256: prepared.taskSha256, attemptId: launched.attemptId, lifecycleOutcome: observation.terminal.outcome, providerPromptStarted: taskResult.providerPromptStarted, sdkInitialized: taskResult.sdkInitialized, boundaryCheckPassed: taskResult.boundaryCheckPassed, controls: taskResult.boundaryControls, offlineChecks: taskResult.offlineChecks, fixtureRoot, rejectedBriefCases: rejected, pinnedBriefSha256: briefSha256, newInputSha })}\n`);
