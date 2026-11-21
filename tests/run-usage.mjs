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
const user = (timestamp, content = 'go') => ({ type: 'user', timestamp, message: { role: 'user', content } });

// Synthetic Claude agent: Skill tool, .agents reads (POSIX and Windows separators), a repeated request id.
// The prompt names worker.md by a Windows path; the brief names design-principles.md from its parent folder,
// review.md, and isswf-tdd by its bare name. review.md, though assigned, is edited by the run, so it is not used.
const agentTranscript = jsonl([
  user('2026-01-01T00:00:00.000Z', 'Apply C:\\repo\\.agents\\roles\\worker.md and read the brief.'),
  assistant('req_a0', '2026-01-01T00:00:00.500Z', claudeUsage(0, 0, 0, 0), [{ type: 'tool_use', id: 'b1', name: 'Read', input: { file_path: '/repo/.factory/initiatives/I0001/jobs/J001/brief-r1.md' } }, { type: 'tool_use', id: 'b2', name: 'Read', input: { file_path: '/repo/.agents/roles/references/review.md' } }, { type: 'tool_use', name: 'Edit', input: { file_path: '/repo/.agents/roles/references/review.md' } }, { type: 'tool_use', id: 'b3', name: 'Read', input: { file_path: '/repo/.agents/roles/references/design-principles.md' } }]),
  user('2026-01-01T00:00:00.700Z', [{ type: 'tool_result', tool_use_id: 'b1', content: 'Use references/design-principles.md, roles/references/review.md and the isswf-tdd skill.' }]),
  // worker.md links execution-principles.md (one hop, used), which links the coordinator skill (two hops, not used).
  assistant('req_a0b', '2026-01-01T00:00:00.800Z', claudeUsage(0, 0, 0, 0), [{ type: 'tool_use', id: 'w1', name: 'Read', input: { file_path: '/repo/.agents/roles/worker.md' } }, { type: 'tool_use', id: 'e1', name: 'Read', input: { file_path: '/repo/.agents/roles/references/execution-principles.md' } }, { type: 'tool_use', id: 'c1', name: 'Read', input: { file_path: '/repo/.agents/skills/isswf-coordinator/SKILL.md' } }]),
  user('2026-01-01T00:00:00.900Z', [{ type: 'tool_result', tool_use_id: 'w1', content: 'See [execution](references/execution-principles.md#retries).' }, { type: 'tool_result', tool_use_id: 'e1', content: 'See [triggers](../../skills/isswf-coordinator/SKILL.md).' }]),
  assistant('req_a1', '2026-01-01T00:00:01.000Z', claudeUsage(10, 20, 30, 40), [{ type: 'tool_use', name: 'Skill', input: { skill: 'isswf:isswf-review' } }, { type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/roles/worker.md' } }]),
  assistant('req_a1', '2026-01-01T00:00:01.500Z', claudeUsage(10, 20, 30, 40), [{ type: 'tool_use', name: 'Read', input: { file_path: 'C:\\repo\\.agents\\skills\\isswf-tdd\\SKILL.md' } }]),
  user('2026-01-01T00:00:02.000Z'),
  assistant('req_a2', '2026-01-01T00:00:05.000Z', claudeUsage(1, 2, 3, 4), [{ type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/roles/worker.md' } }, { type: 'tool_use', name: 'Read', input: { file_path: '/repo/README.md' } }, { type: 'tool_use', name: 'Read', input: { file_path: join(root, 'project', 'src', 'a.mjs') } }, { type: 'tool_use', name: 'Bash', input: { command: 'node tests/run-usage.mjs .' } }, { type: 'tool_use', name: 'PowerShell', input: { command: 'Get-Content README.md' } }, { type: 'text', text: 'done' }], 'end_turn'),
]);
const sessionTranscript = jsonl([
  user('2026-01-02T00:00:00.000Z'),
  { ...assistant('req_s1', '2026-01-02T00:00:10.000Z', claudeUsage(5, 6, 7, 8), [{ type: 'text', text: 'ok' }], 'end_turn'), message: { model: 'claude-test-1', stop_reason: 'end_turn', content: [], usage: { ...claudeUsage(5, 6, 7, 8), iterations: [{ type: 'message', ...claudeUsage(5, 6, 7, 8) }, { type: 'advisor_message', model: 'claude-advisor-1', ...claudeUsage(100, 50, 0, 0) }] } } },
  { type: 'cost-state', sessionId: SESSION, totalDuration: 1 },
]);
const openSession = jsonl([user('2026-01-03T00:00:00.000Z'), assistant('req_o1', '2026-01-03T00:00:02.000Z', claudeUsage(1, 1, 1, 1), [], 'end_turn')]);
const piRecord = (ts, usage, content) => ({ recordType: 'message', role: 'assistant', ts, model: 'pi-test-1', usage, message: { role: 'assistant', content } });
const piTranscript = jsonl([
  { recordType: 'message', role: 'user', ts: 1000, message: { role: 'user', content: [{ type: 'text', text: '[prompt redacted]' }] } },
  // The prompt is redacted; the system sections carry the profile, which names the debug skill.
  { recordType: 'message', role: 'system', ts: 1500, message: { role: 'system', content: '', sections: { preamble: 'Use .agents/skills/isswf-debug/SKILL.md for bugs.' } } },
  piRecord(2000, { input: 100, output: 10, cacheRead: 50, cacheWrite: 5, cost: 0.1 }, [{ type: 'toolCall', name: 'read', arguments: { path: '/repo/.agents/skills/isswf-debug/SKILL.md' } }, { type: 'toolCall', name: 'bash', arguments: { command: 'git status', timeout: 5 } }]),
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
  'claude/projects/-p/9d9d/subagents/agent-guide1.jsonl': jsonl([
    user('2026-01-01T00:00:00.000Z', 'Apply .agents/roles/worker.md, .agents/hosts/claude-code.md and .agents/roles/references/review.md.'),
    assistant('req_g1', '2026-01-01T00:00:01.000Z', claudeUsage(1, 1, 0, 0), [{ type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/hosts/claude-code.md' } }, { type: 'tool_use', name: 'Read', input: { file_path: '/repo/.agents/roles/references/review.md' } }], 'end_turn'),
  ]),
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
    skills: { 'isswf-review': 1, 'isswf-tdd': 1, 'isswf-coordinator': 1 },
    agentsReads: { '.agents/roles/references/review.md': 1, '.agents/roles/references/design-principles.md': 1, '.agents/roles/worker.md': 3, '.agents/roles/references/execution-principles.md': 1, '.agents/skills/isswf-coordinator/SKILL.md': 1, '.agents/skills/isswf-tdd/SKILL.md': 1 },
    usedSkills: { 'isswf-review': 1, 'isswf-tdd': 1 }, usedReferences: { '.agents/roles/references/design-principles.md': 1, '.agents/roles/worker.md': 3, '.agents/roles/references/execution-principles.md': 1 }, usedHostGuides: {}, costUsd: 'unknown',
    readPaths: ['/repo/.factory/initiatives/I0001/jobs/J001/brief-r1.md', '/repo/.agents/roles/references/review.md', '/repo/.agents/roles/references/design-principles.md', '/repo/.agents/roles/worker.md', '/repo/.agents/roles/references/execution-principles.md', '/repo/.agents/skills/isswf-coordinator/SKILL.md', 'C:/repo/.agents/skills/isswf-tdd/SKILL.md', '/repo/README.md', 'src/a.mjs'],
    commands: ['node tests/run-usage.mjs .', 'Get-Content README.md'],
    editedPaths: ['/repo/.agents/roles/references/review.md'],
  });
  // The advisor iteration is billed on top of the request's top-level usage.
  assert.deepEqual(session, { found: true, finished: true, model: 'mixed', tokens: { input: 105, output: 56, cacheRead: 7, cacheWrite: 8 }, durationMs: 10000, skills: {}, agentsReads: {}, usedSkills: {}, usedReferences: {}, usedHostGuides: {}, costUsd: 'unknown', readPaths: [], commands: [], editedPaths: [] });
  assert.deepEqual(pi, {
    found: true, finished: true, model: 'pi-test-1',
    tokens: { input: 101, output: 12, cacheRead: 53, cacheWrite: 9 }, durationMs: 3000,
    skills: { 'isswf-debug': 1 }, agentsReads: { '.agents/skills/isswf-debug/SKILL.md': 1 }, usedSkills: { 'isswf-debug': 1 }, usedReferences: {}, usedHostGuides: {}, costUsd: 'unknown', agent: 'isswf-worker', readPaths: ['/repo/.agents/skills/isswf-debug/SKILL.md'], commands: ['git status'], editedPaths: [],
  });
  const [missing, openPi, broken, escape] = review.runs.map(r => r.usage);
  const unknown = { finished: 'unknown', model: 'unknown', tokens: 'unknown', durationMs: 'unknown', skills: 'unknown', agentsReads: 'unknown', usedSkills: 'unknown', usedReferences: 'unknown', usedHostGuides: 'unknown', costUsd: 'unknown', readPaths: 'unknown', commands: 'unknown', editedPaths: 'unknown' };
  assert.deepEqual(missing, { found: false, reason: 'transcript-not-found', ...unknown });
  // Valid entries of a found transcript are still summed and the result is marked partial.
  assert.deepEqual(broken, {
    found: true, finished: true, model: 'claude-test-1', tokens: { input: 1, output: 2, cacheRead: 3, cacheWrite: 4 },
    durationMs: 1000, skills: {}, agentsReads: {}, usedSkills: {}, usedReferences: {}, usedHostGuides: {}, costUsd: 'unknown', readPaths: [], commands: [], editedPaths: [], tokensPartial: true, reason: 'malformed-line',
  });
  assert.deepEqual(escape, { found: false, reason: 'invalid-id', ...unknown });
  assert.equal(openPi.finished, false, 'a Pi child without its meta file is unfinished');
  assert.deepEqual(openPi.tokens, { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 });

  // A host guide is listed apart from the references a run used.
  const guide = await resolveRunUsage({ host: 'claude', kind: 'agent', id: 'guide1' }, { fs: nodeFs, claudeDir: env.CLAUDE_CONFIG_DIR, piDir: env.PI_CODING_AGENT_DIR, project });
  assert.deepEqual([guide.usedReferences, guide.usedHostGuides], [{ '.agents/roles/references/review.md': 1 }, { '.agents/hosts/claude-code.md': 1 }]);

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
  // A cached finished Pi run keeps the agent name its transcript file carries.
  const piOptions = { ...options, cache: new Map() };
  for (let i = 0; i < 2; i++) assert.equal((await resolveRunUsage({ host: 'pi', kind: 'child', id: 'run-pi-1' }, piOptions)).agent, 'isswf-worker', `call ${i + 1}`);
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
    { tool: 'Read', input: { file_path: '/p/.agents/roles/reviewer.md' } },
    { tool: 'Read', input: { file_path: '/p/.agents/skills/isswf-coordinator/SKILL.md' } },
    { tool: 'Edit', input: { file_path: '/p/.agents/skills/isswf-coordinator/SKILL.md' } },
  ]), {
    skills: { 'isswf-review': 1, 'isswf-tdd': 1, 'isswf-coordinator': 1 },
    agentsReads: { '.agents/skills/isswf-tdd/SKILL.md': 1, '.agents/roles/reviewer.md': 1, '.agents/skills/isswf-coordinator/SKILL.md': 1 },
    // Without an assignment every `.agents/` read counts, except a file the session changed.
    usedSkills: { 'isswf-review': 1, 'isswf-tdd': 1 }, usedReferences: { '.agents/roles/reviewer.md': 1 }, usedHostGuides: {},
  });
}

// The pane's per-role summary: an empty run is told apart from an unresolved one, and an unresolved run
// no longer blanks the runs that did resolve.
{
  const { summarizeRuns, fallbackRole } = await import(pathToFileURL(join(source, 'tools/isswf-run-usage-core.mjs')).href);
  const found = (usedSkills, usedReferences, usedHostGuides = {}) => ({ found: true, usedSkills, usedReferences, usedHostGuides });
  const lost = { found: false, usedSkills: 'unknown', usedReferences: 'unknown', usedHostGuides: 'unknown' };
  assert.deepEqual(summarizeRuns([found({}, {}), found({}, {})]), { skills: {}, references: {}, hostGuides: {}, resolved: 2, unresolved: 0, noReads: true });
  assert.deepEqual(summarizeRuns([found({ 'isswf-tdd': 1 }, { '.agents/roles/worker.md': 1 }, { '.agents/hosts/pi.md': 1 }), found({ 'isswf-tdd': 2 }, {}), lost, undefined]), {
    skills: { 'isswf-tdd': 3 }, references: { '.agents/roles/worker.md': 1 }, hostGuides: { '.agents/hosts/pi.md': 1 }, resolved: 2, unresolved: 2, noReads: false,
  });
  assert.deepEqual(summarizeRuns([lost, undefined]), { skills: undefined, references: undefined, hostGuides: undefined, resolved: 0, unresolved: 2, noReads: false });
  // Role: the record's role wins; otherwise the host's agent name, from the hook store (Claude) or the transcript name (Pi).
  assert.equal(fallbackRole('worker', { id: 'a1' }, { agent: 'isswf-reviewer' }, { a1: 'isswf:isswf-planner' }), 'worker');
  assert.equal(fallbackRole('unknown', { id: 'a1' }, undefined, { a1: 'isswf:isswf-planner' }), 'planner');
  assert.equal(fallbackRole('unknown', { id: 'p1' }, { agent: 'isswf-reviewer' }, {}), 'reviewer');
  assert.equal(fallbackRole('unknown', { id: 'x' }, { agent: 'general-purpose' }, {}), 'unknown');
  console.log('run usage pane summary tests passed');
}

// Observed reads and commands: Windows paths inside the project become relative, a similarly named sibling
// stays absolute, and the lists are bounded with the cut disclosed.
{
  const memoryFs = files => {
    const names = Object.keys(files);
    return {
      exists: async path => names.includes(path),
      list: async dir => {
        const kids = new Map();
        for (const name of names) if (name.startsWith(`${dir}/`)) { const [head, ...tail] = name.slice(dir.length + 1).split('/'); kids.set(head, tail.length ? 'dir' : 'file'); }
        if (!kids.size) throw Error('ENOENT');
        return [...kids].map(([name, kind]) => ({ name, kind }));
      },
      stat: async path => ({ size: files[path].length }),
      read: async path => files[path],
    };
  };
  const call = (name, input) => ({ type: 'tool_use', name, input });
  const transcript = content => jsonl([user('2026-01-01T00:00:00.000Z'), assistant('req_w1', '2026-01-01T00:00:01.000Z', claudeUsage(1, 1, 0, 0), content, 'end_turn')]);
  const resolve1 = (content, project = 'C:\\work\\proj') => resolveRunUsage({ host: 'claude', kind: 'agent', id: 'win1' }, { fs: memoryFs({ '/c/projects/-p/s1/subagents/agent-win1.jsonl': transcript(content) }), claudeDir: '/c', piDir: '/pi', project });
  const windows = await resolve1([call('Read', { file_path: 'C:\\work\\proj\\src\\a.mjs' }), call('Read', { file_path: 'c:\\work\\PROJ\\docs\\b.md' }), call('Read', { file_path: 'C:\\work\\project2\\x.md' }), call('Read', { file_path: 'C:\\work\\proj\\src\\a.mjs' }), call('Bash', { command: 'dir' })]);
  assert.deepEqual(windows.readPaths, ['src/a.mjs', 'docs/b.md', 'C:/work/project2/x.md']);
  assert.deepEqual(windows.commands, ['dir']);
  assert.deepEqual([windows.readsTruncated, windows.commandsTruncated, windows.editsTruncated], [undefined, undefined, undefined]);

  const many = await resolve1([...Array.from({ length: 205 }, (_, i) => call('Read', { file_path: `/repo/f${i}.md` })), ...Array.from({ length: 105 }, (_, i) => call('Bash', { command: i === 0 ? 'x'.repeat(400) : `echo ${i}` }))]);
  assert.equal(many.readPaths.length, 200);
  assert.equal(many.readPaths[199], '/repo/f199.md');
  assert.equal(many.commands.length, 100);
  assert.equal(many.commands[0], 'x'.repeat(300));
  assert.deepEqual([many.readsTruncated, many.commandsTruncated], [true, true]);
  // Each cut is flagged on its own: a command-only cut leaves the read list complete.
  const shell = await resolve1(Array.from({ length: 105 }, (_, i) => call('Bash', { command: `echo ${i}` })));
  assert.deepEqual([shell.readsTruncated, shell.commandsTruncated], [undefined, true]);
  const wrote = await resolve1([call('Write', { file_path: 'C:\\work\\proj\\notes.md' }), call('Edit', { file_path: '/repo/.agents/roles/worker.md' })]);
  assert.deepEqual(wrote.editedPaths, ['notes.md', '/repo/.agents/roles/worker.md']);
}

// The brief comparison names each `.agents/` or `skills/` file the brief mentions that the run never read.
{
  const { compareBrief } = await import(pathToFileURL(join(source, 'tools/isswf-run-usage-core.mjs')).href);
  const brief = 'Read `.agents/roles/worker.md`, [tdd](../../.agents/skills/isswf-tdd/SKILL.md), .agents\\roles\\references\\comments.md and skills/isswf-coordinator/SKILL.md. Also .agents/roles/worker.md again and docs/en/x.md.';
  const run = (readPaths, extra = {}) => ({ found: true, readPaths, commands: [], skills: {}, agentsReads: {}, ...extra });
  assert.deepEqual(compareBrief(brief, [run(['C:/repo/.agents/roles/worker.md'], { skills: { 'isswf-tdd': 1 } })]), {
    named: ['.agents/roles/worker.md', '.agents/skills/isswf-tdd/SKILL.md', '.agents/roles/references/comments.md', 'skills/isswf-coordinator/SKILL.md'],
    unread: ['.agents/roles/references/comments.md', 'skills/isswf-coordinator/SKILL.md'], partial: false,
  });
  // Several runs of one attempt pool their reads; a path that only ends alike (`my.agents/...`) is not a read.
  assert.deepEqual(compareBrief(brief, [run(['/r/.agents/roles/worker.md']), run(['/r/skills/isswf-coordinator/SKILL.md', '/r/.agents/skills/isswf-tdd/SKILL.md', 'my.agents/roles/references/comments.md'])]).unread, ['.agents/roles/references/comments.md']);
  assert.equal(compareBrief(brief, [{ found: false, readPaths: 'unknown' }]), undefined, 'an unresolved run compares nothing');
  assert.equal(compareBrief(brief, []), undefined);
  assert.equal(compareBrief('nothing to read', [run([])]).unread.length, 0);
  assert.equal(compareBrief(brief, [run([], { readsTruncated: true })]).partial, true);
  assert.equal(compareBrief(brief, [run([], { commandsTruncated: true })]).partial, false, 'a cut command list does not make the reads partial');
  assert.equal(compareBrief(brief, [run([], { tokensPartial: true })]).partial, true, 'a partly read transcript is partial');
  // A file the run wrote is its work, not methodology it read.
  assert.deepEqual(compareBrief(brief, [run(['/r/.agents/roles/worker.md', '/r/.agents/roles/references/comments.md'], { editedPaths: ['/r/.agents/roles/references/comments.md'] })]).unread, ['.agents/skills/isswf-tdd/SKILL.md', '.agents/roles/references/comments.md', 'skills/isswf-coordinator/SKILL.md']);
}

// A non-blocking note on an attempt record that cites a brief: the record check names the unread methodology and still exits on its own verdict.
{
  const tmp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-brief-note-')));
  try {
    const jobDir = join(tmp, 'project/.factory/initiatives/I0002/jobs/J001');
    await mkdir(jobDir, { recursive: true });
    await mkdir(join(tmp, 'claude/projects/-p/9d9d/subagents'), { recursive: true });
    await writeFile(join(tmp, 'claude/projects/-p/9d9d/subagents/agent-a1b2c3.jsonl'), agentTranscript);
    await writeFile(join(jobDir, 'brief-r1.md'), 'Use .agents/roles/worker.md and .agents/roles/references/comments.md.\n');
    await writeFile(join(jobDir, 'A001.md'), '# Attempt\n\n- Brief path: I0002/jobs/J001/brief-r1.md\n- Run: claude agent=a1b2c3\n');
    await writeFile(join(jobDir, 'A002.md'), '# Attempt\n\n- Brief path: I0002/jobs/J001/brief-r1.md\n- Run: claude agent=missing99\n');
    const check = file => spawnSync(process.execPath, [join(source, 'tools/isswf-record-check.mjs'), '--project', join(tmp, 'project'), '--file', join(jobDir, file)], { encoding: 'utf8', timeout: 15000, env: { ...process.env, CLAUDE_CONFIG_DIR: join(tmp, 'claude'), PI_CODING_AGENT_DIR: join(tmp, 'pi') } });
    const noted = JSON.parse(check('A001.md').stdout).files[0];
    assert.deepEqual(noted.notes, ['brief names methodology the run never read: .agents/roles/references/comments.md']);
    assert.equal('notes' in JSON.parse(check('A002.md').stdout).files[0], false, 'a run without a transcript gives no note');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
console.log('run usage observed tests passed');
