import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute, relative, sep } from 'node:path';
import { verifyRelease } from '../tools/release-source.mjs';

const source = resolve(process.argv[2] || '.');
assert.ok(process.env.ISSWF_PLATFORM_ROOT, 'Set ISSWF_PLATFORM_ROOT to an absent external directory');
const root = resolve(process.env.ISSWF_PLATFORM_ROOT);
const outputRelative = relative(source, root);
assert.ok(outputRelative === '..' || outputRelative.startsWith('..' + sep) || isAbsolute(outputRelative), 'Platform output must be outside the source checkout');
const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), resolve(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(path => path && isAbsolute(path) && existsSync(path));
assert.ok(npm, 'A Node.js installation with npm CLI is required');
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' };
function run(binary, args, cwd = root, expectedStatus = 0) {
  const result = spawnSync(binary, args, { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, expectedStatus, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return (expectedStatus === 0 ? result.stdout : result.stderr).trim();
}
await mkdir(root);
const revision = run('git', ['-C', source, 'rev-parse', 'HEAD']);
const release = join(root, 'release spaces ñ');
run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', source, '--revision', revision, '--output', release, '--runtime', 'bun']);
const built = verifyRelease(release);
assert.equal(built.revision, revision);
assert.equal(built.runtime.os, process.platform);
assert.equal(built.runtime.arch, process.arch);
assert.equal(Object.keys(built.files).some(path => path.startsWith('.claude/') || path.startsWith('.pi/') || path.startsWith('tooling/')), false, 'Source-only host policies and private configuration must not ship');
assert.equal(Object.keys(built.files).some(path => path.startsWith('.pi/skills/project-release/') || path.startsWith('.agents/skills/isswf-release/')), false, 'Project-only release instructions must not ship to consumers');
const packed = JSON.parse(run(process.execPath, [npm, 'pack', release, '--ignore-scripts', '--json', '--pack-destination', root]));
const entry = Array.isArray(packed) ? packed[0] : Object.values(packed)[0];
const tarball = join(root, entry.filename);
const consumer = join(root, 'consumer spaces ñ');
run(process.execPath, [npm, 'install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', '--offline', tarball]);
const installed = join(consumer, 'node_modules/isswf-pi-resources');
assert.equal(verifyRelease(installed).artifactId, built.artifactId, 'Installed tarball must retain the exact built artifact');
const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
assert.equal(manifest.version, JSON.parse(await readFile(join(installed, '.claude-plugin/plugin.json'), 'utf8')).version);
const binary = join(installed, manifest.bin.isswf);
assert.equal(run(binary, ['--version']), manifest.version);
assert.match(run(binary, ['--help'], root, 1), /Usage: isswf/u);
const project = join(root, 'project spaces ñ');
await mkdir(project);
run('git', ['init', '-q', project]);
await writeFile(join(project, 'baseline.txt'), 'baseline\n');
run('git', ['-C', project, 'add', '.']);
run('git', ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'baseline']);
const store = join(root, 'store spaces ñ');
assert.equal(JSON.parse(run(binary, ['inspect', '--project', project, '--store', store])).status, 'not-initialized');
assert.equal(JSON.parse(run(binary, ['__tool', 'isswf-status', '--project', project, '--initiative', 'I9999'])).status, 'absent');
assert.equal(run('git', ['-C', project, 'status', '--porcelain']), '', 'Read-only CLI checks leave the project unchanged');

const proposal = join(root, 'plan-proposal.json'), grant = join(root, 'plan-grant.json');
const plan = { version: 1, initiative: 'I0085', title: 'Native pinned plan journey', type: 'maintenance', jobs: [{ id: 'J001', objective: 'Verify the installed pinned planner', status: 'pending', dependsOn: [], acceptance: ['No unpinned plan execution'], blocker: 'None', nextStep: 'Inspect the prepared plan', evidence: [] }] };
await writeFile(proposal, JSON.stringify(plan));
async function planJourney(name, launcher, nodeLauncher = false) {
  const target = join(root, name), targetStore = join(root, 'store spaces ñ');
  await mkdir(target);
  run('git', ['init', '-q', target]);
  await writeFile(join(target, 'baseline.txt'), 'baseline\n');
  run('git', ['-C', target, 'add', '.']);
  run('git', ['-C', target, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'baseline']);
  await writeFile(grant, JSON.stringify({ version: 1, project: await realpath(target), initiative: plan.initiative, reference: 'Synthetic installed plan-only journey', permissions: ['plan'] }));
  const invoke = (args, expectedStatus = 0) => nodeLauncher ? run(process.execPath, [launcher, ...args], root, expectedStatus) : run(launcher, args, root, expectedStatus);
  const init = JSON.parse(invoke(['init', '--project', target, '--store', targetStore, '--tracking', 'local']));
  assert.equal(init.status, 'initialized');
  const transaction = JSON.parse(await readFile(join(target, '.isswf/local/transactions', init.id, 'record.json'), 'utf8'));
  if (process.platform === 'win32') {
    assert.equal(transaction.owner.platform, 'win32');
    assert.ok(Number.isSafeInteger(transaction.owner.pid) && transaction.owner.pid > 0);
    assert.ok(Number.isFinite(Date.parse(transaction.owner.startTime)));
    assert.ok(Number.isFinite(Date.parse(transaction.owner.bootId)));
  } else {
    assert.equal(transaction.owner.platform, undefined, 'Linux persisted owner shape remains compatible');
    assert.ok(Number.isSafeInteger(transaction.owner.pid) && transaction.owner.pid > 0);
    assert.match(transaction.owner.startTicks, /^\d+$/u);
    assert.match(transaction.owner.bootId, /^[a-f0-9-]{36}$/u);
  }
  const protectedPaths = ['.isswf/install.json', '.isswf/project-setup.md', '.isswf/models.json', '.isswf/.gitignore'];
  const before = new Map(await Promise.all(protectedPaths.map(async path => [path, await readFile(join(target, path))])));
  const planArgs = ['exec', '--project', target, '--store', targetStore, '--', 'isswf-plan', 'prepare', '--initiative', plan.initiative, '--proposal', proposal, '--grant', grant];
  const created = JSON.parse(invoke(planArgs));
  assert.equal(created.status, 'prepared');
  const planPath = join(target, '.isswf/initiatives', plan.initiative, 'plan.md');
  const planBytes = await readFile(planPath);
  const repeated = JSON.parse(invoke(planArgs));
  assert.equal(repeated.status, 'reused');
  assert.deepEqual(await readFile(planPath), planBytes);
  for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, path)), bytes, `pinned setup byte changed: ${path}`);
  const claim = join(target, '.isswf/initiatives', plan.initiative, '.plan-write');
  await mkdir(claim);
  await writeFile(join(claim, 'pending'), 'uncertain claim bytes');
  assert.match(invoke(planArgs, 1), /Existing plan write claim requires inspection/u);
  assert.deepEqual(await readFile(planPath), planBytes, 'uncertain claim must not change target plan');
  for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, path)), bytes, `uncertain claim changed pinned setup byte: ${path}`);
  assert.equal(await readFile(join(claim, 'pending'), 'utf8'), 'uncertain claim bytes');
  const operation = join(target, '.isswf/local/operation'), transactionPath = join(target, '.isswf/local/transactions/unknown-owner');
  await mkdir(operation);
  await mkdir(transactionPath);
  for (const unknown of [
    { platform: 'win32', pid: 0, startTime: 'unknown', bootId: 'unknown' },
    { ...transaction.owner, platform: 'unsupported' },
  ]) {
    const ownerBytes = Buffer.from(JSON.stringify({ id: 'unknown-owner', owner: unknown, transaction: null }));
    const recordBytes = Buffer.from(JSON.stringify({ format: 1, id: 'unknown-owner', owner: unknown, files: [{ path: '.isswf/install.json', before: null, after: 'YQ==' }] }));
    await writeFile(join(operation, 'owner.json'), ownerBytes);
    await writeFile(join(transactionPath, 'record.json'), recordBytes);
    assert.match(invoke(['recover', '--project', target, '--store', targetStore, '--id', 'unknown-owner'], 1), /Migration owner is live or uncertain; recovery refused/u);
    assert.deepEqual(await readFile(join(operation, 'owner.json')), ownerBytes);
    assert.deepEqual(await readFile(join(transactionPath, 'record.json')), recordBytes);
    assert.deepEqual(await readFile(planPath), planBytes);
    for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, path)), bytes, `unknown recovery identity changed pinned setup byte: ${path}`);
  }
  return { target, pin: JSON.parse(before.get('.isswf/install.json').toString('utf8')) };
}
const nativeJourney = await planJourney('installed project spaces ñ', binary);
const nodeRelease = join(root, 'node release spaces ñ');
run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', source, '--revision', revision, '--output', nodeRelease, '--runtime', 'node']);
const nodeJourney = await planJourney('node development project spaces ñ', join(nodeRelease, 'tools/isswf.mjs'), true);
assert.equal(nativeJourney.pin.runtimeFormat, 2, 'Native journey must select the compiled Bun artifact');
assert.equal(nodeJourney.pin.runtimeFormat, 1, 'Node journey must select a genuine Node development release');
assert.notEqual(nativeJourney.pin.runtimeId, nodeJourney.pin.runtimeId, 'Each journey must use its own immutable runtime pin');
for (const test of ['host-portability', 'worktree-location']) run(process.execPath, [join(source, 'tests', test + '.mjs'), source]);
const report = { status: 'PASS', platform: process.platform, arch: process.arch, revision, version: manifest.version, artifactId: built.artifactId, installed, checks: ['native Bun build', 'npm tarball installation and exact receipt', 'executable version and usage refusal', 'read-only inspect/status', 'native Bun installed init→pinned plan prepare/repeat/uncertain-claim refusal', 'Node release-launcher init→pinned plan prepare/repeat/uncertain-claim refusal', 'native owner evidence shape and unknown-owner recovery refusal', 'space and Unicode paths', 'native Git worktree recipes', 'static resource contracts'], planJourneys: { native: { project: nativeJourney.target, runtimeId: nativeJourney.pin.runtimeId }, node: { project: nodeJourney.target, runtimeId: nodeJourney.pin.runtimeId } }, limits: 'Plan journey only; migration/recovery and worker execution are not certified. Windows omits unsupported directory fsync and does not claim equivalent power-loss persistence. No host discovery in this script; run host-discovery separately. No provider execution or Linux sandbox equivalence is established.' };
await writeFile(join(root, 'platform-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
