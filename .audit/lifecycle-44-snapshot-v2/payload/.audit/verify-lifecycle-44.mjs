#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixturePath = resolve(process.argv[2] || join(root, '.audit/lifecycle-44-fixture.json'));
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'isSWF-lifecycle44-'));
const project = join(temp, 'project');
const runs = join(temp, 'runs');
const scripts = join(temp, 'trusted-tasks');
const cli = join(root, 'tools/worker-lifecycle.mjs');
const node = process.execPath;
const results = [];

function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, { encoding: 'utf8', timeout: options.timeout ?? 10000, maxBuffer: 1024 * 1024, ...options });
  if (result.error) throw result.error;
  return result;
}
function git(...args) {
  const result = command('git', args);
  assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}
function pass(name) { results.push(name); }
function assertTask(result, message) { assert.equal(result.status, 0, `${message}: ${result.stderr}`); }
async function waitFor(predicate, message, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await predicate()) return;
    await delay(40);
  }
  throw new Error(`timed out waiting for ${message}`);
}
async function writeTask(name, source) {
  const path = join(scripts, name);
  await writeFile(path, source, { mode: 0o600 });
  return path;
}
async function launch(id, task, timeout = 5000, output = 4096) {
  return command(node, [cli, 'launch', '--repo', project, '--input-sha', inputCheckpoint,
    '--brief', fixture.briefPath, '--target-base', targetBase, '--attempt-id', id,
    '--runs-store', runs, '--grant-ref', 'local-verifier-only', '--task-script', task,
    '--timeout-ms', String(timeout), '--output-bytes', String(output)]);
}
async function observe(id, operation = 'read') {
  const result = command(node, [cli, operation, '--runs-store', runs, '--attempt-id', id]);
  assert.equal(result.status, 0, `${operation} failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
}
async function writeValidDispatch(directory, id) {
  await writeFile(join(directory, 'dispatch.json'), JSON.stringify({
    version: 1, attemptId: id, workspace: join(directory, 'workspace'),
    inputSha: inputCheckpoint, targetBase, taskSha256: 'a'.repeat(64),
    lifecycleSourceSha256: 'b'.repeat(64), outputBytes: 4096,
  }));
}
async function terminal(id) {
  await waitFor(async () => (await observe(id)).state === 'terminal', `${id} terminal`);
  return observe(id);
}

await mkdir(runs);
await mkdir(scripts);
await cp(fixture.root, project, { recursive: true, preserveTimestamps: true });
const inputCheckpoint = fixture.inputCheckpoint;
const targetBase = fixture.targetBase;
assert.equal(git('-C', project, 'rev-parse', inputCheckpoint), inputCheckpoint);
assert.equal(git('-C', project, 'rev-parse', targetBase), targetBase);
const baseline = command(node, [join(project, 'check.mjs')]);
assert.equal(baseline.status, 1, 'J601 fixture must reproduce the expected red baseline');
assert.match(baseline.stderr, /11 !== 21/);
pass('parent-pinned J601 arithmetic baseline reproduces the expected product mismatch (11 !== 21) in a private fixture copy');
const unsupported = command(node, [cli, 'read', '--runs-store', runs, '--attempt-id', 'J601-invalid', '--unexpected', 'value']);
assert.notEqual(unsupported.status, 0);
assert.match(unsupported.stderr, /unsupported option/);
pass('CLI rejects options outside the explicitly supported invocation');

const successTask = await writeTask('success.mjs', `import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const workspace = process.argv[2];
const path = workspace + '/src/math.mjs';
let source = await (await import('node:fs/promises')).readFile(path, 'utf8');
source = source.replace('values.reduce((total, value) => total * value, 1)', 'values.reduce((total, value) => total * value, 1)');
source = source.replace('export const product = values => values.reduce((total, value) => total + value, 1);', 'export const product = values => values.reduce((total, value) => total * value, 1);');
await writeFile(path, source);
const check = spawnSync(process.execPath, [workspace + '/check.mjs'], { cwd: workspace, encoding: 'utf8' });
if (check.status !== 0) { process.stderr.write(check.stderr); process.exit(check.status ?? 1); }
process.stdout.write(check.stdout);
await new Promise(resolve => setTimeout(resolve, 700));
`);
const first = await launch('J601-success', successTask);
assertTask(first, 'success launch');
assert.notEqual((await observe('J601-success')).state, 'terminal', 'launch CLI must exit before task completion');
const success = await terminal('J601-success');
assert.equal(success.terminal.outcome, 'success');
assert.match(success.terminal.stdout, /PASS two sum and three product assertions/);
assert.equal((await observe('J601-success', 'reconcile')).state, 'terminal');
const duplicate = await launch('J601-success', successTask);
assert.notEqual(duplicate.status, 0, 'same terminal attempt must remain claimed');
pass('pinned J601 task completes after launch CLI exits; fresh read/reconcile sees actual product check output; terminal repeat is rejected');

const failureTask = await writeTask('failure.mjs', `process.stderr.write('bounded fixture failure\\n'); process.exit(7);`);
assertTask(await launch('J601-failure', failureTask), 'failure launch');
const failure = await terminal('J601-failure');
assert.equal(failure.terminal.outcome, 'failure');
assert.equal(failure.terminal.exitCode, 7);
assert.match(failure.terminal.stderr, /bounded fixture failure/);
pass('nonzero task publishes failure without requiring an A001 report');

const timeoutTask = await writeTask('timeout.mjs', `await new Promise(resolve => setTimeout(resolve, 10000));`);
assertTask(await launch('J601-timeout', timeoutTask, 500), 'timeout launch');
const timed = await terminal('J601-timeout');
assert.equal(timed.terminal.outcome, 'timeout');
assert.equal(timed.terminal.timedOut, true);
pass('deadline kills only the live owner’s child process group and publishes timeout');

const longTask = await writeTask('live.mjs', `import { writeFile } from 'node:fs/promises';
const workspace = process.argv[2];
await writeFile(workspace + '/started', 'yes');
await new Promise(resolve => setTimeout(resolve, 900));
`);
assertTask(await launch('J601-repeat-live', longTask), 'live launch');
await waitFor(async () => (await observe('J601-repeat-live')).state === 'running', 'live owner');
assert.notEqual((await launch('J601-repeat-live', longTask)).status, 0, 'same live attempt must reject repeat');
const liveTerminal = await terminal('J601-repeat-live');
assert.equal(liveTerminal.terminal.outcome, 'success');
pass('same ID is blocked while live and after terminal');

assertTask(await launch('J601-distinct-a', successTask), 'distinct A launch');
assertTask(await launch('J601-distinct-b', successTask), 'distinct B launch');
const distinctA = await terminal('J601-distinct-a');
const distinctB = await terminal('J601-distinct-b');
assert.notEqual(distinctA.terminal.workspace, distinctB.terminal.workspace);
assert.notEqual(distinctA.terminal.workspace, join(runs, 'J601-distinct-b', 'workspace'));
pass('different attempt IDs materialize different attempt-derived workspaces');

const tornDir = join(runs, 'J601-torn');
await mkdir(tornDir);
await writeFile(join(tornDir, 'dispatch.json'), '{"version":');
assert.equal((await observe('J601-torn')).state, 'unknown');
assert.notEqual((await launch('J601-torn', successTask)).status, 0);
const corruptTerminalDir = join(runs, 'J601-corrupt-terminal');
await mkdir(corruptTerminalDir);
await writeValidDispatch(corruptTerminalDir, 'J601-corrupt-terminal');
await writeFile(join(corruptTerminalDir, 'terminal.json'), '{ torn');
assert.equal((await observe('J601-corrupt-terminal')).state, 'unknown');
assert.notEqual((await launch('J601-corrupt-terminal', successTask)).status, 0);
const mismatchDir = join(runs, 'J601-identity-mismatch');
await mkdir(mismatchDir);
await writeValidDispatch(mismatchDir, 'J601-identity-mismatch');
await writeFile(join(mismatchDir, 'owner.json'), JSON.stringify({ bootId: 'not-current', pid: process.pid, startTicks: '0', exe: process.execPath, nonce: 'no-such-nonce' }));
assert.equal((await observe('J601-identity-mismatch')).state, 'unknown');
assert.notEqual((await launch('J601-identity-mismatch', successTask)).status, 0);
pass('torn dispatch, corrupt terminal and process-identity mismatch remain unknown; readers do not repair or release claims');

const ownerKillTask = await writeTask('owner-kill.mjs', `import { writeFile } from 'node:fs/promises';
const workspace = process.argv[2];
await writeFile(workspace + '/partial-work', 'preserve-me');
await writeFile(workspace + '/child-pid', String(process.pid));
await new Promise(resolve => setTimeout(resolve, 800));
`);
assertTask(await launch('J601-owner-kill', ownerKillTask), 'owner-kill launch');
const ownerDir = join(runs, 'J601-owner-kill');
await waitFor(async () => {
  try {
    return (await readFile(join(ownerDir, 'workspace/partial-work'), 'utf8')) === 'preserve-me'
      && Number(await readFile(join(ownerDir, 'workspace/child-pid'), 'utf8')) > 0;
  } catch { return false; }
}, 'partial work and child identity');
const owner = JSON.parse(await readFile(join(ownerDir, 'owner.json'), 'utf8'));
const ownerStat = readFileSync(`/proc/${owner.pid}/stat`, 'utf8');
const ownerTicks = ownerStat.slice(ownerStat.lastIndexOf(')') + 2).trim().split(/\s+/)[19];
const ownerArgs = readFileSync(`/proc/${owner.pid}/cmdline`, 'utf8');
assert.equal(ownerTicks, owner.startTicks, 'owner start ticks must match');
assert.equal(readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), owner.bootId, 'owner boot ID must match');
assert.equal(realpathSync(`/proc/${owner.pid}/exe`), owner.exe, 'owner executable must match');
assert.ok(ownerArgs.includes(owner.nonce), 'owner nonce must match');
process.kill(owner.pid, 'SIGKILL');
const taskPid = Number(await readFile(join(ownerDir, 'workspace/child-pid'), 'utf8'));
const taskStat = readFileSync(`/proc/${taskPid}/stat`, 'utf8');
const taskTicks = taskStat.slice(taskStat.lastIndexOf(')') + 2).trim().split(/\s+/)[19];
const taskExe = realpathSync(`/proc/${taskPid}/exe`);
await waitFor(async () => {
  try {
    const current = readFileSync(`/proc/${taskPid}/stat`, 'utf8');
    return current.slice(current.lastIndexOf(')') + 2).trim().split(/\s+/)[19] !== taskTicks || realpathSync(`/proc/${taskPid}/exe`) !== taskExe;
  } catch (error) { return error.code === 'ENOENT'; }
}, 'owned fixture task child to cease naturally', 4000);
assert.equal((await observe('J601-owner-kill')).state, 'unknown');
assert.equal(await readFile(join(ownerDir, 'workspace/partial-work'), 'utf8'), 'preserve-me');
assert.notEqual((await launch('J601-owner-kill', successTask)).status, 0);
pass('killed owner with a potentially-live child stays unknown, preserves partial work, and cannot be relaunched under the same ID');

const bounded = await writeTask('bounded-output.mjs', `process.stdout.write('x'.repeat(20000));`);
assertTask(await launch('J601-output-bound', bounded, 5000, 512), 'bounded output launch');
const output = await terminal('J601-output-bound');
assert.ok(Buffer.byteLength(output.terminal.stdout) <= 512);
pass('captured task output respects the explicit per-stream bound');

const duplicateAttempt = command(node, [cli, 'launch', '--repo', project, '--input-sha', inputCheckpoint,
  '--brief', fixture.briefPath, '--target-base', targetBase, '--attempt-id', 'J601-duplicate-first',
  '--runs-store', runs, '--grant-ref', 'local-verifier-only', '--task-script', successTask,
  '--timeout-ms', '5000', '--output-bytes', '4096', '--attempt-id', 'J601-duplicate-second']);
assert.notEqual(duplicateAttempt.status, 0, 'duplicate normalized option must be rejected');
assert.match(duplicateAttempt.stderr, /invalid or repeated option/);
assert.equal(existsSync(join(runs, 'J601-duplicate-second')), false, 'duplicate option must not launch the second attempt');
pass('duplicate normalized option is rejected before creating an attempt');

const unicodeTask = await writeTask('unicode-output.mjs', `process.stdout.write('😀'.repeat(1000)); process.stderr.write('😀'.repeat(1000));`);
assertTask(await launch('J601-utf8-bound', unicodeTask, 5000, 257), 'UTF-8 bounded output launch');
const unicode = await terminal('J601-utf8-bound');
assert.equal((await observe('J601-utf8-bound')).state, 'terminal');
assert.ok(unicode.terminal.stdoutTruncated);
assert.ok(unicode.terminal.stderrTruncated);
assert.match(unicode.terminal.stdout, /^\[\.\.\.truncated\.\.\.\]/);
assert.match(unicode.terminal.stderr, /^\[\.\.\.truncated\.\.\.\]/);
assert.ok(Buffer.byteLength(unicode.terminal.stdout) <= 257);
assert.ok(Buffer.byteLength(unicode.terminal.stderr) <= 257);
pass('UTF-8 tail and explicit truncation marker stay within encoded-byte bounds and remain readable');

const detachedDescendant = await writeTask('detached-pipe-holder.mjs', `import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const workspace = process.argv[2];
const done = workspace + '/descendant-finished';
spawn(process.execPath, ['-e', \"process.on('SIGTERM',()=>{});process.stdout.write('ready');setTimeout(async()=>{await require('node:fs/promises').writeFile(process.argv[1],'done');process.exit(0)},1800)\", done], { detached: true, stdio: ['ignore', 'inherit', 'ignore'] });
process.stdout.write('leader-exit');
process.exit(0);
`);
const descendantStart = Date.now();
assertTask(await launch('J601-descendant-pipe', detachedDescendant, 250, 1024), 'descendant pipe launch');
const descendant = await terminal('J601-descendant-pipe');
const descendantElapsed = Date.now() - descendantStart;
assert.equal(descendant.terminal.outcome, 'timeout');
assert.ok(descendantElapsed < 1500, `deadline should close held pipes promptly, got ${descendantElapsed}ms`);
assert.equal(descendant.terminal.captureIncomplete, true);
assert.equal(descendant.terminal.descendants, 'uncertain');
await waitFor(async () => {
  try { return (await readFile(join(runs, 'J601-descendant-pipe/workspace/descendant-finished'), 'utf8')) === 'done'; }
  catch { return false; }
}, 'self-terminating detached fixture descendant', 3000);
pass('leader exit cannot hold the deadline open; bounded close reports incomplete capture and uncertain descendants');

const forgedOwnerDir = join(runs, 'J601-empty-nonce');
await mkdir(forgedOwnerDir);
await writeValidDispatch(forgedOwnerDir, 'J601-empty-nonce');
const forgedStat = readFileSync('/proc/self/stat', 'utf8');
const forgedTicks = forgedStat.slice(forgedStat.lastIndexOf(')') + 2).trim().split(/\s+/)[19];
await writeFile(join(forgedOwnerDir, 'owner.json'), JSON.stringify({
  bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), pid: process.pid,
  startTicks: forgedTicks, exe: realpathSync('/proc/self/exe'), nonce: '',
}));
assert.equal((await observe('J601-empty-nonce')).state, 'unknown');
pass('empty nonce cannot make an unrelated live process appear to own an attempt');

process.stdout.write(JSON.stringify({ result: 'PASS', temp, fixtureProject: project, sourceFixture: fixture.root, inputCheckpoint, targetBase, checks: results }, null, 2) + '\n');
