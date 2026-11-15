// No Node imports and no `process` access, like tools/isswf-dispatch-guard-core.mjs: the Claude hooks module and the Pi extension both
// call it with an injected `readBytes`. tools/isswf-handoff.mjs is the Node wrapper that runs Git and writes the files.

export const HANDOFF_SCHEMA = 'isswf.handoff/1';
// The Claude hook cannot read a file over 4 MiB, so a diff above it could not be verified there and is refused when it is written.
export const MAX_DIFF_BYTES = 4 * 1024 * 1024;
const MAX_HANDOFF_BYTES = 1024 * 1024;
const LINE_PREFIX = String.raw`^[ \t]*(?:[-*][ \t]+)?`;
const ABSOLUTE_PATH = /^(?:[A-Za-z]:[\\/]|[\\/]{1,2}[^\\/\s])/u;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSha = (value, length) => typeof value === 'string' && new RegExp(`^[0-9a-f]{${length}}$`, 'u').test(value);

/**
 * The handoff path, its SHA-256 and the candidate a reviewer prompt names, each on its own line as `handoff: <absolute path>`,
 * `handoff-sha256: <64 hex>` and `candidate <40 hex>` (a colon after the label is optional), or `{ error }` naming what is missing.
 */
export function handoffReferences(prompt) {
  const body = typeof prompt === 'string' ? prompt : '';
  const path = new RegExp(`${LINE_PREFIX}handoff:?[ \\t]+(\\S.*?)[ \\t\\r]*$`, 'mu').exec(body)?.[1];
  if (path === undefined) return { error: 'the prompt does not give the handoff file as a line `handoff: <absolute path>`' };
  if (!ABSOLUTE_PATH.test(path)) return { error: `the handoff path ${path} must be an absolute path` };
  const sha256 = new RegExp(`${LINE_PREFIX}handoff-sha256:?[ \\t]+([0-9a-f]{64})[ \\t\\r]*$`, 'mu').exec(body)?.[1];
  if (sha256 === undefined) return { error: 'the prompt does not give the 64-hex SHA-256 of the handoff file as a line `handoff-sha256: <hex>`' };
  const candidate = new RegExp(`${LINE_PREFIX}candidate:?[ \\t]+([0-9a-f]{40})[ \\t\\r]*$`, 'mu').exec(body)?.[1];
  if (candidate === undefined) return { error: 'the prompt does not give the full 40-hex candidate SHA as a line `candidate <sha>`' };
  return { path, sha256, candidate };
}

async function readFile(io, path, label) {
  try {
    const bytes = await io.readBytes(path);
    if (bytes instanceof Uint8Array) return { bytes };
  } catch { /* reported below */ }
  return { error: `the ${label} ${path} cannot be read` };
}

/**
 * Checks a reviewer dispatch against its handoff and returns the reason it fails, or undefined when it holds: the handoff file hashes to
 * the digest in the prompt, its envelope names this candidate, base, checkpoint and job brief, and the diff file it names has the bytes and SHA-256 it records.
 * `references` is the parsed brief, checkpoint and base of the prompt; `io.readBytes(path)` resolves with the file's bytes.
 * @param {{ prompt: string, references: { initiative: string, job: string, revision: string, checkpoint: string, base: string }, io: { readBytes: (path: string) => Promise<Uint8Array> } }} input
 */
export async function verifyHandoff({ prompt, references, io }) {
  const named = handoffReferences(prompt);
  if (named.error) return named.error;
  const file = await readFile(io, named.path, 'handoff file');
  if (file.error) return file.error;
  if (file.bytes.length > MAX_HANDOFF_BYTES) return 'the handoff file is over 1 MiB';
  if (sha256Hex(file.bytes) !== named.sha256) return `the handoff file ${named.path} does not match the handoff-sha256 in the prompt (it changed after the digest was taken)`;
  let envelope;
  try {
    envelope = JSON.parse(new TextDecoder().decode(file.bytes));
  } catch {
    return 'the handoff file is not valid JSON';
  }
  if (!isObject(envelope) || envelope.schema !== HANDOFF_SCHEMA) return `the handoff schema is not ${HANDOFF_SCHEMA}`;
  if (envelope.kind !== 'review') return 'the handoff is not a review handoff (kind review)';
  const brief = isObject(envelope.brief) ? envelope.brief : {};
  for (const [field, actual, expected] of [
    ['candidate', envelope.candidate, named.candidate], ['base', envelope.base, references.base], ['checkpoint', brief.checkpoint, references.checkpoint],
    ['initiative', envelope.initiative, references.initiative], ['job', envelope.job, references.job], ['brief revision', String(brief.revision), references.revision],
  ]) if (actual !== expected) return `the handoff ${field} ${actual} is not the prompt's ${expected}`;
  const diff = isObject(envelope.diff) ? envelope.diff : {};
  if (typeof diff.path !== 'string' || !ABSOLUTE_PATH.test(diff.path)) return 'the handoff diff path must be an absolute path';
  if (!Number.isInteger(diff.bytes) || diff.bytes < 0 || diff.bytes > MAX_DIFF_BYTES || !isSha(diff.sha256, 64)) return 'the handoff diff needs an integer bytes up to 4 MiB and a 64-hex sha256';
  const patch = await readFile(io, diff.path, 'diff file');
  if (patch.error) return patch.error;
  if (patch.bytes.length !== diff.bytes) return `the diff file has ${patch.bytes.length} bytes; the handoff records ${diff.bytes}`;
  if (sha256Hex(patch.bytes) !== diff.sha256) return 'the diff file sha-256 does not match the handoff';
  return undefined;
}

/** The commit a review record names on its candidate line, or undefined when the line is missing or names no full SHA. */
export const reviewCandidateOf = text => /^- Candidate commit SHA, or reproducible snapshot identity: *([0-9a-f]{40})\s*$/mu.exec(text)?.[1];

/** The commit SHAs, at least seven characters each, that the review record's coordinator override lines name. */
export const overrideCommitsOf = text => text.split(/\r?\n/u).filter(line => line.startsWith('- Coordinator override')).flatMap(line => line.match(/\b[0-9a-f]{7,40}\b/gu) ?? []);

/** Documentation an override may excuse: anything under docs/ and the Markdown files at the repository root. */
export const isDocsPath = path => path.startsWith('docs/') || (!path.includes('/') && /\.md$/iu.test(path));

/**
 * Splits commits into those that still need a review and those a coordinator override excuses.
 * An override names a commit by SHA or by a prefix of at least seven characters and never excuses a commit that changes more than documentation.
 * @param {{ commits: {commit: string, paths: string[]}[], overrides: string[] }} input
 */
export function uncoveredCommits({ commits, overrides }) {
  const uncovered = [], overridden = [];
  for (const entry of commits) {
    const named = overrides.some(name => entry.commit.startsWith(name));
    (named && entry.paths.every(isDocsPath) ? overridden : uncovered).push(entry);
  }
  return { uncovered, overridden };
}

const K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));

/**
 * The SHA-256 of `bytes` as lowercase hex. It is pure JavaScript because the Claude hooks runtime has no confirmed `node:crypto` and the
 * core may not import Node modules; one implementation on both hosts keeps their verdicts identical.
 * @param {Uint8Array} bytes
 */
export function sha256Hex(bytes) {
  const state = Uint32Array.from([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  // The message, a 0x80 byte, zeros and the bit length as a 64-bit big-endian number, in whole 64-byte blocks.
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bytes.length / 0x20000000));
  view.setUint32(padded.length - 4, (bytes.length << 3) >>> 0);
  const schedule = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) schedule[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const a = schedule[i - 15], b = schedule[i - 2];
      schedule[i] = schedule[i - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + schedule[i - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = state;
    for (let i = 0; i < 64; i += 1) {
      const first = h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + schedule[i];
      const second = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
      h = g; g = f; f = e; e = (d + first) >>> 0; d = c; c = b; b = a; a = (first + second) >>> 0;
    }
    state[0] += a; state[1] += b; state[2] += c; state[3] += d; state[4] += e; state[5] += f; state[6] += g; state[7] += h;
  }
  return Array.from(state, word => word.toString(16).padStart(8, '0')).join('');
}

/** The `isswf.handoff/1` envelope for a review: the one place that fixes its keys and their order. */
export function buildEnvelope({ initiative, job, base, candidate, diff, brief, reviewGuide, round, priorReviews, reviewer, resources }) {
  return {
    schema: HANDOFF_SCHEMA, kind: 'review', initiative, job, base, candidate,
    diff: { path: diff.path, argv: diff.argv, bytes: diff.bytes, sha256: diff.sha256 },
    brief: { path: brief.path, revision: brief.revision, checkpoint: brief.checkpoint, blob: brief.blob ?? null },
    reviewGuide: { path: 'REVIEW.md', blob: reviewGuide ?? null },
    round, priorReviews: [...priorReviews],
    reviewer: { host: reviewer.host, agent: reviewer.agent, model: reviewer.model, effort: reviewer.effort },
    resources: resources.map(({ path, absolutePath, blob }) => ({ path, absolutePath, blob: blob ?? null })),
  };
}
