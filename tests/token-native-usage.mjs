import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { report } from '../tools/token-report.mjs';
import { normalizeNative } from '../tools/token-native-summary.mjs';
import { normalizePiCost, requestCost, writeExclusive } from '../tools/token-native-pi.mjs';

const root = await mkdtemp(join(tmpdir(), 'native usage ü-'));
const meta = { host: 'pi', id: 'job', window: 'window', hostVersion: 'unknown', effort: 'high', taskClass: 'task', candidate: 'current', outcome: 'accepted', accepted: 1 };
const claudeMeta = { ...meta, host: 'claude', hostVersion: 'unknown' };
try {
  const cost = { version: 1, parent: { input: 100, output: 20, cacheRead: 7, cacheWrite: 2 }, children: [{ runId: 'private-run-id', sessionFile: '/private/path', usage: { input: 50, output: 10, cacheRead: 3, cacheWrite: 1 } }], childTotal: { input: 50, output: 10, cacheRead: 3, cacheWrite: 1 }, total: { input: 150, output: 30, cacheRead: 10, cacheWrite: 3 }, unresolvedAsyncChildren: 0 };
  const snap = normalizePiCost(cost, '0123456789abcdef01234567', ['abcdefabcdefabcdefabcdef']);
  assert.equal(snap.rows.length, 2);
  assert.equal(snap.rows[0].counters.input + snap.rows[1].counters.input, 150);
  assert.doesNotMatch(JSON.stringify(snap), /private-run-id|private\/path/u);
  assert.equal(snap.hostVersion, 'unknown');
  assert.equal(normalizePiCost({ ...cost, unresolvedAsyncChildren: 1 }, 'session', []).unresolvedAsyncChildren, 1);
  assert.throws(() => normalizePiCost({ ...cost, children: [{ ...cost.children[0], runId: undefined, sessionFile: undefined, agent: 'private-agent' }] }, 'session', []));

  const hostile = structuredClone(snap);
  hostile.privateTop = 'TOP SECRET';
  hostile.rows[0].privateRow = 'ROW SECRET';
  hostile.rows[0].counters.privateCounter = 'COUNTER SECRET';
  const snapshot = normalizeNative({ input: hostile, meta });
  assert.equal(snapshot.mode, 'snapshot');
  assert.equal(snapshot.hostVersion, 'unknown');
  assert.doesNotMatch(JSON.stringify(snapshot), /SECRET|privateTop|privateRow|privateCounter/u);
  assert.throws(() => report(snapshot), /invalid token summary/u);

  const end = structuredClone(snap);
  end.branch.push('bbbbbbbbbbbbbbbbbbbbbbbb');
  end.rows[0].counters.input = 110;
  end.rows[1].counters.input = 80;
  const windowSummary = normalizeNative({ input: end, start: snap, meta });
  assert.equal(windowSummary.mode, 'window');
  assert.deepEqual(windowSummary.rows.map(row => row.counters.input), [10, 30]);
  assert.deepEqual(windowSummary.rows.map(row => row.scope), ['unattributed', 'agent']);
  assert.deepEqual(report(windowSummary).totals.counters, { input: 40, output: 0, cacheRead: 0, cacheWrite: 0 });
  const hostileWindow = structuredClone(end);
  hostileWindow.privateTop = 'TOP SECRET';
  hostileWindow.rows[0].privateRow = 'ROW SECRET';
  hostileWindow.rows[0].counters.privateCounter = 'COUNTER SECRET';
  const sanitizedWindow = normalizeNative({ input: hostileWindow, start: snap, meta });
  assert.doesNotMatch(JSON.stringify(sanitizedWindow), /SECRET|privateTop|privateRow|privateCounter/u);
  const consumedWindow = report(sanitizedWindow);
  assert.equal(consumedWindow.totals.processed, 40);
  assert.doesNotMatch(JSON.stringify(consumedWindow), /SECRET|privateTop|privateRow|privateCounter/u);
  assert.throws(() => normalizeNative({ input: { ...end, branch: ['ffffffffffffffffffffffff'] }, start: snap, meta }));
  assert.throws(() => normalizeNative({ input: { ...end, session: 'ffffffffffffffffffffffff' }, start: snap, meta }));
  const decreased = structuredClone(end); decreased.rows[0].counters.output = 0;
  assert.throws(() => normalizeNative({ input: decreased, start: snap, meta }));
  const missingChild = structuredClone(end); missingChild.rows.pop();
  assert.throws(() => normalizeNative({ input: missingChild, start: snap, meta }));
  const unresolved = normalizePiCost({ ...cost, unresolvedAsyncChildren: 1 }, 'abcdefabcdefabcdefabcdef', []);
  const partialSnapshot = normalizeNative({ input: unresolved, meta });
  assert.equal(partialSnapshot.rows.at(-1).counters.input, null);
  assert.equal(partialSnapshot.rows.at(-1).scope, 'unattributed');
  assert.throws(() => normalizeNative({ input: unresolved, start: snap, meta }));

  const claude = { session_id: 'private-session', modelUsage: { modelA: { inputTokens: 7, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 1 }, modelB: { inputTokens: 5, outputTokens: 4, cacheReadInputTokens: 0, cacheCreationInputTokens: 2, thinkingTokens: 100 } }, usage: { input_tokens: 9999 } };
  const claudeSnapshot = normalizeNative({ input: claude, meta: claudeMeta });
  assert.equal(claudeSnapshot.mode, 'snapshot');
  assert.equal(claudeSnapshot.scope, 'tree');
  assert.deepEqual(claudeSnapshot.counters, { input: 12, output: 6, cacheRead: 3, cacheWrite: 3 });
  assert.doesNotMatch(JSON.stringify(claudeSnapshot), /private-session|9999|thinkingTokens|modelA|modelB/u);
  const reordered = { ...claude, modelUsage: { modelB: claude.modelUsage.modelB, modelA: claude.modelUsage.modelA } };
  const sameModels = normalizeNative({ input: reordered, meta: claudeMeta });
  assert.equal(claudeSnapshot.model, sameModels.model);
  const changedTokenValues = normalizeNative({ input: { ...claude, modelUsage: { modelA: { ...claude.modelUsage.modelA, inputTokens: 700 }, modelB: claude.modelUsage.modelB } }, meta: claudeMeta });
  assert.equal(claudeSnapshot.model, changedTokenValues.model);
  const changedModels = normalizeNative({ input: { ...claude, modelUsage: { modelC: claude.modelUsage.modelA } }, meta: claudeMeta });
  assert.notEqual(claudeSnapshot.model, changedModels.model);
  const hypotheticalWindow = value => ({ version: 1, mode: 'window', rows: [{ id: 'tree', host: 'claude', hostVersion: 'unknown', model: value.model, effort: 'unknown', taskClass: 'task', candidate: 'candidate', outcome: 'outcome', accepted: 1, provenance: 'native-claude-summary', scope: 'tree', window: 'window', counters: value.counters }] });
  assert.equal(report(hypotheticalWindow(claudeSnapshot), hypotheticalWindow(sameModels)).comparison.status, 'comparable');
  assert.equal(report(hypotheticalWindow(changedModels), hypotheticalWindow(claudeSnapshot)).comparison.status, 'incomparable');
  assert.throws(() => normalizeNative({ input: { ...claude, modelUsage: { '': {} } }, meta: claudeMeta }));
  const zeroClaudeWindow = normalizeNative({ input: claude, start: claude, meta: { ...claudeMeta, hostVersion: '2.1.312' } });
  assert.equal(zeroClaudeWindow.mode, 'window');
  assert.deepEqual(zeroClaudeWindow.rows[0].counters, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  assert.throws(() => report(claudeSnapshot), /invalid token summary/u);
  const partialClaude = normalizeNative({ input: { session_id: 's', modelUsage: { model: { outputTokens: 2 } } }, meta: claudeMeta });
  assert.equal(partialClaude.counters.input, null);

  const claudeStart = { session_id: 'same-session', modelUsage: {
    modelA: { inputTokens: 100, outputTokens: 20, cacheReadInputTokens: 40, cacheCreationInputTokens: 5 },
    modelB: { inputTokens: 30, outputTokens: 10, cacheReadInputTokens: 8, cacheCreationInputTokens: 2 },
  }, usage: { input_tokens: 999999 } };
  const claudeEnd = { session_id: 'same-session', modelUsage: {
    modelB: { inputTokens: 35, outputTokens: 12, cacheReadInputTokens: 10, cacheCreationInputTokens: 4 },
    modelA: { inputTokens: 111, outputTokens: 24, cacheReadInputTokens: 45, cacheCreationInputTokens: 6 },
  }, usage: { input_tokens: 999999 } };
  const claudeWindowMeta = { ...claudeMeta, hostVersion: '2.1.312' };
  assert.throws(() => normalizeNative({ input: claudeEnd, start: claudeStart, meta: claudeMeta }));
  const claudeWindow = normalizeNative({ input: claudeEnd, start: claudeStart, meta: claudeWindowMeta });
  assert.equal(claudeWindow.mode, 'window');
  assert.equal(claudeWindow.rows.length, 1);
  assert.equal(claudeWindow.rows[0].scope, 'tree');
  assert.deepEqual(claudeWindow.rows[0].counters, { input: 16, output: 6, cacheRead: 7, cacheWrite: 3 });
  const claudeReport = report(claudeWindow);
  assert.equal(claudeReport.totals.processed, 32);
  assert.equal(claudeReport.totals.accepted, 1);
  assert.equal(claudeReport.totals.tokensPerAccepted, 32);
  assert.throws(() => normalizeNative({ input: { ...claudeEnd, session_id: 'reset-session' }, start: claudeStart, meta: claudeWindowMeta }));
  assert.throws(() => normalizeNative({ input: { ...claudeEnd, modelUsage: { modelC: claudeEnd.modelUsage.modelA, modelB: claudeEnd.modelUsage.modelB } }, start: claudeStart, meta: claudeWindowMeta }));
  const decreasedClaude = structuredClone(claudeEnd); decreasedClaude.modelUsage.modelA.outputTokens = 19;
  assert.throws(() => normalizeNative({ input: decreasedClaude, start: claudeStart, meta: claudeWindowMeta }));
  const missingClaude = structuredClone(claudeEnd); delete missingClaude.modelUsage.modelA.cacheReadInputTokens;
  const missingWindow = normalizeNative({ input: missingClaude, start: claudeStart, meta: claudeWindowMeta });
  assert.equal(missingWindow.rows[0].counters.cacheRead, null);
  const unknownStartClaude = structuredClone(claudeStart); delete unknownStartClaude.modelUsage.modelA.inputTokens;
  const unknownWindow = normalizeNative({ input: claudeEnd, start: unknownStartClaude, meta: claudeWindowMeta });
  assert.equal(unknownWindow.rows[0].counters.input, null);
  const resumedSnapshot = normalizeNative({ input: claudeEnd, meta: claudeMeta });
  assert.equal(resumedSnapshot.mode, 'snapshot');
  assert.throws(() => report(resumedSnapshot), /invalid token summary/u);

  const agentInput = { agentOutput: {
    agentId: 'opaque-agent-source-id', status: 'completed', resolvedModel: 'modelA', modelsUsed: ['modelA'],
    usage: { input_tokens: 21, output_tokens: 8, cache_creation_input_tokens: null, cache_read_input_tokens: 4 },
    content: [{ type: 'text', text: 'PRIVATE CONTENT' }], prompt: 'PRIVATE PROMPT', worktreePath: '/private/worktree',
  } };
  const agentSnapshot = normalizeNative({ input: agentInput, meta: claudeMeta });
  assert.equal(agentSnapshot.mode, 'snapshot');
  assert.equal(agentSnapshot.scope, 'agent');
  assert.equal(agentSnapshot.sourceVersion, 'claude-sdk-tools-2.1.299');
  assert.match(agentSnapshot.agent, /^agent-[a-f0-9]{24}$/u);
  assert.deepEqual(agentSnapshot.counters, { input: 21, output: 8, cacheRead: 4, cacheWrite: null });
  assert.doesNotMatch(JSON.stringify(agentSnapshot), /opaque-agent-source-id|PRIVATE|worktree|modelA/u);
  assert.throws(() => report(agentSnapshot), /invalid token summary/u);
  for (const [field, name] of [['input_tokens', 'input'], ['output_tokens', 'output'], ['cache_read_input_tokens', 'cacheRead'], ['cache_creation_input_tokens', 'cacheWrite']]) {
    const incomplete = structuredClone(agentInput.agentOutput);
    delete incomplete.usage[field];
    const normalized = normalizeNative({ input: { agentOutput: incomplete }, meta: claudeMeta });
    assert.equal(normalized.mode, 'snapshot');
    assert.equal(normalized.counters[name], null);
    assert.equal(normalized.counters.input, name === 'input' ? null : 21);
    assert.equal(normalized.counters.output, name === 'output' ? null : 8);
    assert.doesNotMatch(JSON.stringify(normalized), /opaque-agent-source-id|PRIVATE|worktree|modelA/u);
    assert.throws(() => report(normalized), /invalid token summary/u);
  }
  for (const value of [-1, Number.MAX_SAFE_INTEGER + 1, '21', null]) {
    const malformed = structuredClone(agentInput.agentOutput);
    malformed.usage.input_tokens = value;
    assert.throws(() => normalizeNative({ input: { agentOutput: malformed }, meta: claudeMeta }));
  }
  for (const field of ['cache_read_input_tokens', 'cache_creation_input_tokens']) {
    const malformed = structuredClone(agentInput.agentOutput);
    malformed.usage[field] = -1;
    assert.throws(() => normalizeNative({ input: { agentOutput: malformed }, meta: claudeMeta }));
  }
  assert.throws(() => normalizeNative({ input: { agentOutput: { ...agentInput.agentOutput, status: 'async_launched' } }, meta: claudeMeta }));

  const maxClaudeId = normalizeNative({ input: claudeEnd, start: claudeStart, meta: { ...claudeWindowMeta, id: 'x'.repeat(123) } });
  assert.equal(maxClaudeId.rows[0].id.length, 128);
  assert.equal(report(maxClaudeId).totals.processed, 32);
  assert.throws(() => normalizeNative({ input: claudeEnd, start: claudeStart, meta: { ...claudeWindowMeta, id: 'x'.repeat(124) } }));

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

  const piPath = join(root, 'pi.json'), snapshotPath = join(root, 'pi-snapshot.json'), windowPath = join(root, 'pi-window.json');
  await writeFile(piPath, JSON.stringify(snap));
  const args = ['--input', piPath, '--host', 'pi'];
  const snapshotCli = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), ...args], { encoding: 'utf8' });
  assert.equal(snapshotCli.status, 0, snapshotCli.stderr);
  assert.equal(JSON.parse(snapshotCli.stdout).hostVersion, 'unknown');
  await writeFile(snapshotPath, snapshotCli.stdout);
  const reportRejectsSnapshot = spawnSync(process.execPath, [resolve('tools/token-report.mjs'), '--input', snapshotPath], { encoding: 'utf8' });
  assert.equal(reportRejectsSnapshot.status, 1);
  assert.match(reportRejectsSnapshot.stderr, /invalid token summary/u);

  const endPath = join(root, 'pi-end.json');
  await writeFile(endPath, JSON.stringify(end));
  const windowCli = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', endPath, '--start', piPath, '--host', 'pi', '--id', 'job', '--window', 'w', '--effort', 'high', '--task-class', 'task', '--candidate', 'c', '--outcome', 'o', '--accepted', '1'], { encoding: 'utf8' });
  assert.equal(windowCli.status, 0, windowCli.stderr);
  await writeFile(windowPath, windowCli.stdout);
  const acceptedWindow = spawnSync(process.execPath, [resolve('tools/token-report.mjs'), '--input', windowPath], { encoding: 'utf8' });
  assert.equal(acceptedWindow.status, 0, acceptedWindow.stderr);
  assert.equal(JSON.parse(acceptedWindow.stdout).totals.processed, 40);

  const claudePath = join(root, 'claude.json'), claudeOut = join(root, 'claude-snapshot.json');
  await writeFile(claudePath, JSON.stringify(claude));
  const claudeStartPath = join(root, 'claude-start.json'), claudeEndPath = join(root, 'claude-end.json'), claudeWindowPath = join(root, 'claude-window.json');
  await writeFile(claudeStartPath, JSON.stringify(claudeStart));
  await writeFile(claudeEndPath, JSON.stringify(claudeEnd));
  const claudeWindowCli = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', claudeEndPath, '--start', claudeStartPath, '--host', 'claude', '--host-version', '2.1.312', '--id', 'job', '--window', 'w', '--effort', 'unknown', '--task-class', 'task', '--candidate', 'c', '--outcome', 'o', '--accepted', '1'], { encoding: 'utf8' });
  assert.equal(claudeWindowCli.status, 0, claudeWindowCli.stderr);
  await writeFile(claudeWindowPath, claudeWindowCli.stdout);
  const claudeWindowReport = spawnSync(process.execPath, [resolve('tools/token-report.mjs'), '--input', claudeWindowPath], { encoding: 'utf8' });
  assert.equal(claudeWindowReport.status, 0, claudeWindowReport.stderr);
  assert.equal(JSON.parse(claudeWindowReport.stdout).totals.processed, 32);
  const claudeCli = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', claudePath, '--host', 'claude'], { encoding: 'utf8' });
  assert.equal(claudeCli.status, 0, claudeCli.stderr);
  assert.equal(JSON.parse(claudeCli.stdout).hostVersion, 'unknown');
  await writeFile(claudeOut, claudeCli.stdout);
  const rejectClaudeWindow = spawnSync(process.execPath, [resolve('tools/token-native-summary.mjs'), '--input', claudePath, '--start', claudePath, '--host', 'claude'], { encoding: 'utf8' });
  assert.equal(rejectClaudeWindow.status, 1);
  const reportRejectsClaudeSnapshot = spawnSync(process.execPath, [resolve('tools/token-report.mjs'), '--input', claudeOut], { encoding: 'utf8' });
  assert.equal(reportRejectsClaudeSnapshot.status, 1);
  assert.doesNotMatch(reportRejectsClaudeSnapshot.stderr, /modelA|private-session/u);
} finally { await rm(root, { recursive: true, force: true }); }
console.log('PASS: native snapshot boundaries, allowlist privacy, Pi windows, Claude tree identity and real report-consumer guards');
