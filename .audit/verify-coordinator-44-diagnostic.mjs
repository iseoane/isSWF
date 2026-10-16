import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(process.argv[2], 'utf8');
const start = source.indexOf('session.subscribe(event=>{');
assert(start >= 0, 'actual SDK event subscription required');
const end = source.indexOf('\n    });', start);
assert(end > start, 'subscription end required');
const helperStart = source.indexOf('function safeAssistantDiagnostic(');
const helperEnd = source.indexOf('\nconst processStartedAt', helperStart);
const helper = helperStart >= 0 && helperEnd > helperStart ? source.slice(helperStart, helperEnd) : '';
const subscription = source.slice(start, end + '\n    });'.length);
function observe(message) {
  const context = vm.createContext({ safeResult: {}, pending: new Map(), tools: 0, session: { subscribe(fn) { context.onEvent = fn; }, abort() {} } });
  new vm.Script(helper + '\n' + subscription).runInContext(context, { timeout: 1000 });
  context.onEvent({ type: 'message_end', message });
  return JSON.parse(JSON.stringify(context.safeResult));
}
const error = observe({ role: 'assistant', stopReason: 'error', errorMessage: 'FAKE_SECRET_TOKEN HTTP 429 quota exceeded', content: [{ type: 'text', text: 'FAKE_ASSISTANT_TEXT' }] });
assert.equal(error.assistantStopReason, 'error', 'actual event consumer must retain the safe stop reason');
assert.equal(error.assistantMessageObserved, true);
assert.equal(error.assistantErrorIndicators.quotaOrRate, true);
assert.equal(error.assistantErrorIndicators.auth, false);
assert(!JSON.stringify(error).includes('FAKE_'), 'raw text and credentials must not escape the event consumer');
const normal = observe({ role: 'assistant', stopReason: 'stop', content: [{ type: 'text', text: 'quota FAKE_SECRET_TOKEN' }] });
assert.equal(normal.assistantStopReason, 'stop');
assert.equal(normal.assistantErrorIndicators.quotaOrRate, false, 'assistant prose is not a provider error');
const unknown = observe({ role: 'assistant', stopReason: 'FAKE_SECRET_TOKEN', rawStopReason: 'FAKE_SECRET_TOKEN', errorMessage: 'FAKE_SECRET_TOKEN' });
assert.equal(unknown.assistantStopReason, 'unknown');
assert(!JSON.stringify(unknown).includes('FAKE_'));
assert.deepEqual(observe({ role: 'toolResult', stopReason: 'error', errorMessage: 'quota' }), {});
console.log(JSON.stringify({ status: 'PASS', scope: 'Actual generated SDK event-consumer code with synthetic message_end events, no provider. Error indicators are message-derived booleans, not independently confirmed account or provider state.', cases: ['error-with-quota-indicator', 'normal-prose-not-error', 'unknown-stop-redacted', 'non-assistant-ignored'] }));
