import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { validateDiffBinding, validateBinding, validateContentBinding } from './git-evidence.mjs';

// One owner of how a native host invokes the public Git evidence CLI and verifies what it returns.
// Pi and the Claude MCP server share it; each supplies its own trusted launch-binding source and CLI path.
const bindingNamespaces = Object.freeze({ identity: 'isswf.git-evidence/1', diff: 'isswf.git-evidence.diff/1', content: 'isswf.git-evidence.content/1' });
const validators = { identity: validateBinding, diff: validateDiffBinding, content: validateContentBinding };

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

// Capture and validate one operation's binding from a JSON launch-binding object, once and immutably.
export function captureBinding(raw, operation, missingMessage) {
  try {
    let parsed;
    try { parsed = JSON.parse(raw ?? 'null'); } catch { throw Error('launch binding is not valid JSON'); }
    const key = bindingNamespaces[operation];
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.hasOwn(parsed, key)) throw Error(missingMessage);
    return { binding: freeze(validators[operation](parsed[key])) };
  } catch (error) {
    return { binding: null, error: typeof error?.message === 'string' ? error.message.slice(0, 160) : 'invalid trusted launch binding' };
  }
}

export const diffChunkParameters = Object.freeze({ chunk: Object.freeze({ type: 'integer', minimum: 1 }) });

// Reject any argument shape the model-facing schema does not promise. Diff accepts `chunk` only when the host offers chunking.
export function checkArguments(operation, params, { chunked = false } = {}) {
  const keys = Object.keys(params ?? {}).sort().join(',');
  if (params !== undefined && params !== null && (typeof params !== 'object' || Array.isArray(params))) throw Error(`This ${operation} tool arguments must be an object.`);
  if (operation === 'identity' && keys !== '') throw Error('This identity tool accepts no arguments.');
  if (operation === 'diff') {
    if (!chunked && keys !== '') throw Error('This diff tool accepts no arguments.');
    if (chunked && keys !== '' && keys !== 'chunk') throw Error('This diff tool accepts only a chunk number.');
    if (chunked && keys === 'chunk' && !(Number.isSafeInteger(params.chunk) && params.chunk >= 1)) throw Error('The diff chunk must be a positive integer.');
  }
  if (operation === 'content' && (keys !== 'path,slot' || !['base', 'candidate'].includes(params.slot) || typeof params.path !== 'string')) throw Error('This content tool accepts only an allowlisted path and base/candidate slot.');
}

const specifications = {
  identity: { label: 'Identity', statuses: ['ok', 'error'], maxBuffer: binding => binding.outputBytes + 1024 },
  diff: { label: 'Diff', statuses: ['ok', 'error'], maxBuffer: () => 263168, response: 262144, display: 524288 },
  content: { label: 'Content', statuses: ['ok', 'absent', 'error'], maxBuffer: () => 100000, response: 98304, display: 196608 },
};

// Split verified patch bytes into fixed-size chunks that end on UTF-8 character boundaries whenever possible.
function chunkBoundaries(patch, size) {
  const bounds = [];
  let start = 0;
  while (start < patch.length) {
    let end = Math.min(start + size, patch.length);
    if (end < patch.length) {
      let back = end;
      while (back > start && (patch[back] & 0xc0) === 0x80) back -= 1;
      if (back > start) end = back;
    }
    bounds.push([start, end]);
    start = end;
  }
  return bounds.length ? bounds : [[0, 0]];
}

const decodeUtf8 = bytes => { try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); } catch { return null; } };

/**
 * Run `operation` through the CLI at `cli` for the captured binding and verify the result.
 * Returns `{ content, details, isError? }` or throws a bounded Error. With `chunkBytes`, a verified diff is returned
 * as one numbered chunk (`chunk`, default 1) that repeats the whole-patch length and SHA-256.
 */
export function invokeEvidence({ cli, operation, binding, slot, path, chunk = 1, chunkBytes }) {
  const spec = specifications[operation];
  const result = spawnSync(process.execPath, [cli, operation, ...(operation === 'content' ? [slot, path] : [])], {
    input: JSON.stringify(binding), encoding: 'utf8', shell: false, windowsHide: true,
    timeout: binding.timeoutMs + 2000, maxBuffer: spec.maxBuffer(binding),
    env: { PATH: dirname(process.execPath), HOME: process.platform === 'win32' ? 'C:\\' : '/nonexistent', LC_ALL: 'C' },
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  if (result.error) throw Error(result.error.code === 'ETIMEDOUT' ? `${spec.label} CLI timed out.` : `${spec.label} CLI could not be started.`);
  let evidence;
  try { evidence = JSON.parse(result.stdout); }
  catch { throw Error(`${spec.label} CLI returned invalid bounded output.`); }
  if (!evidence || !spec.statuses.includes(evidence.status) || evidence.version !== 1 || (operation !== 'identity' && evidence.operation !== operation)) throw Error(`${spec.label} CLI returned an invalid result.`);
  const failed = !(result.status === 0 && (operation === 'identity' ? evidence.status === 'ok' : evidence.status !== 'error'));
  if (operation === 'identity') return { content: [{ type: 'text', text: JSON.stringify(evidence) }], details: evidence, ...(failed ? { isError: true } : {}) };

  if (operation === 'content' && evidence.status !== 'error') {
    const commitSha = slot === 'base' ? binding.baseSha : binding.candidateSha;
    const bindingSha256 = createHash('sha256').update(JSON.stringify(binding)).digest('hex');
    if (evidence.repository !== binding.repository || evidence.baseSha !== binding.baseSha || evidence.candidateSha !== binding.candidateSha || evidence.commitSha !== commitSha || evidence.path !== path || evidence.bindingSha256 !== bindingSha256) throw Error('Content CLI returned mismatched bound provenance.');
  }
  const serialized = JSON.stringify(evidence);
  if (Buffer.byteLength(serialized + '\n') > spec.response) throw Error(`${spec.label} CLI returned output beyond its response bound.`);
  const details = { ...evidence };
  const content = [{ type: 'text', text: serialized }];
  if (evidence.status === 'ok') {
    const field = operation === 'diff' ? 'patch' : 'content';
    const encodingKey = operation === 'diff' ? 'patchEncoding' : 'contentEncoding';
    if (evidence[encodingKey] !== 'base64' || typeof evidence[field] !== 'string') throw Error(operation === 'diff' ? 'Diff CLI returned invalid patch encoding.' : 'Content CLI returned invalid byte encoding.');
    const bytes = Buffer.from(evidence[field], 'base64');
    const lengthKey = operation === 'diff' ? 'patchBytes' : 'contentBytes';
    const digestKey = operation === 'diff' ? 'patchSha256' : 'contentSha256';
    if (bytes.toString('base64') !== evidence[field] || bytes.length !== evidence[lengthKey] || bytes.length > binding.outputBytes || createHash('sha256').update(bytes).digest('hex') !== evidence[digestKey]) throw Error(operation === 'diff' ? 'Diff CLI patch integrity check failed.' : 'Committed content integrity check failed.');
    const integrityKey = operation === 'diff' ? 'patchIntegrity' : 'contentIntegrity';
    details[integrityKey] = 'verified';
    if (operation === 'diff' && chunkBytes) {
      const bounds = chunkBoundaries(bytes, chunkBytes);
      if (chunk > bounds.length) throw Error(`The diff chunk is out of range; the patch has ${bounds.length} chunk(s).`);
      const [start, end] = bounds[chunk - 1];
      const piece = bytes.subarray(start, end);
      delete details.patch;
      delete details.patchEncoding;
      Object.assign(details, { chunk, chunkCount: bounds.length, chunkBytes: piece.length, chunkOffset: start, chunkSha256: createHash('sha256').update(piece).digest('hex'), chunkEncoding: 'base64', chunkBase64: piece.toString('base64') });
      const view = decodeUtf8(piece);
      details.patchTextEncoding = view === null ? 'unavailable-non-utf8' : 'utf8';
      content[0].text = JSON.stringify(details);
      if (view !== null) content.push({ type: 'text', text: view });
      return { content, details, ...(failed ? { isError: true } : {}) };
    }
    const view = decodeUtf8(bytes);
    details[operation === 'diff' ? 'patchTextEncoding' : 'contentTextEncoding'] = view === null ? 'unavailable-non-utf8' : 'utf8';
    if (view !== null) content.push({ type: 'text', text: view });
    content[0].text = JSON.stringify(details);
    // The model-visible text already carries the base64; repeating it in content details would double the result size.
    if (operation === 'content') delete details.content;
  }
  const output = { content, details, ...(failed ? { isError: true } : {}) };
  if (Buffer.byteLength(JSON.stringify(output) + '\n') > spec.display) throw Error(`${spec.label} tool result exceeds its bounded display envelope.`);
  return output;
}
