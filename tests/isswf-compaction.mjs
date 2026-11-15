import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
assert.deepEqual(first, [{ agent: 'isswf:isswf-worker', initiative: 'I0001', job: 'J001', revision: '1', checkpoint: CHECKPOINT, base: BASE, run: 'agent-1' }]);
assert.deepEqual(rememberDispatch(first, claude('isswf:isswf-reviewer')).at(-1), { agent: 'isswf:isswf-reviewer', initiative: 'I0001', job: 'J001', revision: '1', checkpoint: CHECKPOINT, base: BASE }, 'no run ID when the host returned none');
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
assert.ok(claudeReminder.includes(`brief initiatives/I0001/jobs/J001/brief-r1.md`) && claudeReminder.includes(CHECKPOINT) && claudeReminder.includes(BASE) && claudeReminder.includes('run agent-1') && claudeReminder.includes('isswf:isswf-worker'));
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

// Packaging: the package declares the extension for the main session, after the guards', and the worker child does not load it.
const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
assert.equal(manifest.pi.extensions.at(-1), './tools/isswf-compaction-pi-extension.mjs');
assert.ok(!(await readFile(join(source, '.agents/hosts/pi/agents/isswf-worker.md'), 'utf8')).includes('compaction'), 'children do not load the compaction extension');

console.log('PASS compaction: coordinator detection, bounded assignment memory, summary instructions, the post-compaction reminder, the Pi extension and its packaging');
