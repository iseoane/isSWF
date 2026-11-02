import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalizeNative } from '../tools/token-native-summary.mjs';
import { normalizePiCost, requestCost, writeExclusive } from '../tools/token-native-pi.mjs';

const root = await mkdtemp(join(tmpdir(), 'native usage ü-'));
try {
  const cost = { version: 1, parent: { input: 100, output: 20, cacheRead: 7, cacheWrite: 2 }, children: [{ runId: 'private-run-id', sessionFile: '/private/path', usage: { input: 50, output: 10, cacheRead: 3, cacheWrite: 1 } }], childTotal: { input: 50, output: 10, cacheRead: 3, cacheWrite: 1 }, total: { input: 150, output: 30, cacheRead: 10, cacheWrite: 3 }, unresolvedAsyncChildren: 0 };
  const snap = normalizePiCost(cost, '0123456789abcdef01234567', ['abcdefabcdefabcdefabcdef']);
  assert.equal(snap.rows.length, 2);
  assert.equal(snap.rows[0].counters.input + snap.rows[1].counters.input, 150);
  assert.doesNotMatch(JSON.stringify(snap), /private-run-id|private\/path/u);
  assert.equal(normalizePiCost({ ...cost, unresolvedAsyncChildren: 1 }, 'session', []).unresolvedAsyncChildren, 1);
  assert.throws(() => normalizePiCost({ ...cost, children: [{ ...cost.children[0], runId: undefined, sessionFile: undefined, agent: 'private-agent' }] }, 'session', []));

  const end = structuredClone(snap);
  end.branch.push('bbbbbbbbbbbbbbbbbbbbbbbb');
  end.rows[0].counters.input = 110;
  end.rows[1].counters.input = 80;
  const summary = normalizeNative({ input: end, start: snap, meta: { host: 'pi', id: 'job', window: 'window', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'new', outcome: 'accepted', accepted: 1 } });
  assert.deepEqual(summary.rows.map(row => row.counters.input), [10, 30]);
  assert.deepEqual(summary.rows.map(row => row.scope), ['unattributed', 'agent']);
  const unresolved = normalizePiCost({ ...cost, unresolvedAsyncChildren: 1 }, 'session', []);
  const partial = normalizeNative({ input: unresolved, meta: { host: 'pi', id: 'job', window: 'snapshot', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'c', outcome: 'o', accepted: 0 } });
  assert.equal(partial.rows.at(-1).counters.input, null);
  assert.equal(partial.rows.at(-1).scope, 'unattributed');
  assert.throws(() => normalizeNative({ input: unresolved, start: snap, meta: { host: 'pi', id: 'job', window: 'window', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'new', outcome: 'accepted', accepted: 1 } }));
  assert.throws(() => normalizeNative({ input: { ...end, branch: ['ffffffffffffffffffffffff'] }, start: snap, meta: { host: 'pi', id: 'job', window: 'window', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'new', outcome: 'accepted', accepted: 1 } }));
  const decreased = structuredClone(end); decreased.rows[0].counters.output = 0;
  assert.throws(() => normalizeNative({ input: decreased, start: snap, meta: { host: 'pi', id: 'job', window: 'window', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'new', outcome: 'accepted', accepted: 1 } }));
  const missingChild = structuredClone(end); missingChild.rows.pop();
  assert.throws(() => normalizeNative({ input: missingChild, start: snap, meta: { host: 'pi', id: 'job', window: 'window', hostVersion: '1.5.0', effort: 'high', taskClass: 'task', candidate: 'new', outcome: 'accepted', accepted: 1 } }));

  const claude = { session_id: 'private-session', modelUsage: { modelA: { inputTokens: 7, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 1 }, modelB: { inputTokens: 5, outputTokens: 4, cacheReadInputTokens: 0, cacheCreationInputTokens: 2, thinkingTokens: 100 } }, usage: { input_tokens: 9999 } };
  const claudeSummary = normalizeNative({ input: claude, meta: { host: 'claude', id: 'job', window: 'window', hostVersion: '2.1.312', effort: 'unknown', taskClass: 'task', candidate: 'candidate', outcome: 'accepted', accepted: 1 } });
  assert.equal(claudeSummary.rows.length, 1);
  assert.deepEqual(claudeSummary.rows[0].counters, { input: 12, output: 6, cacheRead: 3, cacheWrite: 3 });
  assert.equal(claudeSummary.rows[0].scope, 'tree');
  assert.doesNotMatch(JSON.stringify(claudeSummary), /private-session|9999|thinkingTokens|modelA/u);
  const partialClaude = { session_id: 's', modelUsage: { a: { outputTokens: 2 } } };
  assert.equal(normalizeNative({ input: partialClaude, meta: { host: 'claude', id: 'job', window: 'window', hostVersion: '2.1', effort: 'unknown', taskClass: 'task', candidate: 'c', outcome: 'o', accepted: 1 } }).rows[0].counters.input, null);

  const destination = join(root, 'receipt.json');
  await writeExclusive(destination, snap);
  assert.equal(JSON.parse(await readFile(destination, 'utf8')).rows.length, 2);
  await assert.rejects(writeExclusive(destination, snap));
  let listener;
  let unsubscribed = false;
  const calls = [];
  const fakePi = { events: { on(_event, cb) { listener = cb; return () => { unsubscribed = true; }; }, emit(_event, req) { calls.push(req.method); listener({ version: 1, requestId: req.requestId, success: true, data: req.method === 'ping' ? { version: 1, capabilities: { cost: { version: 1 } } } : cost }); } } };
  const ctx = { sessionManager: { getSessionId: () => 'session', getBranch: () => [{ id: 'entry' }] } };
  const response = await requestCost(fakePi, ctx);
  assert.equal(response.rows.length, 2);
  assert.deepEqual(calls, ['ping', 'cost']);
  assert.equal(unsubscribed, true);
  const timeoutPi = { events: { on() { return () => { unsubscribed = true; }; }, emit() {} } };
  await assert.rejects(requestCost(timeoutPi, ctx, 5), /timed out/u);

  const piPath = join(root, 'pi.json'), cliOut = join(root, 'normalized.json');
  await writeFile(piPath, JSON.stringify(snap));
  const cli = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', piPath, '--host', 'pi', '--id', 'job', '--window', 'w', '--host-version', '1.5.0', '--effort', 'high', '--task-class', 'task', '--candidate', 'c', '--outcome', 'o', '--accepted', '1'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  await writeFile(cliOut, cli.stdout);
  assert.equal(JSON.parse(await readFile(cliOut, 'utf8')).rows[0].counters.input, 100);
  const invalid = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', piPath, '--host', 'pi', '--accepted', 'nope'], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.doesNotMatch(invalid.stderr, /private|session/u);
} finally { await rm(root, { recursive: true, force: true }); }
console.log('PASS: native receipt redaction, Pi cost RPC/windows, Claude modelUsage tree scope and bounded CLI');
