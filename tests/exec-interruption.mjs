import { cloneRepository, initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Journey: a real `isswf exec` launcher runs a stub tool child. A signal that reaches the launcher while the child
// runs must leave the lease until the child exits, then remove it whatever the child's exit signal. A launcher that
// dies leaves its lease, which inspect and recover then report with the owner's ceased verdict instead of a bare
// blocker. Test seam: `node --import` emits the signal inside the launcher, because Windows cannot deliver
// SIGINT, SIGHUP or SIGBREAK to a process that has no console attached. Production code has no hook.
const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-exec-')));
const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), resolve(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(path => path && isAbsolute(path) && existsSync(path));
assert.ok(npm, 'A Node.js installation with npm CLI is required');
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', npm_config_cache: join(temp, 'npm-cache') };
const sleep = ms => new Promise(done => setTimeout(done, ms));
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
function run(binary, args, ok = true) {
  const result = spawnSync(binary, args, { cwd: temp, env, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  assert.ifError(result.error);
  if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  else assert.notEqual(result.status, 0, `Expected refusal: ${binary} ${args.join(' ')}`);
  return result;
}
async function until(label, condition) {
  for (let count = 0; count < 600; count++) { const value = await condition(); if (value) return value; await sleep(50); }
  throw Error('Timed out waiting for ' + label);
}

// The stub replaces the status tool: it reports its PID, waits for a stop file, then ends by SIGTERM (or plain exit
// on Windows, where a self-sent signal is a hard stop). A hard timeout keeps a failed run from leaking it.
const stub = `import { existsSync, writeFileSync } from 'node:fs';
writeFileSync(process.env.ISSWF_TEST_READY, String(process.pid));
setTimeout(() => process.exit(9), 60000);
setInterval(() => { if (existsSync(process.env.ISSWF_TEST_STOP)) process.kill(process.pid, 'SIGTERM'); }, 25);
`;
const preload = join(temp, 'emit-signal.mjs');
await writeFile(preload, `import { existsSync } from 'node:fs';
const timer = setInterval(() => {
  if (!existsSync(process.env.ISSWF_TEST_TRIGGER)) return;
  clearInterval(timer);
  process.emit(process.env.ISSWF_TEST_SIGNAL);
}, 25);
timer.unref();
`);

const children = new Set();
let release, counter = 0;
async function scenario(options = {}) {
  const name = 'exec ' + ++counter + ' ñ', root = join(temp, name);
  await mkdir(root);
  const project = await realpath(root), store = join(temp, name + ' store');
  initRepository(project);
  const files = { ready: join(temp, name + '.ready'), stop: join(temp, name + '.stop'), trigger: join(temp, name + '.trigger') };
  const common = ['--project', project, '--store', store];
  const cli = (command, args = [], ok = true) => run(process.execPath, [join(release, 'tools/isswf.mjs'), command, ...common, ...args], ok);
  assert.equal(JSON.parse(cli('init', ['--tracking', 'local']).stdout).status, 'initialized');
  const childEnv = { ...env, ISSWF_TEST_READY: files.ready, ISSWF_TEST_STOP: files.stop, ISSWF_TEST_TRIGGER: files.trigger, ISSWF_TEST_SIGNAL: options.signal || 'SIGINT' };
  const imports = options.signal ? ['--import', pathToFileURL(preload).href] : [];
  const launcher = spawn(process.execPath, [...imports, join(release, 'tools/isswf.mjs'), 'exec', ...common, '--', 'isswf-status', '--initiative', 'I0001'], { env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  children.add(launcher);
  let output = '', settled = null;
  for (const stream of [launcher.stdout, launcher.stderr]) stream.on('data', bytes => { output += bytes; });
  const exited = new Promise((done, reject) => { launcher.once('error', reject); launcher.once('exit', (code, signal) => { settled = { code, signal }; done(settled); }); });
  const toolPid = Number(await until('the tool child to start', async () => existsSync(files.ready) && await readFile(files.ready, 'utf8')));
  const leaseDir = join(project, '.isswf/local/leases');
  const [leaseName] = await readdir(leaseDir);
  return { project, files, cli, launcher, exited, settled: () => settled, output: () => output, toolPid, leaseDir, leaseName, lease: join(leaseDir, leaseName) };
}
const stopTool = async ctx => { await writeFile(ctx.files.stop, ''); };

let keep = false;
try {
  const fixture = join(temp, 'source');
  cloneRepository(source, fixture, ['--shared']);
  for (const path of ['tools', '.agents', 'agents', 'skills', 'hooks', 'types', '.claude-plugin', 'package.json', 'docs', '.factory/templates']) await cp(join(source, path), join(fixture, path), { recursive: true, force: true });
  await writeFile(join(fixture, 'tools/isswf-status.mjs'), stub);
  const git = (...args) => run('git', ['-C', fixture, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args]).stdout.trim();
  git('add', '-A'); git('commit', '--allow-empty', '-qm', 'Fixture release with a stub tool');
  release = join(temp, 'release');
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', fixture, '--revision', git('rev-parse', 'HEAD'), '--output', release, '--runtime', 'node']);

  // 1. A signal reaching the launcher is handled, and the lease outlives the child until it exits.
  const handled = ['SIGINT', 'SIGHUP', 'SIGBREAK'].map(async signal => {
    const ctx = await scenario({ signal });
    const lease = await readJSON(ctx.lease);
    assert.equal(lease.tool, 'isswf-status', `${signal}: lease names the tool`);
    assert.equal(lease.child, ctx.toolPid, `${signal}: lease names the tool child PID`);
    await writeFile(ctx.files.trigger, '');
    await sleep(750);
    assert.equal(ctx.settled(), null, `${signal}: the launcher keeps waiting for its child\n${ctx.output()}`);
    assert.equal(existsSync(ctx.lease), true, `${signal}: the lease stays while the child runs`);
    await stopTool(ctx);
    await Promise.race([ctx.exited, sleep(30000).then(() => { throw Error(`${signal}: launcher did not exit after its child`); })]);
    assert.equal(existsSync(ctx.lease), false, `${signal}: the lease is removed once the child has exited, whatever its exit signal\n${ctx.output()}`);
    assert.deepEqual(JSON.parse(ctx.cli('inspect').stdout).blockers, [], `${signal}: nothing blocks recovery afterwards`);
    return signal;
  });

  // 2. A launcher that dies leaves its lease; inspect and recover name the owner's verdict and clear nothing.
  const stale = (async () => {
    const ctx = await scenario();
    const lease = await readJSON(ctx.lease);
    assert.equal(lease.child, ctx.toolPid, 'Lease names the tool child PID');
    ctx.launcher.kill('SIGKILL');
    await Promise.race([ctx.exited, sleep(15000).then(() => { throw Error('Launcher did not end'); })]);
    await stopTool(ctx);
    await writeFile(join(ctx.leaseDir, 'damaged.json'), '{"owner":');
    const blockers = JSON.parse(ctx.cli('inspect').stdout).blockers;
    const entry = blockers.find(blocker => blocker.lease === ctx.leaseName);
    assert.equal(entry?.state, 'owner-ceased', 'A lease whose launcher ceased is reported with that verdict');
    assert.equal(entry.tool, 'isswf-status');
    assert.equal(entry.child, ctx.toolPid, 'The report names the child PID to check');
    assert.equal(blockers.find(blocker => blocker.lease === 'damaged.json')?.state, 'unreadable', 'A damaged lease is reported, not fatal');
    const pin = (await readFile(join(ctx.project, '.isswf/install.json'))).toString('base64');
    await mkdir(join(ctx.project, '.isswf/local/operation'));
    const record = { format: 1, id: 'stale', kind: 'migrate', owner: lease.owner, reference: 'Fixture', files: [{ path: '.isswf/install.json', before: pin, after: pin }] };
    await writeFile(join(ctx.project, '.isswf/local/operation/owner.json'), JSON.stringify({ id: 'stale', owner: lease.owner, transaction: record }));
    assert.match(ctx.cli('recover', ['--id', 'stale'], false).stderr, /owner-ceased/u, 'recover refuses a stale lease with a named reason');
    assert.deepEqual((await readdir(ctx.leaseDir)).sort(), ['damaged.json', ctx.leaseName].sort(), 'No lease is removed automatically');
    return 'stale';
  })();

  const results = await Promise.all([...handled, stale]);
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, node: process.version, scenarios: results }));
} catch (error) { keep = true; console.error('Retained failing fixture: ' + temp); throw error; }
finally {
  for (const child of children) child.kill('SIGKILL');
  await sleep(250);
  if (!keep) await rm(temp, { recursive: true, force: true });
}
