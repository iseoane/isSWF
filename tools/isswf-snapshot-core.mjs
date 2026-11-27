// No Node imports and no `process` access: hook runtimes that only offer an injected fs (the Claude
// Code pane's `$.fs`) load this module. tools/isswf-snapshot.mjs is the Node wrapper.
import { deriveJobState, parsePlan, planErrorDetail } from './isswf-plan-core.mjs';

export const SCHEMA_VERSION = 1;

// Paths are joined as strings with the separator the caller's project path already uses.
export function joiner(path) {
  const sep = path.includes('\\') ? '\\' : '/';
  return (...parts) => parts.join(sep);
}
const MAX_BYTES = 1024 * 1024;
// Attempt and review record names (A or V and three digits): the checker, the guard, the status command and the pane share this.
export const RECORD_NAME = /^[AV]\d{3}\.md$/;
// Where records live: the guard, the pane and the record tools classify paths with these three functions.
const INITIATIVES = /\.(?:isswf|factory)\/initiatives\//u.source;
const INITIATIVES_PREFIX = new RegExp(`^${INITIATIVES}`, 'u');
const RECORD_PATH = new RegExp(`^(?:.*/)?${INITIATIVES}I\\d+/(?:plan\\.md|jobs/J\\d+/([^/]+))$`, 'u');
const INITIATIVE_ID = new RegExp(`${INITIATIVES}(I\\d+)\\b`, 'gu');
/** True for a Git-relative path under a state directory's initiatives folder. */
export const isInitiativePath = path => INITIATIVES_PREFIX.test(path);
/** True for a plan or an attempt or review record, under any prefix; `path` uses forward slashes. */
export const isRecordPath = path => {
  const match = RECORD_PATH.exec(path);
  return match !== null && (match[1] === undefined || RECORD_NAME.test(match[1]));
};
/** The initiative IDs of every initiative folder named in forward-slash `text`. */
export const initiativeIdsIn = text => [...text.matchAll(INITIATIVE_ID)].map(match => match[1]);
const UNKNOWN = 'unknown';
const EFFORTS = /\b(minimal|low|medium|high|xhigh|max)\b/i;
const MODEL_NAME = /(gpt|claude|opus|sonnet|haiku|gemini|glm|kimi|qwen|deepseek)/i;
const SOURCE_RANK = { actual: 0, requested: 1, approved: 2, stated: 3 };

async function listDir(fs, dir) {
  try {
    return await fs.list(dir);
  } catch {
    return [];
  }
}

// Returns null for missing, unreadable or oversized files; oversized and unreadable paths go to `skipped`.
async function readBounded(fs, path, skipped) {
  let size;
  try {
    size = (await fs.stat(path)).size;
  } catch {
    return null;
  }
  try {
    if (size > MAX_BYTES) throw Error('oversized');
    return (await fs.read(path)).replace(/\r\n/g, '\n');
  } catch {
    skipped.push(path);
    return null;
  }
}

function issueRefs(text) {
  const issues = new Set();
  const prs = new Set();
  for (const [, kind, number] of text.matchAll(/\b(issue|PR)\s?#?(\d+)\b/gi)) {
    (kind.toLowerCase() === 'pr' ? prs : issues).add(Number(number));
  }
  return { issues: [...issues].sort((a, b) => a - b), prs: [...prs].sort((a, b) => a - b) };
}

// Review records are written in English or Spanish; labels are matched in both.
// A filled value ends its line or clause; the unfilled template line, which lists every value, does not.
function parseOutcome(text) {
  const match = text.match(/^\W*(?:reported status|status|outcome|estado|resultado)\W{0,4}(complete|completed|passed|partial|blocked|failed|cancell?ed)\W{0,2}(?:$|[.;(])/im);
  return match ? match[1].toLowerCase() : UNKNOWN;
}

function parseVerdict(text, kind, outcome) {
  if (/^\W*(?:reported )?status\W{0,4}running\b/im.test(text)) return 'running';
  if (/^(blocked|failed|cancell?ed)$/.test(outcome)) return 'failed';
  // Partial work is usually committed with acceptance still pending: not a failure.
  if (outcome === 'partial') return 'partial';
  if (kind === 'attempt') return outcome === UNKNOWN ? UNKNOWN : 'passed';
  const aggregate = text.match(/\b(?:aggregate|agregado)\W{0,4}(pass|fail)/i);
  if (aggregate) return aggregate[1].toLowerCase() === 'pass' ? 'passed' : 'changes-requested';
  if (/\bchanges[ -]requested\b|\bcambios (?:pedidos|solicitados)\b/i.test(text)) return 'changes-requested';
  const verdicts = [...text.matchAll(/^\W*(?:verdict|veredicto)\W{0,4}(pass|fail)/gim)].map(m => m[1].toLowerCase());
  if (verdicts.length === 0) return UNKNOWN;
  return verdicts.includes('fail') ? 'changes-requested' : 'passed';
}

function isModelToken(token) {
  const name = token.split(':')[0];
  return /^(opus|sonnet|haiku)$/i.test(name) || (MODEL_NAME.test(name) && /\d/.test(name) && /^[\w./-]+$/.test(name) && !/\.(md|json|mjs)$/.test(name));
}

function parseModel(text) {
  let best = null;
  for (const line of text.split('\n')) {
    const label = line.match(/^[\s*|>-]*([A-Za-z][\w ,/-]*):/)?.[1];
    if (!label || !/model|observer|profile|selection/i.test(label)) continue;
    for (const clause of line.split(/;|\.\s/)) {
      const token = [...clause.matchAll(/`([^`\s]+)`/g)].map(m => m[1]).find(isModelToken);
      if (!token) continue;
      const before = clause.slice(0, clause.indexOf(token));
      const source = /actual|observed|effective/i.test(before) ? 'actual' : /request/i.test(before) ? 'requested' : /approv/i.test(before) ? 'approved' : 'stated';
      const [model, inlineEffort] = token.split(':');
      const after = clause.slice(clause.indexOf(token) + token.length);
      const effort = inlineEffort && EFFORTS.test(inlineEffort) ? inlineEffort : (after.match(EFFORTS)?.[1] ?? UNKNOWN);
      if (!best || SOURCE_RANK[source] < SOURCE_RANK[best.modelSource]) best = { model, modelSource: source, effort: effort.toLowerCase() };
    }
  }
  return best ?? { model: UNKNOWN, modelSource: UNKNOWN, effort: UNKNOWN };
}

const ROLES = 'worker|reviewer|researcher|planner|diagnostician';

const ROLE_FILE = new RegExp(`roles[\\\\/](${ROLES})\\.md`);
const ROLE_ANY = new RegExp(`roles[\\\\/](${ROLES})\\.md|\\bisswf-(${ROLES})\\b`);
const IDENTITY_LINE = /^\W*(?:shared )?(?:profile|role|agent|observer|reviewer)\b[^:\n]*:/i;
// An attempt the coordinator writes itself names its skill (or says so) on an identity line.
const COORDINATOR = /isswf-coordinator[\\/]SKILL\.md|\bcoordinator acting as writer\b/i;

// In the record's identity lines the shared role file wins over the host agent name: a diagnostician runs as
// the isswf-worker agent. Elsewhere the first mention wins, since reports also cite other roles' files.
export function parseRole(text) {
  const identity = text.split('\n').filter(line => IDENTITY_LINE.test(line)).join('\n');
  const match = identity.match(ROLE_FILE) ?? identity.match(ROLE_ANY);
  if (match) return match[1] ?? match[2];
  if (COORDINATOR.test(identity)) return 'coordinator';
  const any = text.match(ROLE_ANY);
  return any ? (any[1] ?? any[2]) : UNKNOWN;
}

const AGENT_ROLE = new RegExp(`\\bisswf-(${ROLES})\\b`);

/** The role a host agent name (`isswf:isswf-worker`, `isswf-worker`) stands for, or undefined for any other agent. */
export const roleOfAgent = name => (typeof name === 'string' ? name.match(AGENT_ROLE)?.[1] : undefined);

const RUN_LINE = /^\s*-\s*Run:\s*(claude (?:agent|session)|pi child)=(\S+)\s*$/;

/** The launch identity a `Run:` line records, or null when the pane would ignore the line. */
export function parseRunLine(line) {
  const match = line.replace(/\r$/, '').match(RUN_LINE);
  if (!match) return null;
  const [host, kind] = match[1].split(' ');
  return { host, kind, id: match[2] };
}

function parseRuns(text) {
  return text.split('\n').map(parseRunLine).filter(Boolean);
}

function parseRecord(file, text, initiativeId, jobId) {
  // Records written on Windows may cite their brief with backslashes.
  const own = new RegExp(`${initiativeId}[\\\\/]jobs[\\\\/]${jobId}[\\\\/]brief-r(\\d+)\\.md`);
  const briefLine = text.split('\n').find(line => /^\W*brief\b/i.test(line) && own.test(line));
  const kind = file.startsWith('A') ? 'attempt' : 'review';
  const outcome = parseOutcome(text);
  return {
    id: file.replace(/\.md$/, ''),
    kind,
    role: parseRole(text),
    ...parseModel(text),
    runs: parseRuns(text),
    verdict: parseVerdict(text, kind, outcome),
    outcome,
    statedRound: briefLine ? Number(briefLine.match(own)[1]) : null,
    // A correction attempt states its round as `Review round: N` (per brief). The review template's
    // "Review round in this job" field counts across the whole job, so reviews are numbered by position.
    statedReviewRound: Number(text.match(/^\W*review round\W{0,4}:\W{0,4}(\d+)/im)?.[1]) || null,
  };
}

// `dirs` are the job's folder in the project, then in each linked worktree. A file name found in several is
// read from the first, so an integrated record counts once and the project's own copy wins.
async function readJob(fs, job, dirs, initiativeId, skipped) {
  const holder = new Map();
  for (const dir of dirs) {
    for (const entry of await listDir(fs, dir)) if (entry.kind === 'file' && !holder.has(entry.name)) holder.set(entry.name, dir);
  }
  const files = [...holder.keys()];
  const dir = dirs[0];
  const join = joiner(dir);
  const briefRounds = files.map(f => f.match(/^brief-r(\d+)\.md$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  const latest = briefRounds.at(-1) ?? null;
  const records = [];
  for (const file of files.filter(f => RECORD_NAME.test(f)).sort()) {
    const text = await readBounded(fs, joiner(holder.get(file))(holder.get(file), file), skipped);
    if (text === null) continue;
    const record = parseRecord(file, text, initiativeId, job.id);
    records.push({ ...record, round: record.statedRound ?? latest ?? UNKNOWN, roundSource: record.statedRound !== null ? 'stated' : latest === null ? UNKNOWN : 'latest' });
  }
  const known = new Set(briefRounds);
  const rounds = [];
  // The k-th review of a brief is round k; an attempt is round 1 unless it states its round. Record
  // numbers run across the whole job, so they cannot pair an attempt with its review.
  const reviewsSeen = new Map();
  for (const { statedRound: _, statedReviewRound, ...entry } of records) {
    const round = known.has(entry.round) ? entry.round : UNKNOWN;
    let reviewRound = statedReviewRound ?? 1;
    if (entry.kind === 'review') {
      reviewRound = (reviewsSeen.get(round) ?? 0) + 1;
      reviewsSeen.set(round, reviewRound);
    }
    let bucket = rounds.find(r => r.round === round && r.reviewRound === reviewRound);
    if (!bucket) rounds.push((bucket = { round, reviewRound, entries: [] }));
    bucket.entries.push(entry);
  }
  // Brief revisions in order, review rounds in order within each, an unknown brief last.
  const rank = r => (r.round === UNKNOWN ? Infinity : r.round);
  rounds.sort((a, b) => rank(a) - rank(b) || a.reviewRound - b.reviewRound);
  const refText = [job.nextStep, ...job.evidence, (await readBounded(fs, join(dir, 'delivery.md'), skipped)) ?? ''].join('\n');
  return {
    id: job.id,
    status: deriveJobState(job.reportedStatus, { attempts: records.filter(r => r.kind === 'attempt').length, reviews: records.filter(r => r.kind === 'review').length }),
    size: job.size,
    objective: job.objective,
    dependsOn: job.dependencies,
    ...issueRefs(refText),
    recordCount: records.length,
    // Only rounds with records: a brief revision nobody worked on yet is not drawn.
    rounds,
  };
}

async function readInitiative(fs, id, dir, worktreeStateDirs, skipped) {
  const join = joiner(dir);
  const plan = await readBounded(fs, join(dir, 'plan.md'), skipped);
  const title = plan?.match(new RegExp(`^# ${id}:\\s*(.+)$`, 'm'))?.[1].trim();
  let jobs;
  try {
    jobs = parsePlan(plan ?? '');
  } catch (error) {
    return { id, title: title ?? UNKNOWN, type: UNKNOWN, status: 'unparsed', planError: planErrorDetail(error), jobs: [] };
  }
  // A closed initiative is not drawn, so its job folders are never opened.
  if (jobs.every(job => job.reportedStatus === 'completed')) return { id, status: 'closed' };
  // Only worktrees that hold this initiative's job folders are listed per job.
  const worktreeBases = [];
  for (const stateDir of worktreeStateDirs) {
    const base = joiner(stateDir)(stateDir, id);
    if (await fs.exists(joiner(base)(base, 'jobs'))) worktreeBases.push(base);
  }
  const parsed = [];
  for (const job of jobs) {
    const dirs = [dir, ...worktreeBases].map(base => joiner(base)(base, 'jobs', job.id));
    parsed.push(await readJob(fs, job, dirs, id, skipped));
  }
  return { id, title: title ?? UNKNOWN, type: plan.match(/^Type:\s*(.+)$/m)[1].trim(), status: 'parsed', jobs: parsed };
}

const isAbsolute = path => /^(?:[\\/]|[A-Za-z]:[\\/])/.test(path);

// Same selection rules as project-state.mjs stateDirectory, read through the injected fs.
// The regular-directory (non-symlink) guard needs lstat and stays in the Node wrapper.
async function selectState(fs, project, join) {
  const current = await fs.exists(join(project, '.isswf'));
  const legacy = await fs.exists(join(project, '.factory'));
  if (current && legacy) throw Error('Both .isswf and .factory exist; reconcile before selecting an active state directory');
  if (!current && !legacy) throw Error(`no .isswf or .factory state directory in ${project}`);
  return current ? '.isswf' : '.factory';
}

const normalized = path => path.replace(/\\/g, '/').replace(/(?<=.)\/+$/, '');
const sameDir = (a, b) => (/^[A-Za-z]:/.test(a) ? a.toLowerCase() === b.toLowerCase() : a === b);

// Git's own files tell which checkouts share this repository: `.git/worktrees/<name>/gitdir` names each linked
// worktree, and that worktree's `.git` file must point back at `<common>/worktrees/<name>`; a linked worktree's own
// `.git` file leads to the shared directory. Only absolute paths are followed and nothing else is opened, so an
// unrelated checkout is never read. Any unreadable or inconsistent piece leaves that worktree out.
async function linkedStateDirs(fs, project, join, stateDir) {
  const stateName = stateDir.slice(project.length + 1).split(/[\\/]/)[0];
  // Git writes forward slashes; paths are read back through `fs` with the separator the project uses.
  const local = path => (project.includes('\\') ? path.replaceAll('/', '\\') : path);
  const absolute = path => /^(?:\/|[A-Za-z]:\/)/.test(path);
  const gitText = async path => {
    try {
      const text = await fs.read(local(path));
      return typeof text === 'string' ? text : null;
    } catch {
      return null;
    }
  };
  const pointerIn = async path => {
    const target = (await gitText(path))?.match(/^gitdir:\s*(.+?)\s*$/m)?.[1];
    return target && absolute(normalized(target)) ? normalized(target) : null;
  };
  let common = normalized(project) + '/.git';
  const roots = [];
  const pointer = await pointerIn(common);
  if (pointer) {
    // <common>/worktrees/<name>
    const parts = pointer.split('/');
    if (parts.length < 3 || parts.at(-2) !== 'worktrees') return [];
    common = parts.slice(0, -2).join('/');
    if (common.endsWith('/.git')) roots.push(common.slice(0, -'/.git'.length));
  }
  for (const entry of await listDir(fs, local(common + '/worktrees'))) {
    if (entry.kind !== 'dir') continue;
    const listed = (await gitText(common + '/worktrees/' + entry.name + '/gitdir'))?.split('\n')[0].trim();
    const gitFile = listed && normalized(listed);
    if (!gitFile || !absolute(gitFile) || !gitFile.endsWith('/.git')) continue;
    const back = await pointerIn(gitFile);
    if (back && sameDir(back, common + '/worktrees/' + entry.name)) roots.push(gitFile.slice(0, -'/.git'.length));
  }
  const seen = [normalized(project)];
  const stateDirs = [];
  for (const root of roots) {
    if (seen.some(known => sameDir(known, root))) continue;
    seen.push(root);
    const own = joiner(local(root));
    // A checkout on the other state directory (or on both) is not this project's state.
    const other = stateName === '.isswf' ? '.factory' : '.isswf';
    if (!(await fs.exists(own(local(root), stateName))) || (await fs.exists(own(local(root), other)))) continue;
    stateDirs.push(own(local(root), stateName, 'initiatives'));
  }
  return stateDirs;
}

/** The project's active `initiatives` directory, without reading any initiative. */
export async function initiativesDir(project, fs) {
  if (!isAbsolute(project)) throw Error('absolute --project required');
  project = project.replace(/(?<=.)[\\/]+$/, '');
  const join = joiner(project);
  return { project, join, stateDir: join(project, await selectState(fs, project, join), 'initiatives') };
}

export async function readSnapshot(project, fs) {
  let join, stateDir;
  ({ project, join, stateDir } = await initiativesDir(project, fs));
  if (!(await fs.exists(stateDir))) throw Error(`no initiatives directory at ${stateDir}`);
  const worktreeStateDirs = await linkedStateDirs(fs, project, join, stateDir);
  const skipped = [];
  const initiatives = [];
  const unopened = [];
  const ids = (await listDir(fs, stateDir)).filter(e => e.kind === 'dir' && /^I\d+$/.test(e.name)).map(e => e.name).sort();
  for (const id of ids) {
    const initiative = await readInitiative(fs, id, join(stateDir, id), worktreeStateDirs, skipped);
    if (initiative.status === 'closed') continue;
    const { jobs } = initiative;
    if (initiative.status === 'parsed' && jobs.every(j => j.status === 'pending' && j.recordCount === 0)) {
      unopened.push({ id, title: initiative.title });
      continue;
    }
    initiatives.push(initiative);
  }
  return { schemaVersion: SCHEMA_VERSION, project, stateDir, initiatives, unopened, skipped };
}
