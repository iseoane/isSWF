import assert from 'node:assert/strict';
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

console.log('PASS compaction: coordinator detection, bounded assignment memory, summary instructions and the post-compaction reminder');
