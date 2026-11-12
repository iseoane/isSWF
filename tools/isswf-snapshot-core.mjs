// No Node imports and no `process` access: hook runtimes that only offer an injected fs (the Claude
// Code pane's `$.fs`) load this module. tools/isswf-snapshot.mjs is the Node wrapper.
import { parsePlan } from './isswf-plan-core.mjs';

export const SCHEMA_VERSION = 1;

// Paths are joined as strings with the separator the caller's project path already uses.
export function joiner(path) {
  const sep = path.includes('\\') ? '\\' : '/';
  return (...parts) => parts.join(sep);
}
const MAX_BYTES = 1024 * 1024;
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
function parseVerdict(text, kind) {
  if (/^\W*(?:reported )?status\W{0,4}running\b/im.test(text)) return 'running';
  if (kind === 'attempt') return UNKNOWN;
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
    const label = line.match(/^[\s*|>-]*([A-Za-z][\w /-]*):/)?.[1];
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

function parseRole(text) {
  const match = text.match(/isswf[-:]isswf-(worker|reviewer|researcher|planner)\b|\bisswf-(worker|reviewer|researcher|planner)\b|roles[\\/](worker|reviewer|researcher|planner)\.md/);
  return match ? (match[1] ?? match[2] ?? match[3]) : UNKNOWN;
}

const RUN_LINE = /^\s*-\s*Run:\s*(claude (?:agent|session)|pi child)=(\S+)\s*$/;

function parseRuns(text) {
  return text.split('\n').map(line => line.replace(/\r$/, '').match(RUN_LINE)).filter(Boolean).map(m => {
    const [host, kind] = m[1].split(' ');
    return { host, kind, id: m[2] };
  });
}

function parseRecord(file, text, initiativeId, jobId) {
  // Records written on Windows may cite their brief with backslashes.
  const own = new RegExp(`${initiativeId}[\\\\/]jobs[\\\\/]${jobId}[\\\\/]brief-r(\\d+)\\.md`);
  const briefLine = text.split('\n').find(line => /^\W*brief\b/i.test(line) && own.test(line));
  const kind = file.startsWith('A') ? 'attempt' : 'review';
  return {
    id: file.replace(/\.md$/, ''),
    kind,
    role: parseRole(text),
    ...parseModel(text),
    runs: parseRuns(text),
    verdict: parseVerdict(text, kind),
    statedRound: briefLine ? Number(briefLine.match(own)[1]) : null,
  };
}

async function readJob(fs, job, dir, initiativeId, skipped) {
  const join = joiner(dir);
  const files = (await listDir(fs, dir)).filter(e => e.kind === 'file').map(e => e.name);
  const briefRounds = files.map(f => f.match(/^brief-r(\d+)\.md$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  const latest = briefRounds.at(-1) ?? null;
  const records = [];
  for (const file of files.filter(f => /^[AV]\d{3}\.md$/.test(f)).sort()) {
    const text = await readBounded(fs, join(dir, file), skipped);
    if (text === null) continue;
    const record = parseRecord(file, text, initiativeId, job.id);
    records.push({ ...record, round: record.statedRound ?? latest ?? UNKNOWN, roundSource: record.statedRound !== null ? 'stated' : latest === null ? UNKNOWN : 'latest' });
  }
  const rounds = briefRounds.map(n => ({ round: n, entries: [] }));
  const unassigned = [];
  for (const { statedRound: _, ...entry } of records) {
    const bucket = rounds.find(r => r.round === entry.round);
    (bucket ? bucket.entries : unassigned).push(entry);
  }
  if (unassigned.length) rounds.push({ round: UNKNOWN, entries: unassigned });
  const refText = [job.nextStep, ...job.evidence, (await readBounded(fs, join(dir, 'delivery.md'), skipped)) ?? ''].join('\n');
  return {
    id: job.id,
    status: job.reportedStatus,
    objective: job.objective,
    dependsOn: job.dependencies,
    ...issueRefs(refText),
    recordCount: records.length,
    rounds,
  };
}

async function readInitiative(fs, id, dir, skipped) {
  const join = joiner(dir);
  const plan = await readBounded(fs, join(dir, 'plan.md'), skipped);
  const title = plan?.match(new RegExp(`^# ${id}:\\s*(.+)$`, 'm'))?.[1].trim();
  let jobs;
  try {
    jobs = parsePlan(plan ?? '');
  } catch {
    return { id, title: title ?? UNKNOWN, type: UNKNOWN, status: 'unparsed', jobs: [] };
  }
  const parsed = [];
  for (const job of jobs) parsed.push(await readJob(fs, job, join(dir, 'jobs', job.id), id, skipped));
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

export async function readSnapshot(project, fs) {
  if (!isAbsolute(project)) throw Error('absolute --project required');
  project = project.replace(/(?<=.)[\\/]+$/, '');
  const join = joiner(project);
  const stateDir = join(project, await selectState(fs, project, join), 'initiatives');
  if (!(await fs.exists(stateDir))) throw Error(`no initiatives directory at ${stateDir}`);
  const skipped = [];
  const initiatives = [];
  const unopened = [];
  const ids = (await listDir(fs, stateDir)).filter(e => e.kind === 'dir' && /^I\d+$/.test(e.name)).map(e => e.name).sort();
  for (const id of ids) {
    const initiative = await readInitiative(fs, id, join(stateDir, id), skipped);
    const { jobs } = initiative;
    if (initiative.status === 'parsed' && jobs.every(j => j.status === 'completed')) continue;
    if (initiative.status === 'parsed' && jobs.every(j => j.status === 'pending' && j.recordCount === 0)) {
      unopened.push({ id, title: initiative.title });
      continue;
    }
    initiatives.push(initiative);
  }
  return { schemaVersion: SCHEMA_VERSION, project, stateDir, initiatives, unopened, skipped };
}
