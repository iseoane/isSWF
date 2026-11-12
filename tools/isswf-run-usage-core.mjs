// No Node imports and no Node globals: hook runtimes that only offer an injected fs (the Claude Code
// pane's `$.fs`) load this module. tools/isswf-snapshot.mjs --usage is the Node entry point.
import { joiner } from './isswf-snapshot-core.mjs';
import { LIMITS, USAGE_KEYS, integer, parseTranscript, piUsage, safe, single } from './token-native-transcript-core.mjs';

const UNKNOWN = 'unknown';
const ID = {
  'claude session': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
  'claude agent': /^[A-Za-z0-9_-]{1,128}$/u,
  'pi child': /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u,
};
const COUNTERS = ['input', 'output', 'cacheRead', 'cacheWrite'];

const unknownUsage = reason => ({ found: false, reason, finished: UNKNOWN, model: UNKNOWN, tokens: UNKNOWN, durationMs: UNKNOWN, skills: UNKNOWN, agentsReads: UNKNOWN });

async function listDirs(fs, dir) {
  try {
    return (await fs.list(dir)).filter(e => e.kind === 'dir').map(e => e.name);
  } catch {
    return [];
  }
}

// Claude names files after the id, so the lookup is an existence check per project directory.
async function locateClaude(fs, claudeDir, kind, id) {
  const join = joiner(claudeDir);
  const projects = join(claudeDir, 'projects');
  for (const project of await listDirs(fs, projects)) {
    if (kind === 'session') {
      const path = join(projects, project, `${id}.jsonl`);
      if (await fs.exists(path)) return { path };
      continue;
    }
    for (const session of await listDirs(fs, join(projects, project))) {
      const path = join(projects, project, session, 'subagents', `agent-${id}.jsonl`);
      if (await fs.exists(path)) return { path };
    }
  }
  return null;
}

// pi-subagents writes `<runId>_<agent>[_<index>]_transcript.jsonl` and, once the child ends, the
// matching `_meta.json` into a session's `subagent-artifacts` or the project's `.pi/subagents/artifacts`.
async function locatePi(fs, piDir, project, id) {
  const join = joiner(piDir);
  const sessions = join(piDir, 'sessions');
  const dirs = (await listDirs(fs, sessions)).map(name => join(sessions, name, 'subagent-artifacts'));
  dirs.push(joiner(project)(project, '.pi', 'subagents', 'artifacts'));
  const found = [];
  for (const dir of dirs) {
    let entries = [];
    try { entries = await fs.list(dir); } catch { continue; }
    for (const { name, kind } of entries) {
      if (kind === 'file' && name.startsWith(`${id}_`) && name.endsWith('_transcript.jsonl')) {
        const path = joiner(dir)(dir, name);
        found.push({ path, meta: path.replace(/_transcript\.jsonl$/u, '_meta.json') });
      }
    }
  }
  if (found.length > 1) return { ambiguous: true };
  return found[0] ?? null;
}

function collector() {
  const state = { first: null, last: null, models: new Set(), skills: {}, agentsReads: {} };
  const count = (map, key) => { map[key] = (map[key] ?? 0) + 1; };
  return {
    state,
    time(value) {
      const ms = typeof value === 'number' ? value : Date.parse(value);
      if (!Number.isFinite(ms)) return;
      state.first = Math.min(state.first ?? ms, ms);
      state.last = Math.max(state.last ?? ms, ms);
    },
    // `Skill` calls name a plugin skill `<plugin>:<skill>`; a SKILL.md read gives the bare name.
    skill: name => { if (safe(name)) count(state.skills, name.replace(/^[^:]*:/u, '')); },
    read(path) {
      if (typeof path !== 'string') return;
      const normalized = path.replace(/\\/g, '/');
      const at = normalized.lastIndexOf('.agents/');
      if (at < 0) return;
      const relative = normalized.slice(at);
      count(state.agentsReads, relative);
      // A read of a skill's SKILL.md is how a file-only child loads that skill.
      const skill = relative.match(/\/([^/]+)\/SKILL\.md$/u);
      if (skill) this.skill(skill[1]);
    },
  };
}

// `invalid` names the first failing check of a found transcript whose valid entries were still summed.
function finish(collected, counters, model, finished, invalid) {
  const { first, last, skills, agentsReads } = collected.state;
  const usage = { found: true, finished, model, tokens: counters, durationMs: first === null ? UNKNOWN : last - first, skills, agentsReads };
  return invalid ? { ...usage, tokensPartial: true, reason: invalid } : usage;
}

function claudeUsage(text, kind, invalid) {
  const collected = collector();
  let lastStop = null, costState = false;
  // A request's top-level usage sums only its `message` iterations; server-side sub-inferences such as
  // `advisor_message` are billed as extra iterations, repeated on every entry of that request.
  const extra = new Map();
  const parsed = parseTranscript(text, { entries: 0 }, entry => {
    collected.time(entry.timestamp);
    if (entry.type === 'cost-state') costState = true;
    // A resumed session appends after its earlier cost-state, so only a trailing one marks it finished.
    if (entry.type === 'user' || entry.type === 'assistant') costState = false;
    if (entry.type === 'user') lastStop = null;
    if (entry.type !== 'assistant') return;
    const iterations = entry.message?.usage?.iterations;
    if (Array.isArray(iterations)) extra.set(entry.requestId, iterations.filter(i => i?.type !== 'message'));
    lastStop = entry.message?.stop_reason ?? null;
    for (const block of Array.isArray(entry.message?.content) ? entry.message.content : []) {
      if (block?.type !== 'tool_use') continue;
      if (block.name === 'Skill') collected.skill(block.input?.skill);
      if (block.name === 'Read') collected.read(block.input?.file_path);
    }
  }, true);
  invalid ??= parsed.invalid;
  const counters = Object.fromEntries(COUNTERS.map(key => [key, 0]));
  for (const usage of parsed.requests.values()) for (const key of COUNTERS) counters[key] += usage[key];
  for (const [requestId, iterations] of extra) {
    if (!parsed.requests.has(requestId)) continue;
    for (const iteration of iterations) {
      if (!USAGE_KEYS.every(([, source]) => integer(iteration?.[source]))) {
        invalid ??= 'invalid-usage-counter';
        continue;
      }
      for (const [key, source] of USAGE_KEYS) counters[key] += iteration[source];
      parsed.models.add(safe(iteration.model) ?? UNKNOWN);
    }
  }
  // `claude -p` writes cost-state when it exits; a native agent's transcript ends on an end_turn reply.
  const finished = kind === 'session' ? costState : lastStop === 'end_turn';
  return finish(collected, counters, single(parsed.models), finished, invalid);
}

function piTranscriptUsage(text, finished, invalid) {
  const collected = collector();
  const counters = Object.fromEntries(COUNTERS.map(key => [key, 0]));
  const lines = text.split('\n');
  const trailing = lines.pop();
  if (lines.length + 1 > LIMITS.entries) {
    invalid ??= 'entry-limit';
    lines.length = LIMITS.entries;
  }
  for (const [index, line] of [...lines, trailing].entries()) {
    if (!line) continue;
    let record;
    try { record = JSON.parse(line); } catch {
      if (index !== lines.length) invalid ??= 'malformed-line';
      continue;
    }
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      invalid ??= 'entry-not-object';
      continue;
    }
    collected.time(record.ts);
    if (record.recordType !== 'message' || record.role !== 'assistant') continue;
    let usage;
    try { usage = piUsage(record.usage); } catch {
      invalid ??= 'invalid-usage-counter';
      continue;
    }
    for (const key of COUNTERS) counters[key] += usage[key];
    collected.state.models.add(safe(record.model) ?? UNKNOWN);
    for (const block of Array.isArray(record.message?.content) ? record.message.content : []) {
      if (block?.type === 'toolCall' && block.name === 'read') collected.read(block.arguments?.path);
    }
  }
  return finish(collected, counters, single(collected.state.models), finished, invalid);
}

async function readFile(fs, path) {
  const { size } = await fs.stat(path);
  const text = (await fs.read(path)).replace(/\r\n/g, '\n');
  if (size <= LIMITS.file) return { size, text };
  // Oversized transcripts keep only their complete lines within the limit, summed as partial usage.
  const kept = text.slice(0, LIMITS.file);
  return { size, text: kept.slice(0, kept.lastIndexOf('\n') + 1), invalid: 'file-size-limit' };
}

async function piFinished(fs, meta) {
  try {
    const { text, invalid } = await readFile(fs, meta);
    return !invalid && Number.isInteger(JSON.parse(text).exitCode);
  } catch {
    return false;
  }
}

/**
 * Resolves one snapshot `runs` entry to usage. `cache` is a caller-owned Map: finished runs are kept
 * under host+kind+id with their transcript size and reused while that size is unchanged, because a
 * same-ID continuation appends to a transcript that already looked finished.
 */
export async function resolveRunUsage({ host, kind, id }, { fs, claudeDir, piDir, project, cache }) {
  const key = `${host} ${kind}`;
  if (!ID[key]?.test(id)) return unknownUsage('invalid-id');
  const cached = cache?.get(`${key} ${id}`);
  if (cached) {
    try { if ((await fs.stat(cached.path)).size === cached.size) return cached.usage; } catch { /* re-resolve below */ }
  }
  const located = host === 'claude' ? await locateClaude(fs, claudeDir, kind, id) : await locatePi(fs, piDir, project, id);
  if (!located) return unknownUsage('transcript-not-found');
  if (located.ambiguous) return unknownUsage('ambiguous-transcript');
  let read, usage;
  try {
    read = await readFile(fs, located.path);
    usage = host === 'claude' ? claudeUsage(read.text, kind, read.invalid) : piTranscriptUsage(read.text, await piFinished(fs, located.meta), read.invalid);
  } catch {
    return { ...unknownUsage('unreadable-transcript'), found: true };
  }
  if (usage.finished && cache) cache.set(`${key} ${id}`, { path: located.path, size: read.size, usage });
  return usage;
}

/** Adds `usage` to every `runs` entry of a snapshot from tools/isswf-snapshot-core.mjs. */
export async function addRunUsage(snapshot, options) {
  for (const initiative of snapshot.initiatives) {
    for (const job of initiative.jobs) {
      for (const round of job.rounds) {
        for (const entry of round.entries) {
          for (const run of entry.runs) run.usage = await resolveRunUsage(run, { ...options, project: snapshot.project });
        }
      }
    }
  }
  return snapshot;
}
