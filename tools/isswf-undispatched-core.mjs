// No Node imports and no `process` access, like tools/isswf-dispatch-guard-core.mjs: the Claude hooks module has only an injected
// fs. The Pi extension and hooks/register.tsx pass their own `io` (`project()`, `read(path)`, `list(dir)` as `{ name, kind }`
// entries, and `git(argv, cwd)` resolving with the exit code) and keep their own session state.
import { parsePlan } from './isswf-plan-core.mjs';
import { joiner } from './isswf-snapshot-core.mjs';

const STATE_DIRECTORIES = ['.isswf', '.factory'];
const INITIATIVE = /^I\d+$/u;
const ATTEMPT = /^A\d{3}\.md$/u;
const MAX_CHARS = 1024 * 1024;

const orElse = async (task, otherwise) => {
  try {
    return await task();
  } catch {
    return otherwise;
  }
};

async function undispatchedInitiative({ project, state, initiative, assignments, io, join }) {
  const markdown = await io.read(join(project, state, 'initiatives', initiative, 'plan.md'));
  if (typeof markdown !== 'string' || markdown.length > MAX_CHARS) return [];
  const found = [];
  for (const job of parsePlan(markdown).filter(candidate => candidate.reportedStatus === 'in-progress')) {
    const path = `${state}/initiatives/${initiative}/jobs/${job.id}/${job.briefName}`;
    if ((await io.git(['cat-file', '-e', `HEAD:./${path}`], project)) !== 0) continue;
    const attempts = await orElse(async () => (await io.list(join(project, state, 'initiatives', initiative, 'jobs', job.id))).filter(entry => entry.kind === 'file' && ATTEMPT.test(entry.name)), []);
    if (attempts.length) continue;
    const launched = assignments.some(entry => entry?.initiative === initiative && entry.job === job.id && typeof entry.path === 'string' && entry.path.split(/[\\/]/u).at(-1) === job.briefName);
    if (!launched) found.push({ initiative, job: job.id, briefName: job.briefName, path });
  }
  return found;
}

/**
 * The jobs of the project's plans that are `in-progress`, whose brief is committed at HEAD, with no `A###.md` attempt record and no
 * accepted dispatch (`assignments`, as the compaction memory keeps them) naming that brief. Read-only; a fault in one plan skips that
 * plan, and a fault in Git or the state directory reports nothing, so the warning never blocks a turn.
 * @returns {Promise<{ initiative: string, job: string, briefName: string, path: string }[]>}
 */
export async function findUndispatched({ io, assignments } = {}) {
  try {
    const project = await io.project();
    const join = joiner(project);
    const names = (await io.list(project)).filter(entry => entry.kind === 'dir').map(entry => entry.name);
    const states = STATE_DIRECTORIES.filter(name => names.includes(name));
    if (states.length !== 1) return [];
    const [state] = states;
    const initiatives = (await io.list(join(project, state, 'initiatives'))).filter(entry => entry.kind === 'dir' && INITIATIVE.test(entry.name)).map(entry => entry.name);
    const found = [];
    for (const initiative of initiatives) found.push(...await orElse(() => undispatchedInitiative({ project, state, initiative, assignments: assignments ?? [], io, join }), []));
    return found;
  } catch {
    return [];
  }
}

/** The gaps not warned about yet, marking them warned; a job and brief revision warns once per `warned` set (one per session). */
export function freshUndispatched(found, warned) {
  const fresh = [];
  for (const gap of found) {
    const key = `${gap.initiative}/${gap.job}/${gap.briefName}`;
    if (warned.has(key)) continue;
    warned.add(key);
    fresh.push(gap);
  }
  return fresh;
}

/** The one-line warning for these gaps, or undefined when there are none. */
export function undispatchedWarning(gaps) {
  if (!gaps?.length) return undefined;
  const names = gaps.map(gap => `${gap.initiative}/${gap.job}`).join(', ');
  const paths = gaps.map(gap => gap.path).join(', ');
  return `isSWF: ${names} ${gaps.length === 1 ? 'is' : 'are'} in-progress with ${gaps.length === 1 ? 'a committed brief' : 'committed briefs'} (${paths}) and no recorded launch or dispatch. Dispatch ${gaps.length === 1 ? 'it' : 'them'}, or record why not, before ending the turn.`;
}
