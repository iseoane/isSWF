import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { assignmentOf, checkBranch, observeFromFiles, refreshBranches } from './isswf-branch-guard-core.mjs';
import { guardCommand } from './isswf-command-core.mjs';
import { checkReferences } from './isswf-dispatch-guard-core.mjs';
import { checkPlanCommit } from './isswf-plan-commit-guard-core.mjs';
import { checkVerificationCommit } from './isswf-verification-guard-core.mjs';
import { checkRecordsPush } from './isswf-records-push-guard-core.mjs';
import { checkIntegrationGate } from './isswf-integration-gate-core.mjs';
import { coverage } from './isswf-handoff.mjs';

const SHELL_TOOLS = new Set(['bash', 'powershell']);

// The commits of `head` above `base` that no recorded review covers, for the integration gate.
const unreviewedIn = async ({ root, head, base }) => (await coverage({ project: root, head, base })).jobs.flatMap(job => job.uncovered.map(item => item.commit));

// `git` without a shell, so a path is passed as one argument on Linux and Windows; a missing `git` resolves as a failure and the guard allows the call.
const git = (argv, cwd) => new Promise(done => {
  execFile('git', argv, { cwd, encoding: 'utf8', maxBuffer: 8 << 20, windowsHide: true, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }, (error, stdout) => done({ exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout: stdout ?? '' }));
});

// Refuses a CI-waiting or package-acquisition shell command, a `git commit` on a branch the session did not select, and one that records a plan
// isswf-status cannot read back, a `git push` to the base branch that carries more than work records without the recorded grant, or (in enforce mode) an integration
// command for a head without a verification stamp, before it runs. Observe mode adds the gate's note to the result of that command.
// Both cores fail open, so a fault never blocks a call. It is registered through the package for the main session and declared by the
// worker profile for its child; each session is one instance, so one set of expected branches serves one agent loop.
// A child whose task carries `checkout:` and `branch:` lines may commit only there. A message to the main session assigns only when it also reads as an isSWF dispatch.
// HEAD is read from the files with `node:fs`: that needs no process per call and no `git` on the path, and `tool_result` runs the same code.
export default function (pi) {
  let expected = {};
  let assignment;
  const store = { read: async () => ({ ...expected }), set: async (key, state) => { expected[key] = state; } };
  const observe = dir => observeFromFiles(dir, path => readFile(path, 'utf8'));
  // A checkout uses isSWF when it has a state directory.
  const isDir = path => stat(path).then(found => found.isDirectory(), () => false);
  const usesIsswf = async top => (await isDir(`${top}/.isswf`)) || isDir(`${top}/.factory`);
  // The directories a call must look at again once it has run, by tool call id.
  const switching = new Map();
  // The gate's observe-mode note for a call, by tool call id, appended to the call's result.
  const notes = new Map();

  pi.on('session_start', () => {
    expected = {};
    assignment = undefined;
    switching.clear();
    notes.clear();
  });

  // The task text reaches the child as its input; only a task that is an isSWF dispatch (it names the brief, checkpoint and base) assigns, and the first one that carries the lines.
  pi.on('input', event => {
    try {
      if (assignment === undefined && typeof event?.text === 'string') {
        checkReferences(event.text);
        assignment = assignmentOf(event.text);
      }
    } catch {}
    return undefined;
  });

  pi.on('tool_call', async (event, ctx) => {
    if (!SHELL_TOOLS.has(event?.toolName)) return undefined;
    const { command } = event.input ?? {};
    if (typeof ctx?.cwd !== 'string') return undefined;
    // Like the branch, push and integration guards, the command guard applies only in a Git checkout that uses isSWF.
    const top = await git(['rev-parse', '--show-toplevel'], ctx.cwd);
    if (top.exitCode === 0 && await usesIsswf(top.stdout.trim())) {
      const { deny } = guardCommand(command);
      if (deny !== undefined) return { block: true, reason: deny };
    }
    const branch = await checkBranch({ command, cwd: ctx.cwd, loop: 'main', store, observe, assignment, usesIsswf });
    if (branch.deny !== undefined) return { block: true, reason: branch.deny };
    const plans = await checkPlanCommit({ command, cwd: ctx.cwd, git, read: path => readFile(path, 'utf8') });
    if (plans.deny !== undefined) return { block: true, reason: plans.deny };
    const verification = await checkVerificationCommit({ command, cwd: ctx.cwd, git });
    if (verification.deny !== undefined) return { block: true, reason: verification.deny };
    const pushes = await checkRecordsPush({ command, cwd: ctx.cwd, git });
    if (pushes.deny !== undefined) return { block: true, reason: pushes.deny };
    const gate = await checkIntegrationGate({ command, cwd: ctx.cwd, git, read: path => readFile(path, 'utf8'), coverage: unreviewedIn });
    if (gate.deny !== undefined) return { block: true, reason: gate.deny };
    if (gate.note !== undefined && event.toolCallId !== undefined) notes.set(event.toolCallId, gate.note);
    if (branch.reobserve.length && event.toolCallId !== undefined) switching.set(event.toolCallId, branch.reobserve);
    return undefined;
  });

  pi.on('tool_result', async event => {
    const note = notes.get(event?.toolCallId);
    notes.delete(event?.toolCallId);
    const dirs = switching.get(event?.toolCallId);
    if (dirs !== undefined) {
      switching.delete(event.toolCallId);
      await refreshBranches({ dirs, loop: 'main', store, observe });
    }
    if (note !== undefined && !event.isError) return { content: [...(event.content ?? []), { type: 'text', text: note }] };
    return undefined;
  });
}
