// No Node imports and no `process` access, like the other guard cores: the Claude hooks module has no `node:fs`. The host supplies
// `io`: `gitOut(argv, cwd)` as `{ exitCode, stdout }`, `list(dir)` as `{ name, kind }` entries, `read(file)`, `write(file, text)`
// and `remove(file)`.
import { resolveDir } from './isswf-branch-guard-core.mjs';

const DEFAULT_LIMIT = 2;
const LIMIT_KEY = 'isswf.maxParallelWorkers';
const MODE_KEY = 'isswf.parallelWorkersMode';
const LIMIT_VALUE = /^[1-9]\d{0,3}$/u;
// The token names the entry's file, so it never carries a path.
const TOKEN = /^[A-Za-z0-9-]{1,64}$/u;
const CLEAR_COMMAND = 'node <factory-root>/tools/isswf-parallel-workers.mjs list|clear [--token <t>]';

const configValue = async (io, cwd, key) => {
  const { exitCode, stdout } = await io.gitOut(['config', '--local', '--get', key], cwd);
  return exitCode === 0 ? String(stdout).trim() : undefined;
};

/** The limit and the mode this clone selects with `git config --local`: an absent or invalid limit is 2 and any mode but `enforce` is `observe`. */
export async function readPolicy({ cwd, io }) {
  const limit = await configValue(io, cwd, LIMIT_KEY);
  const mode = await configValue(io, cwd, MODE_KEY);
  return { limit: limit !== undefined && LIMIT_VALUE.test(limit) ? Number(limit) : DEFAULT_LIMIT, mode: mode === 'enforce' ? 'enforce' : 'observe' };
}

// The store every worktree of the clone shares: under the common Git directory, which Git answers relative to `cwd` or absolute.
async function ledgerDirectory(io, cwd) {
  const { exitCode, stdout } = await io.gitOut(['rev-parse', '--git-common-dir'], cwd);
  const common = String(stdout).trim();
  if (exitCode !== 0 || common === '') throw new Error('Git did not name the common Git directory');
  return `${resolveDir(cwd, common)}/isswf/parallel-workers`;
}

const entryFile = (directory, token) => {
  if (!TOKEN.test(token)) throw new Error(`${JSON.stringify(token)} is not a ledger token`);
  return `${directory}/${token}.json`;
};

// A damaged entry still counts: it is listed with `entry` undefined so the operator can clear it. A directory that cannot be listed holds none.
async function entries(io, directory) {
  let names;
  try {
    names = (await io.list(directory)).filter(item => item.kind === 'file' && item.name.endsWith('.json')).map(item => item.name.slice(0, -'.json'.length));
  } catch {
    return [];
  }
  const found = [];
  for (const token of names.filter(name => TOKEN.test(name))) {
    let entry;
    try {
      entry = JSON.parse(await io.read(`${directory}/${token}.json`));
    } catch {
      entry = undefined;
    }
    found.push({ token, entry });
  }
  return found;
}

/** The open ledger entries as `{ token, entry }`. */
export async function listWorkers({ cwd, io }) {
  return entries(io, await ledgerDirectory(io, cwd));
}

/**
 * Whether `count` more workers fit this clone's limit: `{}` when they do, `{ note }` over the limit in observe mode and `{ deny }` over it in enforce mode.
 * In observe mode no fault refuses; in enforce mode a fault that stops the count refuses.
 */
export async function checkWorkerLimit({ count, cwd, io }) {
  let policy;
  try {
    policy = await readPolicy({ cwd, io });
  } catch {
    return {};
  }
  try {
    const open = (await listWorkers({ cwd, io })).length;
    if (open + count <= policy.limit) return {};
    const facts = `${open} open, ${count} requested, limit ${policy.limit} (git config --local ${LIMIT_KEY}; absent means ${DEFAULT_LIMIT})`;
    return policy.mode === 'enforce'
      ? { deny: `parallel worker limit reached: ${facts}. Wait for a worker to finish, or list and clear stale entries with ${CLEAR_COMMAND}.` }
      : { note: `Parallel worker limit exceeded, not enforced (${MODE_KEY} is observe): ${facts}. If a count looks stale after a crash, clear it with ${CLEAR_COMMAND}.` };
  } catch (error) {
    return policy.mode === 'enforce' ? { deny: `parallel worker limit could not be checked: ${error?.message ?? error}` } : {};
  }
}

const newToken = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Writes one entry for each of `workers` (`{ agent, job, brief }`) and returns their tokens. */
export async function openWorkers({ workers, host, cwd, io }) {
  const directory = await ledgerDirectory(io, cwd);
  const tokens = [];
  for (const worker of workers) {
    const token = newToken();
    await io.write(entryFile(directory, token), `${JSON.stringify({ agent: worker.agent, job: worker.job, brief: worker.brief, host, startedAt: new Date().toISOString() })}\n`);
    tokens.push(token);
  }
  return tokens;
}

/** Records the run id the host gave a launched worker, so its completion event can find the entry. */
export async function markWorkerRun({ token, run, cwd, io }) {
  const file = entryFile(await ledgerDirectory(io, cwd), token);
  await io.write(file, `${JSON.stringify({ ...JSON.parse(await io.read(file)), run })}\n`);
}

/** Removes one entry; an absent entry is already closed. */
export async function closeWorker({ token, cwd, io }) {
  await io.remove(entryFile(await ledgerDirectory(io, cwd), token));
}

/** Removes the entries that recorded `run`; an unknown run removes nothing. */
export async function closeWorkerRun({ run, cwd, io }) {
  const directory = await ledgerDirectory(io, cwd);
  for (const { token, entry } of await entries(io, directory)) if (entry?.run === run) await io.remove(entryFile(directory, token));
}

/** Removes the entry `token` names, or every entry; returns the tokens removed. */
export async function clearWorkers({ token, cwd, io }) {
  const directory = await ledgerDirectory(io, cwd);
  if (token !== undefined) entryFile(directory, token);
  const removed = [];
  for (const { token: found } of await entries(io, directory)) {
    if (token !== undefined && token !== found) continue;
    await io.remove(entryFile(directory, found));
    removed.push(found);
  }
  return removed;
}
