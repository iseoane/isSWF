import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectStateMigration, moveState, recoverState } from '../tools/state-migration.mjs';
import { identity } from '../tools/platform-runtime.mjs';

if (process.platform !== 'win32') console.log('SKIP native Windows state-directory publication: not Windows');
else {
  const root = await mkdtemp(join(tmpdir(), 'isswf Windows state ñ ')), project = join(root, 'project'), store = join(root, 'store');
  await mkdir(join(project, '.factory'), { recursive: true });
  const bytes = Buffer.from('# Historical bytes\r\nOriginal .factory/path remains literal\r\n');
  await writeFile(join(project, '.factory/record.md'), bytes);
  const git = (...args) => { const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 10000 }); assert.ifError(r.error); assert.equal(r.status, 0, r.stderr); };
  git('init', '-q'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Checkpoint unchanged state');
  const preview = await inspectStateMigration(project), owner = await identity();
  const args = { project, store, id: 'S0001', expected: preview.expected, reference: 'explicit-disposable-fixture-no-other-writers', owner };
  await assert.rejects(moveState({ ...args, expected: '0'.repeat(64) }), /--expected/u);
  assert(!(await readdir(project)).includes('.isswf-transition'));
  const moved = await moveState(args); assert.equal(moved.status, 'state-migrated');
  assert.deepEqual(await readFile(join(project, '.isswf/record.md')), bytes);
  assert(!(await readdir(project)).includes('.factory')); assert(!(await readdir(project)).includes('.isswf-transition'));
  assert.equal((await moveState(args)).status, 'unchanged');
  // Inject only an interrupted claim after a completed move; no second process or live writer.
  const record = JSON.parse(await readFile(join(moved.journal, 'record.json'), 'utf8'));
  await mkdir(join(project, '.isswf-transition'));
  await writeFile(join(project, '.isswf-transition/owner.json'), JSON.stringify({ format: 1, id: args.id, recordPath: moved.journal, owner, record }));
  await assert.rejects(recoverState({ project, store, id: args.id, ceased: async () => false }), /live or uncertain/u);
  await writeFile(join(project, '.isswf/record.md'), 'operator-drift');
  await assert.rejects(recoverState({ project, store, id: args.id, ceased: async () => true }), /State drift/u);
  await writeFile(join(project, '.isswf/record.md'), bytes);
  const recovered = await recoverState({ project, store, id: args.id, ceased: async () => true });
  assert.equal(recovered.status, 'state-recovered'); assert.equal(recovered.activeDirectory, '.isswf');
  assert.deepEqual(await readFile(join(project, '.isswf/record.md')), bytes);
  assert(!(await readdir(project)).includes('.isswf-transition'));
  console.log(JSON.stringify({ status: 'PASS', root, checks: ['native move publication and unchanged repeat', 'exact CRLF bytes and original literal paths', 'single active state root', 'expected inventory guard', 'injected recovery refuses live/unknown and drift, preserves exact bytes'], limits: 'Real native file/directory operations; injected cessation predicate for recovery, not a real killed-owner proof. No provider, source-project migration or installation change.' }));
}
