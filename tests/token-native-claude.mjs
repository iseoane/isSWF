import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { countersFrom } from '../tools/token-native-claude.mjs';
import { normalizeClaudeOtel } from '../tools/token-native-summary.mjs';
import { report } from '../tools/token-report.mjs';

const modelId = `model-${createHash('sha256').update('claude-sonnet-4-6').digest('hex').slice(0, 24)}`;
const metric = (type, query_source, asInt, extra = []) => ({ name: 'claude_code.token.usage', sum: { isMonotonic: true, aggregationTemporality: 2, dataPoints: [{ attributes: [{ key: 'type', value: { stringValue: type } }, { key: 'query_source', value: { stringValue: query_source } }, { key: 'model', value: { stringValue: 'claude-sonnet-4-6' } }, ...extra], asInt }] } });
const result = countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', 11, [{ key: 'user.email', value: { stringValue: 'secret@example.test' } }]), metric('output', 'main', 7), metric('cacheRead', 'main', 5), metric('cacheCreation', 'main', 3), metric('input', 'subagent', 99), { name: 'other', sum: {} }] }] }] });
assert.deepEqual(result.map(({ id, source, model, category, value }) => ({ id, source, model, category, value })), [
  { id: `main-${modelId}-cacheCreation`, source: 'main', category: 'cacheCreation', value: 3, model: modelId },
  { id: `main-${modelId}-cacheRead`, source: 'main', category: 'cacheRead', value: 5, model: modelId },
  { id: `main-${modelId}-input`, source: 'main', category: 'input', value: 11, model: modelId },
  { id: `main-${modelId}-output`, source: 'main', category: 'output', value: 7, model: modelId },
  { id: `subagent-${modelId}-input`, source: 'subagent', category: 'input', value: 99, model: modelId },
]);
assert.doesNotMatch(JSON.stringify(result), /secret@example|other|claude-sonnet/u);
const receipt = { version: 1, host: 'claude', hostVersion: '2.1.312', sourceVersion: 'claude_code.token.usage-otlp-cumulative', provenance: 'native-claude-otel', session: '0123456789abcdef01234567', policyStatus: 'managed-policy-not-inspected', counters: result.slice(0, 4) };
const metadata = { host: 'claude', hostVersion: '2.1.312', id: 'task', window: 'run', effort: 'unknown', taskClass: 'fixture', candidate: 'current', outcome: 'fixture', accepted: 1 };
const window = normalizeClaudeOtel({ input: receipt, meta: metadata });
assert.deepEqual(window.rows[0].counters, { input: 11, output: 7, cacheRead: 5, cacheWrite: 3 });
assert.equal(window.rows[0].provenance, 'native-claude-otel');
assert.equal(window.rows[0].scope, 'unattributed');
const rendered = report(window);
assert.equal(rendered.totals.processed, 26);
assert.equal(rendered.collectionPolicy, 'managed-policy-not-inspected; local-only export is unverified');
assert.match(rendered.claims, /not billing.*or verified local-only telemetry/u);
assert.doesNotMatch(JSON.stringify(window), /secret|claude-sonnet|user.email/u);
const partialReceipt = { ...receipt, counters: receipt.counters.slice(0, 2) };
const partialWindow = normalizeClaudeOtel({ input: partialReceipt, meta: metadata });
assert.equal(report(partialWindow).totals.processed, null);
assert.equal(report(partialWindow).totals.processedSubtotal, 8);
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', -1)] }] }] }));
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { isMonotonic: true, aggregationTemporality: 1, dataPoints: [] } }] }] }] }));
console.log('PASS: Claude OTLP token metric allowlist, exact cumulative counters and malformed-value refusal');
