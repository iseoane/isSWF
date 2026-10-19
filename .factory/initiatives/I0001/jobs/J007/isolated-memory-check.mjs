import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Job-local verification harness, not a deployed MCP adapter or user configuration.
assert.ok(isAbsolute(process.argv[2] ?? ''), 'supply the absolute existing Engram executable');
const binary = fs.realpathSync(process.argv[2]);
const root = fs.mkdtempSync('/tmp/isswf-engram-separated-');
const fixtures = [
  { project: 'fixture-coral', marker: 'only-coral-decision-814', title: 'Only coral decision' },
  { project: 'fixture-violet', marker: 'only-violet-decision-927', title: 'Only violet decision' },
];
function sandbox(fixture) {
  return ['--unshare-all', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv',
    '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64',
    '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/runtime', '--ro-bind', binary, '/runtime/engram',
    '--bind', fixture.home, '/home', '--bind', fixture.data, '/data', '--chdir', '/home', '--remount-ro', '/',
    '--setenv', 'PATH', '/usr/bin:/bin', '--setenv', 'HOME', '/home', '--setenv', 'ENGRAM_DATA_DIR', '/data',
    '--setenv', 'ENGRAM_CLOUD_AUTOSYNC', '0', '--setenv', 'ENGRAM_NO_UPDATE_CHECK', '1'];
}
function cli(fixture, ...args) {
  const result = spawnSync('bwrap', [...sandbox(fixture), '/runtime/engram', ...args], { env: { PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
async function observe(fixture, other) {
  assert.ok(fs.existsSync(other.data + '/engram.db'), 'foreign positive-control database exists on host');
  const hidden = spawnSync('bwrap', [...sandbox(fixture), '/usr/bin/test', '!', '-e', other.data + '/engram.db'], { env: { PATH: '/usr/bin:/bin' }, timeout: 10000 });
  assert.equal(hidden.status, 0, 'other store is not mounted in this process profile');
  const child = spawn('bwrap', [...sandbox(fixture), '/runtime/engram', 'mcp', '--tools=agent', '--project', fixture.project], { env: { PATH: '/usr/bin:/bin' }, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  let sequence = 0, buffer = '', stderr = '';
  const fail = error => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); } pending.clear(); };
  const closed = new Promise(resolve => child.once('close', (code, signal) => { fail(Error('MCP closed')); resolve({ code, signal }); }));
  child.once('error', fail);
  child.stdin.on('error', fail);
  child.stderr.on('data', bytes => { stderr += bytes; if (stderr.length > 16000) { fail(Error('stderr limit')); child.kill('SIGTERM'); } });
  child.stdout.on('data', bytes => {
    buffer += bytes;
    if (buffer.length > 256000) { fail(Error('response limit')); child.kill('SIGTERM'); return; }
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line), item = pending.get(response.id);
        if (item) { pending.delete(response.id); clearTimeout(item.timer); response.error ? item.reject(Error(JSON.stringify(response.error))) : item.resolve(response.result); }
      } catch (error) { fail(error); }
    }
  });
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('MCP timeout: ' + method)); }, 10000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const call = async (name, args) => {
    const result = await request('tools/call', { name, arguments: args });
    assert.notEqual(result.isError, true);
    return JSON.parse(result.content.filter(item => item.type === 'text').map(item => item.text).join('\n'));
  };
  let result;
  try {
    const initialized = await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'isswf-separated-store-fixture', version: '1' } });
    assert.equal(initialized.serverInfo.name, 'engram');
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const own = await call('mem_search', { query: fixture.marker, project: fixture.project, scope: 'project', limit: 3 });
    assert.equal(own.results.length, 1); assert.equal(own.results[0].project, fixture.project); assert.ok(own.result.includes(fixture.marker));
    const foreignWide = await call('mem_search', { query: other.marker, all_projects: true, scope: 'project', limit: 3 });
    assert.equal((foreignWide.results ?? []).length, 0); assert.match(foreignWide.result, /^No memories found for:/);
    const ownWide = await call('mem_search', { query: fixture.marker, all_projects: true, scope: 'project', limit: 3 });
    assert.equal(ownWide.results.length, 1); assert.equal(ownWide.results[0].project, fixture.project);
    const context = await call('mem_context', { project: fixture.project, scope: 'project', max_bytes: 4000, compact: true });
    assert.equal(context.project, fixture.project);
    assert.equal(context.project_source, 'explicit_override');
    assert.ok(context.result.includes(fixture.title));
    for (const forbidden of [other.title, other.project, other.marker]) assert.equal(context.result.includes(forbidden), false);
    result = { project: fixture.project, server: initialized.serverInfo, own, foreignWide, ownWide, context, otherDatabaseExistsOnHost: true, sameProfilePathAbsenceControl: true, pathControlScope: 'Separate command using the identical bwrap mount profile; not an in-process MCP filesystem tool' };
  } finally {
    child.stdin.end(); child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 1000);
    try { const exit = await closed; if (result) result.processExit = exit; } finally { clearTimeout(timer); }
  }
  return result;
}
try {
  for (const fixture of fixtures) {
    fixture.home = root + '/' + fixture.project + '-home'; fixture.data = root + '/' + fixture.project + '-data';
    fs.mkdirSync(fixture.home); fs.mkdirSync(fixture.data);
    cli(fixture, 'save', fixture.title, fixture.marker, '--project', fixture.project, '--scope', 'project');
    assert.ok(fs.statSync(fixture.data + '/engram.db').isFile());
  }
  const controls = fixtures.map(fixture => ({ project: fixture.project, ownSearch: cli(fixture, 'search', fixture.marker, '--project', fixture.project) }));
  for (let index = 0; index < fixtures.length; index++) {
    assert.ok(controls[index].ownSearch.includes(fixtures[index].marker));
    assert.ok(controls[index].ownSearch.includes('project: ' + fixtures[index].project));
    assert.equal(controls[index].ownSearch.startsWith('No memories found for:'), false);
  }
  const observations = [];
  for (let index = 0; index < fixtures.length; index++) observations.push(await observe(fixtures[index], fixtures[1 - index]));
  const source = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
  const fallback = spawnSync(process.execPath, [source + '/tests/project-context-handoff.mjs', source], { env: { PATH: process.env.PATH, HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  assert.equal(fallback.status, 0, fallback.stderr);
  const sourceOnlyAfterServerExit = { command: 'node tests/project-context-handoff.mjs <source>', exitCode: fallback.status, stdout: fallback.stdout, scope: 'Explicit source-only prepare after both synthetic servers exited, not an automatic outage handler or interruption of the user server' };
  console.log(JSON.stringify({ version: 1, status: 'PASS-bounded-separated-store-case', binarySha256: createHash('sha256').update(fs.readFileSync(binary)).digest('hex'), controls, observations, sourceOnlyAfterServerExit,
    scope: 'Actual installed Engram MCP; separate synthetic stores and restricted process namespaces, both directions',
    limits: ['Not the configured user server, current parent session or a client deployment', 'Does not fix shared-store summaries; that counterexample remains valid', 'One bounded local configuration, not universal authorization or cloud isolation', 'No global configuration, installation, real credentials or client data'] }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
