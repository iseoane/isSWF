import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { guardDispatch, workerCalls } from './isswf-dispatch-guard-core.mjs';
import { closeWorker, closeWorkerRun, markWorkerRun, openWorkers } from './isswf-parallel-workers-core.mjs';

const GIT_TIMEOUT_MS = 20_000;

const kindOf = info => (info.isDirectory() ? 'dir' : info.isFile() ? 'file' : 'other');
const list = async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: kindOf(entry) }));
// A Git exit code answers the question; a failure to run Git at all (missing executable, timeout) rejects.
const git = (argv, cwd) => new Promise((resolve, reject) => {
  execFile('git', argv, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }, error => (!error ? resolve(0) : typeof error.code === 'number' ? resolve(error.code) : reject(error)));
});
const gitOut = (argv, cwd) => new Promise((resolve, reject) => {
  execFile('git', argv, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }, (error, stdout) => (!error ? resolve({ exitCode: 0, stdout }) : typeof error.code === 'number' ? resolve({ exitCode: error.code, stdout: '' }) : reject(error)));
});
const ledgerIo = {
  gitOut,
  list,
  read: file => readFile(file, 'utf8'),
  write: async (file, text) => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text);
  },
  remove: file => rm(file, { force: true }),
};

// Refuses a `subagent` call to an isSWF role agent that fails the dispatch conditions, before the child starts.
// It is registered through the package for the main session; the children do not dispatch isSWF roles.
// An accepted call to the worker role also opens a parallel-worker ledger entry, closed on its result or, for an async run, on its completion event.
export default function (pi) {
  // Ledger entries by tool call, for the result event, and the last project directory, which the async completion event does not carry.
  const open = new Map();
  let cwd;
  pi.on('tool_call', async (event, ctx) => {
    if (event?.toolName !== 'subagent') return undefined;
    cwd = ctx?.cwd ?? cwd;
    const io = { project: () => ctx.cwd, read: file => readFile(file, 'utf8'), readBytes: file => readFile(file), list, stat: async file => { const info = await stat(file); return { kind: kindOf(info), size: info.size }; }, git, gitOut };
    const verdict = await guardDispatch({ host: 'pi', input: event.input, io });
    if (verdict.deny !== undefined) return { block: true, reason: verdict.deny };
    try {
      if (verdict.note !== undefined) ctx.ui?.notify?.(verdict.note, 'warning');
      const workers = workerCalls('pi', event.input);
      if (workers.length) open.set(event.toolCallId ?? event.input, { cwd: ctx.cwd, tokens: await openWorkers({ workers, host: 'pi', cwd: ctx.cwd, io: ledgerIo }) });
    } catch {}
    return undefined;
  });
  // A synchronous result ends its workers; an async launch stays open under its run id until `subagent:async-complete`. The run id and the async flag are read from the same fields the compaction memory reads.
  pi.on('tool_result', async event => {
    if (event?.toolName !== 'subagent') return undefined;
    const key = event.toolCallId ?? event.input;
    const entry = open.get(key);
    if (!entry) return undefined;
    open.delete(key);
    try {
      const run = event.details?.runId ?? event.details?.asyncId;
      const launchedAsync = !event.isError && typeof run === 'string' && (event.input?.async === true || event.details?.asyncId !== undefined);
      for (const token of entry.tokens) {
        if (launchedAsync) await markWorkerRun({ token, run, cwd: entry.cwd, io: ledgerIo });
        else await closeWorker({ token, cwd: entry.cwd, io: ledgerIo });
      }
    } catch {}
    return undefined;
  });
  pi.events?.on?.('subagent:async-complete', async event => {
    try {
      if (typeof event?.runId === 'string' && cwd !== undefined) await closeWorkerRun({ run: event.runId, cwd, io: ledgerIo });
    } catch {}
  });
}
