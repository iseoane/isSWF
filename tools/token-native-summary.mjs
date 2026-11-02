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

function claudeSnapshot(result) {
  if (!result || typeof result !== 'object' || !result.modelUsage || typeof result.modelUsage !== 'object' || Array.isArray(result.modelUsage) || typeof result.session_id !== 'string' || !result.session_id) fail();
  const models = Object.entries(result.modelUsage);
  if (!models.length || models.length > MAX_ROWS || models.some(([model]) => !model.trim())) fail();
  const modelNames = models.map(([model]) => model).sort();
  const counters = Object.fromEntries(names.map(name => [name, 0]));
  for (const [, usage] of models) {
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) fail();
    for (const [key, outputKey] of [['inputTokens', 'input'], ['outputTokens', 'output'], ['cacheReadInputTokens', 'cacheRead'], ['cacheCreationInputTokens', 'cacheWrite']]) {
      const value = usage[key];
      if (value === undefined) counters[outputKey] = null;
      else if (!Number.isSafeInteger(value) || value < 0) fail();
      else if (counters[outputKey] !== null) {
        counters[outputKey] += value;
        if (!Number.isSafeInteger(counters[outputKey])) fail();
      }
    }
  }
  return {
    session: hash(result.session_id),
    model: `model-mix-${hash(JSON.stringify(modelNames))}`,
    modelCount: modelNames.length,
    counters,
  };
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

export function normalizeNative({ input, start, meta }) {
  if (!meta || !['pi', 'claude'].includes(meta.host) || !safeName(meta.hostVersion)) fail();
  if (meta.host === 'claude') {
    if (start) fail();
    return { version: 1, mode: 'snapshot', host: 'claude', hostVersion: meta.hostVersion, sourceVersion: 1, scope: 'tree', ...claudeSnapshot(input) };
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
    const args = {}, fields = new Set(['--input', '--start', '--host', '--id', '--window', '--host-version', '--effort', '--task-class', '--candidate', '--outcome', '--accepted']);
    const parts = process.argv.slice(2);
    for (let index = 0; index < parts.length; index += 2) {
      if (!fields.has(parts[index]) || !parts[index + 1] || Object.hasOwn(args, parts[index])) throw Error('invalid option');
      args[parts[index]] = parts[index + 1];
    }
    if (!args['--input'] || !['pi', 'claude'].includes(args['--host'])) throw Error('invalid options');
    if (args['--host'] === 'claude' && args['--start']) throw Error('unsupported Claude window');
    if (args['--host'] === 'pi' && args['--start'] && args['--accepted'] === undefined) throw Error('invalid options');
    const total = { bytes: 0 };
    const input = await load(args['--input'], total);
    const start = args['--start'] ? await load(args['--start'], total) : undefined;
    const hostVersion = args['--host-version'] ?? (args['--host'] === 'pi' ? input.hostVersion : 'unknown');
    const meta = {
      host: args['--host'], id: args['--id'] ?? 'native', window: args['--window'] ?? 'window', hostVersion,
      effort: args['--effort'] ?? 'unknown', taskClass: args['--task-class'] ?? 'native-summary',
      candidate: args['--candidate'] ?? 'unknown', outcome: args['--outcome'] ?? 'unknown',
      accepted: Number(args['--accepted']),
    };
    const summary = normalizeNative({ input, start, meta });
    const output = `${JSON.stringify(summary, null, 2)}\n`;
    if (Buffer.byteLength(output) > 64 * 1024) throw Error('native summary output limit exceeded');
    process.stdout.write(output);
  } catch (error) {
    process.stderr.write(['native summary input limit exceeded', 'native summary row limit exceeded', 'native summary output limit exceeded'].includes(error.message) ? `${error.message}\n` : 'invalid native summary input or options\n');
    process.exitCode = 1;
  }
}
