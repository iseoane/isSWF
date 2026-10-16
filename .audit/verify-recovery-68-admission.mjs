#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const source = resolve(process.argv[2] || '.');
const run = (binary, args, expected = 0, env = process.env) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024, env });
  assert.equal(result.status, expected, JSON.stringify({ args, status: result.status, stderr: result.stderr }));
  return result.stdout.trim();
};
const seed = JSON.parse(run(process.execPath, [join(source, '.audit/verify-operational-44.mjs'), source]));
const root = await mkdtemp(join(tmpdir(), 'isswf-admission68-')), runtime = join(root, 'runtime');
run('git', ['clone', '--quiet', '--local', '--no-hardlinks', join(seed.root, 'source'), runtime]);
const project = join(seed.root, 'project'), store = join(seed.root, 'runs'), cli = join(runtime, 'tools/isswf-job.mjs');
const jobPath = '.factory/jobs/J801/job.json';
const original = JSON.parse(run('git', ['-C', project, 'show', seed.inputSha + ':' + jobPath]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => run('git', ['-C', project, ...args]);
async function commitJob(logicalJobRef, hold = false) {
  const job = { ...original, logicalJobRef, offlineChecks: [{ name: 'disposable-admission-control', command: "printf 'export const counter = () => 1;\\n' > src/counter.mjs" + (hold ? '; node -e "setTimeout(()=>{},4000)"' : ''), expectedExitCode: 0 }] };
  await writeFile(join(project, jobPath), JSON.stringify(job) + '\n');
  git('add', jobPath); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', 'commit', '--allow-empty', '-qm', 'Explicit independent admission fixture');
  return git('rev-parse', 'HEAD');
}
const args = (input, id) => [cli, 'run', '--project', project, '--input-sha', input, '--job', jobPath, '--runs-store', store, '--attempt-id', id, '--grant-ref', 'disposable-admission-control-only', '--mode', 'offline'];
const observe = id => JSON.parse(run(process.execPath, [cli, 'read', '--runs-store', store, '--attempt-id', id]));
async function waitFor(fn, label) {
  for (let count = 0; count < 250; count++) { if (await fn()) return; await delay(40); }
  throw Error('timeout ' + label);
}
const preparedCount = async () => (await readdir(store)).filter(name => name.startsWith('.prepare-')).length;
async function reject(input, id, reason) {
  const before = await preparedCount();
  const result = spawnSync(process.execPath, args(input, id), { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, reason);
  assert.equal(await preparedCount(), before, 'refusal must precede task preparation');
  await assert.rejects(readFile(join(store, id + '.job.json')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(store, id, 'dispatch.json')), { code: 'ENOENT' });
}
const results = [];
await reject(seed.inputSha, 'terminal-repeat', /logical job binding|admission already claimed/);
results.push('terminal-does-not-release-one-worker-total-admission');
const input = await commitJob('R68-admission-host-loss', true), id = 'admission-A001';
const launched = JSON.parse(run(process.execPath, args(input, id))), directory = launched.attemptDir;
await waitFor(async () => { try { return (await readFile(join(directory, 'workspace/src/counter.mjs'), 'utf8')).includes('=> 1'); } catch { return false; } }, 'worker tool has started');
const owner = JSON.parse(await readFile(join(directory, 'owner.json'), 'utf8'));
const processStat = pid => {
  const value = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const fields = value.slice(value.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { state: fields[0], startTicks: fields[19] };
};
assert.equal(processStat(owner.pid).startTicks, owner.startTicks);
assert.equal(readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), owner.bootId);
assert.equal(realpathSync(`/proc/${owner.pid}/exe`), owner.exe);
process.kill(owner.pid, 'SIGKILL');
let unknown;
await waitFor(() => { unknown = observe(id); return unknown.state === 'unknown' && unknown.executionChild?.state === 'live'; }, 'host ceased but task still live');
const binding = JSON.parse(await readFile(join(store, id + '.job.json'), 'utf8'));
const key = hash(JSON.stringify(['job-admission-v1', project, binding.logicalJobRef]));
const claimPath = join(store, 'admissions', key + '.json'), claim = await readFile(claimPath);
await reject(input, 'admission-A002', /logical job binding|admission already claimed/);
assert.equal(hash(await readFile(claimPath)), hash(claim));
results.push('actual-host-SIGKILL-live-task-unknown-blocks-distinct-attempt-before-preparation');
const changedInput = await commitJob('R68-admission-host-loss');
await reject(changedInput, 'admission-A003', /logical job binding|admission already claimed/);
results.push('changed-committed-input-does-not-reset-logical-admission');
const independentInput = await commitJob('R68-independent');
const corruptPath = join(store, 'corrupt.job.json');
await writeFile(corruptPath, '{');
await reject(independentInput, 'corrupt-prior', /ambiguous prior/);
await writeFile(corruptPath, JSON.stringify({ ...binding, logicalJobRef: undefined }));
await reject(independentInput, 'legacy-prior', /prior logical job binding/);
await writeFile(corruptPath, JSON.stringify({ ...binding, repo: project, logicalJobRef: 'R68-corrupt-record-resolved-by-test-owner' }));
results.push('corrupt-and-legacy-ambiguous-binding-block-before-preparation');
await writeFile(claimPath, '{');
assert.equal(observe(id).state, 'unknown');
await writeFile(claimPath, claim);
results.push('reader-validates-admission-evidence-without-repair');
const independent = JSON.parse(run(process.execPath, args(independentInput, 'independent-A001')));
await waitFor(() => observe('independent-A001').state === 'terminal', 'independent job completes');
assert.equal(observe('independent-A001').terminal.outcome, 'success');
results.push('independent-logical-job-has-separate-admission');
const missingInput = await commitJob(undefined);
await reject(missingInput, 'missing-logical', /logicalJobRef required/);
results.push('missing-committed-logical-identity-blocks');
const crashInput = await commitJob('R68-claim-before-prepare');
const hook = join(root, 'exit-before-prepare.mjs');
await writeFile(hook, "import fs from 'node:fs/promises';import{syncBuiltinESMExports}from'node:module';const original=fs.mkdtemp;fs.mkdtemp=async(...args)=>{if(String(args[0]).includes('/runs/.prepare-'))process.exit(9);return original(...args)};syncBuiltinESMExports();\n");
run(process.execPath, args(crashInput, 'claim-crash-A001'), 9, { ...process.env, NODE_OPTIONS: '--import=' + hook });
await assert.rejects(readFile(join(store, 'claim-crash-A001.job.json')), { code: 'ENOENT' });
await reject(crashInput, 'claim-crash-A002', /admission already claimed/);
results.push('crash-after-durable-admission-before-prepare-remains-claimed');
const raceInput = await commitJob('R68-race');
const prepareBeforeRace = await preparedCount();
const race = raceId => new Promise(resolveDone => {
  const child = spawn(process.execPath, args(raceInput, raceId), { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  child.on('exit', code => resolveDone({ id: raceId, code, stdout, stderr }));
});
const competing = await Promise.all([race('race-A001'), race('race-A002')]);
assert.deepEqual(competing.map(value => value.code).sort(), [0, 1]);
assert.match(competing.find(value => value.code === 1).stderr, /logical job binding|admission already claimed/);
assert.equal(await preparedCount(), prepareBeforeRace + 1);
const winner = competing.find(value => value.code === 0).id;
await waitFor(() => observe(winner).state === 'terminal', 'one admitted racing worker completes');
assert.equal(observe(winner).terminal.outcome, 'success');
results.push('competing-distinct-attempts-one-atomic-admission-and-one-preparation');
const child = JSON.parse(await readFile(join(directory, 'execution-child.json'), 'utf8')).child;
await waitFor(() => { try { return processStat(child.pid).state === 'Z'; } catch (error) { return error.code === 'ENOENT'; } }, 'self-bounded original task ceases');
await reject(input, 'stopped-repeat', /logical job binding|admission already claimed/);
assert.equal(hash(await readFile(claimPath)), hash(claim));
const pi = JSON.parse(await readFile(join(independent.attemptDir, 'pi-result.json'), 'utf8'));
assert.equal(pi.providerPromptStarted, false);
console.log(JSON.stringify({ status: 'PASS', root, project, store, input, changedInput, runtimeSha: seed.runtimeSha, ownerKilled: { pid: owner.pid, startTicks: owner.startTicks }, unknownWhileChildLive: unknown.state, offlineWorkerProviderPromptStarted: pi.providerPromptStarted, results, limits: ['one admission per logical job in one fixed store; no successor release or review receipt', 'no provider/GitHub prompt or general global multiwriter/reboot proof'] }, null, 2));
