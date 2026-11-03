#!/usr/bin/env node
// Reads Claude Code's local session transcripts and emits a token-report `window` summary.
// The transcript format is undocumented: only numeric usage counters and bounded identifiers are kept.
import { createHash } from 'node:crypto';
import { lstat, open, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ISSUE_URL = 'https://github.com/iseoane/isSWF/issues';
const MAX_FILE = 64 * 1024 * 1024, MAX_TOTAL = 256 * 1024 * 1024, MAX_LINE = 4 * 1024 * 1024, MAX_ENTRIES = 200_000, MAX_SUBAGENTS = 99;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
const AGENT_FILE = /^agent-([A-Za-z0-9_-]{1,128})\.jsonl$/u;
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/u;
const RECOGNISED_VERSION = /^2\.1\.\d+$/u;
const USAGE_KEYS = [['input', 'input_tokens'], ['output', 'output_tokens'], ['cacheRead', 'cache_read_input_tokens'], ['cacheWrite', 'cache_creation_input_tokens']];
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
const safe = value => typeof value === 'string' && SAFE.test(value) ? value : null;
const integer = value => Number.isSafeInteger(value) && value >= 0;

class FormatError extends Error {}
const fail = check => { throw new FormatError(check); };

/** Claude stores each project under its absolute path with every non-alphanumeric character replaced by '-'. */
export function encodeProject(projectPath) {
  return projectPath.replace(/[^A-Za-z0-9]/gu, '-');
}

async function readBounded(path, budget) {
  const info = await lstat(path);
  if (!info.isFile()) fail('not-regular-file');
  if (info.size > MAX_FILE) fail('file-size-limit');
  if (info.size > budget.remaining) fail('total-size-limit');
  budget.remaining -= info.size;
  const handle = await open(path, 'r');
  try { return (await handle.readFile()).toString('utf8'); } finally { await handle.close(); }
}

/** Parses one transcript into per-request usage. Throws FormatError carrying a fixed check name only. */
export function parseTranscript(content, budget = { entries: 0 }) {
  const lines = content.split('\n');
  const trailing = lines.pop();
  const requests = new Map(), models = new Set(), efforts = new Set(), versions = new Set();
  let trailingIncomplete = false;
  const handle = (line, last) => {
    if (line.length === 0) return;
    if (line.length > MAX_LINE) fail('line-size-limit');
    if (++budget.entries > MAX_ENTRIES) fail('entry-limit');
    let entry;
    try { entry = JSON.parse(line); } catch {
      if (last) { trailingIncomplete = true; return; }
      fail('malformed-line');
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('entry-not-object');
    if (typeof entry.version === 'string') versions.add(entry.version);
    if (entry.type !== 'assistant') return;
    const message = entry.message;
    if (!message || typeof message !== 'object' || Array.isArray(message)) fail('missing-message');
    if (message.model === '<synthetic>') return;
    const usage = message.usage;
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) fail('missing-usage');
    if (typeof entry.requestId !== 'string' || entry.requestId.length === 0 || entry.requestId.length > 256) fail('missing-request-id');
    const counters = {};
    for (const [target, source] of USAGE_KEYS) {
      if (!integer(usage[source])) fail('invalid-usage-counter');
      counters[target] = usage[source];
    }
    const previous = requests.get(entry.requestId);
    if (previous && USAGE_KEYS.some(([key]) => previous[key] !== counters[key])) fail('conflicting-duplicate-request');
    requests.set(entry.requestId, counters);
    models.add(safe(message.model) ?? 'unknown');
    efforts.add(safe(entry.effort) ?? 'unknown');
  };
  for (const line of lines) handle(line, false);
  if (trailing !== undefined) handle(trailing, true);
  return { requests, models, efforts, versions, trailingIncomplete };
}

const single = values => values.size === 1 ? [...values][0] : values.size === 0 ? 'unknown' : 'mixed';

async function latestSession(dir) {
  let best = null, names;
  try { names = await readdir(dir); } catch { throw Error('no Claude session transcript for project'); }
  for (const name of names) {
    if (!name.endsWith('.jsonl') || !UUID.test(name.slice(0, -6))) continue;
    const info = await stat(join(dir, name));
    if (info.isFile() && (!best || info.mtimeMs > best.mtime)) best = { id: name.slice(0, -6), mtime: info.mtimeMs };
  }
  if (!best) throw Error('no Claude session transcript for project');
  return best.id;
}

async function agentTypeOf(path) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.size > 64 * 1024) return null;
    const handle = await open(path, 'r');
    try { return safe(JSON.parse((await handle.readFile()).toString('utf8'))?.agentType); } finally { await handle.close(); }
  } catch { return null; }
}

/** Builds the token-report summary and a counts-only coverage record for one session. */
export async function readSession({ claudeDir, project, session = 'latest', taskClass = 'unknown', candidate = 'unknown', outcome = 'unknown', accepted = 0 }) {
  const dir = join(claudeDir, 'projects', encodeProject(project));
  const sessionId = session === 'latest' ? await latestSession(dir) : session;
  if (!UUID.test(sessionId)) throw Error('invalid session id');
  const files = [{ id: 'parent', scope: 'unattributed', path: join(dir, `${sessionId}.jsonl`) }];
  const subDir = join(dir, sessionId, 'subagents');
  let names = [];
  try { names = (await readdir(subDir)).filter(name => AGENT_FILE.test(name)).sort(); } catch (error) { if (error.code !== 'ENOENT') throw Error('unable to list subagent transcripts'); }
  if (names.length > MAX_SUBAGENTS) throw Error('subagent limit exceeded');
  for (const name of names) files.push({ id: `agent-${hash(AGENT_FILE.exec(name)[1])}`, scope: 'agent', path: join(subDir, name), meta: join(subDir, name.replace(/\.jsonl$/u, '.meta.json')) });

  const budget = { remaining: MAX_TOTAL, entries: 0 };
  const seen = new Set(), window = `claude-${hash(sessionId)}`, versions = new Set();
  const coverage = { session: hash(sessionId), filesPresent: files.length, filesParsed: 0, filesInvalid: 0, invalid: [], crossFileDuplicates: 0, trailingIncomplete: 0, requests: 0, versionRecognized: false, versions: [], agents: [] };
  const rows = [];
  for (const file of files) {
    const base = { id: file.id, host: 'claude', taskClass, candidate, outcome, provenance: 'native-claude-summary', scope: file.scope, accepted, window };
    let parsed;
    try { parsed = parseTranscript(await readBounded(file.path, budget), budget); } catch (error) {
      const check = error instanceof FormatError ? error.message : error.code === 'ENOENT' ? 'file-missing' : 'unreadable-file';
      coverage.filesInvalid++;
      coverage.invalid.push({ row: file.id, check });
      rows.push({ ...base, hostVersion: 'unknown', model: 'unknown', effort: 'unknown', counters: { input: null, output: null, cacheRead: null, cacheWrite: null }, requests: null });
      continue;
    }
    coverage.filesParsed++;
    if (parsed.trailingIncomplete) coverage.trailingIncomplete++;
    const counters = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    let requests = 0;
    for (const [requestId, usage] of parsed.requests) {
      if (seen.has(requestId)) { coverage.crossFileDuplicates++; continue; }
      seen.add(requestId);
      requests++;
      for (const key of Object.keys(counters)) counters[key] += usage[key];
    }
    coverage.requests += requests;
    for (const version of parsed.versions) versions.add(version);
    const fileVersion = single(new Set([...parsed.versions].map(version => safe(version) ?? 'unknown')));
    if (file.meta) coverage.agents.push({ row: file.id, agentType: await agentTypeOf(file.meta) ?? 'unknown' });
    rows.push({ ...base, hostVersion: fileVersion, model: single(parsed.models), effort: single(parsed.efforts), counters, requests });
  }
  coverage.versionRecognized = versions.size > 0 && [...versions].every(version => RECOGNISED_VERSION.test(version));
  coverage.versions = [...versions].map(version => safe(version) ?? 'unknown').sort();
  if (coverage.filesInvalid > 0 || !coverage.versionRecognized) coverage.recommendation = `Transcript format not fully recognised; please open an issue at ${ISSUE_URL} with the Claude Code version and failing check names only.`;
  return { summary: { version: 1, mode: 'window', rows }, coverage };
}

export function parseArgs(argv, env = process.env) {
  const options = {};
  const names = { '--project': 'project', '--session': 'session', '--claude-dir': 'claudeDir', '--task-class': 'taskClass', '--candidate': 'candidate', '--outcome': 'outcome', '--accepted': 'accepted' };
  for (let index = 0; index < argv.length; index += 2) {
    const key = names[argv[index]];
    if (!key || argv[index + 1] === undefined || Object.hasOwn(options, key)) throw Error('invalid transcript option');
    options[key] = argv[index + 1];
  }
  for (const key of ['taskClass', 'candidate', 'outcome']) if (Object.hasOwn(options, key) && !SAFE.test(options[key])) throw Error('invalid transcript option');
  if (Object.hasOwn(options, 'accepted')) {
    if (!/^\d{1,9}$/u.test(options.accepted)) throw Error('invalid transcript option');
    options.accepted = Number(options.accepted);
  }
  options.project = resolve(options.project ?? process.cwd());
  options.claudeDir = resolve(options.claudeDir ?? env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'));
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const known = ['invalid transcript option', 'invalid session id', 'no Claude session transcript for project', 'subagent limit exceeded', 'unable to list subagent transcripts'];
  try {
    const { summary, coverage } = await readSession(parseArgs(process.argv.slice(2)));
    console.error(JSON.stringify({ coverage }));
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(known.includes(error.message) ? error.message : 'unable to read Claude transcripts');
    process.exitCode = 1;
  }
}
