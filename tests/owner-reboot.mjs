import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Journey: an owner whose PID is alive but whose boot identity differs from the current boot ran before a reboot
// (the OS reused its PID). The launcher's ceased verdict must hold for it, so inspect reports a stale lease as
// owner-ceased and `recover` and `recover-state` proceed; the same owner with the current boot identity stays
// live and is refused. The alive PID is this test process, so the only difference between the two owners is the boot.
const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-reboot-')));
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
function run(binary, args, ok = true) {
  const result = spawnSync(binary, args, { cwd: temp, env, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  assert.ifError(result.error);
  if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  else assert.notEqual(result.status, 0, `Expected refusal: ${binary} ${args.join(' ')}\n${result.stdout}`);
  return result;
}

// The identity this process would record as an owner now, in each platform's persisted shape.
async function currentIdentity() {
  if (process.platform === 'win32') {
    const powershell = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
    const script = `$ErrorActionPreference='Stop'; $p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${process.pid}'; @{platform='win32';pid=[int]$p.ProcessId;startTime=$p.CreationDate.ToUniversalTime().ToString('o');bootId=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().ToString('o')} | ConvertTo-Json -Compress`;
    const result = run(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')]);
    return JSON.parse(result.stdout.replace(/^\uFEFF/u, ''));
  }
  const stat = await readFile(`/proc/${process.pid}/stat`, 'utf8');
  return { pid: process.pid, startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(/\s+/u)[19], bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() };
}
// Same PID and start identity, well-formed but different boot identity: an earlier boot.
function earlierBoot(owner) {
  if (owner.platform === 'win32') return { ...owner, bootId: new Date(Date.parse(owner.bootId) - 86400000).toISOString().replace('Z', '0000Z') };
  const last = owner.bootId.at(-1);
  return { ...owner, bootId: owner.bootId.slice(0, -1) + (last === '0' ? '1' : '0') };
}

let release, counter = 0;
async function project(legacy = false) {
  const root = join(temp, 'project ' + ++counter + ' ñ');
  await mkdir(root);
  const path = await realpath(root), store = join(temp, 'store ' + counter);
  initRepository(path);
  const args = ['--project', path, '--store', store];
  const cli = (command, extra = [], ok = true) => run(process.execPath, [join(release, 'tools/isswf.mjs'), command, ...args, ...extra], ok);
  if (!legacy) assert.equal(JSON.parse(cli('init', ['--tracking', 'local']).stdout).status, 'initialized');
  return { path, store, cli };
}

let keep = false;
try {
  release = join(temp, 'release');
  const revision = run('git', ['-C', source, 'rev-parse', 'HEAD']).stdout.trim();
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', source, '--revision', revision, '--output', release, '--runtime', 'node']);
  const live = await currentIdentity(), rebooted = earlierBoot(live);
  assert.notEqual(rebooted.bootId, live.bootId);

  // 1. A lease whose launcher is alive in an earlier boot is reported as ceased; the current boot's owner is not.
  const lease = async (ctx, owner, name) => {
    const dir = join(ctx.path, '.isswf/local/leases');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), JSON.stringify({ tool: 'isswf-status', child: process.pid, owner }));
  };
  const leases = await project();
  await lease(leases, live, 'live.json');
  await lease(leases, rebooted, 'rebooted.json');
  const blockers = JSON.parse(leases.cli('inspect').stdout).blockers;
  assert.equal(blockers.find(entry => entry.lease === 'live.json')?.state, 'active-or-unreconciled', 'The current boot keeps an alive owner live');
  assert.equal(blockers.find(entry => entry.lease === 'rebooted.json')?.state, 'owner-ceased', 'An alive PID in an earlier boot has ceased');

  // 2. recover proceeds on an owner from an earlier boot and refuses the same owner in the current boot.
  const claim = async (ctx, owner) => {
    const pin = (await readFile(join(ctx.path, '.isswf/install.json'))).toString('base64');
    const record = { format: 1, id: 'reboot', kind: 'migrate', owner, reference: 'Fixture', files: [{ path: '.isswf/install.json', before: pin, after: pin }] };
    await mkdir(join(ctx.path, '.isswf/local/operation'), { recursive: true });
    await writeFile(join(ctx.path, '.isswf/local/operation/owner.json'), JSON.stringify({ id: 'reboot', owner, transaction: record }));
  };
  const refused = await project();
  await claim(refused, live);
  assert.match(refused.cli('recover', ['--id', 'reboot'], false).stderr, /Migration owner is live or uncertain; recovery refused/u);
  assert.equal(existsSync(join(refused.path, '.isswf/local/operation')), true, 'A live owner keeps its claim');
  const recovered = await project();
  await claim(recovered, rebooted);
  assert.deepEqual(JSON.parse(recovered.cli('recover', ['--id', 'reboot']).stdout), { status: 'recovered', id: 'reboot' });
  assert.equal(existsSync(join(recovered.path, '.isswf/local/operation')), false, 'The claim of an earlier boot is retired');
  assert.deepEqual(await readJSON(join(recovered.path, '.isswf/local/transactions/reboot/recovered.json')), { format: 1, id: 'reboot', state: 'restored-before' });

  // 3. recover-state proceeds on a migration claim from an earlier boot and refuses the current boot's owner.
  const stateClaim = async (owner) => {
    const ctx = await project(true);
    await mkdir(join(ctx.path, '.factory'));
    await writeFile(join(ctx.path, '.factory/project-setup.md'), 'Legacy setup\n');
    const preview = JSON.parse(ctx.cli('inspect').stdout).stateMigration;
    const journal = join(ctx.store, 'state-migrations', digest(ctx.path), 'S0001');
    const record = { format: 1, id: 'S0001', kind: 'move', project: ctx.path, expected: preview.expected, reference: 'Fixture', owner, files: preview.files };
    await mkdir(join(ctx.path, '.isswf-transition'));
    await writeFile(join(ctx.path, '.isswf-transition/owner.json'), JSON.stringify({ format: 1, id: 'S0001', recordPath: journal, owner, record }));
    return { ...ctx, journal };
  };
  const stateRefused = await stateClaim(live);
  assert.match(stateRefused.cli('recover-state', ['--id', 'S0001'], false).stderr, /State migration owner is live or uncertain/u);
  assert.equal(existsSync(join(stateRefused.path, '.isswf-transition')), true, 'A live owner keeps its transition claim');
  const stateRecovered = await stateClaim(rebooted);
  assert.deepEqual(JSON.parse(stateRecovered.cli('recover-state', ['--id', 'S0001']).stdout), { status: 'state-recovered', id: 'S0001', activeDirectory: '.factory' });
  assert.equal(existsSync(join(stateRecovered.path, '.isswf-transition')), false, 'The transition claim of an earlier boot is cleared');
  assert.equal(await readFile(join(stateRecovered.path, '.factory/project-setup.md'), 'utf8'), 'Legacy setup\n');
  assert.deepEqual((await readdir(stateRecovered.journal)).sort(), ['phase.json', 'record.json', 'recovered.json']);

  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, node: process.version, scenarios: ['lease', 'recover', 'recover-state'] }));
} catch (error) { keep = true; console.error('Retained failing fixture: ' + temp); throw error; }
finally { if (!keep) await rm(temp, { recursive: true, force: true }); }
