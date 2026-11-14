import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyRelease } from '../tools/release-source.mjs';

// Journey: a real `migrate-state` process is terminated at each moveState boundary, then the installed
// public `recover-state` resolves it. Launcher: the npm-installed genuine Node release (tools/isswf.mjs).
// The compiled Bun executable cannot take `node --import`, so this seam cannot run there (Bun gap).
const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const temp = await mkdtemp(join(tmpdir(), 'isswf-interrupt-'));
const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), resolve(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(path => path && isAbsolute(path) && existsSync(path));
assert.ok(npm, 'A Node.js installation with npm CLI is required');
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', npm_config_cache: join(temp, 'npm-cache') };
const plain = value => JSON.parse(JSON.stringify(value));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(done => setTimeout(done, ms));
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
function run(binary, args, expectedStatus = 0) {
  const result = spawnSync(binary, args, { cwd: temp, env, encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, expectedStatus, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result;
}
const git = (project, ...args) => run('git', ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args]);

// Test-only seam, loaded with `node --import` into the real migrate-state process: it stops the process
// before one chosen moveState step and never lets that step run. Production code has no hook.
const preload = join(temp, 'pause-at-boundary.mjs');
await writeFile(preload, `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const boundary = process.env.ISSWF_TEST_PAUSE_AT, ready = process.env.ISSWF_TEST_READY;
const slash = path => String(path).replaceAll('\\\\', '/');
let paused = false;
async function pause() {
  paused = true;
  fs.writeFileSync(ready + '.tmp', String(process.pid));
  fs.renameSync(ready + '.tmp', ready);
  await new Promise(done => setTimeout(done, 120000));
  process.exit(86);
}
const { promises } = fs, mkdir = promises.mkdir, rename = promises.rename, open = promises.open;
promises.mkdir = async function (path, ...rest) { if (!paused && boundary === 'claim' && slash(path).endsWith('/state-migrations')) await pause(); return mkdir.call(this, path, ...rest); };
promises.rename = async function (from, ...rest) { if (!paused && boundary === 'record' && slash(from).endsWith('/.factory')) await pause(); return rename.call(this, from, ...rest); };
promises.open = async function (path, ...rest) { if (!paused && boundary === 'renamed' && slash(path).includes('/complete.json.pending-')) await pause(); return open.call(this, path, ...rest); };
syncBuiltinESMExports();
`);

// What a moveState pause must look like on disk, and what recover-state must then report.
const boundaries = {
  claim: { label: 'claim published, no journal', legacy: true, journalDir: false, record: false, activeDirectory: '.factory', recovered: 'unchanged-before', journalFiles: ['record.json', 'recovered.json'] },
  record: { label: 'record published, before rename', legacy: true, journalDir: true, record: true, activeDirectory: '.factory', recovered: 'unchanged-before', journalFiles: ['record.json', 'recovered.json'] },
  renamed: { label: 'after rename, before complete.json', legacy: false, journalDir: true, record: true, activeDirectory: '.isswf', recovered: 'moved', journalFiles: ['complete.json', 'record.json', 'recovered.json'] },
};
const children = new Set(), receipts = [];
let installed, launcher, counter = 0;
const isswf = (args, expectedStatus = 0) => run(process.execPath, [launcher, ...args], expectedStatus);

async function fixture() {
  const name = 'interrupted ' + ++counter + ' ñ';
  const root = join(temp, name);
  await mkdir(join(root, '.factory/initiatives/I0007/jobs/J002'), { recursive: true });
  const project = await realpath(root), store = join(temp, name + ' store');
  const payloads = new Map([
    ['initiatives/I0007/jobs/J002/brief-r1.md', Buffer.from('Historical .factory reference remains unchanged: ñ\n')],
    ['models.json', Buffer.from('{"models":{"worker":"fixture-model"}}\n')],
    ['project-setup.md', Buffer.from('Pinned setup choice: fixture\n')],
    ['project-pin.json', Buffer.from('{"pin":"fixture-sha256:0123456789abcdef"}\n')],
  ]);
  for (const [path, bytes] of payloads) await writeFile(join(project, '.factory', path), bytes);
  if (process.platform !== 'win32') await chmod(join(project, '.factory/initiatives/I0007/jobs/J002/brief-r1.md'), 0o640);
  run('git', ['init', '-q', project]);
  git(project, 'add', '-f', '.factory');
  git(project, 'commit', '-qm', 'legacy state fixture');
  const args = ['--project', project, '--store', store];
  const expected = JSON.parse(isswf(['inspect', ...args]).stdout).stateMigration.expected;
  return { name, project, store, payloads, expected, id: 'S0001', args, journal: join(store, 'state-migrations', hash(project), 'S0001'), claim: join(project, '.isswf-transition') };
}

async function walk(root, label, out) {
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    const path = join(root, entry.name), name = label + '/' + entry.name;
    if (entry.isDirectory()) { out.set(name + '/', 'directory'); await walk(path, name, out); } else out.set(name, hash(await readFile(path)));
  }
}
// Every byte a refused recovery must keep: claim, journal, both candidate roots and the project root listing.
async function evidence(ctx) {
  const out = new Map();
  await walk(ctx.claim, 'claim', out); await walk(ctx.journal, 'journal', out);
  await walk(join(ctx.project, '.factory'), 'factory', out); await walk(join(ctx.project, '.isswf'), 'isswf', out);
  out.set('project-entries', (await readdir(ctx.project)).sort().join('|'));
  return out;
}
// The directory's inventory computed here, not by the tool, as path -> kind/hash (mode only where POSIX applies).
async function inventory(root) {
  const out = new Map();
  async function visit(path, prefix) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const full = join(path, entry.name), relative = prefix + entry.name, mode = process.platform === 'win32' ? undefined : (await stat(full)).mode & 0o777;
      if (entry.isDirectory()) { out.set(relative, plain({ kind: 'directory', mode })); await visit(full, relative + '/'); } else out.set(relative, plain({ kind: 'file', mode, sha256: hash(await readFile(full)) }));
    }
  }
  await visit(root, '');
  return out;
}
async function assertInventory(ctx, rootName) {
  const record = await readJSON(join(ctx.journal, 'record.json')), actual = await inventory(join(ctx.project, rootName));
  assert.equal(record.expected, ctx.expected, 'Journal records the inventory digest inspect reported before interruption');
  assert.equal(hash(JSON.stringify(record.files)), record.expected);
  const recorded = new Map(record.files.map(entry => [entry.path, plain({ kind: entry.kind, mode: process.platform === 'win32' ? undefined : entry.mode, sha256: entry.sha256 })]));
  assert.deepEqual(actual, recorded, 'Active root holds exactly the recorded inventory');
  for (const [path, bytes] of ctx.payloads) assert.deepEqual(await readFile(join(ctx.project, rootName, path)), bytes, `payload bytes changed: ${path}`);
}

async function interrupt(boundary) {
  const ctx = await fixture(), expectation = boundaries[boundary], ready = join(temp, ctx.name + '.ready');
  const child = spawn(process.execPath, ['--import', pathToFileURL(preload).href, launcher, 'migrate-state', ...ctx.args, '--id', ctx.id, '--expected', ctx.expected, '--quiescent-ref', 'Disposable fixture; no external writers'], { env: { ...env, ISSWF_TEST_PAUSE_AT: boundary, ISSWF_TEST_READY: ready }, stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  let output = '', settled = null;
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes; });
  const exited = new Promise((done, reject) => { child.once('error', reject); child.once('exit', (code, signal) => { settled = { code, signal }; done(settled); }); });
  let observed = false;
  for (let count = 0; count < 600 && !settled; count++) { if (existsSync(ready)) { observed = true; break; } await sleep(50); }
  assert.equal(observed, true, `migrate-state must reach the ${boundary} boundary\n${output}`);
  assert.equal(await readFile(ready, 'utf8'), String(child.pid), 'The paused process is the real migrate-state owner');
  assert.equal(settled, null, 'Owner is alive at the boundary');
  const owner = (await readJSON(join(ctx.claim, 'owner.json')));
  assert.equal(owner.owner.pid, child.pid, 'Claim records the real migrate-state process identity');
  assert.equal(owner.recordPath, ctx.journal);
  assert.equal(existsSync(join(ctx.project, '.factory')), expectation.legacy);
  assert.equal(existsSync(join(ctx.project, '.isswf')), !expectation.legacy);
  assert.equal(existsSync(ctx.journal), expectation.journalDir);
  assert.equal(existsSync(join(ctx.journal, 'record.json')), expectation.record);
  assert.equal(existsSync(join(ctx.journal, 'complete.json')), false);
  const live = { ...ctx, boundary, expectation, child, owner: owner.owner, exited, output: () => output, ready };
  live.kill = async () => {
    child.kill('SIGKILL');
    const result = await Promise.race([exited, sleep(15000).then(() => { throw Error('Terminated owner did not exit'); })]);
    children.delete(child);
    assert.ok(result.signal === 'SIGKILL' || result.code !== 0 && result.code !== 86, `Owner must end abruptly, not by itself: ${JSON.stringify(result)}`);
    assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' }, 'Owner process is gone');
    return result;
  };
  return live;
}

const recoverArgs = ctx => ['recover-state', ...ctx.args, '--id', ctx.id];
async function assertRefused(ctx, pattern, label) {
  const before = await evidence(ctx), result = isswf(recoverArgs(ctx), 1);
  assert.match(result.stderr, pattern, label);
  assert.equal(result.stdout, '', `${label}: refusal prints no success result`);
  assert.deepEqual(await evidence(ctx), before, `${label}: claim, journal and state bytes retained`);
  return { control: label, status: result.status, stderr: result.stderr.trim().split('\n')[0] };
}

async function recoverAndVerify(ctx, termination) {
  const recovered = JSON.parse(isswf(recoverArgs(ctx)).stdout), expectation = ctx.expectation, other = expectation.activeDirectory === '.factory' ? '.isswf' : '.factory';
  assert.deepEqual(recovered, { status: 'state-recovered', id: ctx.id, activeDirectory: expectation.activeDirectory });
  assert.equal(existsSync(ctx.claim), false, 'Claim retired');
  assert.equal(existsSync(join(ctx.project, other)), false, 'Exactly one active root');
  assert.deepEqual((await readdir(ctx.project)).sort(), ['.git', expectation.activeDirectory].sort(), 'No stage, retired or stray entries remain');
  await assertInventory(ctx, expectation.activeDirectory);
  assert.deepEqual((await readdir(ctx.journal)).sort(), expectation.journalFiles, 'Journal holds exactly the expected receipts');
  assert.deepEqual(await readJSON(join(ctx.journal, 'recovered.json')), { format: 1, id: ctx.id, state: expectation.recovered });
  if (ctx.boundary === 'renamed') assert.deepEqual(await readJSON(join(ctx.journal, 'complete.json')), { format: 1, id: ctx.id, state: 'moved' });
  else assert.equal(existsSync(join(ctx.journal, 'complete.json')), false, 'An unmoved directory gets no complete receipt');
  const settled = await evidence(ctx), repeat = isswf(recoverArgs(ctx), 1);
  assert.match(repeat.stderr, /ENOENT/u, 'A repeat finds no claim and refuses');
  assert.deepEqual(await evidence(ctx), settled, 'A repeat leaves every byte unchanged');
  let afterwards;
  if (ctx.boundary === 'renamed') {
    afterwards = JSON.parse(isswf(['migrate-state', ...ctx.args, '--id', ctx.id, '--expected', ctx.expected, '--quiescent-ref', 'Disposable fixture; no external writers']).stdout).status;
    assert.equal(afterwards, 'unchanged', 'The recovered completed move is an identical repeat');
  } else {
    afterwards = JSON.parse(isswf(['migrate-state', ...ctx.args, '--id', 'S0002', '--expected', ctx.expected, '--quiescent-ref', 'Disposable fixture; no external writers']).stdout).status;
    assert.equal(afterwards, 'state-migrated', 'The unchanged original can be moved by a new migration');
    await assertInventory({ ...ctx, journal: join(ctx.store, 'state-migrations', hash(ctx.project), 'S0002') }, '.isswf');
  }
  return { boundary: ctx.boundary, label: ctx.expectation.label, ownerPid: ctx.child.pid, ownerIdentity: ctx.owner, termination, recovered, repeat: { status: repeat.status, stderr: repeat.stderr.trim().split('\n')[0] }, afterwards, expectedDigest: ctx.expected, journalFiles: expectation.journalFiles };
}

let keep = false;
try {
  const revision = run('git', ['-C', source, 'rev-parse', 'HEAD']).stdout.trim(), release = join(temp, 'release spaces ñ');
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', source, '--revision', revision, '--output', release, '--runtime', 'node']);
  const built = verifyRelease(release);
  const packed = JSON.parse(run(process.execPath, [npm, 'pack', release, '--ignore-scripts', '--json', '--pack-destination', temp]).stdout);
  const consumer = join(temp, 'consumer spaces ñ');
  run(process.execPath, [npm, 'install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', '--offline', join(temp, (Array.isArray(packed) ? packed[0] : Object.values(packed)[0]).filename)]);
  installed = join(consumer, 'node_modules/isswf-pi-resources');
  assert.equal(verifyRelease(installed).artifactId, built.artifactId, 'Installed package retains the exact built release');
  launcher = join(installed, 'tools/isswf.mjs');

  // 1. Every boundary: the real owner is killed, then recover-state resolves it.
  for (const boundary of Object.keys(boundaries)) {
    const ctx = await interrupt(boundary), controls = [];
    if (boundary === 'record') {
      // Live-owner control: the same paused process, not yet terminated, must block recovery.
      controls.push(await assertRefused(ctx, /live or uncertain/u, 'owner still alive (real paused process)'));
      assert.equal(ctx.child.exitCode, null, 'The live owner was still running after the refusal');
    }
    const termination = await ctx.kill();
    const receipt = await recoverAndVerify(ctx, termination);
    receipts.push({ ...receipt, controls });
  }

  // 2. Controls on a genuinely interrupted, dead-owner migration: each refuses and keeps every byte.
  const controls = [];
  const malformed = await interrupt('record'); await malformed.kill();
  const ownerPath = join(malformed.claim, 'owner.json'), realOwner = await readJSON(ownerPath);
  await writeFile(ownerPath, '{"format":1,"id":"S0001",');
  controls.push(await assertRefused(malformed, /JSON|Unexpected|Expected/u, 'malformed owner.json'));
  const partialIdentity = { ...realOwner.owner };
  delete partialIdentity.bootId;
  await writeFile(ownerPath, JSON.stringify({ ...realOwner, owner: partialIdentity }));
  controls.push(await assertRefused(malformed, /live or uncertain/u, 'owner identity missing bootId'));

  const disagree = await interrupt('record'); await disagree.kill();
  const recordPath = join(disagree.journal, 'record.json'), record = await readJSON(recordPath);
  await writeFile(recordPath, JSON.stringify({ ...record, reference: 'edited after interruption' }, null, 2) + '\n');
  controls.push(await assertRefused(disagree, /Claim and state journal disagree/u, 'claim and journal record disagree'));

  const driftBefore = await interrupt('record'); await driftBefore.kill();
  await writeFile(join(driftBefore.project, '.factory/drift-after-interruption.txt'), 'new bytes\n');
  controls.push(await assertRefused(driftBefore, /State drift blocks recovery/u, 'inventory drift in .factory before rename'));

  const driftAfter = await interrupt('renamed'); await driftAfter.kill();
  await writeFile(join(driftAfter.project, '.isswf/project-setup.md'), 'Edited after the move\n');
  controls.push(await assertRefused(driftAfter, /State drift blocks recovery/u, 'inventory drift in .isswf after rename'));

  const dual = await interrupt('record'); await dual.kill();
  await mkdir(join(dual.project, '.isswf')); await writeFile(join(dual.project, '.isswf/unrelated.txt'), 'competing root\n');
  controls.push(await assertRefused(dual, /Both \.isswf and \.factory exist/u, 'both .factory and .isswf present'));

  const report = { status: 'PASS', platform: process.platform, arch: process.arch, node: process.version, revision, artifactId: built.artifactId, launcher: { kind: 'Node release launcher, npm-installed', executable: process.execPath, entry: launcher }, bunGap: 'The compiled Bun executable cannot load the node --import pause seam, so interruption is exercised only through the genuine Node release launcher.', interruptions: receipts, controls };
  if (process.env.ISSWF_INTERRUPT_RECEIPTS) await writeFile(process.env.ISSWF_INTERRUPT_RECEIPTS, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) { keep = true; console.error('Retained failing fixture: ' + temp); throw error; }
finally {
  for (const child of children) child.kill('SIGKILL');
  if (!keep) await rm(temp, { recursive: true, force: true });
}
