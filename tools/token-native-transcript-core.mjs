// No Node imports and no Node globals: tools/isswf-run-usage-core.mjs loads this module in runtimes
// that only offer an injected fs. tools/token-native-claude-transcript.mjs re-exports it.
export const LIMITS = Object.freeze({ file: 64 * 1024 * 1024, total: 256 * 1024 * 1024, entries: 200_000, subagents: 99 });
const MAX_LINE = 4 * 1024 * 1024;
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/u;
export const USAGE_KEYS = [['input', 'input_tokens'], ['output', 'output_tokens'], ['cacheRead', 'cache_read_input_tokens'], ['cacheWrite', 'cache_creation_input_tokens']];
let encoder;
export const safe = value => typeof value === 'string' && SAFE.test(value) ? value : null;
export const single = values => values.size === 1 ? [...values][0] : values.size === 0 ? 'unknown' : 'mixed';
export const integer = value => Number.isSafeInteger(value) && value >= 0;

export class FormatError extends Error {
  constructor(check, versions = new Set()) { super(check); this.versions = versions; }
}
const fail = check => { throw new FormatError(check); };

/** Validates Pi's `{input, output, cacheRead, cacheWrite}` usage counters. */
export function piUsage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('invalid native usage');
  const counters = {};
  for (const key of ['input', 'output', 'cacheRead', 'cacheWrite']) {
    if (!integer(value[key])) throw Error('native usage counter unavailable');
    counters[key] = value[key];
  }
  return counters;
}

/**
 * Parses one Claude transcript into per-request usage. Throws FormatError carrying a fixed check name only.
 * `onEntry` sees every parsed object entry, so callers can collect more without a second parse.
 * With `lenient`, an invalid line is skipped instead, the first failing check is returned as `invalid`,
 * and the entry limit ends the parse early.
 */
export function parseTranscript(content, budget = { entries: 0 }, onEntry = () => {}, lenient = false) {
  const versions = new Set();
  try { return parseLines(content, budget, versions, onEntry, lenient); } catch (error) {
    if (error instanceof FormatError) throw new FormatError(error.message, versions);
    throw error;
  }
}

function parseLines(content, budget, versions, onEntry, lenient) {
  const lines = content.split('\n');
  const trailing = lines.pop();
  const requests = new Map(), models = new Set(), efforts = new Set();
  let trailingIncomplete = false, invalid = null;
  const handle = (line, last) => {
    if (line.length === 0) return;
    // A UTF-16 code unit encodes to at most 3 UTF-8 bytes, so shorter lines cannot exceed the limit.
    if (line.length * 3 > MAX_LINE && (encoder ??= new TextEncoder()).encode(line).length > MAX_LINE) fail('line-size-limit');
    if (++budget.entries > (budget.maxEntries ?? LIMITS.entries)) fail('entry-limit');
    let entry;
    try { entry = JSON.parse(line); } catch {
      if (last) { trailingIncomplete = true; return; }
      fail('malformed-line');
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('entry-not-object');
    onEntry(entry);
    if (typeof entry.version === 'string') versions.add(entry.version);
    if (entry.type !== 'assistant') return;
    const message = entry.message;
    if (!message || typeof message !== 'object' || Array.isArray(message)) fail('missing-message');
    if (message.model === '<synthetic>') return;
    const usage = message.usage;
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) fail('missing-usage');
    if (typeof entry.requestId !== 'string' || entry.requestId.length === 0 || entry.requestId.length > 256) fail('missing-request-id');
    const counters = {};
    for (const [target, source] of USAGE_KEYS) {
      if (!integer(usage[source])) fail('invalid-usage-counter');
      counters[target] = usage[source];
    }
    const previous = requests.get(entry.requestId);
    if (previous && USAGE_KEYS.some(([key]) => previous[key] !== counters[key])) fail('conflicting-duplicate-request');
    requests.set(entry.requestId, counters);
    models.add(safe(message.model) ?? 'unknown');
    efforts.add(safe(entry.effort) ?? 'unknown');
  };
  const step = (line, last) => {
    if (!lenient) return handle(line, last);
    try { handle(line, last); } catch (error) {
      if (!(error instanceof FormatError)) throw error;
      invalid ??= error.message;
      if (error.message === 'entry-limit') return true;
    }
  };
  let stopped = false;
  for (const line of lines) if ((stopped = step(line, false))) break;
  if (!stopped && trailing !== undefined) step(trailing, true);
  return { requests, models, efforts, versions, trailingIncomplete, invalid };
}
