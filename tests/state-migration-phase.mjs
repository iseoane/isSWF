import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// In-process journey: moveState is stopped at one phase boundary by a test-only fs fault, then recoverState resolves the retained claim.
// The fault replaces fs.promises members before the module under test is imported, so production code carries no hook.
const source = resolve(process.argv[2] || process.cwd());
const { promises } = fs, real = { rename: promises.rename, open: promises.open, rm: promises.rm };
const slash = path => String(path).replaceAll('\\', '/');
let trap = null;
class Interrupted extends Error {}
function fire(op, path) { if (trap?.op === op && trap.match(slash(path))) { trap = null; throw new Interrupted('interrupted'); } }
promises.rename = async (from, ...rest) => { fire('rename', from); return real.rename(from, ...rest); };
promises.open = async (path, ...rest) => { fire('open', path); return real.open(path, ...rest); };
promises.rm = async (path, ...rest) => { fire('rm', path); return real.rm(path, ...rest); };
syncBuiltinESMExports();
const { inspectStateMigration, moveState, recoverState } = await import(pathToFileURL(join(source, 'tools/state-migration.mjs')).href);

const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-state-phase-')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ceased = async () => true;
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
let counter = 0;
async function fixture() {
  const project = join(root, 'project ' + ++counter + ' ñ'), store = join(root, 'store ' + counter);
  await mkdir(join(project, '.factory/initiatives/I0001'), { recursive: true });
  await writeFile(join(project, '.factory/initiatives/I0001/brief-r1.md'), 'Historical payload stays byte-identical\n');
  initRepository(project);
  for (const args of [['add', '-f', '.factory'], ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture']]) {
    const result = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
  }
  const id = 'S0001', expected = (await inspectStateMigration(project)).expected;
  return { project, store, id, expected, journal: join(store, 'state-migrations', hash(project), id), claim: join(project, '.isswf-transition') };
}
const migrate = ctx => moveState({ project: ctx.project, store: ctx.store, id: ctx.id, expected: ctx.expected, reference: 'Fixture has no external writers', owner: { fixture: true } });
// Stops moveState before the matching fs call; the claim, journal and directories stay exactly as an abrupt end leaves them.
async function interruptAt(op, match) {
  const ctx = await fixture();
  trap = { op, match };
  await assert.rejects(migrate(ctx), Interrupted);
  assert.equal(trap, null, 'The fault fired');
  return ctx;
}
const stopAt = {
  staged: () => interruptAt('rename', path => path.endsWith('/.factory')),
  swapped: () => interruptAt('open', path => path.includes('/complete.json.pending-')),
  retired: () => interruptAt('rm', path => path.includes('/.isswf-transition-retired-')),
};
const phase = async ctx => (await readJSON(join(ctx.journal, 'phase.json'))).phase;
const recover = (ctx, alive = ceased) => recoverState({ project: ctx.project, store: ctx.store, id: ctx.id, ceased: alive });
const entries = async ctx => (await readdir(ctx.project)).sort();
const retiredDirs = async ctx => (await entries(ctx)).filter(name => name.startsWith('.isswf-transition-retired-'));
async function evidence(ctx) {
  const out = [];
  async function walk(path, label) {
    let list; try { list = await readdir(path, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of list) { const full = join(path, entry.name); out.push(label + '/' + entry.name); if (entry.isDirectory()) await walk(full, label + '/' + entry.name); else out.push(hash(await readFile(full))); }
  }
  await walk(ctx.journal, 'journal'); await walk(ctx.project, 'project');
  return out.join('\n');
}

let passed = false;
try {
  // Each boundary records the phase it reached; completed phases never run backwards.
  const staged = await stopAt.staged();
  assert.deepEqual(await readJSON(join(staged.journal, 'phase.json')), { format: 1, id: staged.id, phase: 'staged' }, 'record published, before the rename');
  const swapped = await stopAt.swapped();
  assert.equal(await phase(swapped), 'swapped', 'renamed and verified, before complete.json');
  const retired = await stopAt.retired();
  assert.equal(await phase(retired), 'retired', 'claim moved aside, before its removal');
  assert.equal((await retiredDirs(retired)).length, 1);
  const finished = await migrate(await fixture());
  assert.equal(finished.status, 'state-migrated');
  assert.equal(await readJSON(join(finished.journal, 'phase.json')).then(value => value.phase), 'done');

  // Recovery from each phase.
  assert.deepEqual(await recover(staged), { status: 'state-recovered', id: staged.id, activeDirectory: '.factory' });
  assert.equal(await phase(staged), 'staged', 'An unmoved directory never reaches swapped');
  assert.deepEqual(await readJSON(join(staged.journal, 'recovered.json')), { format: 1, id: staged.id, state: 'unchanged-before' });
  assert.deepEqual(await recover(swapped), { status: 'state-recovered', id: swapped.id, activeDirectory: '.isswf' });
  assert.equal(await phase(swapped), 'done');
  assert.deepEqual(await readJSON(join(swapped.journal, 'complete.json')), { format: 1, id: swapped.id, state: 'moved' });
  assert.equal(fs.existsSync(swapped.claim), false);
  assert.deepEqual(await recover(retired), { status: 'state-recovered', id: retired.id, activeDirectory: '.isswf' }, 'The retired phase finishes without the claim');
  assert.equal(await phase(retired), 'done');
  assert.deepEqual(await retiredDirs(retired), [], 'Recovery removes the leftover retired claim');
  assert.deepEqual(await entries(retired), ['.git', '.isswf']);
  assert.equal((await readJSON(join(retired.journal, 'recovered.json'))).state, 'moved');

  // A finished migration has nothing to recover and nothing changes.
  const done = await fixture(); await migrate(done);
  const settled = await evidence(done);
  await assert.rejects(recover(done), { code: 'ENOENT' });
  assert.equal(await evidence(done), settled);

  // The rename landing before the staged phase advanced is read from the one directory that exists.
  const window = await stopAt.staged();
  await rename(join(window.project, '.factory'), join(window.project, '.isswf'));
  assert.deepEqual(await recover(window), { status: 'state-recovered', id: window.id, activeDirectory: '.isswf' });
  assert.equal(await phase(window), 'done');

  // A phase the directories contradict blocks recovery and keeps every byte.
  const contradiction = await stopAt.staged();
  await writeFile(join(contradiction.journal, 'phase.json'), JSON.stringify({ format: 1, id: contradiction.id, phase: 'swapped' }));
  const before = await evidence(contradiction);
  await assert.rejects(recover(contradiction), /phase/iu);
  assert.equal(await evidence(contradiction), before);
  const unknown = await stopAt.staged();
  await writeFile(join(unknown.journal, 'phase.json'), JSON.stringify({ format: 1, id: unknown.id, phase: 'vanished' }));
  await assert.rejects(recover(unknown), /phase/iu);

  // Finishing a retired claim refuses, keeping every byte, while the owner may be alive or a second root exists.
  const alive = await stopAt.retired(), aliveBefore = await evidence(alive);
  await assert.rejects(recover(alive, async () => false), /live or uncertain/u);
  assert.equal(await evidence(alive), aliveBefore);
  const twoRoots = await stopAt.retired();
  await mkdir(join(twoRoots.project, '.factory'));
  const twoBefore = await evidence(twoRoots);
  await assert.rejects(recover(twoRoots), /State drift/u);
  assert.equal(await evidence(twoRoots), twoBefore);
  assert.equal(await phase(twoRoots), 'retired');

  // A migration interrupted before journals carried a phase still recovers by its directories.
  const oldStaged = await stopAt.staged(); await rm(join(oldStaged.journal, 'phase.json'));
  assert.deepEqual(await recover(oldStaged), { status: 'state-recovered', id: oldStaged.id, activeDirectory: '.factory' });
  const oldSwapped = await stopAt.swapped(); await rm(join(oldSwapped.journal, 'phase.json'));
  assert.deepEqual(await recover(oldSwapped), { status: 'state-recovered', id: oldSwapped.id, activeDirectory: '.isswf' });
  assert.equal(await phase(oldSwapped), 'done', 'Recovery adds the phase an old journal lacks');
  const oldRetired = await stopAt.retired(); await rm(join(oldRetired.journal, 'phase.json'));
  const oldBefore = await evidence(oldRetired);
  await assert.rejects(recover(oldRetired), { code: 'ENOENT' }, 'A leftover retired claim without a phase keeps its documented refusal');
  assert.equal(await evidence(oldRetired), oldBefore);

  passed = true;
  console.log(`PASS ${process.platform} state-migration phases: staged, swapped, retired and done journaled; recovery from each phase, rename-before-phase window, contradicting phase refusal, journals without a phase`);
} finally {
  if (passed) await real.rm(root, { recursive: true, force: true });
  else console.error(`Retained phase fixture: ${root}`);
}
