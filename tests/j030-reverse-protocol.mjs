import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// No-model controls for the Claude coordinator -> Pi reviewer reverse route. They run natively on Linux
// (bash) and Windows (Git Bash) against tools/pi-jsonl-projection.mjs and synthetic children only.
// The equivalence fixtures below record the decisions of the retired jq filter (dd61160:.agents/hosts/claude-code.md,
// "Canonical Linux JSONL projection"). jq was not available when they were written, so each expected output is
// derived by reading that exact filter text, not by executing it. Documented stricter rejections are marked "stricter".
const projection = fileURLToPath(new URL('../tools/pi-jsonl-projection.mjs', import.meta.url));
const hostGuide = fileURLToPath(new URL('../.agents/hosts/claude-code.md', import.meta.url));
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const OUTPUT_LIMIT = 16000;

const findBash = () => {
  if (process.platform !== 'win32') return 'bash';
  // A bare `bash` on Windows may be the WSL launcher; prefer the Git for Windows bash that ships with git.
  const execPath = spawnSync('git', ['--exec-path'], { encoding: 'utf8' }).stdout?.trim();
  const candidate = execPath ? resolve(execPath, '../../../bin/bash.exe') : '';
  return candidate && existsSync(candidate) ? candidate : 'bash';
};
const bash = findBash();
const shellPath = (path) => path.replaceAll('\\', '/');
const workDirectory = mkdtempSync(join(tmpdir(), 'isswf-j030-'));

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
const withMessage = (fields) => ({ ...terminal, message: { ...terminal.message, ...fields } });
const jsonl = (records) => records.map(row => typeof row === 'string' ? row : JSON.stringify(row)).join('\n') + '\n';
const stopFields = { role: 'assistant', provider: 'openai-codex', model: 'gpt-6.1-sol', stopReason: 'stop', errorMessage: null };
const compactLines = (rows) => rows.map(row => JSON.stringify(row) + '\n').join('');
const finalRow = (fields) => ({ type: 'message_end', message: { role: 'assistant', provider: null, model: null, stopReason: null, errorMessage: null, content: [], ...fields } });
const parseOutput = (output) => output.split('\n').filter(Boolean).map(line => JSON.parse(line));

let inputCounter = 0;
// The producer reads a file so the input never crosses a command line (Windows limits it), and the paths travel
// as environment variables so one quoting form works in bash on both platforms.
const pipeline = (input, { producer = 'cat "$J030_INPUT"', filter = '"$J030_NODE" "$J030_PROJECTION"', pipefail = true, maxBuffer } = {}) => {
  const inputPath = join(workDirectory, `input-${inputCounter++}.jsonl`);
  writeFileSync(inputPath, input);
  const command = `${pipefail ? 'set -o pipefail; ' : ''}${producer} | ${filter}`;
  return spawnSync(bash, ['-c', command], {
    encoding: 'utf8', maxBuffer,
    env: { ...process.env, J030_INPUT: shellPath(inputPath), J030_NODE: shellPath(process.execPath), J030_PROJECTION: shellPath(projection) },
  });
};
const accepts = (rows) => {
  const sessions = rows.filter(row => row.type === 'session');
  const finals = rows.filter(row => row.type === 'message_end');
  const settledRows = rows.filter(row => row.type === 'agent_settled');
  const adverse = rows.some(row => /retry|compaction|error/u.test(row.type));
  if (sessions.length !== 1 || sessions[0].cwd !== '/candidate' || finals.length !== 1 || settledRows.length !== 1 || settledRows[0].aborted !== false || adverse) return false;
  const final = finals[0].message;
  if (!Array.isArray(final.content) || final.content.some(block => !block || typeof block !== 'object' || block.type !== 'text' || typeof block.text !== 'string')) return false;
  const text = final.content.map(block => block.text).join('');
  return final.role === 'assistant' && final.provider === 'openai-codex' && final.model === 'gpt-6.1-sol' && final.stopReason === 'stop' && final.errorMessage === null && text === report;
};

try {
  // Equivalence: same projected bytes and exit decision as the retired filter on the accepted good input.
  const success = pipeline(jsonl(goodRecords));
  assert.equal(success.status, 0, `projection pipeline succeeds: ${success.stderr}`);
  assert.equal(success.stdout, compactLines([
    { type: 'session', cwd: '/candidate' },
    finalRow({ ...stopFields, content: [{ type: 'text', text: report }] }),
    { type: 'agent_settled', aborted: false },
  ]), 'good input projects to exact whitelisted records');
  const projected = parseOutput(success.stdout);
  assert.equal(accepts(projected), true, 'valid session, exact final text and settlement accepted');
  assert.equal(success.stdout.includes('PRIVATE_SENTINEL'), false, 'thinking omitted');
  assert.equal(success.stdout.includes('privatePayload'), false, 'event payloads are whitelisted');
  assert.equal(projected.find(row => row.type === 'message_end').cwd, undefined, 'final message does not fabricate cwd');
  const coerciveContent = projected.map(row => row.type === 'message_end' ? { ...row, message: { ...row.message, content: [{ type: 'text', text: [report] }] } } : row);
  assert.equal(accepts(coerciveContent), false, 'positive acceptance predicate rejects array-valued text without coercion');

  const equivalenceCases = [
    ['absent whitelisted fields become null', jsonl([{ type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: report }] } }]),
      compactLines([finalRow({ content: [{ type: 'text', text: report }] })])],
    ['session without cwd, settlement without aborted', jsonl([{ type: 'session' }, { type: 'agent_settled' }]),
      compactLines([{ type: 'session', cwd: null }, { type: 'agent_settled', aborted: null }])],
    ['aborted settlement is projected, not dropped', jsonl([{ ...settled, aborted: true }]), compactLines([{ type: 'agent_settled', aborted: true }])],
    ['only text blocks survive, in order', jsonl([withMessage({ content: [{ type: 'text', text: 'a' }, { type: 'thinking', thinking: 'p' }, { type: 'text', text: 'b', extra: 1 }] })]),
      compactLines([finalRow({ ...stopFields, content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] })])],
    ['thinking-only and empty content project an empty array', jsonl([withMessage({ content: [{ type: 'thinking', thinking: 'p' }] }), withMessage({ content: [] })]),
      compactLines([finalRow(stopFields), finalRow(stopFields)])],
    ['error message text is kept for the acceptance predicate', jsonl([withMessage({ stopReason: 'error', errorMessage: 'boom', content: [] })]),
      compactLines([finalRow({ ...stopFields, stopReason: 'error', errorMessage: 'boom' })])],
    ['non-assistant message_end and unrelated events are dropped', jsonl([
      { type: 'message_start' }, { type: 'message_update', message: { role: 'assistant', content: 'partial' } }, { type: 'turn_end' },
      { type: 'message_end', message: { role: 'user', content: 'not even an array' } }, { type: 'message_end' }, { type: 'message_end', message: null },
      'null', '{}', { type: 5 }, { type: true }, { type: 'Retry' }, { type: 'ERROR' },
    ]), ''],
    ['adverse suffixes are retained as type only', jsonl([{ type: 'auto_retry_start', payload: 'private' }, { type: 'auto_compaction_start' }, { type: 'error_event' }, { type: 'error' }, { type: { nested: 'retry' } }]),
      compactLines([{ type: 'auto_retry_start' }, { type: 'auto_compaction_start' }, { type: 'error_event' }, { type: 'error' }, { type: { nested: 'retry' } }])],
    ['empty input and blank lines produce no output', '\n\n  \n', ''],
    ['CRLF lines and a missing final newline', jsonl(goodRecords).replaceAll('\n', '\r\n').trimEnd(), success.stdout],
  ];
  for (const [label, input, expected] of equivalenceCases) {
    const result = pipeline(input);
    assert.equal(result.status, 0, `${label} exits 0: ${result.stderr}`);
    assert.equal(result.stdout, expected, label);
  }

  // The retired filter emitted nothing a positive acceptance predicate could take from these.
  const adversarialCases = [
    ['missing final', [session, settled]],
    ['duplicate final', [session, terminal, terminal, settled]],
    ['missing session', [terminal, settled]],
    ['duplicate session', [session, session, terminal, settled]],
    ['wrong session cwd', [{ ...session, cwd: '/elsewhere' }, terminal, settled]],
    ['malformed final', [session, { type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: report }] } }, settled]],
    ['wrong role', [session, withMessage({ role: 'user' }), settled]],
    ['wrong provider', [session, withMessage({ provider: 'other' }), settled]],
    ['wrong model', [session, withMessage({ model: 'other-model' }), settled]],
    ['non-stop stop reason', [session, withMessage({ stopReason: 'length' }), settled]],
    ['error message present', [session, withMessage({ errorMessage: 'boom' }), settled]],
    ['empty report', [session, withMessage({ content: [] }), settled]],
    ['retry suffix', [session, terminal, { type: 'auto_retry_start' }, settled]],
    ['compaction suffix', [session, terminal, { type: 'auto_compaction_start' }, settled]],
    ['error suffix', [session, terminal, { type: 'error_event' }, settled]],
    ['aborted settlement', [session, terminal, { ...settled, aborted: true }]],
    ['missing settlement', [session, terminal]],
    ['duplicate settlement', [session, terminal, settled, settled]],
  ];
  for (const [label, records] of adversarialCases) {
    const result = pipeline(jsonl(records));
    assert.equal(result.status, 0, `${label} remains parseable`);
    assert.equal(accepts(parseOutput(result.stdout)), false, `${label} must not be accepted`);
  }

  // Rejections: the retired filter exited nonzero here (jq exit 2 or 5). Stricter: it may already have printed the
  // earlier records, while the projection prints nothing at all, and it never echoes event content on stderr.
  const rejectionCases = [
    ['malformed JSON', ['{bad']],
    ['truncated terminal line', [session, '{"type":"agent_settled","abor']],
    ['object content shape', [withMessage({ content: { type: 'text', text: report } })]],
    ['string content', [withMessage({ content: report })]],
    ['missing content', [{ type: 'message_end', message: { role: 'assistant' } }]],
    ['null content', [withMessage({ content: null })]],
    ['array-valued text', [withMessage({ content: [{ type: 'text', text: [report] }] })]],
    ['scalar content block', [withMessage({ content: [{ type: 'text', text: report }, null] })]],
    ['missing block type', [withMessage({ content: [{ text: report }] })]],
    ['non-string text', [withMessage({ content: [{ type: 'text', text: { report } }] })]],
    ['text block carrying only thinking', [withMessage({ content: [{ type: 'text', thinking: report }] })]],
    ['unrecognized block type', [withMessage({ content: [{ type: 'image', data: report }] })]],
    ['malformed thinking block', [withMessage({ content: [{ type: 'thinking', thinking: ['PRIVATE_SENTINEL'] }] })]],
    ['array event line', ['[]']],
    ['string event line', ['"text"']],
    ['number event line', ['5']],
    ['boolean event line', ['true']],
    ['string message on message_end', [{ type: 'message_end', message: 'x' }]],
    ['array message on message_end', [{ type: 'message_end', message: [] }]],
    ['malformed line after good records', [session, terminal, settled, '{bad']],
    ['bad content after good records', [session, withMessage({ content: [null] }), settled]],
  ];
  for (const [label, records] of rejectionCases) {
    const result = pipeline(jsonl(records));
    assert.notEqual(result.status, 0, `${label} makes the projection fail`);
    assert.equal(result.stdout, '', `${label} leaves no partial success`);
    assert.notEqual(result.stderr.trim(), '', `${label} explains the failure on stderr`);
    assert.equal(/PRIVATE_SENTINEL|Exact report/u.test(result.stderr), false, `${label} does not echo event content`);
  }

  // Producer, filter and transport failures under the documented pipefail form.
  const producerFails = '{ cat "$J030_INPUT"; exit 7; }';
  const failedProducer = pipeline(jsonl(goodRecords), { producer: producerFails });
  assert.equal(failedProducer.status, 7, 'producer failure survives a successful filter stage under pipefail');
  const withoutPipefail = pipeline(jsonl(goodRecords), { producer: producerFails, pipefail: false });
  assert.equal(withoutPipefail.status, 0, 'negative control demonstrates pipeline success masks producer failure without pipefail');
  const failedFilter = pipeline(jsonl(goodRecords), { filter: '"$J030_NODE" "$J030_PROJECTION.absent"' });
  assert.notEqual(failedFilter.status, 0, 'a filter that cannot start fails the complete pipeline');
  assert.equal(failedFilter.stdout, '', 'a failed filter prints nothing');
  const malformedPipeline = pipeline('{bad');
  assert.notEqual(malformedPipeline.status, 0, 'malformed JSON fails the pipeline');

  // Input bound: exactly the stated limit passes, one byte over fails with no output.
  const filler = (bytes) => {
    const record = (pad) => JSON.stringify({ type: 'other', pad }) + '\n';
    return record('x'.repeat(bytes - Buffer.byteLength(record(''))));
  };
  const atBound = pipeline(filler(MAX_INPUT_BYTES));
  assert.equal(atBound.status, 0, `input at the stated bound is accepted: ${atBound.stderr}`);
  const overBound = pipeline(filler(MAX_INPUT_BYTES + 1));
  assert.notEqual(overBound.status, 0, 'input past the stated bound fails');
  assert.equal(overBound.stdout, '', 'input past the stated bound leaves no partial success');

  // Output bound: the consumer's 16,000-byte capture trips and the truncated bytes can never contain the settlement.
  const oversizedInput = jsonl([session, withMessage({ content: [{ type: 'text', text: 'x'.repeat(20000) }] }), settled]);
  const limited = pipeline(oversizedInput, { maxBuffer: OUTPUT_LIMIT });
  assert.ok(limited.error || limited.status !== 0, 'bounded pipeline stdout capture trips for oversized output');
  const truncatedStdout = (limited.stdout ?? '').slice(0, OUTPUT_LIMIT);
  assert.equal(truncatedStdout.length, OUTPUT_LIMIT, 'consumer retains no more than the documented stdout limit');
  let capturedRows = [];
  try { capturedRows = parseOutput(truncatedStdout); } catch { capturedRows = []; }
  assert.equal(capturedRows.some(row => row.type === 'agent_settled'), false, 'bounded capture truncates before the terminal settlement');
  assert.equal(accepts(capturedRows), false, 'truncation before settlement cannot accept partial report');

  // Cancellation of a real synthetic child: a Node process that prints a partial report and then waits. The close
  // event is the observation; nothing here extrapolates to real Pi or Claude cancellation or descendant cessation.
  const boundedChild = async (records, termination) => {
    const script = 'process.stdout.write(process.env.J030_PAYLOAD); setInterval(() => {}, 1000);';
    const child = spawn(process.execPath, ['-e', script], { env: { ...process.env, J030_PAYLOAD: jsonl(records) }, stdio: ['ignore', 'pipe', 'pipe'] });
    const close = once(child, 'close');
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    let deadline;
    try {
      await Promise.race([
        once(child.stdout, 'data'),
        new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('synthetic child emitted no partial output')), 10000); }),
      ]);
      clearTimeout(deadline);
      if (termination === 'cancel') child.kill('SIGTERM');
      const stopTimer = termination === 'timeout' ? setTimeout(() => child.kill('SIGTERM'), 100) : undefined;
      let closeTimer;
      try {
        const result = await Promise.race([
          close,
          new Promise((_, reject) => { closeTimer = setTimeout(() => reject(new Error('synthetic child close exceeded 5s')), 5000); }),
        ]);
        return { stdout, code: result[0], signal: result[1], killed: child.killed };
      } finally {
        clearTimeout(stopTimer);
        clearTimeout(closeTimer);
      }
    } finally {
      clearTimeout(deadline);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        let cleanupTimer;
        await Promise.race([close, new Promise(resolveCleanup => { cleanupTimer = setTimeout(resolveCleanup, 1000); })]);
        clearTimeout(cleanupTimer);
      }
    }
  };
  // POSIX reports the terminating signal at close; Windows terminates the process outright, so the observation there
  // is a close after kill() with a nonzero exit code or a reported signal, and no accepted report.
  const observedStop = (result, label) => {
    assert.equal(result.killed, true, `${label}: kill was delivered`);
    if (process.platform === 'win32') assert.ok(result.code !== 0 || result.signal !== null, `${label}: close observed after forced termination`);
    else assert.equal(result.signal, 'SIGTERM', `${label}: terminating signal observed at close`);
  };
  const partialTerminal = withMessage({ content: [{ type: 'text', text: 'partial report' }] });
  const timeout = await boundedChild([session, partialTerminal], 'timeout');
  observedStop(timeout, 'bounded synthetic timeout');
  assert.equal(accepts(parseOutput(timeout.stdout)), false, 'partial report without settlement is never accepted after timeout');
  const cancelled = await boundedChild([session, partialTerminal], 'cancel');
  observedStop(cancelled, 'synthetic cancellation');
  assert.equal(accepts(parseOutput(cancelled.stdout)), false, 'cancelled child output cannot be accepted');

  // The shipped procedure names this module, not an external JSON processor, and states the same input bound.
  const host = await readFile(hostGuide, 'utf8');
  const section = host.match(/### Portable JSONL projection[\s\S]*?(?=\n##)/u)?.[0];
  assert.ok(section, 'host guide owns the portable projection section');
  assert.match(section, /set -o pipefail; pi … < \/dev\/null \| node <factory-root>\/tools\/pi-jsonl-projection\.mjs/u);
  assert.match(section, /8 MiB \(8,388,608 bytes\)/u);
  assert.equal(/\bjq\b/u.test(host), false, 'the reverse procedure no longer depends on jq');
} finally {
  rmSync(workDirectory, { recursive: true, force: true });
}

console.log(`J030 reverse protocol controls passed; synthetic no-model, ${process.platform}`);
