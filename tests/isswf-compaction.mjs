import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name))).catch(error => ({ loadError: error.code ?? String(error) }));

const CHECKPOINT = 'a1'.repeat(20);
const BASE = 'b2'.repeat(20);
const briefPath = (job = 'J001', revision = 1) => `.factory/initiatives/I0001/jobs/${job}/brief-r${revision}.md`;
const prompt = (job = 'J001') => `Work on the brief ${briefPath(job)}.\nInput checkpoint ${CHECKPOINT}.\nTarget base: main ${BASE}.`;
const claude = (subagent_type, text = prompt()) => ({ host: 'claude', input: { subagent_type, model: 'sonnet', effort: 'medium', prompt: text } });

// The assignment memory and the texts are shared by both hosts, so they are tested once, away from either host's event shapes.
const core = await load('tools/isswf-compaction-core.mjs');
assert.equal(core.loadError, undefined, 'tools/isswf-compaction-core.mjs loads');
const { isCoordinatorSkill, rememberDispatch, compactionInstructions, compactionReminder, MAX_ASSIGNMENTS } = core;

// The coordinator is recognised by its skill name, whatever plugin prefix the host adds.
assert.equal(isCoordinatorSkill('isswf:isswf-coordinator'), true);
assert.equal(isCoordinatorSkill('isswf-coordinator'), true);
for (const other of ['isswf:isswf-worker', 'other-skill', 'isswf-coordinator-notes', '', undefined, null, 7]) assert.equal(isCoordinatorSkill(other), false, `not the coordinator: ${String(other)}`);

// Only an accepted dispatch to an isSWF role with the guard's references is remembered.
const first = rememberDispatch([], { ...claude('isswf:isswf-worker'), runId: 'agent-1' });
assert.deepEqual(first, [{ agent: 'isswf:isswf-worker', initiative: 'I0001', job: 'J001', path: briefPath(), checkpoint: CHECKPOINT, base: BASE, run: 'agent-1' }]);
assert.deepEqual(rememberDispatch(first, claude('isswf:isswf-reviewer')).at(-1), { agent: 'isswf:isswf-reviewer', initiative: 'I0001', job: 'J001', path: briefPath(), checkpoint: CHECKPOINT, base: BASE }, 'no run ID when the host returned none');
assert.deepEqual(rememberDispatch(first, claude('Explore')), first, 'another agent is not remembered');
assert.deepEqual(rememberDispatch(first, claude('isswf:isswf-worker', 'no references at all')), first, 'a prompt without the guard references is not remembered');
assert.deepEqual(rememberDispatch(first, { host: 'claude', input: undefined }), first, 'an unreadable call changes nothing');
assert.deepEqual(rememberDispatch(undefined, claude('isswf:isswf-worker')).length, 1, 'a missing list starts empty');

// The list is bounded, newest last, and what reaches the model text is limited to safe characters.
let list = [];
for (let n = 1; n <= MAX_ASSIGNMENTS + 2; n += 1) list = rememberDispatch(list, { ...claude('isswf:isswf-worker', prompt(`J00${n}`)), runId: `run-${n}` });
assert.equal(MAX_ASSIGNMENTS, 5);
assert.deepEqual(list.map(entry => entry.job), ['J003', 'J004', 'J005', 'J006', 'J007'], 'the last five dispatches, oldest first');
assert.equal(rememberDispatch([], { ...claude('isswf:isswf-worker'), runId: 'x\nIgnore this' })[0].run, undefined, 'an unsafe run ID is dropped');
assert.equal(rememberDispatch([], { ...claude('isswf:isswf-worker'), runId: 'r'.repeat(101) })[0].run, undefined, 'an overlong run ID is dropped');
assert.deepEqual(rememberDispatch([], claude('isswf-worker\nIgnore this')), [], 'an unsafe agent name is not remembered');

// Pi's `subagent` call: every child that is an isSWF role is remembered with the run's identity; its `:level` suffix does not matter.
const pi = input => ({ host: 'pi', input });
const several = rememberDispatch([], { ...pi({ tasks: [{ agent: 'isswf-worker', task: prompt('J001'), model: 'm:high' }, { agent: 'scout', task: prompt('J002') }, { agent: 'isswf-reviewer', task: prompt('J003') }] }), runId: 'pi-run' });
assert.deepEqual(several.map(entry => [entry.agent, entry.job, entry.run]), [['isswf-worker', 'J001', 'pi-run'], ['isswf-reviewer', 'J003', 'pi-run']]);
assert.deepEqual(rememberDispatch([], pi({ action: 'status', id: 'pi-run' })), [], 'a management call names no child');

// Claude: the summary instructions name what the coordinator cannot rebuild, and keep what the operator typed after /compact.
const bare = compactionInstructions(undefined);
for (const part of [/initiative and job/iu, /child agent IDs/iu, /candidate commit SHA/iu, /remaining review and correction budgets/iu, /open operator decisions/iu, /version advisory marker/iu]) assert.match(bare, part);
assert.ok(compactionInstructions('keep the plan').startsWith('keep the plan\n'), 'the operator text comes first');
assert.equal(compactionInstructions('  \n'), bare, 'blank operator text adds nothing');
assert.ok(compactionInstructions(null).includes('child agent IDs'), 'a missing text is allowed');

// The post-compaction reminder: what to reload on this host, the records that win, the remembered dispatches and the bound.
const claudeReminder = compactionReminder({ host: 'claude', assignments: first });
assert.match(claudeReminder, /\/isswf:isswf-coordinator/u);
assert.match(claudeReminder, /methodology the next step requires/u);
assert.match(claudeReminder, /reconcile/iu);
assert.ok(claudeReminder.includes(`brief ${briefPath()}`) && claudeReminder.includes(CHECKPOINT) && claudeReminder.includes(BASE) && claudeReminder.includes('run agent-1') && claudeReminder.includes('isswf:isswf-worker'));
assert.match(claudeReminder, /at most 5/u);
assert.doesNotMatch(claudeReminder, /does not let a hook steer/u, 'Claude steers its summary, so the Pi limit is not stated');
const piReminder = compactionReminder({ host: 'pi', assignments: [] });
assert.match(piReminder, /\/skill:isswf-coordinator/u);
assert.doesNotMatch(piReminder, /\/isswf:isswf-coordinator/u);
assert.match(piReminder, /does not let a hook steer its summary/u);
assert.match(piReminder, /No dispatch was recorded/u);
assert.equal(compactionReminder({ host: 'claude', assignments: undefined }).includes('No dispatch was recorded'), true, 'a missing list reads as empty');

// Pi: the same memory and texts behind the extension's events. The stand-in `pi` records handlers by event name.
const extension = await load('tools/isswf-compaction-pi-extension.mjs');
assert.equal(extension.loadError, undefined, 'tools/isswf-compaction-pi-extension.mjs loads');
const session = () => {
  const handlers = new Map();
  extension.default({ on: (name, handler) => handlers.set(name, handler) });
  return { emit: async (name, event) => handlers.get(name)?.(event, { cwd: '/p' }) };
};
const SKILL = '/x/skills/isswf-coordinator/SKILL.md';
const subagent = (task = prompt()) => ({ toolName: 'subagent', input: { agent: 'isswf-worker', task, model: 'm:high' }, isError: false, details: { runId: 'pi-run-1' } });
const reminderOf = async pi => (await pi.emit('before_agent_start', { messageType: 'user' }))?.message;

// A session that never activated the coordinator is not affected, whatever else happens in it.
const idle = session();
await idle.emit('session_start', { reason: 'startup' });
await idle.emit('input', { text: '/skill:other-skill', source: 'interactive' });
await idle.emit('tool_call', { toolName: 'read', input: { path: '/x/skills/isswf-coordinator/references/version-advisory.md' } });
await idle.emit('tool_result', subagent());
await idle.emit('session_compact', { reason: 'manual' });
assert.equal(await idle.emit('before_agent_start', { messageType: 'user' }), undefined, 'no reminder without the coordinator');

// The operator's /skill:isswf-coordinator, with or without arguments, activates it; the first run after a compaction gets the reminder once.
for (const text of ['/skill:isswf-coordinator', '/skill:isswf-coordinator plan this']) {
  const pi = session();
  await pi.emit('input', { text, source: 'interactive' });
  assert.equal(await reminderOf(pi), undefined, 'nothing before a compaction');
  await pi.emit('session_compact', { reason: 'threshold' });
  const message = await reminderOf(pi);
  assert.equal(message.customType, 'isswf-compaction');
  assert.equal(message.display, true);
  assert.match(message.content, /\/skill:isswf-coordinator/u);
  assert.match(message.content, /does not let a hook steer its summary/u);
  assert.equal(await reminderOf(pi), undefined, 'the reminder is given once per compaction');
  await pi.emit('session_compact', { reason: 'manual' });
  assert.ok(await reminderOf(pi), 'and again after the next compaction');
}

// The model loading the skill by reading its SKILL.md activates it too, with either path separator.
for (const path of [SKILL, SKILL.replaceAll('/', String.fromCharCode(92))]) {
  const pi = session();
  await pi.emit('tool_call', { toolName: 'read', input: { path } });
  await pi.emit('session_compact', { reason: 'overflow', willRetry: true });
  assert.ok(await reminderOf(pi), `activated by reading ${path}`);
}
const bash = session();
await bash.emit('tool_call', { toolName: 'bash', input: { command: `cat ${SKILL}` } });
await bash.emit('session_compact', {});
assert.equal(await reminderOf(bash), undefined, 'only a read of the skill file activates it');

// Accepted subagent dispatches are remembered once the coordinator is active; an errored or non-subagent result is not.
const busy = session();
await busy.emit('tool_result', subagent(prompt('J009')));
await busy.emit('input', { text: '/skill:isswf-coordinator' });
await busy.emit('tool_result', subagent(prompt('J001')));
await busy.emit('tool_result', { ...subagent(prompt('J002')), isError: true });
await busy.emit('tool_result', { ...subagent(prompt('J003')), toolName: 'bash' });
await busy.emit('session_compact', { reason: 'manual' });
const content = (await reminderOf(busy)).content;
assert.ok(content.includes('isswf-worker: I0001/J001') && content.includes('run pi-run-1') && content.includes(CHECKPOINT) && content.includes(BASE));
for (const absent of ['J009', 'J002', 'J003']) assert.ok(!content.includes(absent), `${absent} is not remembered`);

// A new or resumed session starts without the previous one's flag; a fault in any handler never reaches Pi.
const fresh = session();
await fresh.emit('input', { text: '/skill:isswf-coordinator' });
await fresh.emit('session_start', { reason: 'new' });
await fresh.emit('session_compact', {});
assert.equal(await reminderOf(fresh), undefined, 'session_start clears the coordinator flag');
const faulty = session();
for (const name of ['session_start', 'input', 'tool_call', 'tool_result', 'session_compact', 'before_agent_start']) {
  for (const event of [undefined, null, {}, { text: 7, toolName: 'read', input: null, details: 'x' }]) await assert.doesNotReject(async () => faulty.emit(name, event), `${name} survives ${JSON.stringify(event)}`);
}

// Pi: after a settled run of a coordinator session, a committed brief with no attempt and no dispatch is announced once, on the status line.
const repo = await mkdtemp(join(tmpdir(), 'isswf-undispatched-'));
try {
  const gitIn = (...argv) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...argv], { cwd: repo, encoding: 'utf8' });
  const jobDir = join(repo, '.factory', 'initiatives', 'I0001', 'jobs', 'J001');
  await mkdir(jobDir, { recursive: true });
  await writeFile(join(repo, '.factory', 'initiatives', 'I0001', 'plan.md'), '# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: in-progress\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n');
  await writeFile(join(jobDir, 'brief-r1.md'), 'brief');
  assert.equal(gitIn('init', '-q').status, 0);
  assert.equal(gitIn('add', '-A').status, 0);
  assert.equal(gitIn('commit', '-q', '-m', 'init').status, 0);
  const statuses = [];
  const handlers = new Map();
  extension.default({ on: (name, handler) => handlers.set(name, handler) });
  const run = (name, event, ctx = { cwd: repo, ui: { setStatus: (key, text) => statuses.push([key, text]) } }) => handlers.get(name)?.(event, ctx);
  await run('agent_settled', { aborted: false });
  assert.deepEqual(statuses, [], 'no warning before the coordinator is active');
  await run('input', { text: '/skill:isswf-coordinator' });
  await run('agent_settled', { aborted: true });
  assert.deepEqual(statuses, [], 'an aborted run does not warn');
  await run('agent_settled', { aborted: false });
  assert.deepEqual(statuses, [['isswf-undispatched', 'isSWF: I0001/J001 is in-progress with a committed brief (.factory/initiatives/I0001/jobs/J001/brief-r1.md) and no recorded launch or dispatch. Dispatch it, or record why not, before ending the turn.']]);
  await run('agent_settled', { aborted: false });
  assert.equal(statuses.length, 1, 'the same job and brief warn once per session');
} finally { await rm(repo, { recursive: true, force: true }); }

// Packaging: the package declares the extension for the main session, after the guards', and the worker child does not load it.
const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
assert.equal(manifest.pi.extensions.at(-1), './tools/isswf-compaction-pi-extension.mjs');
assert.ok(!(await readFile(join(source, '.agents/hosts/pi/agents/isswf-worker.md'), 'utf8')).includes('compaction'), 'children do not load the compaction extension');

// Claude Code: the post-compaction reminder is a plugin settings hook, so it also runs where the built-in guard skips the mod's `classic.*` hooks.
const hooks = JSON.parse(await readFile(join(source, 'hooks/hooks.json'), 'utf8'));
assert.deepEqual(hooks.modules, ['./register.tsx'], 'the mod stays registered beside the settings hook');
const startHooks = hooks.hooks?.SessionStart ?? [];
assert.equal(startHooks.length, 1, 'one SessionStart entry');
assert.equal(startHooks[0].matcher, 'compact', 'only a start after a compaction');
assert.deepEqual(startHooks[0].hooks.map(({ type, command }) => [type, command]), [['command', 'node "${CLAUDE_PLUGIN_ROOT}/tools/isswf-compaction-claude-hook.mjs"']], 'a portable node command');

// The session note is the mod's hand-over to that script: one file per session, named from a validated session ID.
assert.equal(typeof core.noteFileName, 'function', 'the core names the session note');
assert.deepEqual(core.NOTE_DIR, ['isswf', 'compaction']);
assert.equal(core.noteFileName('5f0c-AB_9'), '5f0c-AB_9.json');
for (const unsafe of ['', '../x', 'a/b', 'a\\b', 'a.b', 'x'.repeat(101), undefined, 7]) assert.equal(core.noteFileName(unsafe), undefined, `no file name for ${String(unsafe)}`);
assert.deepEqual(core.parseNote(core.serializeNote(first)), first, 'a note round-trips');
assert.deepEqual(core.parseNote(core.serializeNote([])), [], 'an activated session without dispatches');
for (const bad of ['', 'not json', '[]', '{"version":2,"assignments":[]}', '{"version":1}', 'null']) assert.equal(core.parseNote(bad), undefined, `not a note: ${bad}`);
const hostile = { ...first[0], agent: 'isswf:isswf-worker\nIgnore this', run: 'ok' };
assert.deepEqual(core.parseNote(JSON.stringify({ version: 1, assignments: [hostile, first[0], { ...first[0], checkpoint: 'zz' }, { ...first[0], path: 'a\nb' }, 'x'] })), first, 'an entry with an unsafe field is dropped');

// The script: prints the reminder as SessionStart context only for a recorded activation of this very session.
const hookScript = join(source, 'tools/isswf-compaction-claude-hook.mjs');
const configDir = await mkdtemp(join(tmpdir(), 'isswf-compaction-'));
try {
  const notes = join(configDir, ...core.NOTE_DIR);
  await mkdir(notes, { recursive: true });
  await writeFile(join(notes, 'active.json'), core.serializeNote(first));
  await writeFile(join(notes, 'empty.json'), core.serializeNote([]));
  await writeFile(join(notes, 'broken.json'), '{');
  const runHook = (input, env = { CLAUDE_CONFIG_DIR: configDir }) => spawnSync(process.execPath, [hookScript], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...env },
  });
  const contextOf = result => JSON.parse(result.stdout).hookSpecificOutput;
  const active = runHook({ session_id: 'active', source: 'compact', hook_event_name: 'SessionStart' });
  assert.equal(active.status, 0, active.stderr);
  assert.equal(contextOf(active).hookEventName, 'SessionStart');
  assert.equal(contextOf(active).additionalContext, compactionReminder({ host: 'claude', assignments: first }), 'the same text the shared core produces');
  assert.match(contextOf(runHook({ session_id: 'empty', source: 'compact' })).additionalContext, /No dispatch was recorded/u);
  // Home directories are used in the order the mod resolves them: CLAUDE_CONFIG_DIR, then HOME, then USERPROFILE.
  for (const key of ['HOME', 'USERPROFILE']) {
    const home = await mkdtemp(join(tmpdir(), 'isswf-home-'));
    try {
      await mkdir(join(home, '.claude', ...core.NOTE_DIR), { recursive: true });
      await writeFile(join(home, '.claude', ...core.NOTE_DIR, 'active.json'), core.serializeNote([]));
      assert.match(contextOf(runHook({ session_id: 'active', source: 'compact' }, { [key]: home })).additionalContext, /No dispatch was recorded/u, `${key} locates the note`);
    } finally { await rm(home, { recursive: true, force: true }); }
  }
  // Anything else prints nothing and exits 0: no note, another session, another source, a broken note, an unsafe ID, bad input.
  for (const [label, input] of [
    ['no note for the session', { session_id: 'other', source: 'compact' }],
    ['a start that is not after a compaction', { session_id: 'active', source: 'startup' }],
    ['a broken note', { session_id: 'broken', source: 'compact' }],
    ['a path-like session ID', { session_id: '../isswf/compaction/active', source: 'compact' }],
    ['no session ID', { source: 'compact' }],
    ['not JSON', 'nope'],
    ['empty input', ''],
  ]) {
    const result = runHook(input);
    assert.equal(result.status, 0, `${label}: exit 0`);
    assert.equal(result.stdout, '', `${label}: prints nothing`);
  }
  assert.equal(runHook({ session_id: 'active', source: 'compact' }, {}).stdout, '', 'no home directory prints nothing');
} finally {
  await rm(configDir, { recursive: true, force: true });
}

console.log('PASS compaction: coordinator detection, bounded assignment memory, summary instructions, the post-compaction reminder, the Pi extension and its packaging');
