import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const privateBase = 'tooling/.local/audit-archive';
const encode = value => JSON.stringify(value) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const contentRows = rows => rows.map(({ device: _device, inode: _inode, ...value }) => value);
function git(root, args) {
  const result = spawnSync('git', ['-C', root, '-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8', timeout: 20000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(result.status, 0, result.stderr || 'Git operation failed');
  return result.stdout.trim();
}
async function repository(root) {
  root = await fs.realpath(root);
  assert.equal(git(root, ['rev-parse', '--show-toplevel']), root, 'explicit Git root required');
  return root;
}
async function manifest(directory, withHashes) {
  const rows = []; let bytes = 0;
  async function visit(path, name) {
    const stat = await fs.lstat(path);
    assert(rows.length < 100000, 'archive entry limit exceeded');
    const row = { path: name, mode: stat.mode & 0o7777, device: stat.dev, inode: stat.ino };
    if (stat.isSymbolicLink()) { row.kind = 'symlink'; row.target = await fs.readlink(path); }
    else if (stat.isDirectory()) row.kind = 'directory';
    else {
      assert(stat.isFile(), 'special files require separate inspection'); row.kind = 'file'; row.bytes = stat.size; bytes += stat.size;
      assert(bytes <= 512 * 1024 ** 2, 'archive byte limit exceeded');
      if (withHashes) {
        const digest = createHash('sha256');
        for await (const chunk of createReadStream(path)) digest.update(chunk);
        row.sha256 = digest.digest('hex');
      }
    }
    rows.push(row);
    if (row.kind === 'directory') {
      const names = (await fs.readdir(path)).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
      for (const child of names) await visit(join(path, child), name ? name + '/' + child : child);
    }
  }
  await visit(directory, '');
  return { rows, bytes, files: rows.filter(row => row.kind !== 'directory').length };
}
async function privateDirectory(root) {
  let current = root;
  for (const part of privateBase.split('/')) {
    current = join(current, part);
    try { await fs.mkdir(current, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const stat = await fs.lstat(current);
    assert(stat.isDirectory() && !stat.isSymbolicLink() && await fs.realpath(current) === current, 'archive parents must be real directories');
  }
  return current;
}
async function documentPlan(root, head, tracked) {
  const remote = git(root, ['remote', 'get-url', 'origin']);
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/u.exec(remote);
  assert(match, 'explicit GitHub source remote required for historical links');
  const repositoryURL = 'https://github.com/' + match[1], changes = [];
  let publicLinks = 0, privateLinks = 0, markedGuides = 0;
  const paths = git(root, ['ls-files', '-z', '--', 'README.md', 'docs']).split('\0').filter(path => path.endsWith('.md'));
  for (const path of paths) {
    const file = join(root, path), stat = await fs.lstat(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 512000, 'documentation must be bounded regular files');
    const before = await fs.readFile(file, 'utf8');
    let after = before.replace(/\]\(([^)\s]*\.audit\/[^)\s]+)\)/gu, (original, target) => {
      if (/^[a-z]+:/iu.test(target)) return original;
      const artifact = relative(root, resolve(dirname(file), target));
      if (!artifact.startsWith('.audit/') || ['.audit/README.md', '.audit/archive.json'].includes(artifact)) return original;
      if (tracked.has(artifact)) { publicLinks++; return '](' + repositoryURL + '/blob/' + head + '/' + artifact.split('/').map(encodeURIComponent).join('/') + ')'; }
      privateLinks++;
      return '](' + repositoryURL + '/blob/main/.audit/README.md#local-only-artifacts)';
    });
    if (/(?:node|python3?|bash)\s+\.audit\//u.test(before)) {
      const newline = after.indexOf('\n');
      assert(newline >= 0, 'document heading required');
      const notice = '\n\n> Historical verification: `.audit` commands below belong to the archived development source at `' + head + '`, not the installed product. Use the pinned source/inputs and separate authority required by that case. Restoring files does not renew consumed model or worker grants.';
      after = after.slice(0, newline) + notice + after.slice(newline); markedGuides++;
    }
    if (after !== before) changes.push({ path, before, after, mode: stat.mode & 0o7777 });
  }
  return { changes, summary: { publicLinks, privateLinks, markedGuides, changedDocs: changes.map(change => change.path) } };
}
async function syncedJSON(path, value) {
  const file = await fs.open(path, 'wx', 0o600);
  try { await file.writeFile(encode(value)); await file.sync(); } finally { await file.close(); }
}
async function syncDirectory(path) { const file = await fs.open(path, 'r'); try { await file.sync(); } finally { await file.close(); } }
async function archivePointer(audit) {
  const file = join(audit, 'archive.json'), stat = await fs.lstat(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= 8192, 'invalid archive pointer');
  const pointer = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(pointer.version, 1); assert.equal(pointer.kind, 'historical-development-archive');
  assert(/^[0-9a-f]{40}$/u.test(pointer.checkpoint) && typeof pointer.archivePath === 'string' && pointer.archivePath.startsWith(privateBase + '/'), 'invalid archive metadata');
  return pointer;
}

export async function verifyAuditArchive(root, archivePath, { manifestSha256, allowUnanchoredRecovery = false } = {}) {
  root = await repository(root);
  assert(typeof archivePath === 'string' && archivePath.startsWith(privateBase + '/') && archivePath.split('/').every(part => part && part !== '.' && part !== '..') && !archivePath.includes('\\'), 'private archive path required');
  const directory = join(root, archivePath);
  assert.equal(await fs.realpath(directory), directory, 'archive symlink refused');
  const file = join(directory, 'manifest.json'), stat = await fs.lstat(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= 32 * 1024 ** 2, 'bounded archive manifest required');
  const manifestBytes = await fs.readFile(file), actualManifestSha256 = hash(manifestBytes);
  assert(/^[0-9a-f]{64}$/u.test(manifestSha256 ?? '') || (manifestSha256 === undefined && allowUnanchoredRecovery === true), 'recorded manifest digest required; explicit unanchored recovery is inspection only');
  if (manifestSha256 !== undefined) assert.equal(actualManifestSha256, manifestSha256, 'archive manifest changed');
  const original = JSON.parse(manifestBytes);
  assert.equal(original.version, 1); assert.equal(original.originalPath, '.audit');
  const actual = await manifest(join(directory, 'payload'), true);
  assert.equal(hash(encode(contentRows(actual.rows))), original.contentSha256, 'archive bytes/types/modes changed');
  assert.equal(actual.bytes, original.bytes); assert.equal(actual.files, original.files);
  return { status: manifestSha256 === undefined ? 'verified-unanchored-recovery' : 'verified', archivePath, files: actual.files, bytes: actual.bytes, contentSha256: original.contentSha256, manifestSha256: actualManifestSha256 }; 
}

export async function archiveAudit(root, { apply = false, expectedHead } = {}) {
  root = await repository(root);
  const audit = join(root, '.audit'), head = git(root, ['rev-parse', 'HEAD']);
  const stat = await fs.lstat(audit);
  assert(stat.isDirectory() && !stat.isSymbolicLink(), 'audit must be a real directory');
  const names = await fs.readdir(audit);
  if (names.includes('archive.json')) {
    assert.deepEqual(names.sort(), ['README.md', 'archive.json'], 'new audit files require separate reconciliation');
    const pointer = await archivePointer(audit);
    return { status: 'already-organized', checkpoint: pointer.checkpoint, changed: false };
  }
  if (!apply) { const preview = await manifest(audit, false); return { status: 'preview', checkpoint: head, files: preview.files, bytes: preview.bytes, changed: false }; }
  assert(/^[0-9a-f]{40}$/u.test(expectedHead ?? '') && expectedHead === head, 'exact expected HEAD required');
  assert.equal(git(root, ['status', '--porcelain', '--untracked-files=no']), '', 'commit tracked changes before archiving');
  const ignored = spawnSync('git', ['-C', root, 'check-ignore', '--no-index', privateBase + '/private-probe'], { encoding: 'utf8' });
  assert.equal(ignored.status, 0, 'private archive must be Git-ignored before apply');
  const parent = await privateDirectory(root);
  assert.equal((await fs.stat(parent)).dev, stat.dev, 'same-filesystem archive required');
  const lock = join(parent, '.operation-lock');
  await fs.mkdir(lock, { mode: 0o700 }); await syncDirectory(parent);
  let directory, moved = false;
  try {
    const before = await manifest(audit, true);
    directory = await fs.mkdtemp(join(parent, 'audit-' + head.slice(0, 12) + '-'));
    const archivePath = relative(root, directory), treeEntry = git(root, ['ls-tree', '-d', head, '--', '.audit']);
    const gitTree = treeEntry ? treeEntry.split(/\s+/u)[2] : null;
    const trackedPaths = new Set(git(root, ['ls-files', '-z', '--', '.audit']).split('\0').filter(Boolean));
    const documents = await documentPlan(root, head, trackedPaths);
    await syncedJSON(join(directory, 'documents.json'), documents);
    const tracked = trackedPaths.size;
    const contentSha256 = hash(encode(contentRows(before.rows)));
    const manifestRecord = { version: 1, originalPath: '.audit', checkpoint: head, gitTree, files: before.files, bytes: before.bytes, contentSha256, rows: before.rows };
    assert(Buffer.byteLength(encode(manifestRecord)) <= 32 * 1024 ** 2, 'serialized manifest exceeds verification limit before move');
    await syncedJSON(join(directory, 'manifest.json'), manifestRecord);
    const recordedManifestSha256 = hash(await fs.readFile(join(directory, 'manifest.json')));
    await syncDirectory(directory); await syncDirectory(parent);
    assert.equal(git(root, ['rev-parse', 'HEAD']), head, 'HEAD changed during preparation');
    assert.equal(git(root, ['status', '--porcelain', '--untracked-files=no']), '', 'tracked source changed during preparation');
    await fs.rename(audit, join(directory, 'payload')); moved = true;
    await syncDirectory(root); await syncDirectory(directory);
    const after = await manifest(join(directory, 'payload'), true);
    assert.deepEqual(after.rows, before.rows, 'archive identity/bytes/types/modes changed during rename');
    const verified = await verifyAuditArchive(root, archivePath, { manifestSha256: recordedManifestSha256 });
    const pointer = { version: 1, kind: 'historical-development-archive', checkpoint: head, gitTree, trackedFiles: tracked, localFiles: before.files - tracked, ...verified, documentation: documents.summary, procedureSha256: hash(await fs.readFile(fileURLToPath(import.meta.url))), limitation: 'Preservation and lookup metadata only; no deletion, publication of payloads, script replay or execution authority.' };
    await fs.mkdir(audit);
    await fs.writeFile(join(audit, 'README.md'), '# Historical development audit\n\nThis directory contains archive metadata only. It is not the factory runtime.\n\nHistorical `.factory` job reports remain unchanged, including their original references and verdicts. Resolve their `.audit` references at the checkpoint below, not against this metadata-only working directory. Active README/docs links are updated separately.\n\nTracked historical artifacts remain in Git at `' + head + '` (audit tree `' + gitTree + '`). View a file with `git show ' + head + ':.audit/<path>`. For reproduction, use the full source and exact inputs required by that historical case, not an isolated script copy. Restoring files does not renew consumed model/worker grants.\n\n## Local-only artifacts\n\nHistorical links redirected here refer to local-only evidence, not published files. Consult the guide at the recorded Git checkpoint for its original reference, then look under the private payload. No private filename census is published.\n\nThe full local payload and checksum manifest are private under `' + archivePath + '`. They are Git-ignored and must not be installed or published. On another checkout, that private local archive may be absent; Git still preserves the tracked artifacts. Git does not back up the local-only portion: keep the private archive in your own backup before retiring this checkout. No payload was deleted or Git history rewritten.\n\nNew durable job receipts belong under `.factory/initiatives/<id>/jobs/<job>/`; development fixtures and raw temporary logs do not belong in the installed product. Do not add new scripts or raw logs here.\n', { flag: 'wx', mode: 0o644 });
    for (const change of documents.changes) {
      assert.equal(await fs.readFile(join(root, change.path), 'utf8'), change.before, 'documentation changed during archive operation');
      const file = await fs.open(join(root, change.path), 'w');
      try { await file.writeFile(change.after); await file.sync(); } finally { await file.close(); }
      assert.equal((await fs.lstat(join(root, change.path))).mode & 0o7777, change.mode);
    }
    await syncedJSON(join(directory, 'receipt.json'), pointer);
    await syncedJSON(join(audit, 'archive.json'), pointer);
    await syncDirectory(audit); await syncDirectory(root); await syncDirectory(directory);
    await fs.rmdir(lock); await syncDirectory(parent);
    return pointer;
  } catch (error) {
    if (directory) await syncedJSON(join(directory, 'incomplete.json'), { status: 'inspection-required', moved, message: String(error.message) });
    throw new Error('Archive did not complete; inspect preserved data under ' + privateBase + ' and the retained operation lock. No automatic retry or rollback.', { cause: error });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'), args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--verify') {
      const pointer = await archivePointer(join(root, '.audit'));
      console.log(JSON.stringify(await verifyAuditArchive(root, pointer.archivePath, { manifestSha256: pointer.manifestSha256 }), null, 2));
    } else {
      assert(args.length === 0 || (args.length === 3 && args[0] === '--apply' && args[1] === '--expected-head'), 'use no arguments, --verify, or --apply --expected-head FULL_SHA');
      console.log(JSON.stringify(await archiveAudit(root, { apply: args.length > 0, expectedHead: args[2] }), null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
