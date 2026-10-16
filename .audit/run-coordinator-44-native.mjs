import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

assert(process.argv.length <= 3, 'at most one explicit fixture record is accepted');
const fixture = JSON.parse(await readFile(process.argv[2] ?? '.audit/coordinator-44-fixture.json', 'utf8'));
const recordPrefix = fixture.recordPrefix ?? '.audit/coordinator-44-native';
assert(/^\.audit\/coordinator-44-[a-z-]+$/.test(recordPrefix), 'owned record prefix required');
const attemptId = fixture.attemptId ?? 'J703-native-A001';
const gate = JSON.parse(await readFile(fixture.gatePath ?? '.audit/coordinator-44-precall.json', 'utf8'));
assert(gate.report.startsWith('PASS'), 'independent pre-call gate required');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(await readFile(fixture.taskPath)), fixture.prepared.taskSha256);
const marker = join(fixture.root, fixture.invocationFile ?? 'native-invocation.json');
await writeFile(marker, JSON.stringify({ job: 'J703', attemptId, authorizedForThisInvocation: 1, taskSha256: fixture.prepared.taskSha256, startedAt: new Date().toISOString() }) + '\n', { flag: 'wx', mode: 0o600 });
const cli = resolve('tools/worker-lifecycle.mjs');
const run = args => {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 10000, maxBuffer: 20000 });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const runs = join(fixture.root, 'runs');
const launch = run(['launch', '--repo', fixture.repo, '--input-sha', fixture.inputCheckpoint, '--brief', fixture.briefPath, '--target-base', fixture.targetBase, '--attempt-id', attemptId, '--runs-store', runs, '--grant-ref', fixture.grantRef ?? 'operator-approved-coordinator-cut-one-native-implementation-worker', '--task-script', fixture.taskPath, '--timeout-ms', '120000', '--output-bytes', '16384']);
await writeFile(`${recordPrefix}-launch.json`, JSON.stringify({ ...launch, runs, marker, fixtureInput: fixture.inputCheckpoint }, null, 2) + '\n', { flag: 'wx' });
let observation;
for (let i = 0; i < 490; i++) {
  observation = run(['read', '--runs-store', runs, '--attempt-id', launch.attemptId]);
  if (observation.state === 'terminal') break;
  await delay(250);
}
let taskResult;
if (observation.state === 'terminal') {
  try { taskResult = JSON.parse(await readFile(join(launch.attemptDir, 'pi-result.json'), 'utf8')); } catch {}
}
const record = { launch, observation, taskResult, workerRoute: 'Pi SDK native; not Pstack agent', scope: 'One disposable source-implementation task. Static/compiler checks and adapter scope gate are not full parent Git/SDK verification or independent review.' };
await writeFile(`${recordPrefix}-result.json`, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record));
if (observation.state !== 'terminal' || observation.terminal.outcome !== 'success' || taskResult?.status !== 'completed') process.exitCode = 2;
