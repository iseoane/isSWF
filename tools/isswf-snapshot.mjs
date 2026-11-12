#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlan } from './isswf-plan.mjs';
import { stateDirectory } from './project-state.mjs';

// Callers that cannot use Node's fs (the Claude Code pane passes its `$.fs`) inject an object
// with this shape. The state directory itself is always selected by project-state.mjs.
export const nodeFs = {
  exists: async path => existsSync(path),
  list: async path => (await readdir(path, { withFileTypes: true })).map(e => ({ name: e.name, kind: e.isFile() ? 'file' : e.isDirectory() ? 'dir' : 'other' })),
  stat: async path => ({ size: (await stat(path)).size }),
  read: path => readFile(path, 'utf8'),
};

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

function parseVerdict(text, kind) {
  if (/^\W*(?:reported )?status\W{0,4}running\b/im.test(text)) return 'running';
  if (kind === 'attempt') return UNKNOWN;
  const aggregate = text.match(/\baggregate\W{0,4}(pass|fail)/i);
  if (aggregate) return aggregate[1].toLowerCase() === 'pass' ? 'passed' : 'changes-requested';
  if (/\bchanges[ -]requested\b/i.test(text)) return 'changes-requested';
  const verdicts = [...text.matchAll(/^\W*verdict\W{0,4}(pass|fail)/gim)].map(m => m[1].toLowerCase());
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
    verdict: parseVerdict(text, kind),
    statedRound: briefLine ? Number(briefLine.match(own)[1]) : null,
  };
}

async function readJob(fs, job, dir, initiativeId, skipped) {
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

export async function readSnapshot(project, fs = nodeFs) {
  if (!isAbsolute(project)) throw Error('absolute --project required');
  const stateDir = join(project, stateDirectory(project), 'initiatives');
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
  return { schemaVersion: 1, project, stateDir, initiatives, unopened, skipped };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, project, ...rest] = process.argv.slice(2);
  if (flag !== '--project' || !project || rest.length || !isAbsolute(project)) {
    console.error('Usage: node tools/isswf-snapshot.mjs --project /absolute/project');
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(await readSnapshot(project), null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
