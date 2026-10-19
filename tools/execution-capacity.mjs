import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, lstat, realpath, readFile, open, rename } from 'node:fs/promises';
import { isAbsolute, relative, join } from 'node:path';
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
export async function acquireCapacity(scope, { role, logicalJobRef, mode }) {
  if (!scope) return { info: null, async complete() {} };
  assert(['real', 'fixture'].includes(mode) && ['reviewer', 'planner'].includes(role) && typeof logicalJobRef === 'string' && logicalJobRef.trim() && Buffer.byteLength(logicalJobRef) <= 2000 && !/[\x00-\x1f\x7f]/u.test(logicalJobRef), 'capacity-owner-required');
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
    const info = { version: 1, id, slot, role, mode, logicalJobRef, pid: process.pid, policySha256: scope.policySha256, runnerSha256: scope.runnerSha256, createdAt: new Date().toISOString() };
    const bytes = Buffer.from(JSON.stringify(info) + '\n');
    const file = await open(join(directory, 'lease.json'), 'wx', 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await sync(directory);
    let completed = false;
    return { info: { ...info, pool: scope.pool }, async complete() {
      if (completed) return;
      await policy(scope);
      const stat = await lstat(directory); assert(stat.isDirectory() && !stat.isSymbolicLink(), 'invalid-capacity-reservation');
      assert((await regular(join(directory, 'lease.json'))).equals(bytes), 'capacity-owner-changed');
      const proof = await open(join(directory, 'completion.json'), 'wx', 0o600);
      try { await proof.writeFile(JSON.stringify({ version: 1, id, completedAt: new Date().toISOString(), evidence: mode === 'fixture' ? 'synthetic fixture completed matching response; no real provider execution' : 'own native caller observed complete matching provider response; no active stream remains' }) + '\n'); await proof.sync(); } finally { await proof.close(); }
      await sync(directory);
      await rename(directory, join(scope.pool, 'completed', id));
      await sync(join(scope.pool, 'completed')); await sync(scope.pool);
      completed = true;
    } };
  }
  return null;
}
