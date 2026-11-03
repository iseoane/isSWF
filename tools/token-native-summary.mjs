#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const MAX_INPUT = 1024 * 1024, MAX_ROWS = 100;
const names = ['input', 'output', 'cacheRead', 'cacheWrite'];
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
const safeName = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/u.test(value);
const fail = () => { throw Error('invalid native summary input'); };

async function load(path, total) {
  const handle = await open(resolve(path), 'r');
  try {
    const stat = await handle.stat();
    const remaining = MAX_INPUT - total.bytes;
    if (!stat.isFile() || stat.size > remaining) throw Error('native summary input limit exceeded');
    const buffer = Buffer.alloc(remaining + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > remaining) throw Error('native summary input limit exceeded');
    total.bytes += length;
    return JSON.parse(buffer.toString('utf8', 0, length));
  } finally { await handle.close(); }
}

function piRows(receipt, allowUnresolved = false) {
  if (!receipt || receipt.version !== 1 || receipt.host !== 'pi' || receipt.sourceVersion !== 1 || !safeName(receipt.hostVersion) || receipt.scope !== 'parent-plus-children' || !/^[a-f0-9]{24}$/u.test(receipt.session ?? '') || !Array.isArray(receipt.branch) || !Array.isArray(receipt.rows) || receipt.rows.length > MAX_ROWS || !Number.isSafeInteger(receipt.unresolvedAsyncChildren) || receipt.unresolvedAsyncChildren < 0 || (!allowUnresolved && receipt.unresolvedAsyncChildren !== 0)) fail();
  if (receipt.branch.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/u.test(id))) fail();
  const ids = new Set();
  const rows = receipt.rows.map(row => {
    if (!row || (row.id !== 'parent' && !/^child-[a-f0-9]{24}$/u.test(row.id ?? '')) || ids.has(row.id) || !row.counters || typeof row.counters !== 'object' || Array.isArray(row.counters)) fail();
    ids.add(row.id);
    const counters = {};
    for (const name of names) {
      const value = row.counters[name];
      if (!Number.isSafeInteger(value) || value < 0) fail();
      counters[name] = value;
    }
    return { id: row.id, counters };
  });
  if (!ids.has('parent')) fail();
  return rows;
}

const claudeFields = [['inputTokens', 'input'], ['outputTokens', 'output'], ['cacheReadInputTokens', 'cacheRead'], ['cacheCreationInputTokens', 'cacheWrite']];
function claudeUsage(result) {
  if (!result || typeof result !== 'object' || !result.modelUsage || typeof result.modelUsage !== 'object' || Array.isArray(result.modelUsage) || typeof result.session_id !== 'string' || !result.session_id) fail();
  const models = Object.entries(result.modelUsage);
  if (!models.length || models.length > MAX_ROWS || models.some(([model]) => !model.trim())) fail();
  const perModel = new Map();
  for (const [model, usage] of models) {
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) fail();
    const counters = {};
    for (const [key, name] of claudeFields) {
      const value = usage[key];
      if (value === undefined) counters[name] = null;
      else if (!Number.isSafeInteger(value) || value < 0) fail();
      else counters[name] = value;
    }
    perModel.set(model, counters);
  }
  const modelNames = [...perModel.keys()].sort();
  const counters = Object.fromEntries(names.map(name => [name, 0]));
  for (const usage of perModel.values()) for (const name of names) {
    if (usage[name] === null) counters[name] = null;
    else if (counters[name] !== null) {
      counters[name] += usage[name];
      if (!Number.isSafeInteger(counters[name])) fail();
    }
  }
  return { session: result.session_id, modelNames, perModel, counters };
}
function claudeSnapshot(result) {
  const usage = claudeUsage(result);
  return {
    session: hash(usage.session),
    model: `model-mix-${hash(JSON.stringify(usage.modelNames))}`,
    modelCount: usage.modelNames.length,
    counters: usage.counters,
  };
}
function claudeWindow(startResult, endResult) {
  const start = claudeUsage(startResult), end = claudeUsage(endResult);
  if (start.session !== end.session || JSON.stringify(start.modelNames) !== JSON.stringify(end.modelNames)) fail();
  const counters = Object.fromEntries(names.map(name => [name, (() => {
    const deltas = start.modelNames.map(model => {
      const before = start.perModel.get(model)[name], after = end.perModel.get(model)[name];
      if (before === null || after === null) return null;
      if (after < before) fail();
      return after - before;
    });
    if (deltas.includes(null)) return null;
    const total = deltas.reduce((sum, value) => sum + value, 0);
    if (!Number.isSafeInteger(total)) fail();
    return total;
  })()]));
  return {
    session: hash(end.session),
    model: `model-mix-${hash(JSON.stringify(end.modelNames))}`,
    counters,
  };
}
function claudeAgentSnapshot(summary) {
  if (!summary || typeof summary !== 'object' || summary.status !== 'completed' || typeof summary.agentId !== 'string' || !summary.agentId || !summary.usage || typeof summary.usage !== 'object' || Array.isArray(summary.usage)) fail();
  const counters = {};
  for (const [key, name] of [['input_tokens', 'input'], ['output_tokens', 'output'], ['cache_read_input_tokens', 'cacheRead'], ['cache_creation_input_tokens', 'cacheWrite']]) {
    const value = summary.usage[key];
    if (value === undefined || (value === null && (name === 'cacheRead' || name === 'cacheWrite'))) counters[name] = null;
    else if (!Number.isSafeInteger(value) || value < 0) fail();
    else counters[name] = value;
  }
  const models = [...new Set([...(typeof summary.resolvedModel === 'string' ? [summary.resolvedModel] : []), ...(Array.isArray(summary.modelsUsed) ? summary.modelsUsed.filter(model => typeof model === 'string') : [])])].filter(Boolean).sort();
  if (summary.modelsUsed !== undefined && (!Array.isArray(summary.modelsUsed) || summary.modelsUsed.some(model => typeof model !== 'string'))) fail();
  if (summary.resolvedModel !== undefined && typeof summary.resolvedModel !== 'string') fail();
  return { agent: `agent-${hash(summary.agentId)}`, model: models.length ? `model-mix-${hash(JSON.stringify(models))}` : 'unknown', modelCount: models.length, counters };
}

function deltaRows(start, end) {
  if (start.unresolvedAsyncChildren !== 0 || end.unresolvedAsyncChildren !== 0 || start.hostVersion !== end.hostVersion) fail();
  const before = new Map(piRows(start).map(row => [row.id, row]));
  const after = piRows(end);
  if (start.session !== end.session || start.branch.length > end.branch.length || !start.branch.every((id, index) => end.branch[index] === id)) fail();
  const endIds = new Set(after.map(row => row.id));
  if ([...before.keys()].some(id => !endIds.has(id))) fail();
  return after.map(row => {
    const previous = before.get(row.id);
    const counters = Object.fromEntries(names.map(name => {
      const current = row.counters[name];
      if (!previous) return [name, current];
      const old = previous.counters[name];
      if (current < old) fail();
      return [name, current - old];
    }));
    return { id: row.id, counters, scope: row.id === 'parent' ? 'unattributed' : 'agent', model: 'host-normalized' };
  });
}

const digits = value => typeof value === 'string' && /^[1-9][0-9]*$/u.test(value);

// Observed per-series snapshot: each native series keeps its own interval; no common window is inferred.
export function snapshotClaudeOtel({ input, meta }) {
  if (!input || input.version !== 2 || input.host !== 'claude' || input.provenance !== 'native-claude-otel' || input.sourceVersion !== 'claude_code.token.usage-otlp-cumulative' || !['export-observed', 'no-export-observed'].includes(input.exportStatus) || !Number.isSafeInteger(input.receivedExports) || input.receivedExports < 0 || !Number.isSafeInteger(input.ignoredRequests) || input.ignoredRequests < 0 || !safeName(input.hostVersion) || !/^[a-f0-9]{24}$/u.test(input.capture ?? '') || !Array.isArray(input.series) || input.series.length > MAX_ROWS || meta.host !== 'claude' || meta.hostVersion !== input.hostVersion) fail();
  if (!['effort', 'taskClass', 'candidate'].every(key => safeName(meta[key]))) fail();
  const seen = new Set(), observed = new Map();
  const series = input.series.map(entry => {
    if (!entry || Object.keys(entry).length !== 7 || !/^[a-f0-9]{24}$/u.test(entry.series ?? '') || seen.has(entry.series) || !digits(entry.start) || !digits(entry.end) || BigInt(entry.end) <= BigInt(entry.start) || !sources.has(entry.source) || !safeName(entry.model) || !['input', 'output', 'cacheRead', 'cacheCreation'].includes(entry.category) || !Number.isSafeInteger(entry.value) || entry.value < 0) fail();
    seen.add(entry.series);
    return { series: entry.series, source: entry.source, model: entry.model, category: entry.category, start: entry.start, end: entry.end, value: entry.value };
  }).sort((x, y) => (x.series < y.series ? -1 : x.series > y.series ? 1 : 0));
  // Shared rule: export-observed exactly when at least one native token series was accepted.
  if ((input.exportStatus === 'export-observed') !== (series.length > 0) || (series.length > 0) !== (input.receivedExports > 0)) fail();
  for (const entry of series) {
    // Distinct native series under one visible projection have disjoint attribute sets, so their values add.
    const key = `${entry.source}:${entry.model}:${entry.category}`;
    const row = observed.get(key) ?? { source: entry.source, model: entry.model, category: entry.category, value: 0, series: [] };
    row.value += entry.value; row.series.push(entry.series);
    if (!Number.isSafeInteger(row.value)) fail();
    observed.set(key, row);
  }
  const rows = [...observed.values()].sort((x, y) => { const a = `${x.source}:${x.model}:${x.category}`, b = `${y.source}:${y.model}:${y.category}`; return a < b ? -1 : a > b ? 1 : 0; });
  const observedSubtotal = rows.reduce((sum, row) => sum + row.value, 0);
  if (!Number.isSafeInteger(observedSubtotal)) fail();
  return {
    version: 1, mode: 'observed-snapshot', host: 'claude', hostVersion: input.hostVersion, provenance: 'native-claude-otel',
    effort: meta.effort, taskClass: meta.taskClass, candidate: meta.candidate, capture: input.capture,
    exportStatus: input.exportStatus, coverage: 'observed-series-only', series, observed: rows,
    observedSubtotal: input.exportStatus === 'export-observed' ? observedSubtotal : null, total: null, totalStatus: 'unknown-coverage',
  };
}

const sources = new Set(['main', 'subagent', 'auxiliary']);

export function normalizeNative({ input, start, meta }) {
  if (!meta || !['pi', 'claude'].includes(meta.host) || !safeName(meta.hostVersion)) fail();
  if (meta.host === 'claude') {
    if (input?.agentOutput !== undefined) {
      if (start) fail();
      return { version: 1, mode: 'snapshot', host: 'claude', hostVersion: meta.hostVersion, sourceVersion: 'claude-sdk-tools-2.1.299', scope: 'agent', ...claudeAgentSnapshot(input.agentOutput) };
    }
    if (start && meta.hostVersion === 'unknown') fail();
    const native = start ? claudeWindow(start, input) : claudeSnapshot(input);
    if (!start) return { version: 1, mode: 'snapshot', host: 'claude', hostVersion: meta.hostVersion, sourceVersion: 1, scope: 'tree', ...native };
    if (!['id', 'window', 'effort', 'taskClass', 'candidate', 'outcome'].every(key => safeName(meta[key])) || !Number.isSafeInteger(meta.accepted) || meta.accepted < 0) fail();
    const id = `${meta.id}-tree`;
    if (!safeName(id)) fail();
    return { version: 1, mode: 'window', rows: [{
      id, host: 'claude', hostVersion: meta.hostVersion, model: native.model,
      effort: meta.effort, taskClass: meta.taskClass, candidate: meta.candidate,
      outcome: meta.outcome, accepted: meta.accepted, provenance: 'native-claude-summary',
      scope: 'tree', window: meta.window, counters: native.counters,
    }] };
  }

  const rows = start
    ? deltaRows(start, input)
    : piRows(input, true).map(row => ({ ...row, scope: row.id === 'parent' ? 'unattributed' : 'agent', model: 'host-normalized' }));
  if (meta.hostVersion !== input.hostVersion && input.hostVersion !== 'unknown') fail();
  if (!start) {
    if (input.unresolvedAsyncChildren > 0) rows.push({ id: 'unresolved', counters: Object.fromEntries(names.map(name => [name, null])), scope: 'unattributed', model: 'host-normalized' });
    if (rows.length > MAX_ROWS) fail();
    return {
      version: 1, mode: 'snapshot', host: 'pi', hostVersion: meta.hostVersion,
      sourceVersion: 1, scope: 'parent-plus-children', session: input.session,
      branch: [...input.branch], unresolvedAsyncChildren: input.unresolvedAsyncChildren,
      rows: rows.map(row => ({ id: row.id, scope: row.scope, counters: row.counters })),
    };
  }

  if (!['id', 'window', 'effort', 'taskClass', 'candidate', 'outcome'].every(key => safeName(meta[key])) || !Number.isSafeInteger(meta.accepted) || meta.accepted < 0) fail();
  const reportRows = rows.map(row => ({ ...row, id: `${meta.id}-${row.id}` }));
  if (reportRows.length > MAX_ROWS || reportRows.some(row => !safeName(row.id))) fail();
  return { version: 1, mode: 'window', rows: reportRows.map(row => ({
    id: row.id, host: 'pi', hostVersion: meta.hostVersion, model: row.model,
    effort: meta.effort, taskClass: meta.taskClass, candidate: meta.candidate,
    outcome: meta.outcome, accepted: meta.accepted, provenance: 'native-pi-summary',
    scope: row.scope, window: meta.window, counters: row.counters,
  })) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = {}, fields = new Set(['--input', '--capture', '--otel', '--start', '--host', '--id', '--window', '--host-version', '--effort', '--task-class', '--candidate', '--outcome', '--accepted']);
    const parts = process.argv.slice(2);
    for (let index = 0; index < parts.length; index += 2) {
      if (!fields.has(parts[index]) || !parts[index + 1] || Object.hasOwn(args, parts[index])) throw Error('invalid option');
      args[parts[index]] = parts[index + 1];
    }
    if ([args['--input'], args['--capture'], args['--otel']].filter(Boolean).length !== 1 || !['pi', 'claude'].includes(args['--host'] ?? (args['--capture'] ? 'pi' : args['--otel'] ? 'claude' : ''))) throw Error('invalid options');
    const host = args['--host'] ?? (args['--otel'] ? 'claude' : 'pi');
    if (args['--otel'] && (host !== 'claude' || args['--start'])) throw Error('invalid options');
    if (host === 'pi' && (args['--start'] || args['--capture']) && args['--accepted'] === undefined) throw Error('invalid options');
    const total = { bytes: 0 };
    let input, start;
    if (args['--otel']) {
      input = await load(args['--otel'], total);
    } else if (args['--capture']) {
      const capture = await load(args['--capture'], total);
      if (capture?.version !== 1 || capture.owner !== 'isswf/pi-native-capture-v1' || capture.latest?.host !== 'pi' || !capture.baseline) throw Error('invalid automatic capture');
      input = capture.latest;
      start = capture.baseline;
    } else {
      input = await load(args['--input'], total);
      start = args['--start'] ? await load(args['--start'], total) : undefined;
    }
    const hostVersion = args['--host-version'] ?? (args['--otel'] ? input.hostVersion : host === 'pi' ? input.hostVersion : 'unknown');
    const meta = {
      host, id: args['--id'] ?? 'native', window: args['--window'] ?? 'window', hostVersion,
      effort: args['--effort'] ?? 'unknown', taskClass: args['--task-class'] ?? 'native-summary',
      candidate: args['--candidate'] ?? 'unknown', outcome: args['--outcome'] ?? 'unknown',
      accepted: Number(args['--accepted']),
    };
    const summary = args['--otel'] ? snapshotClaudeOtel({ input, meta }) : normalizeNative({ input, start, meta });
    const output = `${JSON.stringify(summary, null, 2)}\n`;
    if (Buffer.byteLength(output) > 64 * 1024) throw Error('native summary output limit exceeded');
    process.stdout.write(output);
  } catch (error) {
    process.stderr.write(['native summary input limit exceeded', 'native summary row limit exceeded', 'native summary output limit exceeded'].includes(error.message) ? `${error.message}\n` : 'invalid native summary input or options\n');
    process.exitCode = 1;
  }
}
