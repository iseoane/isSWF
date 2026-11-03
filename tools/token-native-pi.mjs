import { createHash, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const REQUEST = 'subagents:rpc:v1:request';
const REPLY = 'subagents:rpc:v1:reply:';
const MAX_RECEIPT = 1024 * 1024;
const MAX_AUTO_ROWS = 100;
const STATE_ROOTS = ['.isswf', '.factory'];
const digest = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
const integer = value => Number.isSafeInteger(value) && value >= 0;

function usage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('invalid native usage');
  const counters = {};
  for (const [source, target] of [['input', 'input'], ['output', 'output'], ['cacheRead', 'cacheRead'], ['cacheWrite', 'cacheWrite']]) {
    if (!integer(value[source])) throw Error('native usage counter unavailable');
    counters[target] = value[source];
  }
  return counters;
}

export function normalizePiCost(data, identity, branch) {
  if (!data || data.version !== 1 || !data.parent || !Array.isArray(data.children) || data.children.length > 99 || !Number.isSafeInteger(data.unresolvedAsyncChildren) || data.unresolvedAsyncChildren < 0) throw Error('unsupported Pi cost reply');
  const rows = [{ id: 'parent', counters: usage(data.parent) }];
  for (const child of data.children) {
    const key = typeof child.runId === 'string' && child.runId ? child.runId : typeof child.sessionFile === 'string' && child.sessionFile ? child.sessionFile : '';
    if (!key) throw Error('Pi child identity unavailable');
    rows.push({ id: `child-${digest(key)}`, counters: usage(child.usage) });
  }
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw Error('duplicate Pi usage identity');
  return {
    version: 1, host: 'pi', sourceVersion: 1, hostVersion: 'unknown', scope: 'parent-plus-children',
    session: identity, branch, unresolvedAsyncChildren: data.unresolvedAsyncChildren, rows,
  };
}

function rpc(pi, method, timeoutMs) {
  const requestId = randomUUID();
  return new Promise((resolvePromise, reject) => {
    let settled = false;
    let unsubscribe;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      reject(Error('Pi cost RPC timed out'));
    }, timeoutMs);
    unsubscribe = pi.events.on(`${REPLY}${requestId}`, reply => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe?.();
      if (!reply || reply.requestId !== requestId || reply.version !== 1 || reply.success !== true) reject(Error('Pi cost RPC failed'));
      else resolvePromise(reply.data);
    });
    try { pi.events.emit(REQUEST, { version: 1, requestId, method, params: {} }); }
    catch {
      settled = true;
      clearTimeout(timer);
      unsubscribe?.();
      reject(Error('Pi cost RPC unavailable'));
    }
  });
}

export async function requestCost(pi, ctx, timeoutMs = 3000) {
  if (!pi?.events || typeof pi.events.emit !== 'function' || typeof pi.events.on !== 'function') throw Error('Pi event bus unavailable');
  const capability = await rpc(pi, 'ping', timeoutMs);
  if (capability?.version !== 1 || capability?.capabilities?.cost?.version !== 1) throw Error('Pi cost RPC unavailable');
  const data = await rpc(pi, 'cost', timeoutMs);
  try {
    const sessionId = ctx.sessionManager.getSessionId();
    const branchEntries = ctx.sessionManager.getBranch();
    if (typeof sessionId !== 'string' || !Array.isArray(branchEntries)) throw Error('session lineage unavailable');
    const ids = branchEntries.map(entry => entry?.id);
    if (ids.some(id => typeof id !== 'string' || !id)) throw Error('branch lineage unavailable');
    return normalizePiCost(data, digest(sessionId), ids.map(digest));
  } catch { throw Error('Pi session lineage unavailable'); }
}

export async function writeExclusive(path, receipt) {
  const body = `${JSON.stringify(receipt)}\n`;
  if (Buffer.byteLength(body) > MAX_RECEIPT) throw Error('receipt limit exceeded');
  const handle = await open(resolve(path), 'wx', 0o600);
  try { await handle.writeFile(body, 'utf8'); }
  finally { await handle.close(); }
}

async function loadAutoConfig(cwd) {
  const configured = [];
  for (const stateRoot of STATE_ROOTS) {
    const rootPath = resolve(cwd, stateRoot);
    try {
      const rootInfo = await lstat(rootPath);
      if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) return undefined;
    } catch (error) { if (error.code === 'ENOENT') continue; return undefined; }
    const configPath = resolve(rootPath, 'native-usage.json');
    try {
      const info = await lstat(configPath);
      if (!info.isFile() || info.isSymbolicLink()) return undefined;
      configured.push({ configPath, stateRoot });
    } catch (error) { if (error.code !== 'ENOENT') return undefined; }
  }
  if (configured.length !== 1) return undefined;
  try {
    const { configPath, stateRoot } = configured[0];
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    if (config?.version !== 1 || config.enabled !== true || typeof config.destination !== 'string' || !config.destination.trim()) return undefined;
    const base = resolve(cwd, stateRoot);
    const destination = resolve(base, config.destination);
    const relativePath = relative(base, destination);
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) return undefined;
    return { destination, stateRoot };
  } catch { return undefined; }
}

async function ensureCaptureDirectory(destination, cwd, stateRoot) {
  const base = resolve(cwd, stateRoot);
  const relativePath = relative(base, destination);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) throw Error('unsafe capture destination');
  try { await mkdir(base, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const baseInfo = await lstat(base);
  if (!baseInfo.isDirectory() || baseInfo.isSymbolicLink()) throw Error('unsafe capture destination');
  let current = base;
  for (const segment of relativePath.split(/[\\/]+/u)) {
    if (!segment || segment === '.' || segment === '..') throw Error('unsafe capture destination');
    current = resolve(current, segment);
    try { await mkdir(current, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Error('unsafe capture destination');
  }
}

async function writeAutoSnapshot(destination, receipt, key, event, cwd, stateRoot) {
  await ensureCaptureDirectory(destination, cwd, stateRoot);
  const path = resolve(destination, `${receipt.session}.json`);
  const lock = `${path}.lock`;
  const claim = await open(lock, 'wx', 0o600);
  try {
    let state;
    let existed = true;
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_RECEIPT) throw Error('capture storage limit exceeded');
      state = JSON.parse(await readFile(path, 'utf8'));
      if (state?.version !== 1 || state.owner !== 'isswf/pi-native-capture-v1' || state.session !== receipt.session || !Array.isArray(state.records) || state.records.length > MAX_AUTO_ROWS) throw Error('invalid existing capture');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      existed = false;
      state = { version: 1, owner: 'isswf/pi-native-capture-v1', session: receipt.session, baseline: receipt, latest: receipt, records: [] };
    }
    const index = state.records.findIndex(record => record.key === key);
    if (index >= 0 && JSON.stringify(state.records[index].snapshot) === JSON.stringify(receipt)) return false;
    if (index < 0 && state.records.length >= MAX_AUTO_ROWS) throw Error('capture record limit exceeded');
    const records = [...state.records];
    const record = { key, event, snapshot: receipt };
    if (index >= 0) records[index] = record;
    else records.push(record);
    const next = { version: 1, owner: 'isswf/pi-native-capture-v1', session: receipt.session, baseline: state.baseline, latest: receipt, records };
    const body = `${JSON.stringify(next)}\n`;
    if (Buffer.byteLength(body) > MAX_RECEIPT) throw Error('capture storage limit exceeded');
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(body, 'utf8'); } finally { await handle.close(); }
      if (existed) await rename(temporary, path);
      else {
        await link(temporary, path);
        await unlink(temporary);
      }
    } catch (error) {
      try { await unlink(temporary); } catch {}
      throw error;
    }
    return true;
  } finally {
    await claim.close();
    await unlink(lock);
  }
}

export default function tokenNativePi(pi) {
  let epoch = 0;
  let active;
  let inFlight = false;
  let pending;
  const completions = new Set();
  pi.on('session_start', async (_event, ctx) => {
    const currentEpoch = ++epoch;
    active = undefined;
    pending = undefined;
    completions.clear();
    const destination = await loadAutoConfig(ctx.cwd);
    if (epoch !== currentEpoch) return;
    active = { epoch: currentEpoch, ctx, destination, disposed: false };
    if (destination) enqueue('session-start', 'session-start', ctx);
  });
  pi.on('agent_settled', (_event, ctx) => {
    let branch;
    try { branch = ctx.sessionManager.getBranch().map(entry => entry.id); } catch { return; }
    if (branch.some(id => typeof id !== 'string' || !id)) return;
    enqueue(`settled:${digest(branch.join(':'))}`, 'agent-settled', ctx);
  });
  pi.on('session_shutdown', () => { epoch++; active = undefined; pending = undefined; completions.clear(); });
  pi.events?.on?.('subagent:async-complete', event => {
    const id = event?.runId;
    if (typeof id !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/u.test(id) || completions.has(id)) return;
    if (completions.size >= MAX_AUTO_ROWS) return;
    completions.add(id);
    enqueue(`async:${digest(id)}`, 'async-complete');
  });

  function enqueue(key, event, ctx = active?.ctx) {
    if (!active?.destination || !ctx) return;
    pending = { key, event, ctx };
    void drain();
  }

  async function drain() {
    if (inFlight || !pending || !active?.destination) return;
    const request = pending;
    pending = undefined;
    const owner = active;
    inFlight = true;
    try {
      const receipt = await requestCost(pi, request.ctx);
      if (active !== owner || owner.epoch !== epoch || owner.disposed) return;
      await writeAutoSnapshot(owner.destination.destination, receipt, request.key, request.event, request.ctx.cwd, owner.destination.stateRoot);
      if (active === owner && owner.epoch === epoch) request.ctx.ui?.setStatus?.('token-native-capture', undefined);
    } catch {
      if (active === owner && owner.epoch === epoch) request.ctx.ui?.setStatus?.('token-native-capture', 'Automatic usage capture failed');
    }
    finally {
      inFlight = false;
      if (pending && active?.destination) void drain();
    }
  }

  pi.registerCommand('token-native-snapshot', {
    description: 'Write one bounded native Pi usage snapshot to a new file',
    handler: async (args, ctx) => {
      const match = /^--out\s+(.+)$/u.exec(args.trim());
      if (!match || !match[1].trim()) {
        ctx.ui.notify('Usage: /token-native-snapshot --out <new-file>', 'error');
        return;
      }
      try {
        const receipt = await requestCost(pi, ctx);
        await writeExclusive(match[1].trim(), receipt);
        ctx.ui.notify('Native usage snapshot written.', 'info');
      } catch {
        ctx.ui.notify('Native usage snapshot failed; no details were retained.', 'error');
      }
    },
  });
}
