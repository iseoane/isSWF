// No Node imports and no Node globals: hook runtimes that only offer an injected fs (the Claude Code
// pane's `$.fs`) load this module. tools/isswf-snapshot.mjs --usage is the Node entry point.
import { joiner, parseRunLine, roleOfAgent } from './isswf-snapshot-core.mjs';
import { PRICES } from './isswf-prices.mjs';
import { LIMITS, USAGE_KEYS, integer, parseTranscript, piUsage, safe, single } from './token-native-transcript-core.mjs';

const UNKNOWN = 'unknown';
const ID = {
  'claude session': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
  'claude agent': /^[A-Za-z0-9_-]{1,128}$/u,
  'pi child': /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u,
};
const COUNTERS = ['input', 'output', 'cacheRead', 'cacheWrite'];

const unknownUsage = reason => ({ found: false, reason, finished: UNKNOWN, model: UNKNOWN, tokens: UNKNOWN, durationMs: UNKNOWN, skills: UNKNOWN, agentsReads: UNKNOWN, usedSkills: UNKNOWN, usedReferences: UNKNOWN, usedHostGuides: UNKNOWN, costUsd: UNKNOWN, readPaths: UNKNOWN, commands: UNKNOWN, editedPaths: UNKNOWN });

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
        // The agent is what follows the run id, without the parallel index.
        found.push({ path, meta: path.replace(/_transcript\.jsonl$/u, '_meta.json'), agent: name.slice(id.length + 1).replace(/(?:_\d+)?_transcript\.jsonl$/u, '') });
      }
    }
  }
  if (found.length > 1) return { ambiguous: true };
  return found[0] ?? null;
}

// Bounds of the observed lists; a cut is disclosed as `readsTruncated`, `commandsTruncated` or `editsTruncated`.
const OBSERVED = { reads: 200, commands: 100, commandChars: 300 };

// Forward slashes always; project-relative when inside it. A Windows drive path matches its project without regard to case.
function projectRelative(path, project) {
  const normalized = path.replace(/\\/g, '/');
  const root = typeof project === 'string' ? project.replace(/\\/g, '/').replace(/\/+$/u, '') : '';
  if (!root) return normalized;
  const drive = /^[A-Za-z]:\//u.test(normalized) && /^[A-Za-z]:(?:\/|$)/u.test(root);
  const [a, b] = drive ? [normalized.toLowerCase(), root.toLowerCase()] : [normalized, root];
  return a.startsWith(`${b}/`) ? normalized.slice(root.length + 1) : normalized;
}

const BRIEF =/\/jobs\/J\d+\/brief-r\d+\.md$/u;
const blockText = content => (typeof content === 'string' ? content
  : Array.isArray(content) ? content.map(b => (typeof b === 'string' ? b : typeof b?.text === 'string' ? b.text : '')).join('\n') : '');

function collector(project) {
  const state = { observed: { reads: [], commands: [], edits: [], cut: new Set() }, first: null, last: null, models: new Set(), skills: {}, agentsReads: {}, invoked: {}, reads: [], edited: new Set(), assigned: [], briefCalls: new Set(), readCalls: new Map(), contents: new Map() };
  const count = (map, key) => { map[key] = (map[key] ?? 0) + 1; };
  const relative = path => {
    if (typeof path !== 'string') return null;
    const normalized = path.replace(/\\/g, '/');
    const at = normalized.lastIndexOf('.agents/');
    return at < 0 ? null : normalized.slice(at);
  };
  // Distinct paths in first-seen order, up to the bound; a path past it flags that list as cut.
  const listPath = (list, path) => {
    if (typeof path !== 'string') return;
    const shown = projectRelative(path, project);
    if (state.observed[list].includes(shown)) return;
    if (state.observed[list].length < OBSERVED.reads) state.observed[list].push(shown);
    else state.observed.cut.add(list);
  };
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
    invoke(name) { if (safe(name)) { this.skill(name); count(state.invoked, name.replace(/^[^:]*:/u, '')); } },
    command(text) {
      const { commands } = state.observed;
      if (typeof text !== 'string') return;
      if (commands.length >= OBSERVED.commands) { state.observed.cut.add('commands'); return; }
      if (text.length > OBSERVED.commandChars) state.observed.cut.add('commands');
      commands.push(text.slice(0, OBSERVED.commandChars));
    },
    read(path, callId) {
      listPath('reads', path);
      if (typeof path === 'string' && BRIEF.test(path.replace(/\\/g, '/')) && callId) state.briefCalls.add(callId);
      const rel = relative(path);
      if (!rel) return;
      count(state.agentsReads, rel);
      state.reads.push(rel);
      if (callId) state.readCalls.set(callId, rel);
      // A read of a skill's SKILL.md is how a file-only child loads that skill.
      const skill = rel.match(/\/([^/]+)\/SKILL\.md$/u);
      if (skill) this.skill(skill[1]);
    },
    edit(path) { listPath('edits', path); const rel = relative(path); if (rel) state.edited.add(rel); },
    // The assignment: the run's prompts, its system profile (Pi) and the text of the briefs it read.
    assign(content) { const text = blockText(content); if (text) state.assigned.push(text); },
    result(callId, content) {
      if (!callId) return;
      if (state.briefCalls.has(callId)) this.assign(content);
      const rel = state.readCalls.get(callId);
      if (rel && !state.contents.has(rel)) state.contents.set(rel, blockText(content));
    },
  };
}

// Markdown link and code-span targets of a methodology file, resolved from its own directory.
function linked(rel, text) {
  const dir = rel.split('/').slice(0, -1);
  const out = new Set();
  for (const m of text.matchAll(/\]\(([^)\s#]+\.md)|`([^`\s#]+\.md)`/gu)) {
    const target = (m[1] ?? m[2]).replace(/\\/g, '/');
    const at = target.lastIndexOf('.agents/');
    const parts = at >= 0 ? target.slice(at).split('/') : [...dir, ...target.split('/')];
    const resolved = [];
    for (const part of parts) {
      if (part === '..') resolved.pop();
      else if (part && part !== '.') resolved.push(part);
    }
    out.add(resolved.join('/'));
  }
  return out;
}

// An assignment names a file by its path from `.agents/` or from its parent folder (`references/review.md`,
// `isswf-writing/SKILL.md`), whatever comes before; a skill may also be named by its bare name.
function mentions(text, rel) {
  const parts = rel.split('/');
  if (text.includes(parts.slice(1).join('/')) || text.includes(parts.slice(-2).join('/'))) return true;
  const skill = rel.match(/\/([^/]+)\/SKILL\.md$/u);
  return Boolean(skill) && new RegExp(`(^|[^\\w-])${skill[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w-])`, 'u').test(text);
}

// What the run used as methodology, not every file it opened: skills it invoked, and the `.agents/`
// skills and references its assignment named (directly, or linked from a file it named directly) and it then
// read. Without an assignment (the coordinator's own session) every `.agents/` read counts. Files the
// run itself changed are its work, never its methodology.
function methodology(state, assigned) {
  const text = state.assigned.join('\n').replace(/\\/g, '/');
  const read = new Set(state.reads);
  const named = new Set([...read].filter(rel => !assigned || mentions(text, rel)));
  // One hop only: a deeper chain soon reaches files a run opens for other reasons.
  for (const rel of [...named]) {
    for (const next of linked(rel, state.contents.get(rel) ?? '')) if (read.has(next)) named.add(next);
  }
  const usedSkills = { ...state.invoked };
  const usedReferences = {};
  const usedHostGuides = {};
  for (const rel of state.reads) {
    if (state.edited.has(rel) || !named.has(rel)) continue;
    const skill = rel.match(/\/([^/]+)\/SKILL\.md$/u);
    if (skill) usedSkills[skill[1]] = (usedSkills[skill[1]] ?? 0) + 1;
    else if (rel.startsWith('.agents/hosts/')) usedHostGuides[rel] = (usedHostGuides[rel] ?? 0) + 1;
    else usedReferences[rel] = (usedReferences[rel] ?? 0) + 1;
  }
  return { usedSkills, usedReferences, usedHostGuides };
}

/** Counts skills and `.agents/` reads in a session's own tool uses (`{ tool, input }`), as a transcript is counted. */
export function countToolUses(toolUses) {
  const collected = collector();
  for (const use of toolUses) {
    if (use?.tool === 'Skill') collected.invoke(use.input?.skill);
    if (use?.tool === 'Read') collected.read(use.input?.file_path);
    if (use?.tool === 'Edit' || use?.tool === 'Write') collected.edit(use.input?.file_path);
  }
  return { skills: collected.state.skills, agentsReads: collected.state.agentsReads, ...methodology(collected.state, false) };
}

// A mixed run is unknown because its tokens are not split by model.
function costUsd(tokens, model) {
  const rates = Object.hasOwn(PRICES.models, model) ? PRICES.models[model] : null;
  if (!rates) return UNKNOWN;
  const micro = COUNTERS.reduce((sum, key) => sum + tokens[key] * rates[key], 0);
  return Math.round(micro) / 1e6;
}

// `invalid` names the first failing check of a found transcript whose valid entries were still summed.
function finish(collected, counters, model, finished, invalid) {
  const { first, last, skills, agentsReads, observed } = collected.state;
  const usage = { found: true, finished, model, tokens: counters, durationMs: first === null ? UNKNOWN : last - first, skills, agentsReads, ...methodology(collected.state, true), costUsd: costUsd(counters, model), readPaths: observed.reads, commands: observed.commands, editedPaths: observed.edits, ...Object.fromEntries([...observed.cut].map(list => [`${list}Truncated`, true])) };
  return invalid ? { ...usage, tokensPartial: true, ...(usage.costUsd !== UNKNOWN && { costPartial: true }), reason: invalid } : usage;
}

// `claude -p` writes cost-state when it exits, and a resumed session appends after it, so only a trailing
// cost-state marks a session finished; a native agent's transcript ends on an end_turn reply. Scanning the
// full text keeps this right when an oversized transcript sums only its prefix.
function tailFinished(text, kind) {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    if (entry?.type === 'user') return false;
    if (kind === 'session' && entry?.type === 'cost-state') return true;
    if (entry?.type === 'assistant') return kind === 'session' ? false : entry.message?.stop_reason === 'end_turn';
  }
  return false;
}

// `full` is the untruncated text of an oversized transcript; only `text` is summed.
function claudeUsage(text, kind, invalid, full, project) {
  const collected = collector(project);
  // A request's top-level usage sums only its `message` iterations; server-side sub-inferences such as
  // `advisor_message` are billed as extra iterations, repeated on every entry of that request.
  const extra = new Map();
  const parsed = parseTranscript(text, { entries: 0 }, entry => {
    collected.time(entry.timestamp);
    if (entry.type === 'user') {
      const content = entry.message?.content;
      if (typeof content === 'string') collected.assign(content);
      for (const block of Array.isArray(content) ? content : []) {
        if (block?.type === 'text') collected.assign(block.text);
        if (block?.type === 'tool_result') collected.result(block.tool_use_id, block.content);
      }
      return;
    }
    if (entry.type !== 'assistant') return;
    const iterations = entry.message?.usage?.iterations;
    if (Array.isArray(iterations)) extra.set(entry.requestId, iterations.filter(i => i?.type !== 'message'));
    for (const block of Array.isArray(entry.message?.content) ? entry.message.content : []) {
      if (block?.type !== 'tool_use') continue;
      if (block.name === 'Skill') collected.invoke(block.input?.skill);
      if (block.name === 'Read') collected.read(block.input?.file_path, block.id);
      if (block.name === 'Bash' || block.name === 'PowerShell') collected.command(block.input?.command);
      if (block.name === 'Edit' || block.name === 'Write') collected.edit(block.input?.file_path);
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
  return finish(collected, counters, single(parsed.models), tailFinished(full ?? text, kind), invalid);
}

function piTranscriptUsage(text, finished, invalid, project) {
  const collected = collector(project);
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
    // pi-subagents redacts the prompt; the agent's profile and its references arrive in the system sections.
    if (record.recordType === 'message' && record.role === 'user') collected.assign(record.message?.content);
    if (record.recordType === 'message' && record.role === 'system') collected.assign(Object.values(record.message?.sections ?? {}).filter(v => typeof v === 'string').join('\n'));
    if (record.recordType === 'message' && record.role === 'toolResult') collected.result(record.message?.toolCallId, record.message?.content);
    if (record.recordType !== 'message' || record.role !== 'assistant') continue;
    let usage;
    try { usage = piUsage(record.usage); } catch {
      invalid ??= 'invalid-usage-counter';
      continue;
    }
    for (const key of COUNTERS) counters[key] += usage[key];
    collected.state.models.add(safe(record.model) ?? UNKNOWN);
    for (const block of Array.isArray(record.message?.content) ? record.message.content : []) {
      if (block?.type === 'toolCall' && block.name === 'read') collected.read(block.arguments?.path, block.id);
      if (block?.type === 'toolCall' && (block.name === 'bash' || block.name === 'powershell')) collected.command(block.arguments?.command);
      if (block?.type === 'toolCall' && (block.name === 'edit' || block.name === 'write')) collected.edit(block.arguments?.path);
    }
  }
  return finish(collected, counters, single(collected.state.models), finished, invalid);
}

async function readFile(fs, path) {
  const { size } = await fs.stat(path);
  const text = (await fs.read(path)).replace(/\r\n/g, '\n');
  if (size <= LIMITS.file) return { size, text };
  // Oversized transcripts sum only their complete lines within the first LIMITS.file UTF-16 code units.
  const kept = text.slice(0, LIMITS.file);
  return { size, text: kept.slice(0, kept.lastIndexOf('\n') + 1), full: text, invalid: 'file-size-limit' };
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
    usage = host === 'claude' ? claudeUsage(read.text, kind, read.invalid, read.full, project) : piTranscriptUsage(read.text, await piFinished(fs, located.meta), read.invalid, project);
  } catch {
    return { ...unknownUsage('unreadable-transcript'), found: true };
  }
  if (located.agent) usage = { ...usage, agent: located.agent };
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

const sumInto = (all, map) => { for (const [key, n] of Object.entries(map)) all[key] = (all[key] ?? 0) + n; };

/**
 * Combines the usage of one agent role's runs. An unresolved run (not found, unreadable) is counted
 * apart and leaves the other runs' maps intact; with none resolved the maps are undefined (unknown).
 * `noReads` is set when every resolved run used nothing.
 */
export function summarizeRuns(usages) {
  const resolved = usages.filter(u => u?.found && typeof u.usedReferences === 'object');
  const total = key => (resolved.length ? resolved.reduce((all, u) => { sumInto(all, u[key]); return all; }, {}) : undefined);
  const [skills, references, hostGuides] = [total('usedSkills'), total('usedReferences'), total('usedHostGuides')];
  const noReads = resolved.length > 0 && [skills, references, hostGuides].every(map => Object.keys(map).length === 0);
  return { skills, references, hostGuides, resolved: resolved.length, unresolved: usages.length - resolved.length, noReads };
}

// `.agents/` files and top-level `skills/` files a brief names, whatever link or code span names them.
const BRIEF_NAMES = /\.agents\/[\w./-]+\.md|(?<![\w./-])skills\/[\w./-]+\.md/gu;

/**
 * The methodology files a brief names that none of an attempt's runs read. A skill invoked through the Skill tool
 * counts as read. `partial` is set when a run is unresolved, its read or edit list was cut or its tokens are partial; with no
 * resolved run the result is undefined, as nothing can be compared.
 */
export function compareBrief(briefText, usages) {
  const resolved = usages.filter(u => u?.found && Array.isArray(u.readPaths));
  if (!resolved.length) return undefined;
  // A file the run wrote is its work, not methodology it read.
  const same = (a, b) => a === b || a.endsWith(`/${b}`) || b.endsWith(`/${a}`);
  const edited = resolved.flatMap(u => u.editedPaths ?? []);
  const read = resolved.flatMap(u => [...u.readPaths, ...Object.keys(u.agentsReads ?? {})]).filter(p => !edited.some(e => same(p, e)));
  const invoked = new Set(resolved.flatMap(u => Object.keys(u.skills ?? {})));
  const seen = path => read.some(p => p === path || p.endsWith(`/${path}`)) || invoked.has(path.match(/^(?:\.agents\/)?skills\/([^/]+)\/SKILL\.md$/u)?.[1]);
  const named = [...new Set(briefText.replace(/\\/g, '/').match(BRIEF_NAMES) ?? [])];
  return { named, unread: named.filter(path => !seen(path)), partial: resolved.length < usages.length || resolved.some(u => u.readsTruncated || u.editsTruncated || u.tokensPartial) };
}

/** The non-blocking note for a comparison with something unread, else undefined. */
export function briefNote(comparison) {
  if (!comparison?.unread.length) return undefined;
  return `brief names methodology the run never read: ${comparison.unread.join(', ')}${comparison.partial ? ' (run data incomplete)' : ''}`;
}

/** The note for an attempt record's text and the text of the brief it cites; `options` are those of resolveRunUsage. */
export async function attemptBriefNote(recordText, briefText, options) {
  const usages = [];
  for (const run of recordText.split('\n').map(parseRunLine).filter(Boolean)) usages.push(await resolveRunUsage(run, options));
  return briefNote(compareBrief(briefText, usages));
}

/** A run's role: the record's role, else the agent name the host gave the run (`names` holds Claude's, by run id), else unknown. */
export function fallbackRole(role, run, usage, names) {
  return role !== UNKNOWN ? role : roleOfAgent(names?.[run.id]) ?? roleOfAgent(usage?.agent) ?? UNKNOWN;
}
