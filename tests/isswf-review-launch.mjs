import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitFixtureArgs } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] ?? '.');
const { prepare, presetReviewer, launch, record } = await import(pathToFileURL(join(source, 'tools/isswf-review-launch.mjs')).href);
const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const git = await realpath(spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0]);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-review-launch-')));
const repo = join(root, 'repo');

function gitRun(args, cwd = repo) {
  const result = spawnSync(git, gitFixtureArgs(args), { cwd, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}
const reason = async promise => { try { await promise; return 'no-error'; } catch (error) { return error.message; } };
const commitFile = async (name, text) => { await writeFile(join(repo, name), text); gitRun(['add', name]); gitRun(['commit', '-q', '-m', name]); return gitRun(['rev-parse', 'HEAD']); };

try {
  await mkdir(repo);
  gitRun(['init', '-q', '-b', 'main']);
  gitRun(['config', 'user.email', 'fixture@example.invalid']);
  gitRun(['config', 'user.name', 'Fixture']);
  const parent = await commitFile('a.txt', 'a\n');
  gitRun(['checkout', '-q', '-b', 'feature']);
  const first = await commitFile('b.txt', 'b\n');
  const second = await commitFile('ñ c.txt', 'c\n');
  gitRun(['checkout', '-q', 'main']);
  const mainLater = await commitFile('d.txt', 'd\n');

  // Main moved on after the branch was cut: the base is the branch point, not main's tip.
  const prepared = await prepare({ repository: repo, candidate: second, main: 'main', paths: ['plan.md', 'b.txt'], git });
  assert.equal(prepared.baseSha, parent);
  assert.notEqual(prepared.baseSha, mainLater);
  assert.deepEqual(prepared.paths, ['b.txt', 'ñ c.txt', 'plan.md']);
  const content = prepared.bindings['isswf.git-evidence.content/1'];
  assert.equal(content.repository, await realpath(repo));
  assert.equal(content.gitExecutable, git);
  assert.equal(content.outputBytes, 32768);
  assert.deepEqual(Object.keys(prepared.bindings).sort(), ['isswf.git-evidence.content/1', 'isswf.git-evidence.diff/1', 'isswf.git-evidence/1']);

  // A delta review binds the previous candidate.
  const delta = await prepare({ repository: repo, candidate: second, base: first, git });
  assert.equal(delta.baseSha, first);
  assert.equal(delta.baseSource, 'given');
  assert.deepEqual(delta.paths, ['ñ c.txt']);

  assert.equal(await reason(prepare({ repository: repo, candidate: second, base: second, git })), 'base-equals-candidate');
  assert.equal(await reason(prepare({ repository: repo, candidate: 'f'.repeat(40), main: 'main', git })), `commit-not-found:${'f'.repeat(40)}`);
  assert.equal(await reason(prepare({ repository: 'relative', candidate: second, git })), 'absolute-repository-required');
  const linked = join(root, 'linked');
  gitRun(['worktree', 'add', '-q', linked, 'feature']);
  assert.equal(await reason(prepare({ repository: linked, candidate: second, main: 'main', git })), 'linked-worktree-bind-the-primary-clone');

  // The preset is read from the shipped setup skill, not assumed.
  assert.deepEqual(await presetReviewer(source), { model: 'opus', effort: 'medium' });
  const factory = join(root, 'factory');
  await mkdir(join(factory, '.agents/skills/isswf-setup'), { recursive: true });
  await writeFile(join(factory, '.agents/skills/isswf-setup/SKILL.md'), '| Role | Claude | Pi |\n| --- | --- | --- |\n| Reviewer | `opus` / `low` | `x` / `y` |\r\n');
  assert.deepEqual(await presetReviewer(factory), { model: 'opus', effort: 'low' });

  // A fake claude records its argv, binding env and stdin, then emits a stream-json trace.
  const fake = join(root, 'fake-claude.mjs');
  await writeFile(fake, `import { readFileSync, writeFileSync } from 'node:fs';
const stdin = readFileSync(0, 'utf8');
writeFileSync(${JSON.stringify(join(root, 'seen.json'))}, JSON.stringify({ argv: process.argv.slice(2), bindings: process.env.ISSWF_GIT_EVIDENCE_BINDINGS, mcp: process.env.MAX_MCP_OUTPUT_TOKENS, stdin }));
const tool = n => 'mcp__plugin_isswf_isswf_git_evidence__' + n;
const ok = body => [{ type: 'text', text: JSON.stringify({ status: 'ok', ...body }) }, { type: 'text', text: 'decoded' }];
const lines = [
  { type: 'system', subtype: 'init', session_id: 'sess-1', model: 'claude-opus-5-5' },
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: tool('identity'), input: {} }, { type: 'tool_use', id: 't2', name: tool('diff'), input: {} }, { type: 'tool_use', id: 't3', name: tool('diff'), input: { chunk: 2 } }, { type: 'tool_use', id: 't4', name: tool('content'), input: {} }, { type: 'tool_use', id: 't5', name: tool('diff'), input: { chunk: 3 } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: ok({}) }, { type: 'tool_result', tool_use_id: 't2', content: ok({ chunk: 1, chunkCount: 3 }) }, { type: 'tool_result', tool_use_id: 't3', content: ok({ chunk: 2, chunkCount: 3 }) }, { type: 'tool_result', tool_use_id: 't4', is_error: true, content: 'refused' }] } },
  // A large result reaches the model as a persisted-output preview; the event keeps the full content.
  { type: 'user', tool_use_result: ok({ chunk: 3, chunkCount: 3 }), message: { content: [{ type: 'tool_result', tool_use_id: 't5', content: '<persisted-output>\\nOutput too large.' }] } },
  { type: 'result', subtype: 'success', is_error: false, result: 'PASS', total_cost_usd: 0.5 },
];
process.stdout.write(lines.map(l => JSON.stringify(l)).join('\\n') + '\\n');
`);
  const bindingsFile = join(root, 'bindings.json');
  await writeFile(bindingsFile, JSON.stringify(prepared.bindings));
  const task = join(root, 'task.md');
  await writeFile(task, 'Review task\n');
  const trace = join(root, 'trace.jsonl');
  const launched = await launch({ bindings: bindingsFile, task, trace, factoryRoot: source, claude: process.execPath, claudePrefix: [fake] });
  assert.equal(launched.exitCode, 0);
  assert.deepEqual([launched.model, launched.effort, launched.source], ['opus', 'medium', 'preset']);
  const seen = JSON.parse(await readFile(join(root, 'seen.json'), 'utf8'));
  assert.equal(seen.stdin, 'Review task\n');
  assert.equal(seen.mcp, '100000');
  assert.deepEqual(JSON.parse(seen.bindings), prepared.bindings);
  assert.deepEqual(seen.argv.slice(seen.argv.indexOf('--model'), seen.argv.indexOf('--model') + 4), ['--model', 'opus', '--effort', 'medium']);
  assert.equal(seen.argv.at(-2), '--allowedTools');
  assert.equal(process.env.ISSWF_GIT_EVIDENCE_BINDINGS, undefined);

  const explicit = await launch({ bindings: bindingsFile, task, trace: join(root, 'trace2.jsonl'), factoryRoot: source, model: 'sonnet', effort: 'high', claude: process.execPath, claudePrefix: [fake] });
  assert.equal(explicit.source, 'operator');
  assert.equal(await reason(launch({ bindings: bindingsFile, task, trace, factoryRoot: source, model: 'sonnet', claude: process.execPath, claudePrefix: [fake] })), 'pass-both-model-and-effort-or-neither');

  // The trace gives the Run line, the requested selection and whether every diff chunk was fetched.
  const read = await record({ trace });
  assert.equal(read.complete, true);
  assert.equal(read.run, 'claude session=sess-1');
  assert.deepEqual(read.requested, { model: 'opus', effort: 'medium', source: 'preset' });
  assert.deepEqual(read.evidenceCalls, { identity: 1, diff: 3, content: 0 });
  assert.deepEqual(read.diff, { chunkCount: 3, fetched: [1, 2, 3], complete: true });
  assert.equal(read.report, 'PASS');

  const lines = (await readFile(trace, 'utf8')).trim().split('\n');
  await writeFile(trace, `${lines.slice(0, -1).join('\n')}\n${JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true })}\n`);
  const failed = await record({ trace });
  assert.equal(failed.complete, false);
  assert.equal(failed.report, undefined);
  console.log('review launch tests passed');
} finally {
  await rm(root, { recursive: true, force: true });
}
