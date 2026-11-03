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

function countersFrom(payload) {
  if (!payload || !Array.isArray(payload.resourceMetrics) || payload.resourceMetrics.length > 10) throw Error('invalid metrics payload');
  const counters = new Map();
  for (const resource of payload.resourceMetrics) {
    if (!Array.isArray(resource.scopeMetrics) || resource.scopeMetrics.length > 20) throw Error('invalid metrics payload');
    for (const scope of resource.scopeMetrics) for (const metric of scope.metrics ?? []) {
      if (metric.name !== 'claude_code.token.usage') continue;
      if (metric.sum?.isMonotonic !== true || metric.sum?.aggregationTemporality !== 2 || !Array.isArray(metric.sum.dataPoints)) throw Error('cumulative metrics required');
      for (const point of metric.sum.dataPoints) {
        const attrs = Object.fromEntries((point.attributes ?? []).filter(item => ['type', 'query_source', 'model'].includes(item.key)).map(item => [item.key, item.value?.stringValue]));
        if (!categories.has(attrs.type) || !sources.has(attrs.query_source)) continue;
        const model = typeof attrs.model === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/u.test(attrs.model) ? `model-${hash(attrs.model)}` : 'unknown';
        const rawValue = point.asInt ?? point.asDouble;
        const value = Number(rawValue);
        if (!Number.isSafeInteger(value) || value < 0) throw Error('invalid metric counter');
        const key = `${attrs.query_source}:${model}:${attrs.type}`;
        const current = counters.get(key);
        if (current !== undefined && current !== value) throw Error('duplicate metric series');
        counters.set(key, value);
      }
    }
  }
  if (counters.size > MAX_ROWS) throw Error('metric row limit exceeded');
  return [...counters].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => {
    const [source, model, category] = key.split(':');
    return { id: `${source}-${model}-${category}`, source, model, category, value };
  });
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
  return { enabled: true, destination, base, configPath };
}

export function conflictingTelemetryEnvironment(environment) {
  return Object.keys(environment).filter(key => /^(?:OTEL_|CLAUDE_CODE_(?:ENABLE_TELEMETRY|OTEL_|USE_MANAGED_SETTINGS_ONLY))/iu.test(key));
}

export { countersFrom };

export function mergeCumulative(previousRows, receivedRows) {
  const next = new Map(previousRows);
  for (const row of receivedRows) {
    const previous = next.get(row.id);
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
    const receipt = JSON.parse(output), path = join(config.destination, `${receipt.session}.json`);
    const handle = await open(path, 'wx', 0o600);
    try { await handle.writeFile(output, 'utf8'); } finally { await handle.close(); }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

async function run() {
  const cwd = process.cwd(), config = await readConfig(cwd);
  const executable = process.platform === 'win32' ? 'claude.exe' : 'claude';
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
  process.stderr.write('Claude telemetry managed policy is not inspected; verify local export is permitted before opting in.\n');
  let hostVersion = 'unknown';
  try {
    const output = execFileSync(executable, ['--version'], { cwd, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, windowsHide: true });
    const match = output.match(/\b(\d+\.\d+\.\d+)\b/u);
    if (match) hostVersion = match[1];
  } catch { throw Error('cannot determine Claude version; refusing instrumented launch'); }
  if (hostVersion === 'unknown') throw Error('Claude version output was not recognized; refusing instrumented launch');
  const id = randomBytes(32).toString('hex'), route = `/${randomBytes(24).toString('hex')}`;
  let rows = new Map();
  let rejected = false, bodyBytes = 0, concurrent = 0, receivedExports = 0, rejectionCode = '';
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
      bodyBytes += size;
      try {
        if (size > MAX_BODY || bodyBytes > MAX_BODY) throw Error();
        receivedExports++;
        rows = mergeCumulative(rows, countersFrom(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
        res.writeHead(200).end('{}');
      } catch (error) {
        rejected = true;
        rejectionCode = ['cumulative metrics required', 'invalid metric counter', 'duplicate metric series', 'cumulative metric reset detected', 'metric row limit exceeded'].includes(error.message) ? error.message : 'payload-validation';
        res.writeHead(400).end();
      }
    });
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const endpoint = `http://127.0.0.1:${server.address().port}${route}`;
  const env = { ...process.env, CLAUDE_CODE_ENABLE_TELEMETRY: '1', OTEL_METRICS_EXPORTER: 'otlp', OTEL_LOGS_EXPORTER: 'none', OTEL_TRACES_EXPORTER: 'none', OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/json', OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: endpoint, OTEL_EXPORTER_OTLP_METRICS_HEADERS: `Authorization=Bearer%20${id}`, OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'cumulative', OTEL_METRIC_EXPORT_INTERVAL: '1000', OTEL_EXPORTER_OTLP_TIMEOUT: '1000', OTEL_METRICS_INCLUDE_ACCOUNT_UUID: 'false', OTEL_METRICS_INCLUDE_SESSION_ID: 'false', OTEL_METRICS_INCLUDE_REPOSITORY: 'false' };
  delete env.OTEL_EXPORTER_OTLP_ENDPOINT; delete env.OTEL_EXPORTER_OTLP_HEADERS;
  const child = spawn(executable, args, { cwd, env, stdio: 'inherit', shell: false, windowsHide: false });
  let spawnError;
  child.once('error', error => { spawnError = error; });
  let signalTimer;
  const forwardSignal = signal => {
    child.kill(signal);
    signalTimer ??= setTimeout(() => child.kill(), 3000);
  };
  process.once('SIGINT', forwardSignal);
  process.once('SIGTERM', forwardSignal);
  const outcome = await new Promise(resolveExit => child.once('close', (code, signal) => resolveExit({ code, signal })));
  clearTimeout(signalTimer);
  process.removeListener('SIGINT', forwardSignal);
  process.removeListener('SIGTERM', forwardSignal);
  await new Promise(resolveClose => {
    const timer = setTimeout(() => server.closeAllConnections?.(), 3000);
    timer.unref();
    server.close(() => { clearTimeout(timer); resolveClose(); });
  });
  if (spawnError) throw Error('unable to start Claude executable');
  const outputRows = [...rows.values()];
  if (!rejected && outputRows.length) {
    const safeRows = outputRows.map(row => ({ id: row.id, source: row.source, model: row.model, category: row.category, value: row.value }));
    const receipt = { version: 1, host: 'claude', hostVersion, sourceVersion: 'claude_code.token.usage-otlp-cumulative', provenance: 'native-claude-otel', session: hash(id), processExit: outcome.code, signal: outcome.signal, policyStatus: 'managed-policy-not-inspected', counters: safeRows };
    const output = `${JSON.stringify(receipt, null, 2)}\n`;
    try {
      if (Buffer.byteLength(output) > MAX_REPORT) throw Error('Claude metrics report limit exceeded');
      await persistReceipt(config, output);
    } catch { rejected = true; }
  }
  if (rejected || !outputRows.length) process.stderr.write(`Claude metrics capture incomplete (exports=${receivedExports}, rows=${outputRows.length}, rejection=${rejectionCode || 'no-token-points'}); no receipt retained.\n`);
  if (outcome.signal) process.exitCode = 1;
  else process.exitCode = outcome.code ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
