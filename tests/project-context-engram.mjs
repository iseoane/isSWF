import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, lstat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

// Optional installed integration: never use the user's store or inherit cloud/auth configuration.
// Intentionally outside portable aggregate checks: Engram is not a factory dependency.
const binary = process.argv[2];
assert.ok(binary && isAbsolute(binary), 'supply the absolute existing Engram executable');
const executable = await realpath(binary);
const root = await mkdtemp(join(tmpdir(), 'isswf-context-boundary-'));
const observations = [];
try {
  await mkdir(join(root, 'home'));
  await mkdir(join(root, 'data'));
  const sandbox = ['--unshare-all', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/runtime', '--ro-bind', executable, '/runtime/engram', '--bind', join(root, 'home'), '/home', '--bind', join(root, 'data'), '/data', '--chdir', '/home', '--remount-ro', '/', '--setenv', 'PATH', '/usr/bin:/bin', '--setenv', 'HOME', '/home', '--setenv', 'ENGRAM_DATA_DIR', '/data', '--setenv', 'ENGRAM_PROJECT', 'fixture-foreign', '--setenv', 'ENGRAM_CLOUD_AUTOSYNC', '0', '--setenv', 'ENGRAM_NO_UPDATE_CHECK', '1', '/runtime/engram'];
  function run(...args) {
    const result = spawnSync('bwrap', [...sandbox, ...args], { cwd: root, env: { PATH: '/usr/bin:/bin' }, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    observations.push({ args, exitCode: result.status, stdout: result.stdout });
    return result.stdout;
  }
  const version = run('version').trim();
  const own = 'synthetic-current-decision-coral814';
  const foreign = 'synthetic-foreign-decision-violet927';
  run('save', 'Current decision', own, '--project', 'fixture-own', '--scope', 'project');
  run('save', 'Foreign decision', foreign, '--project', 'fixture-foreign', '--scope', 'project');
  const database = await lstat(join(root, 'data', 'engram.db'));
  assert.ok(database.isFile() && !database.isSymbolicLink(), 'fixture database must be created in the only mounted data directory');
  // Each CLI invocation is a new process, with an intentionally conflicting default project.
  const recovered = run('search', own, '--project', 'fixture-own', '--scope', 'project');
  assert.ok(recovered.includes(own) && recovered.includes('project: fixture-own'));
  const rejected = run('search', foreign, '--project', 'fixture-own', '--scope', 'project');
  assert.match(rejected, /^No memories found for:/);
  const context = run('context', '--project', 'fixture-own', '--scope', 'project');
  assert.ok(context.includes(own));
  assert.ok(!context.includes(foreign));
  const otherContext = run('context', '--project', 'fixture-foreign', '--scope', 'project');
  assert.ok(otherContext.includes(foreign) && !otherContext.includes(own));
  let mcp;
  if (process.argv.includes('--mcp')) {
    const child = spawn('bwrap', [...sandbox, 'mcp', '--tools=agent', '--project', 'fixture-foreign'], { cwd: root, env: { PATH: '/usr/bin:/bin' }, stdio: ['pipe', 'pipe', 'pipe'] });
    const pending = new Map();
    let sequence = 0, buffer = '', stderr = '';
    const failPending = error => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); } pending.clear(); };
    const closed = new Promise(resolve => child.once('close', (code, signal) => { failPending(Error('MCP process closed')); resolve({ code, signal }); }));
    child.once('error', failPending);
    child.stdin.on('error', failPending);
    child.stderr.on('data', bytes => { stderr += bytes; if (stderr.length > 16000) child.kill('SIGTERM'); });
    child.stdout.on('data', bytes => {
      buffer += bytes;
      if (buffer.length > 256000) { failPending(Error('bounded MCP response exceeded')); child.kill('SIGTERM'); return; }
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line), item = pending.get(response.id);
          if (item) { pending.delete(response.id); clearTimeout(item.timer); response.error ? item.reject(Error(JSON.stringify(response.error))) : item.resolve(response.result); }
        } catch (error) { failPending(error); }
      }
    });
    const request = (method, params) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(Error('MCP request timed out: ' + method)); }, 10000);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
    const toolPayload = response => {
      assert.notEqual(response.isError, true);
      const text = response.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
      return JSON.parse(text);
    };
    try {
      const initialized = await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'isswf-context-test', version: '1' } });
      assert.equal(initialized.serverInfo.name, 'engram');
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      const tools = await request('tools/list', {});
      assert.equal(tools.tools.find(tool => tool.name === 'mem_search')?.inputSchema.properties.project.type, 'string');
      const selected = toolPayload(await request('tools/call', { name: 'mem_search', arguments: { query: own, project: 'fixture-own', scope: 'project', limit: 3 } }));
      assert.equal(selected.project, 'fixture-own');
      assert.equal(selected.project_source, 'explicit_override');
      assert.equal(selected.results.length, 1);
      assert.ok(selected.results.every(item => item.project === 'fixture-own'));
      assert.ok(selected.result.includes(own));
      const excluded = toolPayload(await request('tools/call', { name: 'mem_search', arguments: { query: foreign, project: 'fixture-own', scope: 'project', limit: 3 } }));
      assert.equal(excluded.project, 'fixture-own');
      assert.equal((excluded.results ?? []).length, 0);
      assert.match(excluded.result, /^No memories found for:/);
      const recalled = await request('tools/call', { name: 'mem_context', arguments: { project: 'fixture-own', scope: 'project', max_bytes: 4000, compact: true } });
      assert.notEqual(recalled.isError, true);
      const recalledPayload = toolPayload(recalled);
      assert.equal(recalledPayload.project, 'fixture-own');
      assert.ok(recalledPayload.result.includes('**Current decision**'));
      assert.equal(recalledPayload.result.includes('**Foreign decision**'), false);
      const foreignMetadata = recalledPayload.result.includes('fixture-foreign');
      mcp = { server: initialized.serverInfo, protocol: initialized.protocolVersion, selected, excluded, recalled: recalledPayload, processDefaultProject: 'fixture-foreign', requestProject: 'fixture-own', contextSummaryIsolation: { status: foreignMetadata ? 'blocked' : 'not-established', observedForeignProjectMetadata: foreignMetadata, approvedForClientUse: false, reason: foreignMetadata ? 'Explicit-project shared-store context summary includes another project name in global statistics' : 'This bounded probe alone does not approve client isolation' } };
    } finally {
      child.stdin.end(); child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 1000);
      try { const exit = await closed; if (mcp) mcp.processExit = exit; } finally { clearTimeout(timer); }
    }
  }
  if (mcp) process.exitCode = 2;
  console.log(JSON.stringify({ status: mcp ? 'BLOCKED-CLIENT-CONTEXT-SUMMARY' : 'PASS', executable, binarySha256: createHash('sha256').update(await readFile(executable)).digest('hex'), version, isolation: 'Actual bwrap: only synthetic home/data writable, host home/store unmounted, network namespace isolated; no environment credentials', observations, mcp, checks: ['fixture database created in mounted data directory', 'fresh-process own-project recall', 'explicit project overrides conflicting process default', 'foreign observation absent from scoped search and context', 'reverse separation', ...(mcp ? ['actual MCP scoped search retrieves only own observation despite conflicting default', 'context summary exposes explicit content/metadata isolation result; no client approval inferred'] : [])], limits: ['Actual installed CLI; additional MCP diagnostic only with --mcp, synthetic disposable store, not the user configured server/store or cloud', 'Project selectors are cooperative selection, not access-control credentials; broad queries remain possible', 'No claim of semantic secret detection, autonomous context selection, real service outage or client-ready isolation'] }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
