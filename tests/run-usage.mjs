import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const tool = join(source, 'tools/isswf-snapshot.mjs');
const { nodeFs } = await import(pathToFileURL(tool).href);
const { LIMITS } = await import(pathToFileURL(join(source, 'tools/token-native-transcript-core.mjs')).href);
const { resolveRunUsage } = await import(pathToFileURL(join(source, 'tools/isswf-run-usage-core.mjs')).href);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-run-usage-test-')));

const SESSION = '11111111-2222-4333-8444-555555555555';
const OPEN_SESSION = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const RESUMED_SESSION = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
const jsonl = entries => entries.map(e => JSON.stringify(e)).join('\n') + '\n';
const claudeUsage = (input, output, read, write) => ({ input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: write });
const assistant = (requestId, timestamp, usage, content, stop = 'tool_use', model = 'claude-test-1') => ({ type: 'assistant', requestId, timestamp, version: '2.1.300', message: { model, usage, content, stop_reason: stop } });
const user = timestamp => ({ type: 'user', timestamp, message: { role: 'user', content: 'go' } });

// Synthetic Claude agent: Skill tool, .agents reads (POSIX and Windows separators), a repeated request id.
const agentTranscript = jsonl([
  user('2026-01-01T00:00:00.000Z'),
  assistant('req_a1', '2026-01-01T00:00:01.000Z', claudeUsage(10, 20, 30, 40), [{ type: 'tool_use', name: 'Skill', input: { skill: 'isswf:isswf-review' } }, { type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/roles/worker.md' } }]),
  assistant('req_a1', '2026-01-01T00:00:01.500Z', claudeUsage(10, 20, 30, 40), [{ type: 'tool_use', name: 'Read', input: { file_path: 'C:\\repo\\.agents\\skills\\isswf-tdd\\SKILL.md' } }]),
  user('2026-01-01T00:00:02.000Z'),
  assistant('req_a2', '2026-01-01T00:00:05.000Z', claudeUsage(1, 2, 3, 4), [{ type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/roles/worker.md' } }, { type: 'tool_use', name: 'Read', input: { file_path: '/repo/README.md' } }, { type: 'text', text: 'done' }], 'end_turn'),
]);
const sessionTranscript = jsonl([
  user('2026-01-02T00:00:00.000Z'),
  { ...assistant('req_s1', '2026-01-02T00:00:10.000Z', claudeUsage(5, 6, 7, 8), [{ type: 'text', text: 'ok' }], 'end_turn'), message: { model: 'claude-test-1', stop_reason: 'end_turn', content: [], usage: { ...claudeUsage(5, 6, 7, 8), iterations: [{ type: 'message', ...claudeUsage(5, 6, 7, 8) }, { type: 'advisor_message', model: 'claude-advisor-1', ...claudeUsage(100, 50, 0, 0) }] } } },
  { type: 'cost-state', sessionId: SESSION, totalDuration: 1 },
]);
const openSession = jsonl([user('2026-01-03T00:00:00.000Z'), assistant('req_o1', '2026-01-03T00:00:02.000Z', claudeUsage(1, 1, 1, 1), [], 'end_turn')]);
const piRecord = (ts, usage, content) => ({ recordType: 'message', role: 'assistant', ts, model: 'pi-test-1', usage, message: { role: 'assistant', content } });
const piTranscript = jsonl([
  { recordType: 'message', role: 'user', ts: 1000 },
  piRecord(2000, { input: 100, output: 10, cacheRead: 50, cacheWrite: 5, cost: 0.1 }, [{ type: 'toolCall', name: 'read', arguments: { path: '/repo/.agents/skills/isswf-debug/SKILL.md' } }]),
  { recordType: 'tool_start', ts: 2500 },
  piRecord(4000, { input: 1, output: 2, cacheRead: 3, cacheWrite: 4 }, [{ type: 'text', text: 'done' }]),
]) + '{"recordType":"mess';

const record = runs => `# Attempt\n\n- Brief: I0001/jobs/J001/brief-r1.md\n${runs.map(r => `- Run: ${r}\n`).join('')}`;
const fixture = {
  'project/.factory/initiatives/I0001/plan.md': '# I0001: Usage\n\nType: enhancement\n\n## J001\n\n- Status: in-progress\n- Objective: Use.\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: Continue.\n\n### Acceptance\n\n- Works.\n\n### Evidence\n\n- None.\n',
  'project/.factory/initiatives/I0001/jobs/J001/brief-r1.md': '# Brief\n',
  'project/.factory/initiatives/I0001/jobs/J001/A001.md': record(['claude agent=a1b2c3', `claude session=${SESSION}`, 'pi child=run-pi-1']),
  'project/.factory/initiatives/I0001/jobs/J001/V001.md': record(['claude agent=missing99', 'pi child=run-pi-open', 'claude agent=broken1', 'claude agent=../escape']),
  'claude/projects/-p/9d9d/subagents/agent-a1b2c3.jsonl': agentTranscript,
  'claude/projects/-p/9d9d/subagents/agent-broken1.jsonl': `${jsonl([user('2026-01-01T00:00:00.000Z')])}not json\n${jsonl([assistant('req_b1', '2026-01-01T00:00:01.000Z', claudeUsage(1, 2, 3, 4), [], 'end_turn')])}`,
  [`claude/projects/-other/${SESSION}.jsonl`]: sessionTranscript,
  [`claude/projects/-other/${OPEN_SESSION}.jsonl`]: openSession,
  // A resumed `claude -p` session appends after the cost-state of its first exit.
  [`claude/projects/-other/${RESUMED_SESSION}.jsonl`]: sessionTranscript + openSession,
  'pi/sessions/--p--/subagent-artifacts/run-pi-1_isswf-worker_transcript.jsonl': piTranscript,
  'pi/sessions/--p--/subagent-artifacts/run-pi-1_isswf-worker_meta.json': JSON.stringify({ runId: 'run-pi-1', exitCode: 0 }),
  'project/.pi/subagents/artifacts/run-pi-open_isswf-worker_transcript.jsonl': jsonl([piRecord(1, { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 }, [])]),
};

try {
  for (const [path, text] of Object.entries(fixture)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  const project = join(root, 'project');
  const env = { ...process.env, CLAUDE_CONFIG_DIR: join(root, 'claude'), PI_CODING_AGENT_DIR: join(root, 'pi') };
  const cli = args => spawnSync(process.execPath, [tool, ...args], { encoding: 'utf8', timeout: 15000, env });

  const plain = cli(['--project', project]);
  assert.equal(plain.status, 0, plain.stderr);
  assert.ok(JSON.parse(plain.stdout).initiatives[0].jobs[0].rounds[0].entries.every(e => e.runs.every(r => !('usage' in r))), 'plain snapshot stays cheap');
  assert.equal(cli(['--project', project, '--other']).status, 2);

  const printed = cli(['--project', project, '--usage']);
  assert.equal(printed.status, 0, printed.stderr);
  const [attempt, review] = JSON.parse(printed.stdout).initiatives[0].jobs[0].rounds[0].entries;
  const [agent, session, pi] = attempt.runs.map(r => r.usage);
  assert.deepEqual(agent, {
    found: true, finished: true, model: 'claude-test-1',
    tokens: { input: 11, output: 22, cacheRead: 33, cacheWrite: 44 }, durationMs: 5000,
    skills: { 'isswf-review': 1, 'isswf-tdd': 1 },
    agentsReads: { '.agents/roles/worker.md': 2, '.agents/skills/isswf-tdd/SKILL.md': 1 }, costUsd: 'unknown',
  });
  // The advisor iteration is billed on top of the request's top-level usage.
  assert.deepEqual(session, { found: true, finished: true, model: 'mixed', tokens: { input: 105, output: 56, cacheRead: 7, cacheWrite: 8 }, durationMs: 10000, skills: {}, agentsReads: {}, costUsd: 'unknown' });
  assert.deepEqual(pi, {
    found: true, finished: true, model: 'pi-test-1',
    tokens: { input: 101, output: 12, cacheRead: 53, cacheWrite: 9 }, durationMs: 3000,
    skills: { 'isswf-debug': 1 }, agentsReads: { '.agents/skills/isswf-debug/SKILL.md': 1 }, costUsd: 'unknown',
  });
  const [missing, openPi, broken, escape] = review.runs.map(r => r.usage);
  const unknown = { finished: 'unknown', model: 'unknown', tokens: 'unknown', durationMs: 'unknown', skills: 'unknown', agentsReads: 'unknown', costUsd: 'unknown' };
  assert.deepEqual(missing, { found: false, reason: 'transcript-not-found', ...unknown });
  // Valid entries of a found transcript are still summed and the result is marked partial.
  assert.deepEqual(broken, {
    found: true, finished: true, model: 'claude-test-1', tokens: { input: 1, output: 2, cacheRead: 3, cacheWrite: 4 },
    durationMs: 1000, skills: {}, agentsReads: {}, costUsd: 'unknown', tokensPartial: true, reason: 'malformed-line',
  });
  assert.deepEqual(escape, { found: false, reason: 'invalid-id', ...unknown });
  assert.equal(openPi.finished, false, 'a Pi child without its meta file is unfinished');
  assert.deepEqual(openPi.tokens, { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 });

  // Cache: a finished run is read once while its size is unchanged; unfinished runs are re-read.
  const reads = [];
  const counting = { ...nodeFs, read: path => { reads.push(path); return nodeFs.read(path); } };
  const options = { fs: counting, claudeDir: env.CLAUDE_CONFIG_DIR, piDir: env.PI_CODING_AGENT_DIR, project, cache: new Map() };
  const agentPath = join(root, 'claude/projects/-p/9d9d/subagents/agent-a1b2c3.jsonl');
  const openPath = join(root, `claude/projects/-other/${OPEN_SESSION}.jsonl`);
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await resolveRunUsage({ host: 'claude', kind: 'agent', id: 'a1b2c3' }, options), agent);
    assert.equal((await resolveRunUsage({ host: 'claude', kind: 'session', id: OPEN_SESSION }, options)).finished, false);
  }
  assert.equal(reads.filter(p => p === agentPath).length, 1, 'finished run is cached');
  assert.equal(reads.filter(p => p === openPath).length, 2, 'unfinished run is not cached');
  assert.deepEqual([...options.cache.keys()], ['claude agent a1b2c3']);
  // A same-ID continuation appends to a finished transcript; the size change invalidates the entry.
  await writeFile(agentPath, agentTranscript + jsonl([user('2026-01-01T00:01:00.000Z')]));
  assert.equal((await resolveRunUsage({ host: 'claude', kind: 'agent', id: 'a1b2c3' }, options)).finished, false);
  assert.equal(reads.filter(p => p === agentPath).length, 2);
  assert.equal((await resolveRunUsage({ host: 'claude', kind: 'session', id: RESUMED_SESSION }, options)).finished, false, 'a resumed session is running again');
  // An oversized finished session: tokens come from the truncated prefix, `finished` from the full tail.
  const sessionPath = join(root, `claude/projects/-other/${SESSION}.jsonl`);
  const [head, tail] = [sessionTranscript.split('\n').slice(0, 2).join('\n'), sessionTranscript.split('\n').slice(2).join('\n')];
  const oversized = `${head}\n${' '.repeat(LIMITS.file)}\n${tail}`;
  const bigReads = [];
  const big = {
    ...nodeFs,
    stat: async path => path === sessionPath ? { ...(await nodeFs.stat(path)), size: oversized.length } : nodeFs.stat(path),
    read: async path => { bigReads.push(path); return path === sessionPath ? oversized : nodeFs.read(path); },
  };
  const bigOptions = { ...options, fs: big, cache: new Map() };
  for (let i = 0; i < 2; i++) {
    const usage = await resolveRunUsage({ host: 'claude', kind: 'session', id: SESSION }, bigOptions);
    assert.equal(usage.finished, true, 'an oversized finished session is finished');
    assert.equal(usage.tokensPartial, true);
    assert.equal(usage.reason, 'file-size-limit');
  }
  assert.equal(bigReads.filter(p => p === sessionPath).length, 1, 'an oversized finished session is cached');
  // Cost: an exact priced model, and a partial run whose cost covers only its valid entries.
  const million = claudeUsage(1e6, 1e6, 1e6, 1e6);
  await writeFile(join(root, 'claude/projects/-p/9d9d/subagents/agent-priced1.jsonl'), jsonl([assistant('req_p1', '2026-01-01T00:00:01.000Z', million, [], 'end_turn', 'claude-opus-5-5')]));
  await writeFile(join(root, 'claude/projects/-p/9d9d/subagents/agent-priced2.jsonl'), `not json\n${jsonl([assistant('req_p2', '2026-01-01T00:00:01.000Z', million, [], 'end_turn', 'claude-haiku-4-5')])}`);
  const priced = await resolveRunUsage({ host: 'claude', kind: 'agent', id: 'priced1' }, options);
  assert.equal(priced.costUsd, 29.2);
  assert.equal('costPartial' in priced, false);
  const partial = await resolveRunUsage({ host: 'claude', kind: 'agent', id: 'priced2' }, options);
  assert.deepEqual([partial.costUsd, partial.costPartial, partial.tokensPartial], [7.35, true, true]);
  console.log('run usage tests passed');
} finally {
  await rm(root, { recursive: true, force: true });
}

// The coordinator's own tool uses count as a transcript does: plugin prefix dropped, `.agents/` reads relative.
{
  const { countToolUses } = await import(pathToFileURL(join(source, 'tools/isswf-run-usage-core.mjs')).href);
  assert.deepEqual(countToolUses([
    { tool: 'Skill', input: { skill: 'isswf:isswf-review' } },
    { tool: 'Read', input: { file_path: 'C:\\p\\.agents\\skills\\isswf-tdd\\SKILL.md' } },
    { tool: 'Read', input: { file_path: '/p/README.md' } },
    { tool: 'Bash', input: { command: 'cat .agents/roles/worker.md' } },
  ]), { skills: { 'isswf-review': 1, 'isswf-tdd': 1 }, agentsReads: { '.agents/skills/isswf-tdd/SKILL.md': 1 } });
}
