import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { checkBranch, observeFromFiles, refreshBranches } from './isswf-branch-guard-core.mjs';
import { guardCommand } from './isswf-command-core.mjs';
import { checkPlanCommit } from './isswf-plan-commit-guard-core.mjs';

const SHELL_TOOLS = new Set(['bash', 'powershell']);

// `git` without a shell, so a path is passed as one argument on Linux and Windows; a missing `git` resolves as a failure and the guard allows the call.
const git = (argv, cwd) => new Promise(done => {
  execFile('git', argv, { cwd, encoding: 'utf8', maxBuffer: 8 << 20, windowsHide: true }, (error, stdout) => done({ exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout: stdout ?? '' }));
});

// Refuses a CI-waiting or package-acquisition shell command, a `git commit` on a branch the session did not select, and one that records a plan
// isswf-status cannot read back, before it runs.
// Both cores fail open, so a fault never blocks a call. It is registered through the package for the main session and declared by the
// worker profile for its child; each session is one instance, so one set of expected branches serves one agent loop.
// HEAD is read from the files with `node:fs`: that needs no process per call and no `git` on the path, and `tool_result` runs the same code.
export default function (pi) {
  let expected = {};
  const store = { read: async () => ({ ...expected }), set: async (key, state) => { expected[key] = state; } };
  const observe = dir => observeFromFiles(dir, path => readFile(path, 'utf8'));
  // The directories a call must look at again once it has run, by tool call id.
  const switching = new Map();

  pi.on('session_start', () => {
    expected = {};
    switching.clear();
  });

  pi.on('tool_call', async (event, ctx) => {
    if (!SHELL_TOOLS.has(event?.toolName)) return undefined;
    const { command } = event.input ?? {};
    const { deny } = guardCommand(command);
    if (deny !== undefined) return { block: true, reason: deny };
    if (typeof ctx?.cwd !== 'string') return undefined;
    const branch = await checkBranch({ command, cwd: ctx.cwd, loop: 'main', store, observe });
    if (branch.deny !== undefined) return { block: true, reason: branch.deny };
    const plans = await checkPlanCommit({ command, cwd: ctx.cwd, git, read: path => readFile(path, 'utf8') });
    if (plans.deny !== undefined) return { block: true, reason: plans.deny };
    if (branch.reobserve.length && event.toolCallId !== undefined) switching.set(event.toolCallId, branch.reobserve);
    return undefined;
  });

  pi.on('tool_result', async event => {
    const dirs = switching.get(event?.toolCallId);
    if (dirs === undefined) return;
    switching.delete(event.toolCallId);
    await refreshBranches({ dirs, loop: 'main', store, observe });
  });
}
