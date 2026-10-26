import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ceased, identity, syncDirectory } from '../tools/platform-runtime.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
assert.ok(['linux', 'win32'].includes(process.platform), 'Run the initialization journey on native Linux or Windows');
const temp = await mkdtemp(join(tmpdir(), 'isswf-init-platform-'));
const fixture = join(temp, 'source'), release = join(temp, 'release spaces ñ');
const project = join(temp, 'project spaces ñ'), store = join(temp, 'store spaces ñ');
function run(binary, args, ok = true) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' } });
  assert.ifError(result.error);
  if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  else assert.notEqual(result.status, 0);
  return result;
}
const cli = (...args) => run(process.execPath, [join(release, 'tools/isswf.mjs'), ...args, '--project', project, '--store', store]);
let passed = false;
try {
  const owner = await identity();
  assert.equal(await ceased(owner), false, 'A live owner must block recovery');
  assert.equal(await ceased({}), false);
  assert.equal(await ceased({ ...owner, pid: -1 }), false);
  assert.equal(await ceased({ platform: process.platform === 'win32' ? 'linux' : 'win32', pid: process.pid }), false);
  const moduleURL = pathToFileURL(join(source, 'tools/platform-runtime.mjs')).href;
  const child = JSON.parse(run(process.execPath, ['--input-type=module', '-e', `const {identity}=await import(${JSON.stringify(moduleURL)}); console.log(JSON.stringify(await identity()));`]).stdout);
  assert.equal(await ceased(child), true, 'A terminated child is recoverable');
  if (process.platform === 'win32') {
    assert.equal(await ceased({ ...owner, startTime: '2000-01-01T00:00:00.0000000Z' }), true, 'A reused PID is not the recorded owner');
    const unavailable = `import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module'; cp.spawnSync = () => ({status:1,stdout:''}); syncBuiltinESMExports(); const m=await import(${JSON.stringify(moduleURL)}); console.log(await m.ceased(${JSON.stringify(owner)})); try { await m.identity(); process.exitCode=2; } catch {}`;
    assert.equal(run(process.execPath, ['--input-type=module', '-e', unavailable]).stdout.trim(), 'false', 'Unavailable CIM evidence cannot authorize recovery');
  } else {
    await assert.rejects(syncDirectory(join(temp, 'absent-directory')), { code: 'ENOENT' });
  }
  await syncDirectory(temp);
  run('git', ['clone', '-q', '--shared', source, fixture]);
  for (const file of ['isswf.mjs', 'platform-runtime.mjs']) await cp(join(source, 'tools', file), join(fixture, 'tools', file));
  run('git', ['-C', fixture, 'add', 'tools/isswf.mjs', 'tools/platform-runtime.mjs']);
  run('git', ['-C', fixture, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'Platform init candidate']);
  const revision = run('git', ['-C', fixture, 'rev-parse', 'HEAD']).stdout.trim();
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', fixture, '--revision', revision, '--output', release, '--runtime', 'node']);
  await mkdir(project);
  run('git', ['init', '-q', project]);
  assert.equal(JSON.parse(cli('inspect').stdout).status, 'not-initialized');
  assert.equal(JSON.parse(cli('init', '--tracking', 'local').stdout).status, 'initialized');
  const pin = await readFile(join(project, '.isswf/install.json'));
  const models = await readFile(join(project, '.isswf/models.json'));
  assert.equal(JSON.parse(cli('inspect').stdout).status, 'current');
  assert.equal(JSON.parse(cli('init', '--tracking', 'local').stdout).status, 'unchanged');
  assert.deepEqual(await readFile(join(project, '.isswf/install.json')), pin);
  assert.deepEqual(await readFile(join(project, '.isswf/models.json')), models);
  assert.equal((await readdir(join(project, '.isswf/local'))).includes('operation'), false);
  const transactions = await readdir(join(project, '.isswf/local/transactions'));
  assert.equal(transactions.length, 1);
  const record = JSON.parse(await readFile(join(project, '.isswf/local/transactions', transactions[0], 'record.json'), 'utf8'));
  assert.equal(await ceased(record.owner), true);
  // A file sync failure must still fail initialization, never become success.
  const preload = join(temp, 'sync-failure.mjs');
  await writeFile(preload, `import fs from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module'; const original = fs.open; fs.open = async (...args) => { const handle = await original(...args); if (args[1] === 'wx') handle.sync = async () => { throw Object.assign(new Error('injected file sync failure'), {code:'EIO'}); }; return handle; }; syncBuiltinESMExports();`);
  const second = join(temp, 'second project'); await mkdir(second); run('git', ['init', '-q', second]);
  const failed = run(process.execPath, ['--import', pathToFileURL(preload).href, join(release, 'tools/isswf.mjs'), 'init', '--project', second, '--store', join(temp, 'second store'), '--tracking', 'local'], false);
  assert.match(failed.stderr, /injected file sync failure/u);
  await assert.rejects(readFile(join(second, '.isswf/install.json')), { code: 'ENOENT' });
  passed = true;
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, revision, checks: ['live/ceased/malformed owner', 'directory sync policy', 'built Node release init and repeat', 'pin/model preservation', 'file sync failure propagates'], limits: 'No Bun compiler, provider, worker isolation or full migration/recovery journey is exercised.' }));
} finally {
  if (passed) await rm(temp, { recursive: true, force: true });
  else console.error(`Preserved failing platform fixture: ${temp}`);
}
