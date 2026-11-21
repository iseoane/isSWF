import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { compactionReminder, isCoordinatorSkill, rememberDispatch } from './isswf-compaction-core.mjs';
import { findUndispatched, freshUndispatched, undispatchedWarning } from './isswf-undispatched-core.mjs';

// `/skill:name` as typed, before Pi expands it; the model loads a skill by reading its SKILL.md.
const SKILL_COMMAND = /^\/skill:(\S+)/u;
const COORDINATOR_FILE = /(?:^|[\\/])isswf-coordinator[\\/]SKILL\.md$/u;
const GIT_TIMEOUT_MS = 20_000;

const list = async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : entry.isFile() ? 'file' : 'other' }));
// A Git exit code answers the question; a failure to run Git at all (missing executable, timeout) rejects.
const git = (argv, cwd) => new Promise((resolve, reject) => {
  execFile('git', argv, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }, error => (!error ? resolve(0) : typeof error.code === 'number' ? resolve(error.code) : reject(error)));
});

// After a compaction of a session whose coordinator skill was loaded, the first run gets a message that tells the model to reload the
// skill and lists the last accepted dispatches. Pi's own summarizer cannot be steered, so that message is all this extension adds.
// It is registered through the package for the main session only, and each handler fails open: a fault never reaches Pi.
export default function (pi) {
  let active = false;
  let assignments = [];
  let remind = false;
  let warned = new Set();

  pi.on('session_start', () => {
    active = false;
    assignments = [];
    remind = false;
    warned = new Set();
  });

  pi.on('input', event => {
    try {
      if (isCoordinatorSkill(SKILL_COMMAND.exec(event?.text)?.[1])) active = true;
    } catch {}
    return undefined;
  });

  pi.on('tool_call', event => {
    try {
      if (event?.toolName === 'read' && COORDINATOR_FILE.test(event.input?.path)) active = true;
    } catch {}
    return undefined;
  });

  // A blocked call never reaches `tool_result`, so only an accepted dispatch is remembered.
  pi.on('tool_result', event => {
    try {
      if (active && event?.toolName === 'subagent' && !event.isError) assignments = rememberDispatch(assignments, { host: 'pi', input: event.input, runId: event.details?.runId ?? event.details?.asyncId });
    } catch {}
    return undefined;
  });

  // When a settled run of a coordinator session was not aborted or failed, a status line tells once about an in-progress job whose committed
  // brief has no attempt record and no accepted dispatch (isswf-undispatched-core). A fault never reaches Pi.
  pi.on('agent_settled', async (event, ctx) => {
    try {
      if (!active || event?.aborted === true || event?.error !== undefined) return;
      const found = await findUndispatched({ assignments, io: { project: () => ctx.cwd, list, read: file => readFile(file, 'utf8'), git } });
      const text = undispatchedWarning(freshUndispatched(found, warned));
      if (text) ctx.ui.setStatus('isswf-undispatched', text);
    } catch {}
  });

  pi.on('session_compact', () => {
    remind = active;
  });

  pi.on('before_agent_start', () => {
    if (!remind) return undefined;
    remind = false;
    try {
      return { message: { customType: 'isswf-compaction', content: compactionReminder({ host: 'pi', assignments }), display: true } };
    } catch {
      return undefined;
    }
  });
}
