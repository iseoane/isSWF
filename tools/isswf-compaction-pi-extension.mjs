import { compactionReminder, isCoordinatorSkill, rememberDispatch } from './isswf-compaction-core.mjs';

// `/skill:name` as typed, before Pi expands it; the model loads a skill by reading its SKILL.md.
const SKILL_COMMAND = /^\/skill:(\S+)/u;
const COORDINATOR_FILE = /(?:^|[\\/])isswf-coordinator[\\/]SKILL\.md$/u;

// After a compaction of a session whose coordinator skill was loaded, the first run gets a message that tells the model to reload the
// skill and lists the last accepted dispatches. Pi's own summarizer cannot be steered, so that message is all this extension adds.
// It is registered through the package for the main session only, and each handler fails open: a fault never reaches Pi.
export default function (pi) {
  let active = false;
  let assignments = [];
  let remind = false;

  pi.on('session_start', () => {
    active = false;
    assignments = [];
    remind = false;
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
