import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, open, readFile, rm, writeFile } from 'node:fs/promises';
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
    let requests = 0, responseGate;
    const pi = {
      on(name, fn) { handlers.set(name, fn); },
      registerCommand() {},
      events: {
        on(name, fn) { listeners.set(name, fn); return () => listeners.delete(name); },
        emit(name, request) {
          if (name !== 'subagents:rpc:v1:request') return;
          requests++;
          const data = request.method === 'ping' ? { version: 1, capabilities: { cost: { version: 1 } } } : cost;
          const reply = () => listeners.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({ version: 1, requestId: request.requestId, success: true, data });
          if (responseGate) responseGate.then(reply); else reply();
        },
      },
    };
    return { pi, handlers, setCost(value) { cost = value; }, holdReplies(promise) { responseGate = promise; }, get requests() { return requests; }, emitCompletion(runId) { listeners.get('subagent:async-complete')?.({ runId }); } };
  };
  const ctx = branch => ({ cwd: root, sessionManager: { getSessionId: () => 'test-session', getBranch: () => branch.map(id => ({ id })) }, ui: { setStatus() {} } });
  const waitUntil = async (predicate, message) => {
    for (let index = 0; index < 1000; index++) {
      if (await predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw Error(message);
  };
  const waitFile = async (path, records = 1) => {
    for (let index = 0; index < 1000; index++) {
      try {
        const value = JSON.parse(await readFile(path, 'utf8'));
        if (value.records.length >= records) return value;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw Error('automatic capture did not write its expected record');
  };

  const disabled = makeHost();
  await mkdir(join(root, '.factory'), { recursive: true });
  await writeFile(join(root, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: false, destination: 'native-usage' }));
  (await import(extensionPath)).default(disabled.pi);
  await disabled.handlers.get('session_start')({ reason: 'startup' }, ctx(['entry-a']));
  assert.equal(disabled.requests, 0, 'disabled capture makes no cost RPC requests');
  assert.equal(disabled.handlers.has('agent_settled'), true);
  await mkdir(join(root, '.isswf'), { recursive: true });
  await writeFile(join(root, '.isswf/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const ambiguous = makeHost();
  (await import(extensionPath)).default(ambiguous.pi);
  await ambiguous.handlers.get('session_start')({ reason: 'startup' }, ctx(['entry-a']));
  assert.equal(ambiguous.requests, 0, 'two active state roots fail closed');
  await rm(join(root, '.isswf'), { recursive: true, force: true });

  const enabled = makeHost();
  await writeFile(join(root, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
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
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.equal(completed.records.filter(record => record.event === 'async-complete').length, 1);
  const repeatedBranch = ctx(['entry-a', 'entry-b']);
  await enabled.handlers.get('agent_settled')({}, repeatedBranch);
  await new Promise(resolve => setImmediate(resolve));
  const unchanged = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(unchanged.records.length, 3, 'unchanged settled branch snapshots are deduplicated');
  const changedCost = { version: 1, parent: { input: 17, output: 5, cacheRead: 8, cacheWrite: 9 }, children: [{ runId: 'child-private', usage: { input: 4, output: 3, cacheRead: 2, cacheWrite: 1 } }], unresolvedAsyncChildren: 1 };
  enabled.setCost(changedCost);
  const reader = await open(path, 'r');
  await enabled.handlers.get('agent_settled')({}, repeatedBranch);
  await new Promise(resolve => setTimeout(resolve, 50));
  await reader.close();
  await waitUntil(async () => JSON.parse(await readFile(path, 'utf8')).latest.rows[0].counters.input === 17, 'changed same-branch counters refresh latest');
  let changed = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(changed.baseline.rows[0].counters.input, 1, 'changed settlement never replaces the first baseline');
  assert.equal(changed.latest.rows[0].counters.input, 17, 'same-boundary changed counters refresh the latest snapshot');
  assert.equal(changed.latest.unresolvedAsyncChildren, 1, 'incomplete child coverage remains visible');
  enabled.setCost({ ...changedCost, unresolvedAsyncChildren: 0 });
  await enabled.handlers.get('agent_settled')({}, repeatedBranch);
  await waitUntil(async () => JSON.parse(await readFile(path, 'utf8')).latest.unresolvedAsyncChildren === 0, 'resolved child coverage refreshes latest');
  changed = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(changed.records.length, 3, 'changed observation updates its keyed row instead of growing history');
  assert.equal(changed.latest.unresolvedAsyncChildren, 0, 'later settled boundary refreshes resolved child coverage');
  assert.equal(changed.records[1].snapshot.rows[0].counters.input, 17, 'same-boundary event row tracks latest counters');
  assert.ok(enabled.requests >= 8, 'enabled capture requests ping/cost automatically at lifecycle boundaries');
  const converted = spawnSync(process.execPath, ['tools/token-native-summary.mjs', '--capture', path, '--id', 'task', '--window', 'w', '--effort', 'high', '--task-class', 'task', '--candidate', 'fixture', '--outcome', 'completed', '--accepted', '1'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(converted.status, 0, converted.stderr);
  const summaryPath = join(root, 'window.json');
  await writeFile(summaryPath, converted.stdout);
  const report = spawnSync(process.execPath, ['tools/token-report.mjs', '--input', summaryPath], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(report.status, 0, report.stderr);
  assert.equal(JSON.parse(report.stdout).totals.processed, 39);

  const isolatedRoot = join(root, 'lifecycle');
  await mkdir(join(isolatedRoot, '.factory'), { recursive: true });
  await writeFile(join(isolatedRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const isolatedCtx = (sessionId, branch = ['entry']) => ({ cwd: isolatedRoot, sessionManager: { getSessionId: () => sessionId, getBranch: () => branch.map(id => ({ id })) }, ui: { setStatus(_key, value) { statuses.push(value); } } });
  const statuses = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const switching = makeHost();
  switching.holdReplies(gate);
  (await import(extensionPath)).default(switching.pi);
  const oldCtx = isolatedCtx('old-session');
  const newCtx = isolatedCtx('new-session');
  void switching.handlers.get('session_start')({ reason: 'startup' }, oldCtx);
  await waitUntil(() => switching.requests > 0, 'first session starts its native cost request');
  await switching.handlers.get('session_shutdown')({ reason: 'resume' }, oldCtx);
  await switching.handlers.get('session_start')({ reason: 'resume' }, newCtx);
  release();
  const newSessionKey = createHash('sha256').update('new-session').digest('hex').slice(0, 24);
  const newSessionPath = join(isolatedRoot, `.factory/native-usage/${newSessionKey}.json`);
  const switched = await waitFile(newSessionPath);
  assert.equal(switched.session, createHash('sha256').update('new-session').digest('hex').slice(0, 24));
  assert.equal(switched.records[0].event, 'session-start', 'new session captures after the in-flight prior session drains');
  const oldSessionKey = createHash('sha256').update('old-session').digest('hex').slice(0, 24);
  await assert.rejects(readFile(join(isolatedRoot, `.factory/native-usage/${oldSessionKey}.json`)), { code: 'ENOENT' });

  const shutdownRoot = join(root, 'shutdown');
  await mkdir(join(shutdownRoot, '.factory'), { recursive: true });
  await writeFile(join(shutdownRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const stopped = makeHost();
  let releaseShutdown;
  stopped.holdReplies(new Promise(resolve => { releaseShutdown = resolve; }));
  (await import(extensionPath)).default(stopped.pi);
  const stoppedCtx = { ...ctx(['entry']), cwd: shutdownRoot };
  void stopped.handlers.get('session_start')({ reason: 'startup' }, stoppedCtx);
  await waitUntil(() => stopped.requests > 0, 'shutdown case starts its native cost request');
  stopped.handlers.get('session_shutdown')({ reason: 'quit' }, stoppedCtx);
  releaseShutdown();
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(readFile(join(shutdownRoot, '.factory/native-usage')), { code: 'ENOENT' }, 'shutdown invalidates the in-flight capture without creating storage');

  const sinkRoot = join(root, 'sink');
  await mkdir(join(sinkRoot, '.factory/native-usage'), { recursive: true });
  await writeFile(join(sinkRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const sinkCtx = { ...ctx(['entry']), cwd: sinkRoot, ui: { setStatus(_key, value) { statuses.push(value); } } };
  const sinkKey = createHash('sha256').update('test-session').digest('hex').slice(0, 24);
  const protectedPath = join(sinkRoot, `.factory/native-usage/${sinkKey}.json`);
  const protectedBytes = '{"operator":"keep"}\n';
  await writeFile(protectedPath, protectedBytes);
  const sink = makeHost();
  (await import(extensionPath)).default(sink.pi);
  await sink.handlers.get('session_start')({ reason: 'startup' }, sinkCtx);
  await waitUntil(() => statuses.includes('Automatic usage capture failed'), 'invalid existing sink reports a visible generic failure');
  assert.equal(await readFile(protectedPath, 'utf8'), protectedBytes, 'capture never overwrites unowned sink data');

  const conflictRoot = join(root, 'conflict');
  await mkdir(join(conflictRoot, '.factory'), { recursive: true });
  await writeFile(join(conflictRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const conflictStatuses = [];
  const conflictCtx = { ...ctx(['entry']), cwd: conflictRoot, ui: { setStatus(_key, value) { conflictStatuses.push(value); } } };
  const conflictKey = createHash('sha256').update('test-session').digest('hex').slice(0, 24);
  const conflictPath = join(conflictRoot, `.factory/native-usage/${conflictKey}.json`);
  const lockPath = `${conflictPath}.lock`;
  await mkdir(join(conflictRoot, '.factory/native-usage'), { recursive: true });
  const competingClaim = 'competing-writer';
  await writeFile(lockPath, competingClaim, { flag: 'wx' });
  const competingWriter = makeHost();
  (await import(extensionPath)).default(competingWriter.pi);
  await competingWriter.handlers.get('session_start')({ reason: 'startup' }, conflictCtx);
  await waitUntil(() => conflictStatuses.includes('Automatic usage capture failed'), 'a competing transaction claim fails closed visibly');
  await assert.rejects(readFile(conflictPath), { code: 'ENOENT' }, 'a conflicted transaction cannot create or clobber capture data');
  assert.equal(await readFile(lockPath, 'utf8'), competingClaim, 'a competing or stale claim is never automatically deleted');

  const interleaveRoot = join(root, 'interleave');
  await mkdir(join(interleaveRoot, '.factory'), { recursive: true });
  await writeFile(join(interleaveRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const interleaveStatuses = [];
  const interleaveCtx = { ...ctx(['entry']), cwd: interleaveRoot, ui: { setStatus(_key, value) { interleaveStatuses.push(value); } } };
  const writerA = makeHost(), writerB = makeHost();
  (await import(extensionPath)).default(writerA.pi);
  (await import(extensionPath)).default(writerB.pi);
  await Promise.all([
    writerA.handlers.get('session_start')({ reason: 'startup' }, interleaveCtx),
    writerB.handlers.get('session_start')({ reason: 'startup' }, interleaveCtx),
  ]);
  const interleaveKey = createHash('sha256').update('test-session').digest('hex').slice(0, 24);
  const interleavePath = join(interleaveRoot, `.factory/native-usage/${interleaveKey}.json`);
  await waitFile(interleavePath);
  writerA.emitCompletion('run-a');
  writerB.emitCompletion('run-b');
  await waitUntil(async () => {
    const state = JSON.parse(await readFile(interleavePath, 'utf8'));
    return state.records.some(record => record.event === 'async-complete') || interleaveStatuses.includes('Automatic usage capture failed');
  }, 'interleaved writers either serialize or expose a fail-closed conflict');
  await new Promise(resolve => setTimeout(resolve, 25));
  const interleaved = JSON.parse(await readFile(interleavePath, 'utf8'));
  const asyncRecords = interleaved.records.filter(record => record.event === 'async-complete');
  assert.ok(asyncRecords.length === 2 || (asyncRecords.length === 1 && interleaveStatuses.includes('Automatic usage capture failed')), 'interleaved writers never silently clobber a competing snapshot');

  const overflowRoot = join(root, 'overflow');
  await mkdir(join(overflowRoot, '.factory'), { recursive: true });
  await writeFile(join(overflowRoot, '.factory/native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'native-usage' }));
  const overflowStatuses = [];
  const overflowCtx = { ...ctx(['entry-a']), cwd: overflowRoot, ui: { setStatus(_key, value) { overflowStatuses.push(value); } } };
  const overflow = makeHost();
  (await import(extensionPath)).default(overflow.pi);
  await overflow.handlers.get('session_start')({ reason: 'startup' }, overflowCtx);
  const overflowKey = createHash('sha256').update('test-session').digest('hex').slice(0, 24);
  const overflowPath = join(overflowRoot, `.factory/native-usage/${overflowKey}.json`);
  await waitFile(overflowPath);
  const fullState = JSON.parse(await readFile(overflowPath, 'utf8'));
  fullState.records = Array.from({ length: 100 }, (_, index) => ({ key: `existing-${index}`, event: 'agent-settled', snapshot: fullState.latest }));
  const fullBytes = `${JSON.stringify(fullState)}\n`;
  await writeFile(overflowPath, fullBytes);
  await overflow.handlers.get('agent_settled')({}, overflowCtx);
  await waitUntil(() => overflowStatuses.includes('Automatic usage capture failed'), 'record overflow fails visibly');
  assert.equal(await readFile(overflowPath, 'utf8'), fullBytes, 'overflow preserves existing capture evidence without truncation');
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log('PASS: setup-gated automatic Pi snapshots, disabled no-RPC path, settled and duplicate async completion events, privacy allowlist');
