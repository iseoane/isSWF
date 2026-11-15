import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { guardDispatch } from './isswf-dispatch-guard-core.mjs';

const GIT_TIMEOUT_MS = 20_000;

const kindOf = info => (info.isDirectory() ? 'dir' : info.isFile() ? 'file' : 'other');
const list = async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: kindOf(entry) }));
// A Git exit code answers the question; a failure to run Git at all (missing executable, timeout) rejects.
const git = (argv, cwd) => new Promise((resolve, reject) => {
  execFile('git', argv, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }, error => (!error ? resolve(0) : typeof error.code === 'number' ? resolve(error.code) : reject(error)));
});

// Refuses a `subagent` call to an isSWF role agent that fails the dispatch conditions, before the child starts.
// It is registered through the package for the main session; the children do not dispatch isSWF roles.
export default function (pi) {
  pi.on('tool_call', async (event, ctx) => {
    if (event?.toolName !== 'subagent') return undefined;
    const io = { project: () => ctx.cwd, read: file => readFile(file, 'utf8'), readBytes: file => readFile(file), list, stat: async file => { const info = await stat(file); return { kind: kindOf(info), size: info.size }; }, git };
    const verdict = await guardDispatch({ host: 'pi', input: event.input, io });
    return verdict.deny === undefined ? undefined : { block: true, reason: verdict.deny };
  });
}
