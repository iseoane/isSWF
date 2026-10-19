import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, lstat, realpath, readFile, open, rename } from 'node:fs/promises';
import { isAbsolute, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (root, path) => { const part = relative(root, path); return part === '' || (part !== '..' && !part.startsWith('../') && !isAbsolute(part)); };
const sync = async path => { const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); } };
async function regular(path) {
  const stat = await lstat(path); assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 4096, 'bounded-capacity-record-required');
  const bytes = await readFile(path); assert(bytes.length <= 4096, 'bounded-capacity-record-required'); return bytes;
}
async function policy(scope) {
  const bytes = await regular(join(scope.pool, 'policy.json'));
  assert(hash(bytes) === scope.policySha256, 'capacity-policy-changed');
  const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  assert(Object.keys(value).sort().join(',') === 'limit,reference,version' && value.version === 1 && Number.isSafeInteger(value.limit) && value.limit > 0 && value.limit <= 16 && typeof value.reference === 'string' && value.reference.trim() && value.reference.length <= 1000 && !/[\x00-\x1f\x7f]/u.test(value.reference), 'finite-capacity-policy-required');
  return value;
}
export async function prepareCapacity(descriptor, excludedRoots, runnerSha256) {
  if (descriptor === undefined) return undefined;
  assert(typeof runnerSha256 === 'string' && /^[a-f0-9]{64}$/u.test(runnerSha256) && hash(await readFile(fileURLToPath(import.meta.url))) === runnerSha256, 'capacity-runner-binding-required');
  assert(descriptor && Object.keys(descriptor).sort().join(',') === 'policySha256,pool' && isAbsolute(descriptor.pool ?? '') && /^[a-f0-9]{64}$/u.test(descriptor.policySha256 ?? ''), 'explicit-capacity-scope-required');
  const pool = await realpath(descriptor.pool);
  assert(pool === descriptor.pool && excludedRoots.every(root => !inside(root, pool) && !inside(pool, root)), 'capacity-scope-must-be-separate');
  for (const directory of [pool, join(pool, 'completed')]) { const stat = await lstat(directory); assert(stat.isDirectory() && !stat.isSymbolicLink(), 'capacity-directory-required'); }
  const scope = { pool, policySha256: descriptor.policySha256 };
  const value = await policy(scope); return { ...scope, limit: value.limit, runnerSha256 };
}
async function archiveReservation(scope, info, bytes, evidence) {
  await policy(scope);
  const directory=join(scope.pool,'slot-'+info.slot);
  const stat=await lstat(directory);assert(stat.isDirectory()&&!stat.isSymbolicLink(),'invalid-capacity-reservation');
  assert((await regular(join(directory,'lease.json'))).equals(bytes),'capacity-owner-changed');
  const proof=await open(join(directory,'completion.json'),'wx',0o600);
  try {await proof.writeFile(JSON.stringify({version:1,id:info.id,completedAt:new Date().toISOString(),evidence})+'\n');await proof.sync();} finally {await proof.close();}
  await sync(directory);await rename(directory,join(scope.pool,'completed',info.id));await sync(join(scope.pool,'completed'));await sync(scope.pool);
}

export async function acquireCapacity(scope, { role, logicalJobRef, mode, worker }) {
  if (!scope) return { info: null, async complete() {} };
  assert(['real', 'fixture'].includes(mode) && ['reviewer', 'planner', 'diagnostician', 'researcher', 'worker'].includes(role) && typeof logicalJobRef === 'string' && logicalJobRef.trim() && Buffer.byteLength(logicalJobRef) <= 2000 && !/[\x00-\x1f\x7f]/u.test(logicalJobRef), 'capacity-owner-required');
  if(role==='worker') {
    assert(worker && Object.keys(worker).sort().join(',')==='attemptDir,attemptId,inputSha,jobSha256,runtimeSha,targetBase','worker-capacity-owner-required');
    assert(typeof worker.attemptId==='string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(worker.attemptId) && !['.','..'].includes(worker.attemptId) && isAbsolute(worker.attemptDir) && join(dirname(worker.attemptDir),worker.attemptId)===worker.attemptDir,'worker-capacity-path-required');
    for(const key of ['inputSha','runtimeSha','targetBase'])assert(/^[a-f0-9]{40}$/.test(worker[key]),'worker-capacity-pin-required');
    assert(/^[a-f0-9]{64}$/.test(worker.jobSha256),'worker-capacity-job-required');
  } else assert(worker===undefined,'unexpected-worker-owner');
  const value = await policy(scope); assert(value.limit === scope.limit, 'capacity-policy-changed');
  for (let slot = 0; slot < scope.limit; slot++) {
    const directory = join(scope.pool, 'slot-' + slot);
    try { await mkdir(directory, { mode: 0o700 }); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const stat = await lstat(directory); assert(stat.isDirectory() && !stat.isSymbolicLink(), 'invalid-capacity-reservation');
      continue;
    }
    // An incomplete claim stays occupied. Never infer that its execution did not start.
    await sync(scope.pool);
    const id = randomUUID();
    const info = { version: 1, id, slot, role, mode, logicalJobRef, pid: process.pid, policySha256: scope.policySha256, runnerSha256: scope.runnerSha256, createdAt: new Date().toISOString(), ...(worker ? {worker:{...worker}} : {}) };
    const bytes = Buffer.from(JSON.stringify(info) + '\n');
    const file = await open(join(directory, 'lease.json'), 'wx', 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await sync(directory);
    let completed = false;
    return { info: { ...info, pool: scope.pool }, async complete() {
      if (completed) return;
      assert(role!=='worker','worker-completion-requires-bound-cessation');
      await archiveReservation(scope,info,bytes,mode === 'fixture' ? 'synthetic fixture completed matching response; no real provider execution' : 'own native caller observed complete matching provider response; no active stream remains');
      completed = true;
    }, async cancelBeforeDispatch() {
      assert(role==='worker' && process.pid===info.pid && !completed,'worker-predispatch-owner-required');
      for(const path of [worker.attemptDir,join(dirname(worker.attemptDir),worker.attemptId+'.job.json')]) {
        try { await lstat(path); } catch(error) { if(error.code==='ENOENT')continue; throw error; }
        throw Error('worker-dispatch-may-have-started');
      }
      await archiveReservation(scope,info,bytes,{kind:'worker-admission-refused-before-dispatch'});
      completed=true;
    } };
  }
  return null;
}

export async function completeWorkerCapacity({scope,info}) {
  assert(info?.role==='worker' && ['real','fixture'].includes(info.mode) && /^[a-f0-9-]{36}$/.test(info.id) && Number.isInteger(info.slot) && info.slot>=0 && info.slot<scope.limit && info.pool===scope.pool && info.policySha256===scope.policySha256 && info.runnerSha256===scope.runnerSha256,'bound-worker-capacity-required');
  const owner=info.worker;assert(owner && isAbsolute(owner.attemptDir) && join(dirname(owner.attemptDir),owner.attemptId)===owner.attemptDir,'bound-worker-attempt-required');
  await prepareCapacity({pool:scope.pool,policySha256:scope.policySha256},[owner.attemptDir],scope.runnerSha256);
  const {pool:ignoredPool,...lease}=info;assert(ignoredPool===scope.pool);
  const bytes=Buffer.from(JSON.stringify(lease)+'\n');
  assert((await regular(join(scope.pool,'slot-'+info.slot,'lease.json'))).equals(bytes),'worker-capacity-owner-changed');
  const binding=JSON.parse(await regular(join(dirname(owner.attemptDir),owner.attemptId+'.job.json')));
  assert(binding.version===1 && binding.attemptId===owner.attemptId && binding.inputSha===owner.inputSha && binding.jobSha256===owner.jobSha256 && binding.runtimeSha===owner.runtimeSha && binding.targetBase===owner.targetBase && binding.logicalJobRef===info.logicalJobRef && (binding.mode==='offline'?'fixture':binding.mode)===info.mode && JSON.stringify(binding.capacity)===JSON.stringify(info),'worker-capacity-binding-changed');
  const dispatch=JSON.parse(await regular(join(owner.attemptDir,'dispatch.json')));
  assert(dispatch.version===1 && dispatch.attemptId===owner.attemptId && dispatch.inputSha===owner.inputSha && dispatch.targetBase===owner.targetBase && dispatch.taskSha256===binding.taskSha256 && dispatch.workspace===join(owner.attemptDir,'workspace'),'worker-capacity-dispatch-changed');
  const {inspectWorkerCessation}=await import('./native-recovery.mjs');
  const cessation=await inspectWorkerCessation({attemptDir:owner.attemptDir,dispatch});
  assert(cessation.status==='ceased' && cessation.taskSha256===binding.taskSha256,'worker-capacity-cessation-unproven');
  await archiveReservation(scope,lease,bytes,{mode:info.mode,kind:'verified-worker-task-and-tool-namespace-cessation',...cessation});
  return {status:'released',id:info.id,scope:scope.pool,cessation};
}
