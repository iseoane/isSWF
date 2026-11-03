import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeProject, ISSUE_URL, LIMITS, parseArgs, parseTranscript, readSession } from '../tools/token-native-claude-transcript.mjs';
import { report } from '../tools/token-report.mjs';

const tool = fileURLToPath(new URL('../tools/token-native-claude-transcript.mjs', import.meta.url));
const SESSION = '11111111-2222-4333-8444-555555555555';
const SECRET = 'SECRET-PROMPT-TEXT';
const usage = (input, output, cacheRead, cacheWrite) => ({ input_tokens: input, output_tokens: output, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: cacheWrite, service_tier: 'standard' });
const assistant = (requestId, counters, extra = {}) => JSON.stringify({ type: 'assistant', requestId, sessionId: SESSION, version: '2.1.312', effort: 'high', isSidechain: false, timestamp: '2026-11-03T00:00:00Z', message: { model: 'claude-opus-5-5', content: [{ type: 'text', text: SECRET }], usage: counters }, ...extra });
const user = JSON.stringify({ type: 'user', version: '2.1.312', message: { content: SECRET } });

assert.equal(encodeProject('/home/a/Work/isSWF'), '-home-a-Work-isSWF');
assert.equal(encodeProject('C:\\Users\\a\\Work\\is_SWF'), 'C--Users-a-Work-is-SWF');
assert.equal(parseArgs(['--claude-dir', '/x'], {}).claudeDir.endsWith('x'), true);
assert.match(parseArgs([], { CLAUDE_CONFIG_DIR: '/cfg' }).claudeDir, /cfg$/u);
assert.throws(() => parseArgs(['--bogus', '1']), /invalid transcript option/u);
assert.throws(() => parseArgs(['--accepted', '-1']), /invalid transcript option/u);

// Duplicated requestId lines count once; synthetic and non-assistant lines are ignored; trailing partial line tolerated.
const parsed = parseTranscript([user, assistant('r1', usage(10, 2, 100, 5)), assistant('r1', usage(10, 2, 100, 5)), assistant('r2', usage(1, 1, 1, 1)), JSON.stringify({ type: 'assistant', message: { model: '<synthetic>' } }), '{"type":"assist'].join('\n'));
assert.equal(parsed.requests.size, 2);
assert.equal(parsed.trailingIncomplete, true);
for (const [bad, check] of [[[assistant('r1', usage(1, 1, 1, 1)), assistant('r1', usage(2, 1, 1, 1)), ''], 'conflicting-duplicate-request'], [['{bad', user, ''], 'malformed-line'], [[JSON.stringify({ type: 'assistant', requestId: 'x', message: { model: 'm' } }), ''], 'missing-usage'], [[assistant('r1', { input_tokens: 1 }), ''], 'invalid-usage-counter'], [[JSON.stringify({ type: 'assistant', message: { model: 'm', usage: usage(1, 1, 1, 1) } }), ''], 'missing-request-id']]) {
  assert.throws(() => parseTranscript(bad.join('\n')), error => error.message === check && !error.message.includes(SECRET));
}
assert.throws(() => parseTranscript('x'.repeat(4 * 1024 * 1024 + 1) + '\n'), /line-size-limit/u);
assert.throws(() => parseTranscript('é'.repeat(2 * 1024 * 1024 + 1) + '\n'), /line-size-limit/u, 'line limit is measured in bytes');
assert.throws(() => parseTranscript([user, user, ''].join('\n'), { entries: 0, maxEntries: 1 }), /entry-limit/u);

const root = await mkdtemp(join(tmpdir(), 'isswf-transcript-'));
try {
  const project = join(root, 'work', 'proj');
  const dir = join(root, 'claude', 'projects', encodeProject(project));
  const sub = join(dir, SESSION, 'subagents');
  await mkdir(sub, { recursive: true });
  await writeFile(join(dir, `${SESSION}.jsonl`), [user, assistant('p1', usage(10, 2, 100, 5)), assistant('p1', usage(10, 2, 100, 5)), assistant('p2', usage(3, 4, 0, 0)), ''].join('\n'));
  await writeFile(join(sub, 'agent-aaa.jsonl'), [assistant('a1', usage(7, 1, 50, 2), { isSidechain: true }), assistant('p2', usage(3, 4, 0, 0)), ''].join('\n'));
  await writeFile(join(sub, 'agent-aaa.meta.json'), JSON.stringify({ agentType: 'isswf-worker', description: SECRET }));
  await writeFile(join(sub, 'agent-bbb.jsonl'), ['{broken', assistant('b1', usage(1, 1, 1, 1)), ''].join('\n'));
  const claudeDir = join(root, 'claude');

  const { summary, coverage } = await readSession({ claudeDir, project });
  const text = JSON.stringify({ summary, coverage });
  assert.doesNotMatch(text, new RegExp(`${SECRET}|${SESSION}|proj|aaa`, 'u'));
  assert.equal(summary.rows.length, 3);
  const parent = summary.rows.find(row => row.id === 'parent');
  assert.deepEqual(parent.counters, { input: 13, output: 6, cacheRead: 100, cacheWrite: 5 });
  assert.equal(parent.requests, 2);
  assert.equal(parent.scope, 'unattributed');
  assert.equal(parent.model, 'claude-opus-5-5');
  assert.equal(parent.hostVersion, '2.1.312');
  const agents = summary.rows.filter(row => row.scope === 'agent');
  const good = agents.find(row => row.requests === 1);
  assert.deepEqual(good.counters, { input: 7, output: 1, cacheRead: 50, cacheWrite: 2 }, 'cross-file duplicate counted once');
  assert.ok(agents.some(row => row.counters.input === null), 'invalid file yields an all-null row');
  assert.equal(coverage.filesPresent, 3);
  assert.equal(coverage.filesParsed, 2);
  assert.equal(coverage.filesInvalid, 1);
  assert.equal(coverage.crossFileDuplicates, 1);
  assert.deepEqual(coverage.invalid.map(item => item.check), ['malformed-line']);
  assert.ok(coverage.agents.some(item => item.agentType === 'isswf-worker'));
  assert.ok(coverage.recommendation.includes(ISSUE_URL));

  const rendered = report(summary);
  assert.equal(rendered.totals.totalStatus, 'partial-subtotal');
  assert.equal(rendered.totals.attribution, 'partial');

  // Repair the invalid file: report becomes complete and the total is the deduplicated sum.
  await writeFile(join(sub, 'agent-bbb.jsonl'), assistant('b1', usage(1, 1, 1, 1)) + '\n');
  const clean = await readSession({ claudeDir, project, session: SESSION });
  assert.equal(clean.coverage.recommendation, undefined);
  assert.equal(report(clean.summary).totals.attribution, 'partial');
  assert.equal(report(clean.summary).totals.totalStatus, 'complete');
  assert.ok(rendered.totals && coverage.recommendation.includes('2.1.312') && coverage.recommendation.includes('isswf-issue'));

  // Size, entry and subagent limits.
  const limited = async (overrides) => readSession({ claudeDir, project, limits: { ...LIMITS, ...overrides } });
  const fileLimit = await limited({ file: 10 });
  assert.ok(fileLimit.coverage.invalid.every(item => item.check === 'file-size-limit') && fileLimit.coverage.filesInvalid === 3);
  assert.equal(fileLimit.coverage.recommendation, undefined, 'size limits are not a format issue');
  const totalLimit = await limited({ total: 400 });
  assert.ok(totalLimit.coverage.invalid.some(item => item.check === 'total-size-limit'));
  const entryLimit = await limited({ entries: 2 });
  assert.ok(entryLimit.coverage.invalid.some(item => item.check === 'entry-limit'));
  await assert.rejects(limited({ subagents: 1 }), /subagent limit exceeded/u);

  // Cross-file conflicting counters for one requestId invalidate the later file.
  await writeFile(join(sub, 'agent-bbb.jsonl'), assistant('p1', usage(99, 2, 100, 5)) + '\n');
  const conflict = await readSession({ claudeDir, project });
  assert.deepEqual(conflict.coverage.invalid, [{ row: conflict.summary.rows.find(row => row.counters.input === null).id, check: 'cross-file-conflicting-request' }]);
  assert.ok(conflict.coverage.recommendation.includes(ISSUE_URL));
  assert.equal(report(clean.summary).totals.processed, 13 + 6 + 100 + 5 + 7 + 1 + 50 + 2 + 4);

  // Unknown version is reported with an issue recommendation, counters still produced.
  await writeFile(join(sub, 'agent-bbb.jsonl'), assistant('b1', usage(1, 1, 1, 1), { version: '9.0.0' }) + '\n');
  const unknown = await readSession({ claudeDir, project });
  assert.equal(unknown.coverage.versionRecognized, false);
  assert.ok(unknown.coverage.recommendation.includes(ISSUE_URL));

  await assert.rejects(readSession({ claudeDir, project, session: '../x' }), /invalid session id/u);
  await assert.rejects(readSession({ claudeDir, project, session: '99999999-2222-4333-8444-555555555555' }), /Claude session transcript not found/u);
  await assert.rejects(readSession({ claudeDir, project: join(root, 'other'), session: SESSION }), /Claude session transcript not found/u);
  const empty = join(root, 'claude', 'projects', encodeProject(join(root, 'empty')));
  await mkdir(empty, { recursive: true });
  await assert.rejects(readSession({ claudeDir, project: join(root, 'empty') }), /no Claude session transcript for project/u, 'latest-session selection fails without transcripts');
  // Version recorded from an invalid parent file.
  const lone = join(root, 'lone');
  const loneDir = join(root, 'claude', 'projects', encodeProject(lone));
  await mkdir(loneDir, { recursive: true });
  await writeFile(join(loneDir, `${SESSION}.jsonl`), [JSON.stringify({ type: 'user', version: '2.1.400' }), '{bad', user, ''].join('\n'));
  const loneResult = await readSession({ claudeDir, project: lone });
  assert.deepEqual(loneResult.coverage.versions, ['2.1.400']);
  assert.ok(loneResult.coverage.recommendation.includes('2.1.400'));
  await assert.rejects(readSession({ claudeDir, project: join(root, 'none') }), /no Claude session transcript for project/u);

  // CLI: summary on stdout, counts-only coverage on stderr, fixed messages on error.
  const out = execFileSync(process.execPath, [tool, '--claude-dir', claudeDir, '--project', project], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.throws(() => execFileSync(process.execPath, [tool, '--claude-dir', claudeDir, '--project', project, '--session', '99999999-2222-4333-8444-555555555555'], { stdio: 'pipe' }), error => error.status === 1 && String(error.stderr).trim() === 'Claude session transcript not found');
  assert.equal(JSON.parse(out).mode, 'window');
  assert.throws(() => execFileSync(process.execPath, [tool, '--claude-dir', claudeDir, '--project', project, '--session', 'nope'], { stdio: 'pipe' }), error => String(error.stderr).trim() === 'invalid session id');
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log(JSON.stringify({ status: 'PASS' }));
