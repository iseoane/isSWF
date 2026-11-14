#!/usr/bin/env node
// Filter-only projection of Pi JSON-mode JSONL for the Claude coordinator's reverse route
// (.agents/hosts/claude-code.md, "Portable JSONL projection"). It reads stdin, writes the projected records to
// stdout and decides nothing: it never launches Pi, retries or accepts a report.
//
// Any malformed input rejects the whole stream: nothing reaches stdout, the exit code is nonzero and stderr names
// the cause without echoing event content, so a truncated or tampered stream cannot pass as a partial success.

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ADVERSE_TYPE = /retry|compaction|error/u;

class Rejection extends Error {}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
// A whitelisted field that is absent projects as null.
const field = (object, key) => (Object.hasOwn(object, key) ? object[key] : null);
const isRecognizedBlock = (block) => isObject(block)
  && ((field(block, 'type') === 'text' && typeof field(block, 'text') === 'string')
    || (field(block, 'type') === 'thinking' && typeof field(block, 'thinking') === 'string'));

function projectAssistant(message, lineNumber) {
  const content = field(message, 'content');
  if (!Array.isArray(content)) throw new Rejection(`line ${lineNumber}: assistant content must be an array`);
  if (!content.every(isRecognizedBlock)) throw new Rejection(`line ${lineNumber}: malformed assistant content block`);
  return {
    type: 'message_end',
    message: {
      role: field(message, 'role'),
      provider: field(message, 'provider'),
      model: field(message, 'model'),
      stopReason: field(message, 'stopReason'),
      errorMessage: field(message, 'errorMessage'),
      // Only text blocks leave this filter; thinking blocks are dropped here.
      content: content.filter(block => block.type === 'text').map(block => ({ type: 'text', text: block.text })),
    },
  };
}

// Returns the projected record, or undefined when the event is dropped.
function projectEvent(event, lineNumber) {
  if (event === null) return undefined;
  if (!isObject(event)) throw new Rejection(`line ${lineNumber}: event is not a JSON object`);
  const type = field(event, 'type');
  if (type === 'session') return { type, cwd: field(event, 'cwd') };
  if (type === 'agent_settled') return { type, aborted: field(event, 'aborted') };
  if (type === 'message_end') {
    const message = field(event, 'message');
    if (message !== null && !isObject(message)) throw new Rejection(`line ${lineNumber}: message_end message is not a JSON object`);
    return message !== null && field(message, 'role') === 'assistant' ? projectAssistant(message, lineNumber) : undefined;
  }
  // Suffixed adverse names such as auto_retry_start match too; non-string types are compared by their JSON text.
  const typeText = typeof type === 'string' ? type : JSON.stringify(type);
  return ADVERSE_TYPE.test(typeText) ? { type } : undefined;
}

function project(text) {
  const output = [];
  text.split('\n').forEach((line, index) => {
    if (line.trim() === '') return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Rejection(`line ${index + 1}: invalid JSON`);
    }
    const record = projectEvent(event, index + 1);
    if (record !== undefined) output.push(`${JSON.stringify(record)}\n`);
  });
  return output.join('');
}

async function readInput() {
  const chunks = [];
  let size = 0;
  // Keep draining after the bound so the producer is never blocked or sent a broken pipe; only the verdict changes.
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size <= MAX_INPUT_BYTES) chunks.push(chunk);
  }
  if (size > MAX_INPUT_BYTES) throw new Rejection(`input exceeds ${MAX_INPUT_BYTES} bytes`);
  return Buffer.concat(chunks).toString('utf8');
}

try {
  process.stdout.write(project(await readInput()));
} catch (error) {
  if (!(error instanceof Rejection)) throw error;
  process.stderr.write(`pi-jsonl-projection: ${error.message}\n`);
  process.exitCode = 1;
}
