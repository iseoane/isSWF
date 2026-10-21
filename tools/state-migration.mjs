import { createHash, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, open, readFile, readdir, rename, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const validId = value => /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u.test(value || '');
async function exists(path) { try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function dir(path) { const stat = await lstat(path); if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Real state migration directory required'); }
async function json(path) { const stat = await lstat(path); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) throw Error('Bounded migration journal required'); return JSON.parse(await readFile(path, 'utf8')); }
async function publish(path, value) {
  const temp = path + '.pending-' + randomUUID();
  const file = await open(temp, 'wx', 0o600);
  try { await file.writeFile(JSON.stringify(value, null, 2) + '\n'); await file.sync(); } finally { await file.close(); }
  try { await link(temp, path); } finally { await unlink(temp); }
}
async function sync(path) { const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); } }
async function tree(root) {
  await dir(root);
  const files = [];
  let bytes = 0;
  async function visit(path, prefix) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const full = join(path, entry.name), relative = prefix + entry.name, stat = await lstat(full);
      if (entry.isSymbolicLink() || !entry.isDirectory() && !entry.isFile()) throw Error('State migration refuses symlinks and special files: ' + relative);
      if (['.plan-write', '.tools-install', 'operation'].includes(entry.name)) throw Error('Interrupted or active state claim requires reconciliation: ' + relative);
      if (files.length >= 10000 || stat.isFile() && (bytes += stat.size) > 64 * 1024 * 1024) throw Error('State migration inventory exceeds bounded limits');
      if (relative === 'local/leases' || relative === 'local/workers') {
        if (!stat.isDirectory() || (await readdir(full)).length) throw Error('Registered legacy execution must be reconciled before moving state');
      }
      if (stat.isDirectory()) { files.push({ path: relative, kind: 'directory', mode: stat.mode & 0o777 }); await visit(full, relative + '/'); }
      else files.push({ path: relative, kind: 'file', mode: stat.mode & 0o777, sha256: digest(await readFile(full)) });
    }
  }
  await visit(root, '');
  return { files, expected: digest(JSON.stringify(files)) };
}
export async function inspectStateMigration(project) {
  const old = await exists(join(project, '.factory')), current = await exists(join(project, '.isswf'));
  if (old && current) throw Error('Both .factory and .isswf exist; do not merge automatically');
  if (!old) return null;
  return { from: '.factory', to: '.isswf', ...await tree(join(project, '.factory')), writes: false };
}
function journal(store, project, id) {
  if (!validId(id)) throw Error('State migration requires --id of at most 64 safe characters');
  return join(store, 'state-migrations', digest(project), id);
}
async function checkJournal(store, project, id) {
  const path = journal(store, project, id);
  for (const parent of [store, join(store, 'state-migrations'), join(store, 'state-migrations', digest(project)), path]) if (await exists(parent)) await dir(parent);
  return path;
}
async function journalParents(store, project, id) {
  for (const path of [store, join(store, 'state-migrations'), join(store, 'state-migrations', digest(project))]) {
    try { await mkdir(path, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    await dir(path);
  }
  const path = journal(store, project, id);
  await mkdir(path, { mode: 0o700 });
  return path;
}
async function claim(project, id, recordPath, record) {
  const path = join(project, '.isswf-transition');
  if (await exists(path)) throw Error('Existing transition requires inspection and recovery');
  const stage = join(project, '.isswf-transition-stage-' + randomUUID());
  await mkdir(stage, { mode: 0o700 });
  try {
    await publish(join(stage, 'owner.json'), { format: 1, id, recordPath, owner: record.owner, record });
    await sync(stage); await rename(stage, path); await sync(project);
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}
async function clearClaim(project) {
  const path = join(project, '.isswf-transition');
  const retired = join(project, '.isswf-transition-retired-' + randomUUID());
  await rename(path, retired); await sync(project);
  await rm(retired, { recursive: true });
}
export async function moveState({ project, store, id, expected, reference, owner }) {
  if (!reference?.trim()) throw Error('Explicit --quiescent-ref for legacy and external writers required');
  const path = await checkJournal(store, project, id);
  if (await exists(path)) {
    const record = await json(join(path, 'record.json'));
    if (record.project === project && record.kind === 'move' && await exists(join(path, 'complete.json')) && !await exists(join(project, '.factory')) && (await tree(join(project, '.isswf'))).expected === record.expected) return { status: 'unchanged', id };
    throw Error('Existing state migration requires inspection; journal is never overwritten');
  }
  const preview = await inspectStateMigration(project);
  if (!preview || preview.expected !== expected) throw Error('--expected must match the legacy state inventory from inspect');
  const git = await import('node:child_process');
  const status = git.spawnSync('git', ['-C', project, 'status', '--porcelain=v1', '--untracked-files=all', '--', '.factory'], { encoding: 'utf8', timeout: 10000 });
  if (status.error || status.status !== 0 || status.stdout.trim()) throw Error('Checkpoint legacy .factory files before moving them');
  const record = { format: 1, id, kind: 'move', project, expected, reference, owner, files: preview.files };
  if (Buffer.byteLength(JSON.stringify(record, null, 2)) > 3 * 1024 * 1024) throw Error('State inventory exceeds recoverable journal bound');
  await claim(project, id, path, record);
  await journalParents(store, project, id);
  await publish(join(path, 'record.json'), record);
  await sync(path);
  if ((await inspectStateMigration(project)).expected !== expected) throw Error('Legacy state changed after inspection; claim retained');
  if (await exists(join(project, '.isswf'))) throw Error('State destination appeared; claim retained');
  await rename(join(project, '.factory'), join(project, '.isswf'));
  await sync(project);
  if ((await tree(join(project, '.isswf'))).expected !== expected) throw Error('Moved state differs from recorded bytes; claim retained');
  await publish(join(path, 'complete.json'), { format: 1, id, state: 'moved' });
  await sync(path); await clearClaim(project);
  return { status: 'state-migrated', id, from: '.factory', to: '.isswf', changedFiles: 0, journal: path };
}
export async function recoverState({ project, store, id, ceased }) {
  const path = await checkJournal(store, project, id);
  const claimPath = join(project, '.isswf-transition'); await dir(claimPath);
  const owner = await json(join(claimPath, 'owner.json'));
  const hasRecord = await exists(join(path, 'record.json'));
  const record = hasRecord ? await json(join(path, 'record.json')) : owner.record;
  if (owner.record && JSON.stringify(owner.record) !== JSON.stringify(record)) throw Error('Claim and state journal disagree');
  if (record?.format !== 1 || record.kind !== 'move' || !Array.isArray(record.files) || digest(JSON.stringify(record.files)) !== record.expected || record.project !== project || record.id !== id || owner.id !== id || owner.recordPath !== path || !await ceased(owner.owner) || !await ceased(record.owner)) throw Error('State migration owner is live or uncertain, or journal mismatches');
  const old = await exists(join(project, '.factory')), current = await exists(join(project, '.isswf'));
  if (old === current) throw Error('Ambiguous state locations block recovery');
  const observed = await tree(join(project, old ? '.factory' : '.isswf'));
  if (observed.expected !== record.expected) throw Error('State drift blocks recovery; preserve data for inspection');
  if (!hasRecord) {
    if (!await exists(path)) await journalParents(store, project, id);
    await publish(join(path, 'record.json'), record);
  }
  if (!await exists(join(path, 'recovered.json'))) await publish(join(path, 'recovered.json'), { format: 1, id, state: old ? 'unchanged-before' : 'moved' });
  if (current && !await exists(join(path, 'complete.json'))) await publish(join(path, 'complete.json'), { format: 1, id, state: 'moved' });
  await sync(path); await clearClaim(project);
  return { status: 'state-recovered', id, activeDirectory: old ? '.factory' : '.isswf' };
}
