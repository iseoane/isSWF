import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';

if (process.platform !== 'linux') {
  console.log(JSON.stringify({ status: 'NOT_RUN', reason: 'J030 reverse process/projection controls require native Linux; Windows evidence is deliberately deferred.' }));
  process.exit(0);
}

const host = await readFile(new URL('../.agents/hosts/claude-code.md', import.meta.url), 'utf8');
const match = host.match(/### Canonical Linux JSONL projection[\s\S]*?```sh\njq -c '([^']+)'/u);
assert.ok(match, 'canonical jq filter exists in host guidance');
const filter = match[1];
const report = 'Exact report ✓';
const session = { type: 'session', cwd: '/candidate', sessionId: 'synthetic-session', privatePayload: 'do not expose' };
const terminal = {
  type: 'message_end',
  message: {
    role: 'assistant', provider: 'openai-codex', model: 'gpt-6.1-sol', stopReason: 'stop', errorMessage: null,
    content: [{ type: 'thinking', thinking: 'PRIVATE_SENTINEL' }, { type: 'text', text: report }],
  },
};
const settled = { type: 'agent_settled', aborted: false, privatePayload: 'do not expose' };
const goodRecords = [session, terminal, settled];
const jsonl = (records) => records.map(row => typeof row === 'string' ? row : JSON.stringify(row)).join('\n') + '\n';
const shellQuote = (text) => `'${text.replaceAll("'", "'\\''")}'`;
const pipeline = (input, jqFilter = filter, pipefail = true) => {
  const prefix = pipefail ? 'set -o pipefail; ' : '';
  return spawnSync('bash', ['-c', `${prefix}printf '%s' ${shellQuote(input)} | jq -c ${shellQuote(jqFilter)}`], { encoding: 'utf8', maxBuffer: 16000 });
};
const parseOutput = (output) => output.split('\n').filter(Boolean).map(line => JSON.parse(line));
const accepts = (rows) => {
  const sessions = rows.filter(row => row.type === 'session');
  const finals = rows.filter(row => row.type === 'message_end');
  const settledRows = rows.filter(row => row.type === 'agent_settled');
  const adverse = rows.some(row => /retry|compaction|error/u.test(row.type));
  if (sessions.length !== 1 || sessions[0].cwd !== '/candidate' || finals.length !== 1 || settledRows.length !== 1 || settledRows[0].aborted !== false || adverse) return false;
  const final = finals[0].message;
  const text = final.content.filter(block => block.type === 'text').map(block => block.text).join('');
  return final.role === 'assistant' && final.provider === 'openai-codex' && final.model === 'gpt-6.1-sol' && final.stopReason === 'stop' && final.errorMessage === null && text === report;
};

const success = pipeline(jsonl(goodRecords));
assert.equal(success.status, 0);
const projected = parseOutput(success.stdout);
assert.equal(accepts(projected), true, 'valid session, exact final text and settlement accepted');
assert.equal(success.stdout.includes('PRIVATE_SENTINEL'), false, 'thinking omitted');
assert.equal(success.stdout.includes('privatePayload'), false, 'event payloads are whitelisted');
assert.equal(projected.find(row => row.type === 'message_end').cwd, undefined, 'final message does not fabricate cwd');
assert.equal(projected.find(row => row.type === 'message_end').message.content.map(block => block.text).join(''), report);
assert.equal(projected.find(row => row.type === 'session').cwd, '/candidate');

const adversarialCases = [
  ['missing final', [session, settled]],
  ['duplicate final', [session, terminal, terminal, settled]],
  ['missing session', [terminal, settled]],
  ['duplicate session', [session, session, terminal, settled]],
  ['wrong session cwd', [{ ...session, cwd: '/elsewhere' }, terminal, settled]],
  ['malformed final', [session, { type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: report }] } }, settled]],
  ['wrong role', [session, { ...terminal, message: { ...terminal.message, role: 'user' } }, settled]],
  ['empty report', [session, { ...terminal, message: { ...terminal.message, content: [] } }, settled]],
  ['retry suffix', [session, terminal, { type: 'auto_retry_start' }, settled]],
  ['compaction suffix', [session, terminal, { type: 'auto_compaction_start' }, settled]],
  ['error suffix', [session, terminal, { type: 'error_event' }, settled]],
  ['aborted settlement', [session, terminal, { ...settled, aborted: true }]],
];
for (const [label, records] of adversarialCases) {
  const result = pipeline(jsonl(records));
  assert.equal(result.status, 0, `${label} remains parseable`);
  assert.equal(accepts(parseOutput(result.stdout)), false, `${label} must not be accepted`);
}

const producerScript = `{ printf '%s' ${shellQuote(jsonl(goodRecords))}; exit 7; }`;
const failedProducer = spawnSync('bash', ['-c', `set -o pipefail; ${producerScript} | jq -c ${shellQuote(filter)}`], { encoding: 'utf8' });
assert.equal(failedProducer.status, 7, 'producer failure survives a successful jq stage under pipefail');
const withoutPipefail = spawnSync('bash', ['-c', `${producerScript} | jq -c ${shellQuote(filter)}`], { encoding: 'utf8' });
assert.equal(withoutPipefail.status, 0, 'negative control demonstrates pipeline success masks producer failure without pipefail');
const failedFilter = spawnSync('bash', ['-c', `set -o pipefail; printf '%s' ${shellQuote(jsonl(goodRecords))} | jq -c 'not valid jq ('`], { encoding: 'utf8' });
assert.notEqual(failedFilter.status, 0, 'jq filter failure fails the complete pipeline');
const malformedInput = pipeline('{bad');
assert.notEqual(malformedInput.status, 0, 'malformed JSON fails jq and pipeline');

const oversizedInput = jsonl([session, { ...terminal, message: { ...terminal.message, content: [{ type: 'text', text: 'x'.repeat(20000) }] } }, settled]);
const limited = spawnSync('bash', ['-c', `set -o pipefail; printf '%s' ${shellQuote(oversizedInput)} | jq -c ${shellQuote(filter)}`], { encoding: 'utf8', maxBuffer: 16000 });
assert.ok(limited.error || limited.status !== 0, 'bounded pipeline stdout capture trips for oversized output');
const truncatedStdout = (limited.stdout ?? '').slice(0, 16000);
assert.equal(truncatedStdout.length, 16000, 'consumer retains no more than the documented stdout limit');
let capturedRows = [];
try { capturedRows = parseOutput(truncatedStdout); } catch { capturedRows = []; }
assert.equal(capturedRows.some(row => row.type === 'agent_settled'), false, 'bounded capture truncates before the terminal settlement');
assert.equal(accepts(capturedRows), false, 'truncation before settlement cannot accept partial report');

const boundedChild = async (records, termination) => {
  const child = spawn('bash', ['-c', `printf '%s' ${shellQuote(jsonl(records))}; exec sleep 30`], { stdio: ['ignore', 'pipe', 'pipe'] });
  const close = once(child, 'close');
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => { stdout += chunk; });
  let deadline;
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('synthetic child emitted no partial output')), 1000); }),
    ]);
    clearTimeout(deadline);
    if (termination === 'cancel') child.kill('SIGTERM');
    const stopTimer = termination === 'timeout' ? setTimeout(() => child.kill('SIGTERM'), 100) : undefined;
    let closeTimer;
    try {
      const result = await Promise.race([
        close,
        new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('synthetic child close exceeded 2s')), 2000); }),
      ]);
      return { stdout, code: result[0], signal: result[1] };
    } finally {
      clearTimeout(stopTimer);
      clearTimeout(closeTimer);
    }
  } finally {
    clearTimeout(deadline);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      let cleanupTimer;
      await Promise.race([close, new Promise(resolve => { cleanupTimer = setTimeout(resolve, 1000); })]);
      clearTimeout(cleanupTimer);
    }
  }
};
const partialTerminal = { ...terminal, message: { ...terminal.message, content: [{ type: 'text', text: 'partial report' }] } };
const timeout = await boundedChild([session, partialTerminal], 'timeout');
assert.equal(timeout.signal, 'SIGTERM', 'bounded synthetic timeout observed at close');
assert.equal(accepts(parseOutput(timeout.stdout)), false, 'partial report without settlement is never accepted after timeout');
const cancelled = await boundedChild([session, partialTerminal], 'cancel');
assert.equal(cancelled.signal, 'SIGTERM', 'synthetic cancellation observed at close');
assert.equal(accepts(parseOutput(cancelled.stdout)), false, 'cancelled child output cannot be accepted');

console.log('J030 reverse protocol controls passed; synthetic Linux only, no model call');
