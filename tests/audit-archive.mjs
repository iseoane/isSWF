import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveAudit, verifyAuditArchive } from '../tooling/maintenance/archive-audit.mjs';

const roots = [];
async function fixture({ ignore = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'isswf-audit-archive-')); roots.push(root);
  const git = (...args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  git('init', '-q'); git('remote', 'add', 'origin', 'https://github.com/fixture/repo.git'); await fs.mkdir(join(root, '.audit'));
  await fs.mkdir(join(root, 'docs'));
  await fs.writeFile(join(root, 'docs/history.md'), '# History\n\n[Tracked](../.audit/tracked.json) [Private](../.audit/private/local.bin) [Other](../source.txt)\n\n```sh\nnode .audit/old.mjs\n```\n');
  await fs.writeFile(join(root, 'source.txt'), 'do not change\n');
  await fs.writeFile(join(root, '.gitignore'), ignore ? '/tooling/.local/\n.audit/*.log\n' : '.audit/*.log\n');
  await fs.writeFile(join(root, '.audit/tracked.json'), '{"retained":true}\n');
  git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', 'commit', '-qm', 'Historical source');
  const head = git('rev-parse', 'HEAD');
  await fs.mkdir(join(root, '.audit/private'), { mode: 0o700 });
  await fs.writeFile(join(root, '.audit/private/local.bin'), Buffer.from([0, 255, 7, 10]), { mode: 0o600 });
  await fs.writeFile(join(root, '.audit/ignored.log'), 'private log\n');
  return { root, head, git };
}
try {
  const f = await fixture(), sourceBytes = await fs.readFile(join(f.root, 'source.txt'));
  await fs.symlink(join(f.root, 'missing-outside-target'), join(f.root, '.audit/link'));
  const before = await fs.lstat(join(f.root, '.audit/private/local.bin'));
  const preview = await archiveAudit(f.root);
  assert.equal(preview.status, 'preview'); assert.equal(preview.files, 4);
  await assert.rejects(fs.stat(join(f.root, 'tooling')), { code: 'ENOENT' });
  await assert.rejects(archiveAudit(f.root, { apply: true, expectedHead: '0'.repeat(40) }), /expected HEAD/u);
  const result = await archiveAudit(f.root, { apply: true, expectedHead: f.head });
  assert.equal(result.status, 'verified'); assert.equal(result.trackedFiles, 1); assert.equal(result.localFiles, 3);
  assert.equal(result.checkpoint, f.head); assert.equal(result.gitTree, f.git('rev-parse', f.head + ':.audit'));
  assert.deepEqual((await fs.readdir(join(f.root, '.audit'))).sort(), ['README.md', 'archive.json']);
  const payload = join(f.root, result.archivePath, 'payload');
  assert.deepEqual(await fs.readFile(join(payload, 'private/local.bin')), Buffer.from([0, 255, 7, 10]));
  const after = await fs.lstat(join(payload, 'private/local.bin'));
  assert.equal(after.ino, before.ino); assert.equal(after.mode, before.mode);
  assert.equal(await fs.readlink(join(payload, 'link')), join(f.root, 'missing-outside-target'));
  assert.deepEqual(await fs.readFile(join(f.root, 'source.txt')), sourceBytes);
  const guide = await fs.readFile(join(f.root, 'docs/history.md'), 'utf8');
  assert(guide.includes('https://github.com/fixture/repo/blob/' + f.head + '/.audit/tracked.json'));
  assert(guide.includes('README.md#local-only-artifacts "Original local artifact: .audit/private/local.bin"'));
  assert(guide.includes('[Other](../source.txt)'));
  assert(guide.includes('Restoring files does not renew consumed model or worker grants.'));
  assert.deepEqual(result.documentation, { publicLinks: 1, privateLinks: 1, markedGuides: 1, changedDocs: ['docs/history.md'] });
  assert.equal((await verifyAuditArchive(f.root, result.archivePath)).contentSha256, result.contentSha256);
  assert.equal((await archiveAudit(f.root, { apply: true, expectedHead: f.head })).status, 'already-organized');
  assert.equal((await fs.readdir(join(f.root, 'tooling/.local/audit-archive'))).length, 1);
  const binary = join(payload, 'private/local.bin'); await fs.writeFile(binary, 'tampered');
  await assert.rejects(verifyAuditArchive(f.root, result.archivePath), /changed/u);
  await fs.writeFile(binary, Buffer.from([0, 255, 7, 10]));
  await fs.chmod(binary, 0o644); await assert.rejects(verifyAuditArchive(f.root, result.archivePath), /changed/u);
  await fs.chmod(binary, 0o600); await verifyAuditArchive(f.root, result.archivePath);
  await fs.writeFile(join(f.root, '.audit/new.log'), 'new evidence');
  await assert.rejects(archiveAudit(f.root, { apply: true, expectedHead: f.head }), /separate reconciliation/u);

  const dirty = await fixture(); await fs.writeFile(join(dirty.root, 'source.txt'), 'uncommitted');
  await assert.rejects(archiveAudit(dirty.root, { apply: true, expectedHead: dirty.head }), /commit tracked/u);
  assert.equal(await fs.readFile(join(dirty.root, '.audit/ignored.log'), 'utf8'), 'private log\n');
  const exposed = await fixture({ ignore: false });
  await assert.rejects(archiveAudit(exposed.root, { apply: true, expectedHead: exposed.head }), /Git-ignored/u);
  await assert.rejects(fs.stat(join(exposed.root, 'tooling')), { code: 'ENOENT' });
  const escape = await fixture(), outside = await mkdtemp(join(tmpdir(), 'isswf-audit-outside-')); roots.push(outside);
  await fs.mkdir(join(escape.root, 'tooling')); await fs.symlink(outside, join(escape.root, 'tooling/.local'));
  await assert.rejects(archiveAudit(escape.root, { apply: true, expectedHead: escape.head }));
  assert.deepEqual(await fs.readdir(outside), []);
  assert.equal(await fs.readFile(join(escape.root, '.audit/ignored.log'), 'utf8'), 'private log\n');
  const held = await fixture(); await fs.mkdir(join(held.root, 'tooling/.local/audit-archive/.operation-lock'), { recursive: true });
  await assert.rejects(archiveAudit(held.root, { apply: true, expectedHead: held.head }), { code: 'EEXIST' });
  assert.equal(await fs.readFile(join(held.root, '.audit/ignored.log'), 'utf8'), 'private log\n');
  const interrupted = await fixture(), mkdir = fs.mkdir;
  fs.mkdir = async (path, ...args) => { if (path === join(interrupted.root, '.audit')) throw Error('synthetic interruption after verified move'); return mkdir(path, ...args); };
  try { await assert.rejects(archiveAudit(interrupted.root, { apply: true, expectedHead: interrupted.head }), /No automatic retry or rollback/u); }
  finally { fs.mkdir = mkdir; }
  const interruptedBase = join(interrupted.root, 'tooling/.local/audit-archive');
  const preserved = (await fs.readdir(interruptedBase)).find(name => name.startsWith('audit-'));
  assert(preserved); assert((await fs.stat(join(interruptedBase, '.operation-lock'))).isDirectory());
  const recoverable = await verifyAuditArchive(interrupted.root, 'tooling/.local/audit-archive/' + preserved);
  assert.equal(recoverable.files, 3);
  assert.equal(JSON.parse(await fs.readFile(join(interruptedBase, preserved, 'incomplete.json'))).status, 'inspection-required');
  await assert.rejects(archiveAudit(interrupted.root, { apply: true, expectedHead: interrupted.head }), { code: 'ENOENT' });
  console.log('PASS archive fixtures: tracked/local/ignored bytes, modes and dangling symlink preserved; preview/no-overwrite/replay, head/dirty/ignore/escape/tamper/lock guards and interrupted-move payload recovery; no real audit, providers or workers touched');
} finally { for (const root of roots) await fs.rm(root, { recursive: true, force: true }); }
