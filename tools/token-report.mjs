#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_INPUT = 1024 * 1024, MAX_ROWS = 100, MAX_ROW = 4096, MAX_OUTPUT = 64 * 1024;
const fields = ['input', 'output', 'cacheRead', 'cacheWrite'];
const metaFields = ['host', 'hostVersion', 'model', 'effort', 'taskClass', 'candidate', 'outcome', 'provenance', 'scope'];
const allowedTop = new Set(['version', 'mode', 'rows']);
const allowedRow = new Set(['id', ...metaFields, 'accepted', 'window', 'counters', 'durationSeconds', 'requests', 'turns', 'corrections', 'reasoning', 'source', 'segment']);
const ownKeysOnly = (value, allowed) => Object.keys(value).every(key => allowed.has(key));
const text = (value, max = 128) => typeof value === 'string' && value.length > 0 && value.length <= max && /^[A-Za-z0-9][A-Za-z0-9._:+-]*$/u.test(value);
const count = value => value === null || (Number.isSafeInteger(value) && value >= 0);
function invalid() { throw Error('invalid token summary'); }

export function normalize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !ownKeysOnly(input, allowedTop) || input.version !== 1 || input.mode !== 'window' || !Array.isArray(input.rows)) invalid();
  if (input.rows.length > MAX_ROWS) throw Error('row limit exceeded');
  const ids = new Set(), rows = input.rows.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || !ownKeysOnly(row, allowedRow) || Buffer.byteLength(JSON.stringify(row)) > MAX_ROW) invalid();
    for (const key of ['id', ...metaFields, 'window']) if (!text(row[key])) invalid();
    const expectedSource = row.provenance === `manual-${row.host}` || row.provenance === `native-${row.host}-summary` || (row.host === 'claude' && row.provenance === 'native-claude-otel');
    if (!['pi', 'claude'].includes(row.host) || !['agent', 'unattributed', 'tree'].includes(row.scope) || !expectedSource) invalid();
    if (!Number.isSafeInteger(row.accepted) || row.accepted < 0 || !row.counters || typeof row.counters !== 'object' || Array.isArray(row.counters) || !ownKeysOnly(row.counters, new Set(fields))) invalid();
    for (const key of fields) if (!Object.hasOwn(row.counters, key) || !count(row.counters[key])) invalid();
    if (ids.has(`${row.window}\0${row.id}`)) throw Error('duplicate row identity/window');
    ids.add(`${row.window}\0${row.id}`);
    if (row.provenance === 'native-claude-otel' && (!['main', 'subagent', 'auxiliary'].includes(row.source) || !/^[a-f0-9]{24}$/u.test(row.segment ?? ''))) invalid();
    for (const key of ['durationSeconds', 'requests', 'turns', 'corrections', 'reasoning']) if (Object.hasOwn(row, key) && !count(row[key])) invalid();
    const { reasoning, ...safe } = row;
    return { ...safe, reasoning: reasoning ?? null };
  });
  const outcomeAcceptances = new Map();
  for (const row of rows) {
    const key = `${row.window}\0${row.outcome}`;
    const declared = outcomeAcceptances.get(key);
    if (declared && (declared.accepted !== row.accepted || declared.candidate !== row.candidate)) throw Error('contradictory outcome acceptance');
    outcomeAcceptances.set(key, { accepted: row.accepted, candidate: row.candidate });
  }
  const windows = new Map();
  for (const row of rows) {
    if (!windows.has(row.window)) windows.set(row.window, []);
    windows.get(row.window).push(row);
  }
  for (const windowRows of windows.values()) {
    if (windowRows.some(row => row.scope === 'tree') && windowRows.length > 1) throw Error('overlapping row scopes');
  }
  rows.sort((a, b) => a.window.localeCompare(b.window) || a.id.localeCompare(b.id));
  return { version: 1, mode: 'window', rows };
}
function safeSum(values) {
  const result = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(result)) throw Error('counter total exceeds safe integer range');
  return result;
}
function sumKnown(rows, key) { return rows.every(row => row.counters[key] !== null) ? safeSum(rows.map(row => row.counters[key])) : null; }
function summarize(input) {
  const rows = input.rows;
  const counters = Object.fromEntries(fields.map(key => [key, sumKnown(rows, key)]));
  const knownSubtotal = safeSum(rows.flatMap(row => fields.map(key => row.counters[key] ?? 0)));
  const processed = fields.every(key => counters[key] !== null) ? safeSum(fields.map(key => counters[key])) : null;
  const acceptances = new Map(rows.map(row => [`${row.window}\0${row.outcome}`, row.accepted]));
  const accepted = safeSum([...acceptances.values()]);
  const cacheDenominator = counters.input === null || counters.cacheRead === null || counters.cacheWrite === null ? null : safeSum([counters.input, counters.cacheRead, counters.cacheWrite]);
  const individualRows = rows.filter(row => row.scope === 'agent').length;
  const aggregateRows = rows.filter(row => row.scope === 'tree').length;
  const unattributedRows = rows.filter(row => row.scope === 'unattributed').length;
  const attribution = rows.length === 0 ? 'unknown' : unattributedRows && (individualRows || aggregateRows) ? 'partial' : unattributedRows ? 'unattributed' : aggregateRows && individualRows ? 'mixed-aggregate-and-individual' : aggregateRows ? 'aggregate-only' : 'individual';
  return { rows, counters, processed, processedSubtotal: processed === null ? knownSubtotal : null, totalStatus: processed === null ? 'partial-subtotal' : 'complete', accepted, tokensPerAccepted: accepted > 0 && processed !== null ? processed / accepted : null, cacheReadShare: cacheDenominator > 0 ? counters.cacheRead / cacheDenominator : null, attribution, coverage: { individualRows, aggregateRows, unattributedRows } };
}
function compare(before, after) {
  const a = before.rows, b = after.rows;
  const keys = ['window', 'id', 'outcome', 'host', 'hostVersion', 'model', 'effort', 'taskClass', 'scope', 'accepted', 'provenance', 'source'];
  const byIdentity = new Map(b.map(row => [`${row.window}\0${row.id}`, row]));
  const comparable = a.length === b.length && a.every(row => {
    const counterpart = byIdentity.get(`${row.window}\0${row.id}`);
    return counterpart && keys.every(key => row[key] === counterpart[key]) && fields.every(key => (row.counters[key] === null) === (counterpart.counters[key] === null));
  });
  const reasons = [];
  if (!comparable) reasons.push('metadata, actor scope, outcome/window identity, acceptance basis, row count, or counter availability differs');
  const positiveBaseline = before.processed !== null && before.processed > 0;
  const rawDifference = comparable && positiveBaseline && after.processed !== null ? before.processed - after.processed : null;
  const perAcceptedDifference = comparable && positiveBaseline && before.tokensPerAccepted !== null && after.tokensPerAccepted !== null ? before.tokensPerAccepted - after.tokensPerAccepted : null;
  if (!positiveBaseline) reasons.push('baseline processed total is unknown or zero');
  if (before.tokensPerAccepted === null || after.tokensPerAccepted === null) reasons.push('accepted-outcome ratio is undefined');
  const status = !comparable || !positiveBaseline ? 'incomparable' : after.processed === null ? 'partial' : 'comparable';
  if (after.processed === null && positiveBaseline && comparable) reasons.push('after processed total is partial');
  return { status, reasons, processedDifference: rawDifference, processedReductionPercent: rawDifference === null ? null : 100 * rawDifference / before.processed, tokensPerAcceptedDifference: perAcceptedDifference };
}
export function report(summary, beforeSummary = null) {
  const afterInput = normalize(summary);
  const beforeInput = beforeSummary ? normalize(beforeSummary) : null;
  if (afterInput.rows.length + (beforeInput?.rows.length ?? 0) > MAX_ROWS) throw Error('row limit exceeded');
  const after = summarize(afterInput);
  const hasClaudeOtel = afterInput.rows.some(row => row.provenance === 'native-claude-otel');
  const result = {
    version: 1, reportType: 'offline-token-summary', totals: after,
    comparison: beforeInput ? compare(summarize(beforeInput), after) : null,
    collectionPolicy: hasClaudeOtel ? 'managed-policy-not-inspected; local-only export is unverified' : null,
    claims: hasClaudeOtel ? 'Native Claude OTLP metrics normalized locally; this is not billing, a wider session total, or verified local-only telemetry.' : 'Curated supplied summaries only; no native collection, billing, or live-session measurement.',
  };
  const output = JSON.stringify(result, null, 2);
  if (Buffer.byteLength(output) > MAX_OUTPUT) throw Error('report limit exceeded');
  return result;
}

async function load(path, total) {
  const remaining = MAX_INPUT - total.bytes;
  const buffer = Buffer.alloc(remaining + 1);
  const handle = await open(resolve(path), 'r');
  try {
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > remaining) throw Error('input limit exceeded');
    total.bytes += length;
    return JSON.parse(buffer.toString('utf8', 0, length));
  } finally {
    await handle.close();
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = {}, parts = process.argv.slice(2);
    for (let i = 0; i < parts.length; i += 2) {
      if (!['--input', '--before', '--after'].includes(parts[i]) || !parts[i + 1] || Object.hasOwn(args, parts[i])) throw Error('invalid token-report option');
      args[parts[i]] = parts[i + 1];
    }
    const total = { bytes: 0 };
    let result;
    if (args['--input'] && !args['--before'] && !args['--after']) result = report(await load(args['--input'], total));
    else if (!args['--input'] && args['--before'] && args['--after']) result = report(await load(args['--after'], total), await load(args['--before'], total));
    else throw Error('supply --input or both --before and --after');
    const output = JSON.stringify(result, null, 2);
    if (Buffer.byteLength(output) > MAX_OUTPUT) throw Error('report limit exceeded');
    console.log(output);
  } catch (error) {
    console.error(['invalid token summary', 'duplicate row identity/window', 'overlapping row scopes', 'row limit exceeded', 'input limit exceeded', 'report limit exceeded', 'invalid token-report option', 'supply --input or both --before and --after'].includes(error.message) ? error.message : 'unable to read or parse input');
    process.exitCode = 1;
  }
}
