#!/usr/bin/env node
import { createServer } from 'node:http';
import { lstatSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, open, lstat, readdir, unlink } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BODY = 1024 * 1024, MAX_ROWS = 100, MAX_ROW = 4096, MAX_REPORT = 64 * 1024;
const categories = new Set(['input', 'output', 'cacheRead', 'cacheCreation']);
const sources = new Set(['main', 'subagent', 'auxiliary']);
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24);

function canonicalAttributes(attributes) {
  if (!Array.isArray(attributes)) throw Error('invalid metric attributes');
  const seen = new Set();
  const entries = attributes.map(item => {
    if (!item || typeof item.key !== 'string' || !item.key || seen.has(item.key) || !item.value || typeof item.value !== 'object' || Array.isArray(item.value)) throw Error('invalid or duplicate metric attribute');
    seen.add(item.key);
    const keys = Object.keys(item.value);
    if (keys.length !== 1) throw Error('invalid metric attribute value');
    const variant = keys[0], payload = item.value[variant];
    let normalized;
    if (variant === 'stringValue' && typeof payload === 'string') normalized = payload;
    else if (variant === 'boolValue' && typeof payload === 'boolean') normalized = payload;
    else if (variant === 'doubleValue' && typeof payload === 'number' && Number.isFinite(payload)) normalized = Object.is(payload, -0) ? 0 : payload;
    else if (variant === 'intValue' && (typeof payload === 'number' && Number.isSafeInteger(payload) || typeof payload === 'string' && /^-?(0|[1-9][0-9]*)$/u.test(payload) && Number.isSafeInteger(Number(payload)))) normalized = Number(payload);
    else throw Error('invalid metric attribute value');
    return [item.key, { [variant]: normalized }];
  });
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function timestamp(value) {
  if (!(typeof value === 'string' && /^(0|[1-9][0-9]*)$/u.test(value)) && !(Number.isSafeInteger(value) && value >= 0)) throw Error('invalid metric timestamp');
  const parsed = BigInt(value);
  if (parsed <= 0n) throw Error('invalid metric timestamp');
  return parsed.toString();
}

function countersFrom(payload) {
  if (!payload || !Array.isArray(payload.resourceMetrics) || payload.resourceMetrics.length > 10) throw Error('invalid metrics payload');
  const counters = new Map();
  for (const resource of payload.resourceMetrics) {
    if (!Array.isArray(resource.scopeMetrics) || resource.scopeMetrics.length > 20) throw Error('invalid metrics payload');
    const resourceIdentity = canonicalAttributes(resource.resource?.attributes ?? []);
    for (const scope of resource.scopeMetrics) for (const metric of scope.metrics ?? []) {
      const scopeName = scope.scope?.name ?? '', scopeVersion = scope.scope?.version ?? '';
      if (typeof scopeName !== 'string' || typeof scopeVersion !== 'string') throw Error('invalid metric scope');
      const scopeIdentity = JSON.stringify([scopeName, scopeVersion, canonicalAttributes(scope.scope?.attributes ?? [])]);
      if (metric.name !== 'claude_code.token.usage') continue;
      if (metric.sum?.isMonotonic !== true || metric.sum?.aggregationTemporality !== 2 || !Array.isArray(metric.sum.dataPoints)) throw Error('cumulative metrics required');
      for (const point of metric.sum.dataPoints) {
        const pointAttributes = point.attributes ?? [];
        const pointIdentity = canonicalAttributes(pointAttributes);
        const attrs = Object.fromEntries(pointAttributes.filter(item => ['type', 'query_source', 'model'].includes(item.key)).map(item => [item.key, item.value.stringValue]));
        if (!categories.has(attrs.type) || !sources.has(attrs.query_source)) continue;
        if (Object.hasOwn(point, 'asInt') === Object.hasOwn(point, 'asDouble')) throw Error('invalid metric counter');
        const rawValue = Object.hasOwn(point, 'asInt') ? point.asInt : point.asDouble;
        const value = typeof rawValue === 'string' && /^(0|[1-9][0-9]*)$/u.test(rawValue) ? Number(rawValue) : rawValue;
        if (typeof rawValue !== 'number' && typeof rawValue !== 'string' || !Number.isSafeInteger(value) || value < 0) throw Error('invalid metric counter');
        const start = timestamp(point.startTimeUnixNano), end = timestamp(point.timeUnixNano);
        if (BigInt(end) <= BigInt(start)) throw Error('invalid metric timestamp order');
        const model = typeof attrs.model === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/u.test(attrs.model) ? `model-${hash(attrs.model)}` : 'unknown';
        if (metric.unit !== undefined && typeof metric.unit !== 'string') throw Error('invalid metric unit');
        // Native stream identity: resource, scope, metric properties and every point attribute.
        const series = hash(JSON.stringify([resourceIdentity, scopeIdentity, metric.name, metric.unit ?? '', pointIdentity]));
        if (counters.has(series)) throw Error('duplicate metric series');
        counters.set(series, { source: attrs.query_source, model, category: attrs.type, value, series, start, end });
      }
    }
  }
  if (counters.size > MAX_ROWS) throw Error('metric row limit exceeded');
  return [...counters].sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => ({ id: key, ...row }));
}

export async function readConfig(cwd) {
  const roots = ['.isswf', '.factory'].filter(name => {
    try { const info = lstatSync(join(cwd, name)); return info.isDirectory() && !info.isSymbolicLink(); } catch { return false; }
  });
  if (roots.length !== 1) return { enabled: false, reason: 'Claude capture disabled: select one regular project state root.' };
  const base = resolve(cwd, roots[0]), configPath = join(base, 'claude-native-usage.json');
  let config;
  try {
    const info = lstatSync(configPath);
    if (!info.isFile() || info.isSymbolicLink()) throw Error('unsafe setup configuration');
    config = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { enabled: false };
    return { enabled: false, reason: 'Claude capture disabled: setup configuration is unreadable or unsafe.' };
  }
  if (config?.version !== 1 || typeof config.enabled !== 'boolean') return { enabled: false, reason: 'Claude capture disabled: setup configuration is invalid.' };
  if (!config.enabled) return { enabled: false };
  const interval = config.exportIntervalMs ?? 60000;
  if (!Number.isSafeInteger(interval) || interval < 1000 || interval > 60000) return { enabled: false, reason: 'Claude capture disabled: setup configuration is invalid.' };
  if (typeof config.destination !== 'string' || !config.destination) throw Error('enabled Claude capture requires a destination');
  const destination = resolve(base, config.destination), rel = relative(base, destination);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw Error('unsafe capture destination');
  const configInfo = lstatSync(configPath);
  if (!configInfo.isFile() || configInfo.isSymbolicLink()) throw Error('unsafe Claude capture config');
  let parent = base;
  for (const part of rel.split(/[\\/]+/u)) {
    if (!part || part === '.' || part === '..') throw Error('unsafe capture destination');
    parent = join(parent, part);
    try { const info = lstatSync(parent); if (!info.isDirectory() || info.isSymbolicLink()) throw Error('unsafe capture destination'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { enabled: true, destination, base, configPath, exportIntervalMs: interval };
}

export function conflictingTelemetryEnvironment(environment) {
  return Object.keys(environment).filter(key => /^(?:OTEL_|CLAUDE_CODE_(?:ENABLE_TELEMETRY|OTEL_|USE_MANAGED_SETTINGS_ONLY))/iu.test(key));
}

export function claudeExecutable(platform = process.platform) { return platform === 'win32' ? 'claude.exe' : 'claude'; }

export { countersFrom };

export function mergeCumulative(previousRows, receivedRows) {
  const next = new Map(previousRows);
  const seen = new Set();
  for (const row of receivedRows) {
    if (seen.has(row.id)) throw Error('duplicate metric series');
    seen.add(row.id);
    const previous = next.get(row.id);
    if (previous && row.start === previous.start && row.end === previous.end && row.value === previous.value) continue;
    if (previous && row.end === previous.end) throw Error('conflicting metric observation');
    if (previous && row.start !== previous.start) throw Error('cumulative metric segment changed; unsupported transition');
    if (previous && BigInt(row.end) <= BigInt(previous.end)) throw Error('replayed or out-of-order metric export');
    if (previous && row.value < previous.value) throw Error('cumulative metric reset detected');
    next.set(row.id, row);
  }
  if (next.size > MAX_ROWS || [...next.values()].some(row => Buffer.byteLength(JSON.stringify(row)) > MAX_ROW)) throw Error('metric row limit exceeded');
  return next;
}

export async function persistReceipt(config, output) {
  const rel = relative(config.base, config.destination);
  let current = config.base;
  const baseInfo = await lstat(current);
  if (!baseInfo.isDirectory() || baseInfo.isSymbolicLink()) throw Error('unsafe project state root');
  for (const part of rel.split(/[\\/]+/u)) {
    current = join(current, part);
    try { await mkdir(current, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Error('unsafe capture destination');
  }
  const lockPath = join(config.destination, '.claude-capture.lock');
  const lock = await open(lockPath, 'wx', 0o600);
  try {
    const entries = await readdir(config.destination, { withFileTypes: true });
    let total = Buffer.byteLength(output), files = 1;
    for (const entry of entries) {
      if (entry.name === '.claude-capture.lock') continue;
      if (!entry.isFile() || !/^[a-f0-9]{24}\.json$/u.test(entry.name)) throw Error('unexpected capture file');
      const info = await lstat(join(config.destination, entry.name));
      if (!info.isFile() || info.isSymbolicLink()) throw Error('unsafe existing capture');
      files++;
      total += info.size;
    }
    if (files > MAX_ROWS || total > MAX_BODY) throw Error('Claude capture storage limit exceeded');
    const receipt = JSON.parse(output), path = join(config.destination, `${receipt.capture}.json`);
    const handle = await open(path, 'wx', 0o600);
    try { await handle.writeFile(output, 'utf8'); } finally { await handle.close(); }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

async function run() {
  const cwd = process.cwd(), config = await readConfig(cwd);
  const executable = claudeExecutable();
  const args = process.argv.slice(2);
  if (args[0] === '--') args.shift();
  if (!config.enabled) {
    if (config.reason) process.stderr.write(`${config.reason}\n`);
    const child = spawn(executable, args, { cwd, env: process.env, stdio: 'inherit', shell: false, windowsHide: false });
    const outcome = await new Promise(resolveExit => { child.once('error', () => resolveExit({ code: 1, signal: null })); child.once('close', (code, signal) => resolveExit({ code, signal })); });
    process.exitCode = outcome.signal ? 1 : outcome.code ?? 1;
    return;
  }
  const conflicts = conflictingTelemetryEnvironment(process.env);
  if (conflicts.length) throw Error(`conflicting or managed telemetry environment (${conflicts.length} setting(s)); refusing instrumented launch`);
  process.stderr.write('Claude telemetry policy compatibility is unknown until local metric exports are observed; managed settings may redirect exports elsewhere.\n');
  let hostVersion = 'unknown';
  try {
    const output = execFileSync(executable, ['--version'], { cwd, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, windowsHide: true });
    const match = output.match(/(?:^|\s)v?(\d+\.\d+\.\d+)\b/mu);
    if (match) hostVersion = match[1];
  } catch { throw Error('cannot determine Claude version; refusing instrumented launch'); }
  if (hostVersion === 'unknown') throw Error('Claude version output was not recognized; refusing instrumented launch');
  const id = randomBytes(32).toString('hex'), route = `/${randomBytes(24).toString('hex')}`;
  let rows = new Map();
  let rejected = false, concurrent = 0, receivedExports = 0, rejectionCode = '';
  const server = createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== route || req.headers['content-type']?.split(';')[0] !== 'application/json' || req.headers.authorization !== `Bearer ${id}`) { rejected = true; rejectionCode = 'route-method-content-or-auth'; req.resume(); res.writeHead(404).end(); return; }
    if (concurrent >= 2 || Number(req.headers['content-length']) > MAX_BODY) { rejected = true; req.resume(); res.writeHead(413).end(); return; }
    concurrent++; let size = 0, settled = false; const chunks = [];
    const release = () => { if (!settled) { settled = true; concurrent--; } };
    const deadline = setTimeout(() => { rejected = true; rejectionCode = 'request-timeout'; req.destroy(); }, 3000);
    req.on('close', () => { clearTimeout(deadline); release(); });
    req.on('data', chunk => { size += chunk.length; if (size <= MAX_BODY) chunks.push(chunk); });
    req.on('end', () => {
      clearTimeout(deadline);
      release();
      try {
        if (size > MAX_BODY) throw Error();
        receivedExports++;
        rows = mergeCumulative(rows, countersFrom(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
        chunks.length = 0;
        res.writeHead(200).end('{}');
      } catch (error) {
        rejected = true;
        rejectionCode = ['cumulative metrics required', 'invalid metric counter', 'duplicate metric series', 'cumulative metric reset detected', 'conflicting metric observation', 'cumulative metric segment changed; unsupported transition', 'replayed or out-of-order metric export', 'metric row limit exceeded'].includes(error.message) ? error.message : 'payload-validation';
        res.writeHead(400).end();
      }
    });
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const endpoint = `http://127.0.0.1:${server.address().port}${route}`;
  const env = { ...process.env, CLAUDE_CODE_ENABLE_TELEMETRY: '1', OTEL_METRICS_EXPORTER: 'otlp', OTEL_LOGS_EXPORTER: 'none', OTEL_TRACES_EXPORTER: 'none', OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/json', OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: endpoint, OTEL_EXPORTER_OTLP_METRICS_HEADERS: `Authorization=Bearer%20${id}`, OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'cumulative', OTEL_METRIC_EXPORT_INTERVAL: String(config.exportIntervalMs), OTEL_EXPORTER_OTLP_TIMEOUT: '1000', OTEL_METRICS_INCLUDE_ACCOUNT_UUID: 'false', OTEL_METRICS_INCLUDE_SESSION_ID: 'false', OTEL_METRICS_INCLUDE_REPOSITORY: 'false' };
  delete env.OTEL_EXPORTER_OTLP_ENDPOINT; delete env.OTEL_EXPORTER_OTLP_HEADERS;
  const child = spawn(executable, args, { cwd, env, stdio: 'inherit', shell: false, windowsHide: false });
  let spawnError;
  child.once('error', error => { spawnError = error; });
  let signalTimer, forceTimer, cancelled = null, closed = false;
  const outcomePromise = new Promise(resolveExit => child.once('close', (code, signal) => { closed = true; resolveExit({ code, signal }); }));
  const forwardSignal = signal => {
    if (cancelled) return;
    cancelled = signal;
    child.kill(signal);
    signalTimer = setTimeout(() => child.kill('SIGKILL'), 3000);
    forceTimer = setTimeout(() => { if (!closed) { process.stderr.write('Claude child did not close after bounded cancellation; descendant state is unknown.\\n'); process.exit(1); } }, 6000);
  };
  process.once('SIGINT', forwardSignal);
  process.once('SIGTERM', forwardSignal);
  const outcome = await outcomePromise;
  clearTimeout(signalTimer); clearTimeout(forceTimer);
  process.removeListener('SIGINT', forwardSignal);
  process.removeListener('SIGTERM', forwardSignal);
  await new Promise(resolveClose => {
    const timer = setTimeout(() => server.closeAllConnections?.(), 3000);
    timer.unref();
    server.close(() => { clearTimeout(timer); resolveClose(); });
  });
  if (spawnError) throw Error('unable to start Claude executable');
  const outputRows = [...rows.values()];
  if (!rejected) {
    const safeRows = outputRows.map(row => ({ series: row.series, start: row.start, end: row.end, source: row.source, model: row.model, category: row.category, value: row.value }));
    // Observed local delivery for this run only; not a policy-compliance certificate.
    const exportStatus = receivedExports > 0 ? 'export-observed' : 'no-export-observed';
    const receipt = { version: 2, host: 'claude', hostVersion, sourceVersion: 'claude_code.token.usage-otlp-cumulative', provenance: 'native-claude-otel', capture: hash(id), cancellation: cancelled, processExit: outcome.code, signal: outcome.signal, exportStatus, receivedExports, series: safeRows };
    const output = `${JSON.stringify(receipt, null, 2)}\n`;
    try {
      if (Buffer.byteLength(output) > MAX_REPORT) throw Error('Claude metrics report limit exceeded');
      await persistReceipt(config, output);
    } catch { rejected = true; }
  }
  if (rejected) process.stderr.write(`Claude metrics capture invalid (exports=${receivedExports}, rows=${outputRows.length}, rejection=${rejectionCode || 'receipt-storage'}); no receipt retained.\n`);
  else if (!receivedExports) process.stderr.write('Claude metrics: no-export-observed; coverage unknown (possible managed endpoint override or missing final export), not zero usage.\n');
  if (outcome.signal) process.exitCode = 1;
  else process.exitCode = outcome.code ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
