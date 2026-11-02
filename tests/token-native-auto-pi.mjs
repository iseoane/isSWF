import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = await mkdtemp(join(tmpdir(), 'pi-native-auto-'));
try {
  const extensionPath = pathToFileURL(join(process.cwd(), 'tools/token-native-pi.mjs')).href;
  const makeHost = () => {
    const handlers = new Map(), listeners = new Map();
    let cost = { version: 1, parent: { input: 1, output: 2, cacheRead: 3, cacheWrite: 4 }, children: [], unresolvedAsyncChildren: 0 };
    let requests = 0;
    const pi = {
      on(name, fn) { handlers.set(name, fn); },
      registerCommand() {},
      events: {
        on(name, fn) { listeners.set(name, fn); return () => listeners.delete(name); },
        emit(name, request) {
          if (name !== 'subagents:rpc:v1:request') return;
          requests++;
          const data = request.method === 'ping' ? { version: 1, capabilities: { cost: { version: 1 } } } : cost;
          listeners.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({ version: 1, requestId: request.requestId, success: true, data });
        },
      },
    };
    return { pi, handlers, setCost(value) { cost = value; }, get requests() { return requests; }, emitCompletion(runId) { listeners.get('subagent:async-complete')?.({ runId }); } };
  };
  const ctx = branch => ({ cwd: root, sessionManager: { getSessionId: () => 'test-session', getBranch: () => branch.map(id => ({ id })) }, ui: { setStatus() {} } });
  const waitFile = async (path, records = 1) => {
    for (let index = 0; index < 100; index++) {
      try {
        const value = JSON.parse(await readFile(path, 'utf8'));
        if (value.records.length >= records) return value;
      } catch {}
      await new Promise(resolve => setImmediate(resolve));
    }
    throw Error('automatic capture did not write its expected record');
  };

  const disabled = makeHost();
  await mkdir(join(root, '.factory'), { recursive: true });
  await writeFile(join(root, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: false, destination: '.factory/native-usage' }));
  (await import(extensionPath)).default(disabled.pi);
  await disabled.handlers.get('session_start')({ reason: 'startup' }, ctx(['entry-a']));
  assert.equal(disabled.requests, 0, 'disabled capture makes no cost RPC requests');
  assert.equal(disabled.handlers.has('agent_settled'), true);

  const enabled = makeHost();
  await writeFile(join(root, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: '.factory/native-usage' }));
  (await import(extensionPath)).default(enabled.pi);
  await enabled.handlers.get('session_start')({ reason: 'startup' }, ctx(['entry-a']));
  const sessionKey = createHash('sha256').update('test-session').digest('hex').slice(0, 24);
  const path = join(root, `.factory/native-usage/${sessionKey}.json`);
  const baseline = await waitFile(path);
  assert.equal(baseline.baseline.rows[0].counters.input, 1);
  assert.equal(baseline.records.length, 1);
  assert.equal(baseline.records[0].event, 'session-start');
  enabled.setCost({ version: 1, parent: { input: 7, output: 5, cacheRead: 8, cacheWrite: 9 }, children: [{ runId: 'child-private', usage: { input: 4, output: 3, cacheRead: 2, cacheWrite: 1 } }], unresolvedAsyncChildren: 0 });
  await enabled.handlers.get('agent_settled')({}, ctx(['entry-a', 'entry-b']));
  const settled = await waitFile(path, 2);
  assert.equal(settled.latest.rows.length, 2);
  assert.equal(settled.latest.unresolvedAsyncChildren, 0);
  assert.equal(settled.records.length, 2);
  assert.equal(settled.records[1].event, 'agent-settled');
  assert.doesNotMatch(JSON.stringify(settled), /child-private|sessionFile|\/private/u);
  enabled.emitCompletion('run-1');
  enabled.emitCompletion('run-1');
  let completed;
  for (let index = 0; index < 100; index++) {
    completed = JSON.parse(await readFile(path, 'utf8'));
    if (completed.records.some(record => record.event === 'async-complete')) break;
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(completed.records.filter(record => record.event === 'async-complete').length, 1);
  assert.ok(enabled.requests >= 6, 'enabled capture requests ping/cost automatically at lifecycle boundaries');
  const converted = spawnSync(process.execPath, ['tools/token-native-summary.mjs', '--capture', path, '--id', 'task', '--window', 'w', '--effort', 'high', '--task-class', 'task', '--candidate', 'fixture', '--outcome', 'completed', '--accepted', '1'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(converted.status, 0, converted.stderr);
  const summaryPath = join(root, 'window.json');
  await writeFile(summaryPath, converted.stdout);
  const report = spawnSync(process.execPath, ['tools/token-report.mjs', '--input', summaryPath], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(report.status, 0, report.stderr);
  assert.equal(JSON.parse(report.stdout).totals.processed, 29);
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log('PASS: setup-gated automatic Pi snapshots, disabled no-RPC path, settled and duplicate async completion events, privacy allowlist');
