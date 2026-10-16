#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const cli = resolve(process.argv[2] || 'tools/worker-lifecycle.mjs');
const root = await mkdtemp(join(tmpdir(), 'isswf-recovery68-host-loss-'));
const repo = join(root, 'repo');
const runs = join(root, 'runs');
await mkdir(repo);
const command = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  if (r.error) throw r.error;
  return r;
};
const git = (...args) => {
  const r = command('git', ['-C', repo, ...args]);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const wait = async (predicate, label) => {
  for (let i = 0; i < 150; i++) {
    if (await predicate()) return;
    await delay(40);
  }
  throw Error(`timeout: ${label}`);
};
const identity = pid => {
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { pid, bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), startTicks: fields[19], exe: realpathSync(`/proc/${pid}/exe`), state: fields[0] };
};
git('init', '-q');
git('config', 'user.name', 'Disposable Recovery Test');
git('config', 'user.email', 'recovery-test@invalid');
await writeFile(join(repo, 'brief.md'), 'Disposable trusted-process recovery fixture. No model or remote effects.\n');
await writeFile(join(repo, 'original.txt'), 'protected\n');
git('add', 'brief.md', 'original.txt');
git('commit', '-qm', 'seed');
const sha = git('rev-parse', 'HEAD');
const task = join(root, 'trusted-task.mjs');
await writeFile(task, `import { writeFile, access } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const work = process.argv[2];
await writeFile(work + '/partial.txt', 'preserved partial work\\n');
await writeFile(work + '/ready.json', JSON.stringify({pid:process.pid}));
const end = Date.now() + 8000;
while (Date.now() < end) {
  try { await access(work + '/release'); break; } catch {}
  await delay(40);
}
await writeFile(work + '/finished', 'self-bounded task ended\\n');
`);
const id = 'R68-host-loss';
const args = ['launch', '--repo', repo, '--input-sha', sha, '--brief', 'brief.md', '--target-base', sha, '--attempt-id', id, '--runs-store', runs, '--grant-ref', 'disposable-parent-owned-test', '--task-script', task, '--timeout-ms', '10000', '--output-bytes', '1024'];
const launch = command(process.execPath, [cli, ...args]);
assert.equal(launch.status, 0, launch.stderr);
const dir = join(runs, id);
const workspace = join(dir, 'workspace');
await wait(async () => { try { await readFile(join(workspace, 'ready.json')); return true; } catch { return false; } }, 'trusted task ready');
await wait(async () => { try { await readFile(join(dir, 'execution-child.json')); return true; } catch { return false; } }, 'durable child identity');
const beforeHostLoss = JSON.parse(command(process.execPath, [cli, 'read', '--runs-store', runs, '--attempt-id', id]).stdout);
assert.equal(beforeHostLoss.state, 'running');
assert.equal(beforeHostLoss.executionChild.state, 'live');
const owner = JSON.parse(await readFile(join(dir, 'owner.json'), 'utf8'));
const actualOwner = identity(owner.pid);
for (const key of ['bootId', 'startTicks', 'exe']) assert.equal(actualOwner[key], owner[key]);
assert.ok(readFileSync(`/proc/${owner.pid}/cmdline`, 'utf8').split('\0').includes(owner.nonce));
const childPid = JSON.parse(await readFile(join(workspace, 'ready.json'), 'utf8')).pid;
const childBefore = identity(childPid);
const before = Object.fromEntries(await Promise.all(['dispatch.json', 'owner.json', 'task.mjs', 'execution-child.json'].map(async name => [name, digest(await readFile(join(dir, name)))])));
process.kill(owner.pid, 'SIGKILL');
await wait(async () => { try { return identity(owner.pid).state === 'Z'; } catch (error) { return error.code === 'ENOENT'; } }, 'owned execution host absent or zombie');
const childAfter = identity(childPid);
for (const key of ['bootId', 'pid', 'startTicks', 'exe']) assert.equal(childAfter[key], childBefore[key]);
assert.notEqual(childAfter.state, 'Z', 'same task child still live after host loss');
const read = command(process.execPath, [cli, 'reconcile', '--runs-store', runs, '--attempt-id', id]);
assert.equal(read.status, 0, read.stderr);
const observedWhileChildLive = JSON.parse(read.stdout);
assert.equal(observedWhileChildLive.state, 'unknown');
assert.equal(observedWhileChildLive.executionChild.state, 'live');
assert.equal(observedWhileChildLive.executionChild.identity.pid, childPid);
assert.equal(observedWhileChildLive.executionChild.descendants, 'unproven');
const duplicate = command(process.execPath, [cli, ...args]);
assert.notEqual(duplicate.status, 0, 'unknown claimed attempt must not relaunch');
for (const [name, hash] of Object.entries(before)) assert.equal(digest(await readFile(join(dir, name))), hash);
assert.equal(await readFile(join(workspace, 'partial.txt'), 'utf8'), 'preserved partial work\n');
await writeFile(join(workspace, 'release'), 'parent-owned fixture release\n');
await wait(async () => { try { await readFile(join(workspace, 'finished')); return true; } catch { return false; } }, 'task ends independently');
await wait(async () => { try { return identity(childPid).state === 'Z'; } catch (error) { return error.code === 'ENOENT'; } }, 'direct child no longer live');
const observe = () => {
  const result = command(process.execPath, [cli, 'reconcile', '--runs-store', runs, '--attempt-id', id]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const afterExit = observe();
assert.equal(afterExit.state, 'unknown');
assert.equal(afterExit.executionChild.state, 'not-live');
assert.equal(afterExit.executionChild.descendants, 'unproven');
const recordPath = join(dir, 'execution-child.json');
const originalRecord = await readFile(recordPath);
const record = JSON.parse(originalRecord);
const negatives = [];
for (const [name, value] of [
  ['torn', '{'],
  ['wrong attempt', JSON.stringify({ ...record, attemptId:'other' })],
  ['wrong task', JSON.stringify({ ...record, taskSha256:'0'.repeat(64) })],
  ['wrong boot', JSON.stringify({ ...record, child:{ ...record.child, bootId:'0'.repeat(36) } })],
  ['invalid group', JSON.stringify({ ...record, child:{ ...record.child, pgid:0 } })],
]) {
  await writeFile(recordPath, value);
  const result = observe();
  assert.equal(result.state, 'unknown');
  assert.equal(result.executionChild.state, 'unknown');
  negatives.push(name);
}
await writeFile(recordPath, originalRecord);
for (const [name, hash] of Object.entries(before)) assert.equal(digest(await readFile(join(dir, name))), hash);
console.log(JSON.stringify({scope:'direct-child identity only; no recovery authorization or descendant-cessation proof', cliSha256:digest(await readFile(cli)), root, inputSha:sha, parentVerifiedLiveChild:childBefore, beforeHostLoss, observedWhileChildLive, afterExit, negatives, duplicateExit:duplicate.status, preserved:true, taskSelfBounded:true}, null, 2));
