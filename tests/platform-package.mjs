import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, readFile, realpath, rm, rmdir, stat, symlink, unlink, writeFile } from 'node:fs/promises';
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
assert.equal(Object.keys(built.files).some(path => path.startsWith('.pi/skills/project-release/') || path.startsWith('.claude/skills/') || path.startsWith('.agents/skills/isswf-release/')), false, 'Project-only release instructions must not ship to consumers');
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
let liveWindowsOwner;
if (process.platform === 'win32') {
  const powershell = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const script = `$ErrorActionPreference='Stop'; $p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${process.pid}'; @{platform='win32';pid=[int]$p.ProcessId;startTime=$p.CreationDate.ToUniversalTime().ToString('o');bootId=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().ToString('o')} | ConvertTo-Json -Compress`;
  liveWindowsOwner = JSON.parse(run(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')]).replace(/^\uFEFF/u, ''));
  assert.equal(liveWindowsOwner.pid, process.pid, 'Recovery refusal must exercise a genuinely live owner');
  for (const value of [liveWindowsOwner.startTime, liveWindowsOwner.bootId]) assert.match(value, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{7}Z$/u);
}
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
  await assert.rejects(readFile(join(target, '.isswf/models.json')), { code: 'ENOENT' }, 'init seeds no legacy route file');
  const protectedPaths = ['.isswf/install.json', '.isswf/project-setup.md', '.isswf/.gitignore'];
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
    ...(liveWindowsOwner ? [
      liveWindowsOwner,
      { ...liveWindowsOwner, bootId: '2020-01-01' },
      { ...liveWindowsOwner, startTime: '2020-01-01' },
      { ...liveWindowsOwner, bootId: liveWindowsOwner.bootId.replace(/(\.\d{3})\d{4}Z$/u, '$1Z') },
      { ...liveWindowsOwner, startTime: liveWindowsOwner.startTime.replace('Z', '+00:00') },
    ] : []),
  ]) {
    const ownerBytes = Buffer.from(JSON.stringify({ id: 'unknown-owner', owner: unknown, transaction: null }));
    const retainedPin = before.get('.isswf/install.json').toString('base64');
    const recordBytes = Buffer.from(JSON.stringify({ format: 1, id: 'unknown-owner', owner: unknown, files: [{ path: '.isswf/install.json', before: retainedPin, after: retainedPin }] }));
    await writeFile(join(operation, 'owner.json'), ownerBytes);
    await writeFile(join(transactionPath, 'record.json'), recordBytes);
    assert.match(invoke(['recover', '--project', target, '--store', targetStore, '--id', 'unknown-owner'], 1), /Migration owner is live or uncertain; recovery refused/u);
    assert.deepEqual(await readFile(join(operation, 'owner.json')), ownerBytes);
    assert.deepEqual(await readFile(join(transactionPath, 'record.json')), recordBytes);
    assert.equal(existsSync(join(transactionPath, 'recovered.json')), false, 'Uncertain identity must not authorize any recovery receipt');
    assert.equal(await readFile(join(claim, 'pending'), 'utf8'), 'uncertain claim bytes');
    assert.deepEqual(await readFile(planPath), planBytes);
    for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, path)), bytes, `unknown recovery identity changed pinned setup byte: ${path}`);
  }
  return { target, pin: JSON.parse(before.get('.isswf/install.json').toString('utf8')) };
}
const nativeJourney = await planJourney('installed project spaces ñ', binary);
const nodeRelease = join(root, 'node release spaces ñ');
run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', source, '--revision', revision, '--output', nodeRelease, '--runtime', 'node']);
const nodeJourney = await planJourney('node development project spaces ñ', join(nodeRelease, 'tools/isswf.mjs'), true);
async function stateMigrationJourney(name, launcher, nodeLauncher = false) {
  const target = join(root, name), targetStore = join(root, name + ' store');
  await mkdir(join(target, '.factory/initiatives/I0007/jobs/J002'), { recursive: true });
  const payloadPath = join(target, '.factory/initiatives/I0007/jobs/J002/brief-r1.md');
  const payloads = new Map([
    [payloadPath, Buffer.from('Historical .factory reference remains unchanged: ñ\n')],
    [join(target, '.factory/models.json'), Buffer.from('{"models":{"worker":"fixture-model"}}\n')],
    [join(target, '.factory/project-setup.md'), Buffer.from('Pinned setup choice: fixture\n')],
    [join(target, '.factory/project-pin.json'), Buffer.from('{"pin":"fixture-sha256:0123456789abcdef"}\n')],
  ]);
  for (const [path, bytes] of payloads) await writeFile(path, bytes);
  if (process.platform !== 'win32') await chmod(payloadPath, 0o640);
  run('git', ['init', '-q', target]);
  run('git', ['-C', target, 'add', '-f', '.factory']);
  run('git', ['-C', target, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'legacy state fixture']);
  const invoke = (args, expectedStatus = 0) => nodeLauncher ? run(process.execPath, [launcher, ...args], root, expectedStatus) : run(launcher, args, root, expectedStatus);
  const inspectArgs = ['inspect', '--project', target, '--store', targetStore];
  const inspect = JSON.parse(invoke(inspectArgs));
  assert.equal(inspect.status, 'legacy-state');
  const migrationArgs = expected => ['migrate-state', '--project', target, '--store', targetStore, '--id', 'S0007', '--expected', expected, '--quiescent-ref', 'Disposable fixture; no external writers'];
  const journalPath = join(targetStore, 'state-migrations', createHash('sha256').update(await realpath(target)).digest('hex'), 'S0007');
  const assertLegacyBytes = async () => { for (const [path, bytes] of payloads) assert.deepEqual(await readFile(path), bytes, `refusal changed legacy bytes: ${path}`); };
  const staleExpected = inspect.stateMigration.expected;
  const pinPath = join(target, '.factory/project-pin.json'), updatedPin = Buffer.from('{"pin":"fixture-sha256:fedcba9876543210"}\n');
  await writeFile(pinPath, updatedPin); payloads.set(pinPath, updatedPin);
  run('git', ['-C', target, 'add', '-f', '.factory/project-pin.json']);
  run('git', ['-C', target, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'update fixture pin']);
  assert.match(invoke(migrationArgs(staleExpected), 1), /--expected must match the legacy state inventory/u);
  await assertLegacyBytes();
  assert.equal(existsSync(join(target, '.isswf-transition')), false, 'stale digest refusal must not claim the project');
  assert.equal(existsSync(journalPath), false, 'stale digest refusal must not create a journal');

  await writeFile(join(target, '.factory/untracked-note'), 'uncheckpointed bytes');
  const dirtyInventory = JSON.parse(invoke(inspectArgs)).stateMigration.expected;
  assert.match(invoke(migrationArgs(dirtyInventory), 1), /Checkpoint legacy \.factory files/u);
  await assertLegacyBytes();
  assert.equal(await readFile(join(target, '.factory/untracked-note'), 'utf8'), 'uncheckpointed bytes');
  await unlink(join(target, '.factory/untracked-note'));

  const unsafeLink = join(target, '.factory/unsafe-link');
  await symlink(join(target, '.factory/initiatives'), unsafeLink, process.platform === 'win32' ? 'junction' : 'dir');
  assert.match(invoke(inspectArgs, 1), /State migration refuses symlinks and special files/u);
  await assertLegacyBytes();
  assert.equal(existsSync(unsafeLink), true, 'unsafe entry refusal retains the link');
  await rm(unsafeLink, { recursive: true });

  const legacyClaim = join(target, '.factory/.plan-write');
  await mkdir(legacyClaim); await writeFile(join(legacyClaim, 'pending'), 'active legacy claim bytes');
  assert.match(invoke(inspectArgs, 1), /Interrupted or active state claim requires reconciliation/u);
  await assertLegacyBytes();
  assert.equal(await readFile(join(legacyClaim, 'pending'), 'utf8'), 'active legacy claim bytes');
  await unlink(join(legacyClaim, 'pending')); await rmdir(legacyClaim);

  const transition = join(target, '.isswf-transition'), ownerBytes = Buffer.from('{"uncertain":"preserve"}\n');
  await mkdir(transition); await writeFile(join(transition, 'owner.json'), ownerBytes);
  const currentExpected = JSON.parse(invoke(inspectArgs)).stateMigration.expected;
  assert.match(invoke(migrationArgs(currentExpected), 1), /Interrupted state transition requires inspect and recover-state/u);
  await assertLegacyBytes();
  assert.deepEqual(await readFile(join(transition, 'owner.json')), ownerBytes, 'uncertain transition evidence must remain byte-identical');
  assert.equal(existsSync(journalPath), false, 'transition refusal must not create a journal');
  await unlink(join(transition, 'owner.json')); await rmdir(transition);

  await mkdir(journalPath, { recursive: true });
  const uncertainJournal = Buffer.from(JSON.stringify({ project: target, kind: 'move', complete: false }) + '\n');
  await writeFile(join(journalPath, 'record.json'), uncertainJournal);
  assert.match(invoke(migrationArgs(currentExpected), 1), /Existing state migration requires inspection/u);
  await assertLegacyBytes();
  assert.deepEqual(await readFile(join(journalPath, 'record.json')), uncertainJournal, 'uncertain journal must remain byte-identical');
  assert.equal(existsSync(transition), false, 'journal refusal must not claim the project');
  await rm(journalPath, { recursive: true });

  const migrateArgs = migrationArgs(currentExpected);
  const before = new Map(await Promise.all([...payloads.keys()].map(async path => [relative(join(target, '.factory'), path), await readFile(path)]))), mode = (await stat(payloadPath)).mode & 0o777;
  const moved = JSON.parse(invoke(migrateArgs));
  assert.equal(moved.status, 'state-migrated');
  for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, '.isswf', path)), bytes, `moved payload bytes changed: ${path}`);
  await assert.rejects(readFile(join(target, '.factory')), { code: 'ENOENT' });
  if (process.platform !== 'win32') assert.equal((await stat(join(target, '.isswf/initiatives/I0007/jobs/J002/brief-r1.md'))).mode & 0o777, mode);
  const repeat = JSON.parse(invoke(migrateArgs));
  assert.equal(repeat.status, 'unchanged');
  for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, '.isswf', path)), bytes, `repeat rewrote payload bytes: ${path}`);
  await mkdir(join(target, '.factory'));
  assert.match(invoke(inspectArgs, 1), /Both \.isswf and \.factory exist/u);
  for (const [path, bytes] of before) assert.deepEqual(await readFile(join(target, '.isswf', path)), bytes, `dual-root refusal changed active payload: ${path}`);
  await rmdir(join(target, '.factory'));

  const alteredPin = Buffer.from('{"pin":"unexpected altered bytes"}\n'), installedPinPath = join(target, '.isswf/project-pin.json');
  await writeFile(installedPinPath, alteredPin);
  const negativeControl = invoke(migrateArgs, 1);
  assert.match(negativeControl, /Existing state migration requires inspection/u, 'repeat must reject an altered installed payload rather than report unchanged');
  assert.deepEqual(await readFile(installedPinPath), alteredPin, 'negative control refusal must preserve the changed bytes');
  return { name, launcher: nodeLauncher ? { kind: 'Node release launcher', executable: process.execPath, entry: launcher, runtime: process.version } : { kind: 'compiled Bun artifact', executable: launcher, runtime: built.runtime.version }, observations: { migrateStatus: moved.status, repeatStatus: repeat.status, unmutatedBaseline: [...before].map(([path, bytes]) => ({ path, sha256: createHash('sha256').update(bytes).digest('hex'), base64: bytes.toString('base64') })) }, negativeControl: { input: '.isswf/project-pin.json changed to literal unexpected bytes', observed: negativeControl } };
}
const nativeStateMigration = await stateMigrationJourney('installed migration project spaces ñ', binary);
const nodeStateMigration = await stateMigrationJourney('node migration project spaces ñ', join(nodeRelease, 'tools/isswf.mjs'), true);
assert.equal(nativeJourney.pin.runtimeFormat, 2, 'Native journey must select the compiled Bun artifact');
assert.equal(nodeJourney.pin.runtimeFormat, 1, 'Node journey must select a genuine Node development release');
assert.notEqual(nativeJourney.pin.runtimeId, nodeJourney.pin.runtimeId, 'Each journey must use its own immutable runtime pin');
for (const test of ['host-portability', 'worktree-location']) run(process.execPath, [join(source, 'tests', test + '.mjs'), source]);
const report = { status: 'PASS', platform: process.platform, arch: process.arch, revision, version: manifest.version, artifactId: built.artifactId, installed, checks: ['native Bun build', 'npm tarball installation and exact receipt', 'executable version and usage refusal', 'read-only inspect/status', 'native Bun installed init→pinned plan prepare/repeat/uncertain-claim refusal', 'Node release-launcher init→pinned plan prepare/repeat/uncertain-claim refusal', 'installed Bun and Node migration with stale digest, dirty state, unsafe symlink/junction, active legacy claim, uncertain transition and journal refusal; exact evidence retained', 'migration pins, models, setup and historical payload bytes/modes preserved across rename and repeat', 'dual-root refusal preserves one active root and all bytes', 'mutated installed pin negative control rejects repeat and preserves altered bytes', 'native owner evidence shape and unknown-owner recovery refusal', 'space and Unicode paths', 'native Git worktree recipes', 'static resource contracts'], planJourneys: { native: { project: nativeJourney.target, runtimeId: nativeJourney.pin.runtimeId }, node: { project: nodeJourney.target, runtimeId: nodeJourney.pin.runtimeId } }, migrationJourneys: { bun: nativeStateMigration, node: nodeStateMigration }, migrationAssertionMap: { 'brief criterion 1 — installed normal migration/repeat, exact payloads and one root': 'stateMigrationJourney() assertions for migrateStatus, repeatStatus, payload byte maps, no legacy root, and supported mode', 'brief criterion 2 — public refusal and protected evidence': 'stale digest, dirty/untracked, symlink/junction, .plan-write active legacy claim, .isswf-transition, incomplete journal and dual root assertions; each checks retained payloads/evidence', 'brief criterion 3 — publication fault policy': 'tests/state-migration-publication.mjs injects regular-file write/sync/close failures on the native host and Linux directory open/sync/close failures; its Windows policy seam is simulated and is not native evidence; the native platform matrix runs this test', 'brief criterion 4 — installed-result sensitivity': 'mutated .isswf/project-pin.json repeat is refused and altered bytes are retained; unmutated baseline payload base64/SHA-256 and observed refusal are in migrationJourneys', 'brief criterion 5 — supported policy identity': 'launcher objects name actual compiled Bun executable/runtime and Node executable/release entry/runtime; Windows symlink control creates a junction and is exercised natively in CI'}, limits: 'Migration is the normal installed path only; actual interrupted-owner recovery is not certified. Windows run remains pending; Linux evidence is not Windows evidence. Windows omits directory flushes and does not claim equivalent power-loss persistence. No host discovery in this script; run host-discovery separately. No provider execution or Linux sandbox equivalence is established.' };
await writeFile(join(root, 'platform-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
