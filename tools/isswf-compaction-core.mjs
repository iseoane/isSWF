// No Node imports and no `process` access, like tools/isswf-dispatch-guard-core.mjs: the Claude hooks module has only
// its injected host. The Claude hooks module and the Pi extension keep their own session state and pass it in.
import { callsOf, checkReferences, isRoleAgent } from './isswf-dispatch-guard-core.mjs';

/** The accepted dispatches kept per session, newest last; the reminder lists exactly these. */
export const MAX_ASSIGNMENTS = 5;
const COORDINATOR_SKILL = 'isswf-coordinator';
// What reaches the model text from a prompt or a host result is limited to these characters.
const SAFE_NAME = /^[A-Za-z0-9._:-]{1,80}$/u;
const SAFE_RUN = /^[A-Za-z0-9._:-]{1,100}$/u;
const RELOAD = { claude: '/isswf:isswf-coordinator', pi: '/skill:isswf-coordinator' };

/** Whether a skill name, with or without a plugin prefix, is the coordinator skill. */
export const isCoordinatorSkill = name => typeof name === 'string' && (name === COORDINATOR_SKILL || name.endsWith(`:${COORDINATOR_SKILL}`));

/**
 * Returns the assignment list with the isSWF role dispatches one accepted call names added, newest last and bounded to
 * MAX_ASSIGNMENTS. `host` and `input` are the guard's: Claude's `Agent` input or Pi's `subagent` input. `runId` is the
 * identity the host returned for the call, when it returned one. A child the guard's parser cannot read is left out.
 */
export function rememberDispatch(assignments, { host, input, runId } = {}) {
  const kept = [];
  for (const call of callsOf(host, input).filter(candidate => isRoleAgent(candidate.agent) && SAFE_NAME.test(candidate.agent))) {
    try {
      const { initiative, job, path, checkpoint, base } = checkReferences(call.prompt);
      kept.push({ agent: call.agent, initiative, job, path, checkpoint, base, ...(typeof runId === 'string' && SAFE_RUN.test(runId) ? { run: runId } : {}) });
    } catch {
      // The guard refuses such a call, or it is not an isSWF assignment; either way there is nothing to remember.
    }
  }
  return [...(assignments ?? []), ...kept].slice(-MAX_ASSIGNMENTS);
}

/** The directory under the Claude config directory that holds one note per session. */
export const NOTE_DIR = ['isswf', 'compaction'];
const SESSION_ID = /^[A-Za-z0-9_-]{1,100}$/u;
const SHA = /^[0-9a-f]{40,64}$/iu;
// A brief path is one line of printable text; anything else never reaches model text.
const SAFE_PATH = /^[^\u0000-\u001f\u007f]{1,300}$/u;

/** The note's file name for a session, or undefined when the ID is not a plain token (it becomes a path segment). */
export const noteFileName = sessionId => (typeof sessionId === 'string' && SESSION_ID.test(sessionId) ? `${sessionId}.json` : undefined);

/** The note the Claude mod writes for an activated session: the assignment list its `$.state` holds. */
export const serializeNote = assignments => JSON.stringify({ version: 1, assignments: assignments ?? [] });

const validEntry = entry => entry !== null && typeof entry === 'object'
  && typeof entry.agent === 'string' && SAFE_NAME.test(entry.agent)
  && /^I\d+$/u.test(entry.initiative) && /^J\d+$/u.test(entry.job)
  && typeof entry.path === 'string' && SAFE_PATH.test(entry.path)
  && SHA.test(entry.checkpoint) && SHA.test(entry.base)
  && (entry.run === undefined || (typeof entry.run === 'string' && SAFE_RUN.test(entry.run)));

/**
 * The assignments of a note, or undefined when the text is not a note (the session never recorded an activation). The note is
 * a file another process could have changed, so each entry is checked again and an entry with an unsafe field is dropped.
 */
export function parseNote(text) {
  try {
    const note = JSON.parse(text);
    if (note?.version !== 1 || !Array.isArray(note.assignments)) return undefined;
    return note.assignments.filter(validEntry).map(({ agent, initiative, job, path, checkpoint, base, run }) => ({ agent, initiative, job, path, checkpoint, base, ...(run === undefined ? {} : { run }) })).slice(-MAX_ASSIGNMENTS);
  } catch {
    return undefined;
  }
}

const KEEP = [
  'the active initiative and job, and the brief in use',
  'the child agent IDs, each with its role and the task it was given',
  'the current candidate commit SHA and the target base SHA',
  'the remaining review and correction budgets',
  'the open operator decisions and approvals still awaited',
  'the version advisory marker: whether the once-per-session advisory was already evaluated, and its result',
];

/** The `/compact` instructions of a session whose coordinator was active: the operator's own text, if any, then what the summary must keep. */
export function compactionInstructions(existing) {
  const own = typeof existing === 'string' ? existing.trim() : '';
  const keep = `The isSWF coordinator skill was active in this session. Keep these in the summary, with identifiers verbatim:\n${KEEP.map(item => `- ${item};`).join('\n')}`;
  return own ? `${own}\n${keep}` : keep;
}

const describe = ({ agent, initiative, job, path, checkpoint, base, run }) =>
  `- ${agent}: ${initiative}/${job}, brief ${path}, checkpoint ${checkpoint}, base ${base}${run ? `, run ${run}` : ''}`;

/** The first message after a compaction of a session whose coordinator was active, for `host` `claude` or `pi`. */
export function compactionReminder({ host, assignments }) {
  const recent = assignments ?? [];
  const lines = [
    'isSWF reminder: the coordinator skill was active in this session before the conversation was compacted, and the summary may not hold everything the coordinator knew.',
    'Before the next action:',
    `1. Reload the coordinator skill (${RELOAD[host]}) and the methodology the next step requires: the host guide, the role profile, and the selected skills and references.`,
    '2. Reconcile the records (plan, attempt and review records, git status, open pull requests) with the summary. The records win; do not act on the summary alone.',
    recent.length
      ? `Dispatches accepted in this session, oldest first (at most ${MAX_ASSIGNMENTS} are kept; run is the identity the host returned, when it returned one):\n${recent.map(describe).join('\n')}`
      : 'No dispatch was recorded in this session since the coordinator was activated.',
  ];
  if (host === 'pi') lines.push('Pi does not let a hook steer its summary, so the candidate commit, the remaining budgets and the open operator decisions may be missing from it. Take them from the records or ask the operator.');
  return lines.join('\n');
}
