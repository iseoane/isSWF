// No Node imports and no `process` access, like tools/isswf-record-guard-core.mjs: the Claude hooks module has
// only an injected fs. The Pi extension and hooks/register.tsx pass their own `io`.
import { verifyHandoff } from './isswf-handoff-core.mjs';
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { joiner } from './isswf-snapshot-core.mjs';

// The same ceiling as tools/isswf-record-guard-core.mjs.
const MAX_CHARS = 1024 * 1024;
const ROLE_AGENT = /^(?:isswf:)?isswf-/u;
const REVIEWER_AGENT = /^(?:isswf:)?isswf-reviewer$/u;
// Read-only roles that may analyse a committed retrospective record instead of a job (#355).
const READ_ONLY_AGENT = /^(?:isswf:)?isswf-(?:researcher|planner)$/u;
const STATE_DIRECTORIES = ['.isswf', '.factory'];
// Pi has no thinking field: the level is a suffix of the model, and a model id may contain ':' itself.
const PI_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const PATH_CHAR = /[\w.:\\/-]/u;
const RETROSPECTIVE_PATH = /(?<![\w.-])retrospectives[\\/]([A-Za-z0-9_][\w.-]{0,127})\.md(?![\w-])/u;
const BRIEF_PATH = /initiatives[\\/](I\d+)[\\/]jobs[\\/]([A-Z][A-Z0-9-]{0,63})[\\/]brief-r([1-9]\d*)\.md(?![\w-])/u;
// The first hex token on the same line after the word that names it; only a full 40-hex token counts, so a short SHA is not
// rescued by a full one that follows it.
const fullShaAfter = (body, word) => {
  const sha = new RegExp(`\\b${word}\\b[^\\n]{0,80}?(?<![0-9A-Za-z])([0-9a-f]{7,64})(?![0-9A-Za-z])`, 'iu').exec(body)?.[1];
  return sha?.length === 40 ? sha : undefined;
};
const OVERRIDE_LINE = /^Override:[ \t]+model=(\S+)[ \t]+effort=(\S+)[ \t]*$/u;
const CONDITION_NAMES = { 2: 'selection', 3: 'references', 4: 'plan', 5: 'brief', 6: 'handoff' };

class Refusal extends Error {
  constructor(condition, detail) {
    super(detail);
    this.condition = condition;
  }
}
const refuse = (condition, detail) => {
  throw new Refusal(condition, detail);
};
/** RED stub. */
export const workerCalls = () => [];
/** Whether an agent name is an isSWF role agent, the only kind the guard checks. */
export const isRoleAgent = agent => typeof agent === 'string' && ROLE_AGENT.test(agent);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value !== '';

function splitPiModel(model) {
  if (!text(model)) return { model, effort: undefined };
  const at = model.lastIndexOf(':');
  return at > 0 && PI_LEVELS.includes(model.slice(at + 1)) ? { model: model.slice(0, at), effort: model.slice(at + 1) } : { model, effort: undefined };
}

/**
 * The delegated children one tool call names (a Pi `action` call is exempt only because none of them is an isSWF role), as `{ agent, model, effort, prompt }` for the host's event shape.
 * Exported so the compaction memory reads a dispatch with the guard's own parser.
 */
export function callsOf(host, input) {
  if (host === 'claude') return [{ agent: input?.subagent_type, model: input?.model, effort: input?.effort, prompt: input?.prompt }];
  if (!isObject(input)) return [];
  const children = [input];
  if (Array.isArray(input.tasks)) children.push(...input.tasks);
  if (Array.isArray(input.chain)) for (const step of input.chain) children.push(step, ...(isObject(step) && Array.isArray(step.parallel) ? step.parallel : []));
  return children.filter(isObject).map(child => ({ agent: child.agent, ...splitPiModel(child.model), prompt: typeof child.task === 'string' ? child.task : input.task }));
}

async function stateDirectory(project, io) {
  const names = (await io.list(project)).filter(entry => entry.kind === 'dir').map(entry => entry.name);
  const found = STATE_DIRECTORIES.filter(name => names.includes(name));
  if (found.length !== 1) refuse(2, found.length ? 'both .isswf and .factory exist; reconcile before selecting an active state directory' : 'the project has no .isswf or .factory state directory');
  return found[0];
}

function overrideOf(prompt) {
  const lines = String(prompt ?? '').split(/\r?\n/u).filter(line => line.startsWith('Override:'));
  if (!lines.length) return undefined;
  const parsed = lines.length === 1 ? OVERRIDE_LINE.exec(lines[0]) : null;
  if (!parsed) refuse(2, lines.length > 1 ? 'the prompt has more than one Override line; it may have one' : 'the Override line must read `Override: model=<m> effort=<e>`');
  return { model: parsed[1], effort: parsed[2] };
}

// The agent names a selection file may key the reviewer by, in the order tried: the plugin's and the bare spelling.
export const REVIEWER_AGENTS = { claude: ['isswf:isswf-reviewer', 'isswf-reviewer'], pi: ['isswf-reviewer'] };

/**
 * The model and effort a parsed dispatch-selection.json holds for the first of `agents` it lists for `host`, or a refusal naming `label`.
 * The guard, the handoff and the review launcher read the approved selection through this one function.
 * @public
 */
export function selectionEntry(selection, host, agents, label) {
  if (!isObject(selection) || selection.schemaVersion !== 1 || !isObject(selection.agents)) refuse(2, `${label} needs schemaVersion 1 and an agents object`);
  const forHost = selection.agents[host];
  const agent = isObject(forHost) ? agents.find(name => Object.hasOwn(forHost, name)) : undefined;
  if (agent === undefined) refuse(2, `${label} has no entry for ${agents[0]} for host ${host}`);
  const entry = forHost[agent];
  const missing = ['model', 'effort'].find(field => !text(entry?.[field]));
  if (!isObject(entry) || missing) refuse(2, `the entry for ${agent} for host ${host} needs a model and an effort${missing ? ` (${missing} is missing)` : ''}`);
  return { agent, model: entry.model, effort: entry.effort };
}

async function checkSelection(host, call, state, file, io) {
  let selection;
  try {
    selection = JSON.parse(await io.read(file));
  } catch {
    refuse(2, `${state}/dispatch-selection.json is missing or is not valid JSON`);
  }
  const entry = selectionEntry(selection, host, [call.agent], `${state}/dispatch-selection.json`);
  const override = overrideOf(call.prompt);
  const expected = override ?? entry;
  const source = override ? 'the Override line' : `${state}/dispatch-selection.json`;
  for (const field of ['model', 'effort']) {
    if (!text(call[field])) refuse(2, `the call has no ${field}; ${call.agent} expects ${field} ${expected[field]} (${source})`);
    if (call[field] !== expected[field]) refuse(2, `the call has ${field} ${call[field]}; ${call.agent} expects ${field} ${expected[field]} (${source})`);
  }
}

/**
 * Reads the job brief (its initiative, job, revision and the path as the prompt wrote it, state root included) and the full checkpoint and base SHAs from a dispatch prompt, or refuses. Exported so a tool that records a
 * launch can read them with the same parser as the guard; only the tests use it so far.
 * @public
 */
export function checkReferences(prompt) {
  const body = typeof prompt === 'string' ? prompt : '';
  const brief = BRIEF_PATH.exec(body);
  if (!brief) refuse(3, 'the prompt does not name the job brief as .../initiatives/<I>/jobs/<J>/brief-r<n>.md');
  const shas = {};
  for (const [word, label] of [['checkpoint', 'document-input checkpoint'], ['base', 'target base']]) {
    shas[word] = fullShaAfter(body, word);
    if (!shas[word]) refuse(3, `the prompt does not give the full 40-hex ${label} SHA after the word "${word}"`);
  }
  // The state root is whatever path characters precede the match; walking back keeps the match itself unchanged and the cost linear.
  let start = brief.index;
  while (start > 0 && PATH_CHAR.test(body[start - 1])) start -= 1;
  return { initiative: brief[1], job: brief[2], revision: brief[3], path: body.slice(start, brief.index + brief[0].length), checkpoint: shas.checkpoint, base: shas.base };
}

/**
 * A read-only role's prompt that names no job brief but a retrospective record and a full checkpoint SHA, or undefined
 * when it names a job brief or no record; condition 3 then decides as for any other role.
 */
function retrospectiveOf(prompt) {
  const body = typeof prompt === 'string' ? prompt : '';
  if (BRIEF_PATH.test(body)) return undefined;
  const record = RETROSPECTIVE_PATH.exec(body);
  if (!record) return undefined;
  const checkpoint = fullShaAfter(body, 'checkpoint');
  if (!checkpoint) refuse(3, 'the prompt does not give the full 40-hex document-input checkpoint SHA after the word "checkpoint"');
  return { name: record[1], checkpoint };
}

async function checkPlan(planPath, job, io) {
  let markdown;
  try {
    markdown = await io.read(planPath);
  } catch {
    refuse(4, `the initiative plan ${planPath} is missing or unreadable`);
  }
  if (typeof markdown !== 'string' || markdown.length > MAX_CHARS) refuse(4, 'the initiative plan is not text or is over 1 MiB');
  let jobs;
  try {
    jobs = parsePlan(markdown);
  } catch (error) {
    const { code, job: at, field, line } = planErrorDetail(error);
    refuse(4, `the initiative plan does not parse: ${[code, at, field, line === undefined ? undefined : `line ${line}`].filter(Boolean).join(' ')}`);
  }
  const found = jobs.find(candidate => candidate.id === job);
  if (!found) refuse(4, `job ${job} is not in the plan`);
  if (found.reportedStatus !== 'in-progress') refuse(4, `job ${job} is ${found.reportedStatus}; a dispatch needs it in-progress`);
}

// Git answers by exit code; a runtime that cannot run it makes the check fail, not pass.
async function checkBrief(project, relative, checkpoint, join, io, label = 'brief') {
  let info;
  try {
    info = await io.stat(join(project, ...relative.split('/')));
  } catch {
    info = undefined;
  }
  if (info?.kind !== 'file') refuse(5, `the ${label} ${relative} does not exist as a file`);
  let tracked, ignored, committed;
  try {
    tracked = await io.git(['ls-files', '--error-unmatch', '--', relative], project);
    // --no-index: a force-added brief under an ignored path is tracked and would otherwise not be reported as ignored.
    ignored = await io.git(['check-ignore', '--no-index', '-q', '--', relative], project);
    // `./` makes Git resolve the path from the project directory, as the checks above do, not from the repository root.
    committed = await io.git(['cat-file', '-e', `${checkpoint}:./${relative}`], project);
  } catch (error) {
    refuse(5, `Git could not check the ${label}: ${error?.message ?? error}`);
  }
  if (tracked !== 0) refuse(5, `the ${label} ${relative} is not tracked by Git (untracked or never committed)`);
  if (ignored === 0) refuse(5, `the ${label} ${relative} is ignored by Git`);
  if (ignored !== 1) refuse(5, `git check-ignore could not decide for the ${label} ${relative}`);
  if (committed !== 0) refuse(5, `the ${label} ${relative} is not committed at the checkpoint ${checkpoint}`);
}

async function checkCall(host, call, io) {
  const project = await io.project();
  const join = joiner(project);
  const state = await stateDirectory(project, io);
  await checkSelection(host, call, state, join(project, state, 'dispatch-selection.json'), io);
  const retrospective = READ_ONLY_AGENT.test(call.agent) ? retrospectiveOf(call.prompt) : undefined;
  if (retrospective) {
    await checkBrief(project, `${state}/retrospectives/${retrospective.name}.md`, retrospective.checkpoint, join, io, 'retrospective record');
    return;
  }
  const references = checkReferences(call.prompt);
  const { initiative, job, revision, checkpoint } = references;
  await checkPlan(join(project, state, 'initiatives', initiative, 'plan.md'), job, io);
  await checkBrief(project, `${state}/initiatives/${initiative}/jobs/${job}/brief-r${revision}.md`, checkpoint, join, io);
  if (REVIEWER_AGENT.test(call.agent)) {
    const reason = await verifyHandoff({ prompt: call.prompt, host, agent: call.agent, references, io });
    if (reason) refuse(6, reason);
  }
}

/**
 * Decides whether a delegation to an isSWF role agent may start. `input` is the host's raw tool input:
 * Claude's `Agent` call (`subagent_type`, `model`, `effort`, `prompt`) or Pi's `subagent` call (`agent`, `task`,
 * `model` with an optional `:level` suffix, and the `tasks` and `chain` forms). `io` supplies `project()`,
 * `read(path)`, `readBytes(path)` (the file's bytes, for a reviewer's handoff), `list(dir)` as `{ name, kind }` entries, `stat(path)` as `{ kind }` and `git(argv, cwd)`, which resolves with the
 * exit code. Another agent is allowed without reading anything. A failure of the guard itself refuses the isSWF
 * role call, never any other. The verdict only refuses: `{ allow: true }` is not an authorization to dispatch.
 * @returns {Promise<{ allow: true } | { deny: string, condition: string }>}
 */
export async function guardDispatch({ host, input, io } = {}) {
  for (const call of callsOf(host, input).filter(candidate => isRoleAgent(candidate.agent))) {
    try {
      await checkCall(host, call, io);
    } catch (error) {
      if (error instanceof Refusal) return { deny: `isSWF dispatch refused for ${call.agent}: condition ${error.condition} (${CONDITION_NAMES[error.condition]}): ${error.message}. Fix it and dispatch again.`, condition: CONDITION_NAMES[error.condition] };
      return { deny: `isSWF dispatch refused for ${call.agent}: dispatch guard error: ${error?.message ?? error}`, condition: 'error' };
    }
  }
  return { allow: true };
}
