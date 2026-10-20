import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? '.');
const { admission, claimSuccessor, validateSuccessorBinding } = await import(pathToFileURL(join(source, 'tools/job-successor.mjs')));
const { recoveryReview } = await import(pathToFileURL(join(source, 'tools/recovery-review.mjs')));
const { workspaceTree } = await import(pathToFileURL(join(source, 'tools/native-recovery.mjs')));
const hash = value => createHash('sha256').update(value).digest('hex');
const root = await fs.mkdtemp(join(tmpdir(), 'isswf-successor-models-'));
const originalRead = fs.readFile;
// Snapshot hashing only: no bwrap or worker is executed by this synthetic record test.
fs.readFile = async (path, ...args) => path === '/usr/bin/bwrap' ? Buffer.from('synthetic-bwrap-identity') : originalRead(path, ...args);
syncBuiltinESMExports();
const json = (path, value) => fs.writeFile(path, JSON.stringify(value) + '\n');
try {
  const store = join(root, 'runs'), attemptDir = join(store, 'previous'), workspace = join(attemptDir, 'workspace'), packageRoot = join(root, 'package');
  for (const path of [workspace, packageRoot, join(attemptDir, 'native-tools'), join(store, 'admissions')]) await fs.mkdir(path, { recursive: true });
  await fs.writeFile(join(workspace, 'code.txt'), 'preserved candidate\n');
  await json(join(packageRoot, '.isswf-package-receipt.json'), { synthetic: true });
  for (const name of ['dispatch.json', 'owner.json', 'execution-child.json', 'native-recovery.json', 'task.mjs']) await fs.writeFile(join(attemptDir, name), 'synthetic retained evidence\n');
  const oldModels = { sha: '1'.repeat(40), path: '.factory/models.json', sha256: '2'.repeat(64) };
  const unchanged = process.argv.includes('--unchanged');
  const newModels = unchanged ? { ...oldModels } : { ...oldModels, sha: '3'.repeat(40), sha256: '4'.repeat(64) };
  const original = { workerTotal: 1, methodologySha: '5'.repeat(40), models: oldModels, protectedCheckCommand: 'true', expectedMutablePaths: ['code.txt'] };
  const prior = { repo: join(root, 'project'), logicalJobRef: 'synthetic/job', attemptId: 'previous', inputSha: '6'.repeat(40), targetBase: '7'.repeat(40), runtimeSha: '8'.repeat(40), packageRoot, methodologySha: original.methodologySha, models: oldModels, jobPath: 'job.json', jobSha256: '9'.repeat(64), briefPath: 'brief.md', briefSha256: 'a'.repeat(64), taskSha256: 'b'.repeat(64), grantRef: 'original-only', mode: 'offline' };
  await json(join(store, 'previous.job.json'), prior);
  await json(join(store, 'admissions', admission(prior).key + '.json'), admission(prior));
  const baseline = await workspaceTree(workspace);
  const context = { observation: { state: 'unknown', recovery: { status: 'stopped-review-required', changedPaths: [], candidateHashes: {} } }, binding: prior, dispatch: { workspace }, job: original, baseline, attemptDir, store };
  const load = async () => context;
  const inspected = await recoveryReview({ action: 'inspect', load });
  await json(join(attemptDir, 'recovery-review-receipt.json'), { version: 1, fingerprint: inspected.fingerprint, candidate: inspected.candidate, approval: { grantRef: 'synthetic-approval', reviewRef: 'synthetic-review', sha256: 'c'.repeat(64), independentReview: true, verdict: 'pass' }, protectedCheck: { exitCode: 0, stdoutSha256: hash(''), stderrSha256: hash('') } });
  const checked = await recoveryReview({ action: 'check', load });
  const job = { ...original, workerTotal: 2, models: newModels };
  const request = { ...prior, attemptId: 'next', inputSha: 'd'.repeat(40), jobSha256: 'e'.repeat(64), models: newModels, grantRef: 'explicit-new-input' };
  const grant = { version: 1, grantRef: request.grantRef, reviewRef: 'synthetic-review', predecessorAttemptId: prior.attemptId, receiptSha256: checked.receiptSha256, fingerprint: checked.fingerprint, newAttemptId: request.attemptId, newInputSha: request.inputSha, newJobPath: request.jobPath, newJobSha256: request.jobSha256, newTargetBase: request.targetBase, mode: 'offline', cumulativeWorkerTotal: 2, priorInvocationUncertainAndConsumed: true, exclusiveSuccessorOwner: true, modelChange: { previous: oldModels, next: newModels } };
  if (unchanged) delete grant.modelChange;
  const previousBytes = await fs.readFile(join(store, 'previous.job.json'));
  async function refused(change) {
    await assert.rejects(claimSuccessor({ store, request, job, baseline, grant: { ...grant, ...change }, load }));
    await assert.rejects(fs.stat(join(store, 'successors')), { code: 'ENOENT' });
    assert.deepEqual(await fs.readFile(join(store, 'previous.job.json')), previousBytes);
  }
  if (unchanged) {
    await refused({ modelChange: { previous: oldModels, next: oldModels } });
  } else {
    await refused({ modelChange: undefined });
    await refused({ modelChange: { previous: newModels, next: newModels } });
    await refused({ modelChange: { previous: oldModels, next: oldModels } });
    await refused({ modelChange: { previous: oldModels, next: newModels, extra: true } });
  }
  await refused({ cumulativeWorkerTotal: 3 });
  const successor = await claimSuccessor({ store, request, job, baseline, grant, load });
  const binding = { ...request, successor };
  await validateSuccessorBinding({ store, binding });
  assert.deepEqual(await fs.readFile(join(store, 'previous.job.json')), previousBytes);
  assert.deepEqual(JSON.parse(await fs.readFile(join(store, 'previous.job.json'))).models, oldModels);
  const edgePath = join(store, 'successors', successor.key + '.json'), bytes = await fs.readFile(edgePath), edge = JSON.parse(bytes);
  assert.deepEqual(edge.request.models, newModels);
  assert.deepEqual(edge.grant.modelChange, grant.modelChange);
  await assert.rejects(claimSuccessor({ store, request, job, baseline, grant, load }), /already consumed/u);
  edge.grant.modelChange = { previous: newModels, next: newModels };
  const tampered = JSON.stringify(edge) + '\n'; await fs.writeFile(edgePath, tampered);
  await assert.rejects(validateSuccessorBinding({ store, binding: { ...binding, successor: { ...successor, sha256: hash(tampered) } } }));
  await fs.writeFile(edgePath, bytes);
  await validateSuccessorBinding({ store, binding });
  console.log(`PASS ${unchanged ? 'legacy unchanged' : 'explicit changed'} model successor recorded; old pins preserved, mismatched authority and budget/replay/tampered readback refused; synthetic records only, no worker/provider/reboot`);
} finally {
  fs.readFile = originalRead; syncBuiltinESMExports();
  await fs.rm(root, { recursive: true, force: true });
}
