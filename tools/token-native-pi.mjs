import { createHash, randomUUID } from 'node:crypto';
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';

const REQUEST = 'subagents:rpc:v1:request';
const REPLY = 'subagents:rpc:v1:reply:';
const MAX_RECEIPT = 1024 * 1024;
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

export default function tokenNativePi(pi) {
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
