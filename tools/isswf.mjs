#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { cp, link, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyRelease, releaseInvocation } from './release-source.mjs';
import { stateDirectory } from './project-state.mjs';
import { inspectStateMigration, moveState, recoverState } from './state-migration.mjs';

const ownRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u;
const runtimePattern = /^[a-f0-9]{64}$/u;
const pinPath = '.isswf/install.json';
const executableTools = ['isswf-plan', 'isswf-status', 'isswf-panel', 'isswf-response', 'isswf-intake', 'project-quality', 'isswf-job', 'researcher-task', 'reviewer-task', 'planner-task', 'diagnostic-task'];
function fail(message) { throw Error(message); }
function inside(parent, child) { const part = relative(parent, child); return part === '' || (!part.startsWith('..' + sep) && part !== '..' && !isAbsolute(part)); }
async function exists(path) { try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function directory(path) { const stat = await lstat(path); if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`Real directory required: ${path}`); }
async function regular(path) { const stat = await lstat(path); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) fail(`Bounded regular file required: ${path}`); return readFile(path); }
async function json(path) { return JSON.parse((await regular(path)).toString('utf8')); }
async function safeParents(root, path, create = false) {
  if (!inside(root, path)) fail('Path escapes owned root');
  const parts = relative(root, dirname(path)).split(sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    if (create && !await exists(current)) await mkdir(current, { mode: 0o700 });
    if (await exists(current)) await directory(current);
  }
}
async function writeExclusive(path, bytes) {
  const temp = join(dirname(path), '.pending-' + randomUUID());
  const file = await open(temp, 'wx', 0o600);
  try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
  try { await link(temp, path); } finally { await unlink(temp); }
  await syncDirectory(dirname(path));
}
async function syncDirectory(path) {
  // Windows rejects directory-handle sync; regular-file sync remains mandatory.
  if (process.platform === 'win32') return;
  const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); }
}
async function atomic(path, bytes) {
  const temp = join(dirname(path), '.isswf-' + randomUUID());
  await writeExclusive(temp, bytes);
  await rename(temp, path);
  await syncDirectory(dirname(path));
}
async function projectRoot(path) {
  if (!isAbsolute(path || '')) fail('--project must be an absolute Git root');
  const root = await realpath(path);
  stateDirectory(root);
  const git = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10000 });
  if (git.error || git.status !== 0 || await realpath(git.stdout.trim()) !== root) fail('--project must name a Git root');
  await safeParents(root, join(root, '.isswf', 'local', 'placeholder'));
  if (await exists(join(root, '.isswf/local'))) await directory(join(root, '.isswf/local'));
  return root;
}
async function storeRoot(path, project) {
  const candidate = resolve(path || process.env.ISSWF_STORE || join(homedir(), '.local/share/isswf'));
  if (path && !isAbsolute(path)) fail('--store must be absolute');
  let current = candidate;
  const missing = [];
  while (!await exists(current)) { missing.unshift(relative(dirname(current), current)); current = dirname(current); }
  await directory(current);
  const canonical = resolve(await realpath(current), ...missing);
  if (inside(project, canonical) || inside(canonical, project) || inside(ownRoot, canonical) || inside(canonical, ownRoot)) fail('Runtime store must be outside project and installed package');
  return canonical;
}
function release(root) { const value = verifyRelease(root); if (!value) fail('Use a built release, not the development checkout. See docs/installation.md'); return value; }
function pinFor(value, previous = {}) { return { ...previous, format: 1, schemaVersion: 1, version: value.version, revision: value.revision, runtimeId: value.runtimeId, runtimeFormat: value.format }; }
function retainedPath(store, pin) {
  const base = join(store, 'releases', pin.runtimeId);
  return pin.runtimeFormat === 2 ? join(base, `${process.platform}-${process.arch}`) : base;
}
function artifactAnchor(root) { return root + '.sha256'; }
async function readPin(project) {
  const path = join(project, pinPath);
  if (!await exists(path)) return null;
  const bytes = await regular(path), pin = JSON.parse(bytes.toString('utf8'));
  if (pin.format !== 1 || pin.schemaVersion !== 1 || (pin.runtimeFormat !== undefined && ![1, 2].includes(pin.runtimeFormat)) || !runtimePattern.test(pin.runtimeId || '') || typeof pin.version !== 'string' || !/^[a-f0-9]{40}$/u.test(pin.revision || '')) fail('Unsupported or malformed project installation; no automatic schema conversion');
  return { pin, bytes };
}
async function retained(store, pin) {
  const root = retainedPath(store, pin);
  await safeParents(store, join(root, 'package.json'));
  await directory(root);
  const value = release(root);
  if (value.runtimeId !== pin.runtimeId || value.revision !== pin.revision || value.version !== pin.version || value.format !== (pin.runtimeFormat || 1)) fail('Retained runtime does not match project pin');
  if (value.format === 2) {
    if (value.runtime.os !== process.platform || value.runtime.arch !== process.arch) fail('Retained executable target does not match this host');
    if ((await regular(artifactAnchor(root))).toString('utf8') !== value.artifactId + '\n') fail('Retained artifact receipt differs from its immutable local anchor');
  }
  return root;
}
async function retain(store, from) {
  const value = release(from), target = retainedPath(store, pinFor(value));
  if (value.format === 2 && (value.runtime.os !== process.platform || value.runtime.arch !== process.arch)) fail('Cannot retain an executable for another host');
  if (await exists(target)) { await retained(store, pinFor(value)); return target; }
  await mkdir(store, { recursive: true, mode: 0o700 });
  await directory(store);
  await safeParents(store, join(dirname(target), 'placeholder'), true);
  const stage = join(dirname(target), '.stage-' + randomUUID());
  await cp(from, stage, { recursive: true, errorOnExist: true, force: false, filter: path => path === from || !relative(from, path).split(sep).includes('node_modules') });
  try {
    const staged = release(stage);
    if (staged.runtimeId !== value.runtimeId || staged.artifactId !== value.artifactId) fail('Runtime changed during retention');
    if (await exists(target)) { await retained(store, pinFor(value)); await rm(stage, { recursive: true }); return target; }
    if (value.format === 2) {
      const anchor = artifactAnchor(target), bytes = Buffer.from(value.artifactId + '\n');
      if (!await exists(anchor)) {
        try { await writeExclusive(anchor, bytes); }
        catch (error) { if (error.code !== 'EEXIST') throw error; }
      }
      if (!(await regular(anchor)).equals(bytes)) fail('A different artifact is already bound to this portable runtime and host');
    }
    await rename(stage, target);
    await syncDirectory(dirname(target));
    return target;
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
}
// A Windows PID is reusable; bind it to process creation and OS boot times.
function windowsProcessIdentity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) fail('Invalid Windows process identity PID');
  const script = `$ErrorActionPreference = 'Stop'; $p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; $boot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().ToString('o'); if ($null -eq $p) { @{bootId=$boot; process=$null} | ConvertTo-Json -Compress } else { @{bootId=$boot; process=@{pid=[int]$p.ProcessId; startTime=$p.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress }`;
  const executable = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const result = spawnSync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { encoding: 'utf8', timeout: 15000, maxBuffer: 16384, windowsHide: true });
  if (result.error || result.status !== 0) fail('Windows process identity unavailable; recovery remains blocked');
  const value = JSON.parse(result.stdout.replace(/^\uFEFF/u, '').trim());
  const timestamp = input => typeof input === 'string' && /^\d{4}-\d\d-\d\dT/u.test(input) && Number.isFinite(Date.parse(input));
  if (!timestamp(value.bootId) || value.process !== null && (value.process?.pid !== pid || !timestamp(value.process.startTime))) fail('Invalid Windows process identity evidence');
  return value;
}
async function identity() {
  if (process.platform === 'win32') {
    const value = windowsProcessIdentity(process.pid);
    if (!value.process) fail('Current Windows process identity unavailable');
    return { platform: 'win32', ...value.process, bootId: value.bootId };
  }
  if (process.platform !== 'linux') fail('Mutation recovery requires Linux or Windows process identity support');
  const stat = await readFile(`/proc/${process.pid}/stat`, 'utf8');
  return { pid: process.pid, startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(/\s+/u)[19], bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() };
}
async function ceased(owner) {
  if (owner?.platform === 'win32') {
    if (process.platform !== 'win32' || !Number.isSafeInteger(owner.pid) || owner.pid <= 0 || typeof owner.startTime !== 'string' || !Number.isFinite(Date.parse(owner.startTime)) || typeof owner.bootId !== 'string' || !Number.isFinite(Date.parse(owner.bootId))) return false;
    try {
      const value = windowsProcessIdentity(owner.pid);
      return value.bootId !== owner.bootId || value.process === null || value.process.startTime !== owner.startTime;
    } catch { return false; }
  }
  if (process.platform !== 'linux' || owner?.platform !== undefined) return false;
  if (!Number.isSafeInteger(owner?.pid) || owner.pid <= 0 || !/^\d+$/u.test(owner.startTicks || '') || !/^[a-f0-9-]{36}$/u.test(owner.bootId || '')) return false;
  try {
    if ((await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() !== owner.bootId) return true;
    const stat = await readFile(`/proc/${owner.pid}/stat`, 'utf8');
    return stat.slice(stat.lastIndexOf(')') + 2).split(/\s+/u)[19] !== owner.startTicks;
  } catch (error) { return error.code === 'ENOENT'; }
}
async function retireClaim(path) {
  const retired = join(dirname(path), '.retired-' + randomUUID());
  await rename(path, retired);
  await syncDirectory(dirname(path));
  await rm(retired, { recursive: true });
}
async function lock(project, id, transaction = null) {
  const local = join(project, '.isswf/local');
  await safeParents(project, join(local, 'placeholder'), true);
  await directory(local);
  const path = join(local, 'operation');
  if (await exists(path)) fail('Existing operation requires inspection and recovery');
  const stage = join(local, '.claim-' + randomUUID());
  await mkdir(stage, { mode: 0o700 });
  try {
    await writeExclusive(join(stage, 'owner.json'), jsonBytes({ id, owner: await identity(), transaction }));
    await syncDirectory(stage);
    await rename(stage, path);
    await syncDirectory(local);
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error; }
  return () => retireClaim(path);
}
async function activity(project, store) {
  const local = join(project, '.isswf/local'), blockers = [];
  for (const name of ['leases', 'workers']) {
    const dir = join(local, name);
    if (!await exists(dir)) continue;
    await directory(dir);
    for (const entry of await readdir(dir)) {
      const record = await json(join(dir, entry));
      if (name === 'leases') { blockers.push({ lease: entry, state: 'active-or-unreconciled' }); continue; }
      try {
        if (record.project !== project || !isAbsolute(record.store || '') || !idPattern.test(record.attemptId || '')) fail('Invalid worker registration');
        const runtime = await retained(store, record.pin);
        const attemptDir = join(record.store, record.attemptId);
        await directory(attemptDir);
        const dispatch = await json(join(attemptDir, 'dispatch.json'));
        if (dispatch.repo !== project || dispatch.attemptId !== record.attemptId) fail('Worker dispatch binding mismatch');
        const { inspectWorkerCessation } = await import(pathToFileURL(join(runtime, 'tools/native-recovery.mjs')));
        const observation = await inspectWorkerCessation({ attemptDir, dispatch });
        if (observation.status !== 'ceased') blockers.push({ worker: entry, state: 'unknown-or-not-ceased', reason: observation.reason });
      } catch (error) { blockers.push({ worker: entry, state: 'unknown', reason: error.message }); }
    }
  }
  return blockers;
}
async function idle(project, store) {
  const blockers = await activity(project, store);
  if (blockers.length) fail('Active or uncertain execution blocks installation change: ' + JSON.stringify(blockers));
}
async function clean(project, paths) {
  const result = spawnSync('git', ['-C', project, 'status', '--porcelain=v1', '--untracked-files=all', '--', ...paths], { encoding: 'utf8', timeout: 10000 });
  if (result.error || result.status !== 0 || result.stdout.trim()) fail('Checkpoint affected project files in Git before migration; dirty/untracked operator bytes are preserved');
}
const managedPaths = new Set([pinPath, '.isswf/project-setup.md', '.isswf/models.json', '.isswf/.gitignore']);
async function matches(project, files, side) {
  for (const file of files) {
    const path = join(project, file.path); await safeParents(project, path);
    const observed = await exists(path) ? (await regular(path)).toString('base64') : null;
    if (observed !== file[side]) return false;
  }
  return true;
}
async function applyFiles(project, files, side) {
  for (const file of files) {
    if (!managedPaths.has(file.path) || !['string', 'object'].includes(typeof file[side]) || (typeof file[side] === 'object' && file[side] !== null)) fail('Malformed transaction file');
    const path = join(project, file.path); await safeParents(project, path, true);
    const observed = await exists(path) ? (await regular(path)).toString('base64') : null;
    if (observed !== file.before && observed !== file.after) fail(`Operator drift blocks recovery: ${file.path}`);
    if (file[side] === null) { if (await exists(path)) await unlink(path); }
    else await atomic(path, Buffer.from(file[side], 'base64'));
  }
}
function transactionPath(project, id) { if (!idPattern.test(id || '')) fail('--id must be a safe transaction identifier'); return join(project, '.isswf/local/transactions', id); }
async function transaction(project, store, id, kind, files, reference = null) {
  const path = transactionPath(project, id);
  await safeParents(project, join(path, 'record.json'));
  if (await exists(path)) {
    const record = await json(join(path, 'record.json'));
    if (record.kind === kind && JSON.stringify(record.files) === JSON.stringify(files) && await exists(join(path, 'complete.json')) && await matches(project, files, 'after')) return { status: 'unchanged', id };
    fail('Transaction exists; inspect or recover it, never overwrite a prior migration');
  }
  const record = { format: 1, id, kind, owner: await identity(), reference, files };
  if (jsonBytes(record).length > 1024 * 1024) fail('Installation transaction exceeds the recoverable journal bound');
  const unlock = await lock(project, id, record);
  let started = false;
  try {
    await idle(project, store);
    if (!await matches(project, files, 'before')) fail('Project changed since inspection');
    await safeParents(project, join(path, 'record.json'), true);
    await directory(path);
    await writeExclusive(join(path, 'record.json'), jsonBytes(record));
    await syncDirectory(path);
    started = true;
    await applyFiles(project, files, 'after');
    if (!await matches(project, files, 'after')) fail('Migration validation failed');
    await writeExclusive(join(path, 'complete.json'), jsonBytes({ format: 1, id, state: 'complete' }));
    await syncDirectory(path);
    await unlock();
    return { status: kind === 'init' ? 'initialized' : 'migrated', id, changed: files.map(file => file.path) };
  } catch (error) {
    if (!started) await unlock();
    else error.message += `; retained backup and claim, use recover --id ${id}`;
    throw error;
  }
}
function trackingRecord(mode, repository) {
  if (!['local', 'github'].includes(mode)) fail('init requires --tracking local|github');
  if (mode === 'github' && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository || '')) fail('GitHub tracking requires explicit --repository owner/repo');
  if (mode === 'local' && repository) fail('Local tracking has no GitHub repository');
  return `# Project setup\n\nTracking: ${mode}\n${repository ? `Repository: ${repository}\n` : ''}\nRemote permissions: none. Tracking selection grants no remote actions.\n\nModel routes: .isswf/models.json. Availability and effort support remain pending verification.\nChecks and delivery boundary: pending project-specific assessment.\nTechnical isolation: not verified. Client-use gate: blocked.\n\nInitialization installs resources only. It does not grant execution, provider calls, push, merge, or deployment.\n`;
}
async function initialize(project, store, opts) {
  const target = release(ownRoot), current = await readPin(project);
  if (await exists(join(project, '.factory'))) fail('Legacy .factory requires explicit migrate-state before initialization');
  if (current) {
    if (current.pin.runtimeId === target.runtimeId) await retain(store, ownRoot);
    await retained(store, current.pin);
    if (current.pin.runtimeId !== target.runtimeId) fail('Project has another version; inspect and migrate explicitly');
    if (await exists(join(project, '.isswf/local/operation'))) fail('Interrupted operation requires inspect and recovery');
    return { status: 'unchanged', pin: current.pin };
  }
  const changes = { [pinPath]: jsonBytes({ ...pinFor(target), generation: opts.id || 'init-' + target.runtimeId.slice(0, 16) }) };
  const setup = '.isswf/project-setup.md';
  if (!await exists(join(project, setup))) changes[setup] = trackingRecord(opts.tracking, opts.repository);
  else if (opts.tracking || opts.repository) fail('Existing project setup is preserved; reconcile tracking separately');
  if (!await exists(join(project, '.isswf/models.json'))) changes['.isswf/models.json'] = await regular(join(ownRoot, '.factory/models.json'));
  if (!await exists(join(project, '.isswf/.gitignore'))) changes['.isswf/.gitignore'] = 'local/\n';
  const files = Object.entries(changes).map(([path, after]) => ({ path, before: null, after: Buffer.from(after).toString('base64') }));
  await retain(store, ownRoot);
  return transaction(project, store, opts.id || 'init-' + target.runtimeId.slice(0, 16), 'init', files);
}
async function inspect(project, store) {
  const target = release(ownRoot), current = await readPin(project);
  const stateMigration = await inspectStateMigration(project);
  if (stateMigration) return { status: 'legacy-state', available: pinFor(target), stateMigration, transition: await exists(join(project, '.isswf-transition')), writes: false };
  if (current) await retained(store, current.pin);
  const changed = current?.pin.runtimeId === target.runtimeId ? [] : [pinPath];
  if (!current) for (const path of ['.isswf/project-setup.md', '.isswf/models.json', '.isswf/.gitignore']) if (!await exists(join(project, path))) changed.push(path);
  const claim = join(project, '.isswf/local/operation');
  return { status: current ? current.pin.runtimeId === target.runtimeId ? 'current' : 'update-available' : 'not-initialized', current: current?.pin || null, available: pinFor(target), expected: current ? hash(current.bytes) : null, changed, migrationRequired: Boolean(current && current.pin.runtimeId !== target.runtimeId), operation: await exists(claim) ? await json(join(claim, 'owner.json')) : null, blockers: await activity(project, store), writes: false, limits: 'Only registered CLI activity is inspected. Reconcile external/native host writers separately; saved statuses are not liveness evidence.' };
}
async function migrate(project, store, opts) {
  const current = await readPin(project); if (!current) fail('Initialize the project first');
  const target = release(ownRoot);
  await retained(store, current.pin);
  if (target.runtimeId === current.pin.runtimeId) {
    if (await exists(join(project, '.isswf/local/operation'))) fail('Interrupted operation requires inspect and recovery');
    return { status: 'unchanged', pin: current.pin };
  }
  if (opts.expected !== hash(current.bytes)) fail('--expected must match the install.json digest from inspect');
  if (!opts['quiescent-ref']?.trim()) fail('Explicit --quiescent-ref for reconciled external host writers required');
  if (!idPattern.test(opts.id || '')) fail('--id must be a safe transaction identifier');
  await clean(project, [pinPath]);
  await retain(store, ownRoot);
  const files = [{ path: pinPath, before: current.bytes.toString('base64'), after: jsonBytes({ ...pinFor(target, current.pin), generation: opts.id }).toString('base64') }];
  return transaction(project, store, opts.id, 'migrate', files, opts['quiescent-ref']);
}
async function rollback(project, store, opts) {
  const path = transactionPath(project, opts.id);
  await safeParents(project, join(path, 'record.json'));
  await directory(path);
  const record = await json(join(path, 'record.json'));
  if (record.kind !== 'migrate' || !await exists(join(path, 'complete.json'))) fail('Rollback requires a completed migration');
  if (!opts['quiescent-ref']?.trim()) fail('Explicit --quiescent-ref for external host writers required');
  const files = record.files.map(file => ({ ...file, before: file.after, after: file.before }));
  if (!await matches(project, files, 'before')) {
    if (await exists(join(transactionPath(project, 'rollback-' + opts.id), 'complete.json')) && await matches(project, files, 'after')) return { status: 'unchanged', id: opts.id };
    fail('Current bytes differ from migration result; rollback would overwrite later changes');
  }
  const old = JSON.parse(Buffer.from(files.find(file => file.path === pinPath).after, 'base64'));
  await retained(store, old);
  await clean(project, record.files.map(file => file.path));
  return transaction(project, store, 'rollback-' + opts.id, 'rollback', files, opts['quiescent-ref']);
}
async function recover(project, store, opts) {
  const path = transactionPath(project, opts.id);
  await safeParents(project, join(path, 'record.json'));
  const claim = join(project, '.isswf/local/operation');
  await directory(claim);
  const owner = await json(join(claim, 'owner.json'));
  const hasRecord = await exists(join(path, 'record.json'));
  const record = hasRecord ? await json(join(path, 'record.json')) : owner.transaction;
  if (owner.transaction && JSON.stringify(owner.transaction) !== JSON.stringify(record)) fail('Claim and migration journal disagree');
  if (record?.format !== 1 || record.id !== opts.id || !Array.isArray(record.files) || !record.files.length || record.files.some(file => !managedPaths.has(file.path) || ![file.before, file.after].every(value => value === null || typeof value === 'string'))) fail('Invalid recovery record');
  if (owner.id !== opts.id || !await ceased(owner.owner) || !await ceased(record.owner)) fail('Migration owner is live or uncertain; recovery refused');
  await idle(project, store);
  if (!hasRecord) {
    if (!await matches(project, record.files, 'before')) fail('Bootstrap claim has unexpected project drift');
    await safeParents(project, join(path, 'record.json'), true);
    await writeExclusive(join(path, 'record.json'), jsonBytes(record));
  }
  if (await exists(join(path, 'complete.json'))) {
    if (!await matches(project, record.files, 'after')) fail('Completed migration has operator drift');
  } else {
    for (const file of record.files) if (!await matches(project, [file], 'before') && !await matches(project, [file], 'after')) fail('Operator drift blocks recovery');
    await applyFiles(project, record.files, 'before');
    if (!await exists(join(path, 'recovered.json'))) await writeExclusive(join(path, 'recovered.json'), jsonBytes({ format: 1, id: opts.id, state: 'restored-before' }));
  }
  await retireClaim(claim);
  return { status: 'recovered', id: opts.id };
}
async function execute(project, store, _opts, args) {
  const current = await readPin(project); if (!current) fail('Initialize the project first');
  const runtime = await retained(store, current.pin), tool = args[0], forwarded = args.slice(1);
  if (!executableTools.includes(tool)) fail('Unknown tool; supported tools: ' + executableTools.join(', '));
  if (forwarded.includes('--project') || forwarded.includes('--repo')) fail('Project is supplied by the launcher, not tool arguments');
  const id = randomUUID(), unlock = await lock(project, 'exec-' + id);
  const local = join(project, '.isswf/local'), lease = join(local, 'leases', id + '.json');
  let workerRecord;
  try {
    const lockedPin = await readPin(project);
    if (!lockedPin || !lockedPin.bytes.equals(current.bytes)) fail('Project pin changed before execution registration; inspect and retry');
    await safeParents(project, lease, true);
    await writeExclusive(lease, jsonBytes({ format: 1, owner: await identity(), tool, runtimeId: current.pin.runtimeId }));
    if (tool === 'isswf-job' && forwarded[0] === 'run') {
      const values = Object.fromEntries(forwarded.slice(1).reduce((pairs, value, index, list) => index % 2 ? pairs : [...pairs, [value, list[index + 1]]], []));
      if (!isAbsolute(values['--runs-store'] || '') || !idPattern.test(values['--attempt-id'] || '')) fail('Worker requires explicit absolute runs store and safe attempt ID');
      const runs = resolve(values['--runs-store']);
      if (inside(project, runs) || inside(runs, project)) fail('Worker runs store must be external');
      workerRecord = join(local, 'workers', hash(runs + '\0' + values['--attempt-id']) + '.json');
      await safeParents(project, workerRecord, true);
      if (!await exists(workerRecord)) await writeExclusive(workerRecord, jsonBytes({ format: 1, project, store: runs, attemptId: values['--attempt-id'], pin: current.pin }));
    }
    await unlock();
  } catch (error) {
    if (await exists(lease)) await unlink(lease);
    await unlock(); throw error;
  }
  const withoutProject = tool === 'isswf-job' && forwarded[0] !== 'run';
  const invocation = releaseInvocation(runtime, tool, [...forwarded, ...(withoutProject ? [] : ['--project', project])]);
  const result = await new Promise((done, reject) => {
    const child = spawn(invocation.command, invocation.args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => done({ code, signal }));
  });
  if (workerRecord && result.signal === null) {
    const record = await json(workerRecord);
    if (!await exists(join(record.store, record.attemptId + '.job.json')) && !await exists(join(record.store, record.attemptId))) await unlink(workerRecord);
  }
  if (result.signal === null) await unlink(lease);
  process.exitCode = result.code ?? 1;
  return null;
}
function parse(argv) {
  const [command, ...rest] = argv, split = rest.indexOf('--'), parts = split < 0 ? rest : rest.slice(0, split), args = split < 0 ? [] : rest.slice(split + 1), opts = {};
  const commands = { 'migrate-state': ['project', 'store', 'id', 'expected', 'quiescent-ref'], 'recover-state': ['project', 'store', 'id'], locate: ['project', 'store'], init: ['project', 'store', 'tracking', 'repository', 'id'], inspect: ['project', 'store'], migrate: ['project', 'store', 'id', 'expected', 'quiescent-ref'], rollback: ['project', 'store', 'id', 'quiescent-ref'], recover: ['project', 'store', 'id'], exec: ['project', 'store'] };
  if (!Object.hasOwn(commands, command)) fail('Usage: isswf init|inspect|locate|migrate|rollback|recover|migrate-state|recover-state|exec --project ABS [--store ABS] [options]. exec uses -- TOOL [arguments].');
  for (let index = 0; index < parts.length; index += 2) {
    const key = parts[index].slice(2), value = parts[index + 1];
    if (!parts[index].startsWith('--') || !commands[command].includes(key) || !value || value.startsWith('--') || Object.hasOwn(opts, key)) fail('Unknown, missing or repeated option: ' + parts[index]);
    opts[key] = value;
  }
  if (args.length && command !== 'exec') fail('Unexpected trailing arguments');
  return { command, opts, args };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { command, opts, args } = parse(process.argv.slice(2));
    const project = await projectRoot(opts.project), store = await storeRoot(opts.store, project);
    if (await exists(join(project, '.isswf-transition')) && !['inspect', 'recover-state'].includes(command)) fail('Interrupted state transition requires inspect and recover-state');
    const handlers = { 'migrate-state': async () => moveState({ project, store, id: opts.id, expected: opts.expected, reference: opts['quiescent-ref'], owner: await identity() }), 'recover-state': async () => recoverState({ project, store, id: opts.id, ceased }), locate: async () => { const current = await readPin(project); if (!current) fail('Initialize the project first'); return { pin: current.pin, runtimeRoot: await retained(store, current.pin) }; }, init: initialize, inspect, migrate, rollback, recover, exec: execute };
    const result = await handlers[command](project, store, opts, args);
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
