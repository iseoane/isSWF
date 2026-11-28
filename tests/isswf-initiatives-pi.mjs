import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { nodeFs } = await import(pathToFileURL(join(source, 'tools/isswf-snapshot.mjs')).href);
const extension = await import(pathToFileURL(join(source, 'tools/isswf-initiatives-pi-extension.mjs')).href).catch(error => ({ loadError: error.code ?? String(error) }));
assert.equal(extension.loadError, undefined, 'tools/isswf-initiatives-pi-extension.mjs loads');
const { renderLines, latchFromBranch, MAX_LINES } = extension;

const initiative = (id, title, jobs) => ({ id, title, type: 'enhancement', status: 'parsed', jobs });
const job = (id, status, dependsOn = []) => ({ id, status, dependsOn });
const snapshot = (initiatives, unopened = []) => ({ schemaVersion: 1, project: '/p', stateDir: '/p/.factory/initiatives', initiatives, unopened, skipped: [] });

// One line per initiative: the Claude pane's counts (blocked, then open = neither completed nor blocked) and the first pending job whose dependencies are completed.
assert.deepEqual(renderLines(snapshot([
  initiative('I0001', 'Active work', [job('J001', 'completed'), job('J002', 'blocked'), job('J003', 'pending', ['J001']), job('J004', 'in-progress')]),
  initiative('I0002', 'Waiting', [job('J001', 'in-review'), job('J002', 'pending', ['J001'])]),
  { id: 'I0003', title: 'unknown', type: 'unknown', status: 'unparsed', jobs: [] },
], [{ id: 'I0007', title: 'Later' }, { id: 'I0009', title: 'Much later' }])), [
  'I0001 Active work · 1 blocked · 2 open · next J003',
  'I0002 Waiting · 2 open',
  'I0003 · plan unreadable',
  '○ 2 unopened: I0007 I0009',
]);
assert.deepEqual(renderLines(snapshot([])), [], 'nothing to show');

// A title comes from a plan: control characters (terminal escapes) are dropped and a long title is cut.
const [escaped] = renderLines(snapshot([initiative('I0001', `Bad\u001b[31m${'x'.repeat(80)}`, [job('J001', 'pending')])]));
assert.equal(escaped, `I0001 Bad[31m${'x'.repeat(27)}… · 1 open · next J001`);

// The widget keeps within Pi's 10-entry string cap: MAX_LINES entries at most, the last one counting what was left out.
assert.equal(MAX_LINES, 9);
const many = Array.from({ length: 12 }, (_, n) => initiative(`I00${String(n + 10)}`, `T${n}`, [job('J001', 'pending')]));
const full = renderLines(snapshot(many, [{ id: 'I0100', title: 'u' }]));
assert.equal(full.length, 9);
assert.deepEqual(full.slice(-2), ['+5 more initiatives', '○ 1 unopened: I0100']);
assert.equal(full[0], 'I0010 T0 · 1 open · next J001');
assert.deepEqual(renderLines(snapshot(many)).slice(-2), ['I0017 T7 · 1 open · next J001', '+4 more initiatives']);
const unopenedOnly = renderLines(snapshot([], Array.from({ length: 6 }, (_, n) => ({ id: `I010${n}`, title: 'u' }))));
assert.deepEqual(unopenedOnly, ['○ 6 unopened: I0100 I0101 I0102 +3']);

// The coordinator latch is rebuilt from the current branch in the form Pi stores: the expanded skill block of a user message, or a read tool call.
const user = content => ({ type: 'message', message: { role: 'user', content } });
const expanded = (name, extra = '') => `<skill name="${name}" location="/x/skills/${name}/SKILL.md">\nReferences are relative to /x.\n\n# Coordinator\n</skill>${extra}`;
const assistantRead = path => ({ type: 'message', message: { role: 'assistant', content: [{ type: 'text', text: 'loading' }, { type: 'toolCall', id: 't1', name: 'read', arguments: { path } }] } });
assert.equal(latchFromBranch([user(expanded('isswf-coordinator'))]), true, 'expanded skill block, string content');
assert.equal(latchFromBranch([user([{ type: 'text', text: expanded('isswf-coordinator', '\n\nplan this') }])]), true, 'block content with a following request');
assert.equal(latchFromBranch([user(expanded('isswf:isswf-coordinator'))]), true, 'a plugin prefix is accepted');
assert.equal(latchFromBranch([assistantRead('/x/skills/isswf-coordinator/SKILL.md')]), true, 'read of the skill');
assert.equal(latchFromBranch([assistantRead('C:\\x\\skills\\isswf-coordinator\\SKILL.md')]), true, 'read with Windows separators');
assert.equal(latchFromBranch([user(expanded('other-skill')), user('/skill:isswf-coordinator'), assistantRead('/x/skills/isswf-coordinator/references/version-advisory.md'), { type: 'custom', customType: 'x' }, { type: 'message', message: { role: 'toolResult', content: expanded('isswf-coordinator') } }]), false, 'raw command text, another skill, a reference file and a non-user block do not activate');
assert.equal(latchFromBranch([]), false);
assert.equal(latchFromBranch(undefined), false);
assert.equal(latchFromBranch([null, { type: 'message' }, user(undefined), user([null, 7])]), false, 'unreadable entries are skipped');

// The extension behind its events, with a stand-in `pi`, a context with a UI and real plan files.
const plan = (id, title, jobs) => `# ${id}: ${title}\n\nType: enhancement\n\n${jobs.map(([jid, status, dependsOn = 'None']) => [`## ${jid}`, '', `- Status: ${status}`, `- Objective: Objective ${jid}`, `- Depends on: ${dependsOn}`, `- Brief: [brief-r1.md](jobs/${jid}/brief-r1.md)`, `- Blocker: ${status === 'blocked' ? 'Waiting.' : 'None.'}`, '- Next step: Continue.', '', '### Acceptance', '', '- Works.', '', '### Evidence', '', status === 'completed' ? '- Merged.' : '- None.', ''].join('\n')).join('\n')}`;
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-initiatives-pi-')));
const timers = [];
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;
globalThis.setInterval = (callback, ms) => { const timer = { callback, ms, cleared: false, unref() {} }; timers.push(timer); return timer; };
globalThis.clearInterval = timer => { if (timer) timer.cleared = true; };
try {
  const project = join(root, 'project');
  const files = {
    'I0001/plan.md': plan('I0001', 'Active work', [['J001', 'completed'], ['J002', 'blocked'], ['J003', 'pending', 'J001']]),
    'I0002/plan.md': plan('I0002', 'Not started', [['J001', 'pending']]),
  };
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(project, '.factory/initiatives', path)), { recursive: true });
    await writeFile(join(project, '.factory/initiatives', path), text);
  }
  const expected = ['I0001 Active work · 1 blocked · 1 open · next J003', '○ 1 unopened: I0002'];

  const session = (options = {}) => {
    const handlers = new Map();
    extension.default({ on: (name, handler) => handlers.set(name, handler) }, options.io);
    const widgets = [];
    let branch = options.branch ?? [];
    const ctx = {
      cwd: options.cwd ?? project,
      mode: options.mode ?? 'tui',
      isProjectTrusted: () => options.trusted ?? true,
      sessionManager: { getBranch: () => branch },
      ui: 'noWidget' in options ? {} : { setWidget: (key, lines, widgetOptions) => widgets.push({ key, lines, placement: widgetOptions?.placement }) },
    };
    return { widgets, setBranch: next => { branch = next; }, call: (name, event = {}) => handlers.get(name)?.(event, ctx), emit: async (name, event = {}) => { await handlers.get(name)?.(event, ctx); await new Promise(settle => setImmediate(settle)); } };
  };
  const last = pi => pi.widgets.at(-1);
  // The extension's file-system seam: counts every call and, once `hold` is set, parks the first record read after it has the text.
  const watched = () => {
    const io = { calls: [], hold: false, gate: undefined, reached: undefined };
    const wrap = name => async (...args) => {
      io.calls.push(name);
      const result = await nodeFs[name](...args);
      if (name === 'read' && io.hold) {
        io.hold = false;
        io.reachedNow();
        await io.gate;
      }
      return result;
    };
    io.fs = Object.fromEntries(Object.keys(nodeFs).map(name => [name, wrap(name)]));
    io.arm = () => {
      io.hold = true;
      io.reached = new Promise(resolveReached => { io.reachedNow = resolveReached; });
      io.gate = new Promise(resolveGate => { io.release = resolveGate; });
    };
    return io;
  };
  const within = (promise, ms) => Promise.race([promise.then(() => true), new Promise(settle => setTimeout(() => settle(false), ms))]);

  // A coordinator session shows the widget below the editor and refreshes it when a run settles.
  const pi = session();
  await pi.emit('session_start', { reason: 'startup' });
  assert.deepEqual(pi.widgets, [], 'nothing before the coordinator is active');
  await pi.emit('input', { text: '/skill:other-skill' });
  await pi.emit('agent_settled', { aborted: false });
  assert.deepEqual(pi.widgets, [], 'another skill does not activate it');
  await pi.emit('input', { text: '/skill:isswf-coordinator plan this' });
  assert.deepEqual(last(pi), { key: 'isswf-initiatives', lines: expected, placement: 'belowEditor' });
  await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), plan('I0001', 'Active work', [['J001', 'completed'], ['J002', 'completed'], ['J003', 'pending', 'J001']]));
  await pi.emit('agent_settled', { aborted: false });
  assert.deepEqual(last(pi).lines, ['I0001 Active work · 1 open · next J003', '○ 1 unopened: I0002']);
  await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), plan('I0001', 'Active work', [['J001', 'completed'], ['J002', 'completed'], ['J003', 'completed'], ['J004', 'pending']]));
  await pi.emit('tool_result', { toolName: 'bash' });
  assert.deepEqual(last(pi).lines, ['I0001 Active work · 1 open · next J004', '○ 1 unopened: I0002'], 'a tool result refreshes it');
  await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), files['I0001/plan.md']);

  // The 60-second fallback timer starts with the session and stops at shutdown.
  const timer = timers.at(-1);
  assert.equal(timer.ms, 60_000);
  assert.equal(timer.cleared, false);
  const before = pi.widgets.length;
  await timer.callback();
  assert.deepEqual(last(pi).lines, expected, 'the timer refreshes it');
  assert.ok(pi.widgets.length >= before);
  await pi.emit('session_shutdown', { reason: 'quit' });
  assert.equal(timer.cleared, true, 'shutdown clears the timer');

  // The model reading the coordinator's SKILL.md activates it through tool_call.
  const reader = session();
  await reader.emit('session_start', { reason: 'startup' });
  await reader.emit('tool_call', { toolName: 'read', input: { path: '/x/skills/isswf-coordinator/SKILL.md' } });
  assert.deepEqual(last(reader).lines, expected);
  await reader.emit('session_shutdown', {});

  // /reload and resume re-emit session_start in a new runtime: the latch is rebuilt from the stored entries and the widget is set again.
  const resumed = session({ branch: [{ type: 'message', message: { role: 'user', content: expanded('isswf-coordinator') } }] });
  await resumed.emit('session_start', { reason: 'reload' });
  assert.deepEqual(last(resumed).lines, expected, 'reload with a stored coordinator skill block');
  await resumed.emit('session_shutdown', {});
  const fresh = session();
  await fresh.emit('session_start', { reason: 'new' });
  assert.deepEqual(fresh.widgets, [], 'a session without the coordinator stays empty');
  fresh.setBranch([assistantRead('/x/skills/isswf-coordinator/SKILL.md')]);
  await fresh.emit('session_start', { reason: 'resume' });
  assert.deepEqual(last(fresh).lines, expected, 'resume with a stored read of the skill');
  await fresh.emit('session_shutdown', {});

  // No project records are read unless the project is trusted, the mode is the TUI and the UI has setWidget.
  const coordinator = [{ type: 'message', message: { role: 'user', content: expanded('isswf-coordinator') } }];
  for (const options of [{ trusted: false }, { mode: 'rpc' }, { mode: 'print' }, { noWidget: true }]) {
    const io = watched();
    const blocked = session({ ...options, branch: coordinator, io: { fs: io.fs } });
    await blocked.emit('session_start', { reason: 'startup' });
    await blocked.emit('agent_settled', { aborted: false });
    await blocked.emit('input', { text: '/skill:isswf-coordinator' });
    assert.deepEqual(blocked.widgets, [], `nothing shown for ${JSON.stringify(options)}`);
    assert.deepEqual(io.calls, [], `no record read for ${JSON.stringify(options)}`);
    await blocked.emit('session_shutdown', {});
  }

  // The same session ungated does read the records, so the empty list above is not an artefact of the seam.
  const control = watched();
  const reading = session({ branch: coordinator, io: { fs: control.fs } });
  await reading.emit('session_start', { reason: 'startup' });
  assert.ok(control.calls.includes('read'), 'a gated-in session reads the plans through the seam');
  await reading.emit('session_shutdown', {});

  // A tool result does not wait for the read, and a refresh asked for during a read is run again afterwards instead of dropped.
  const slow = watched();
  const busy = session({ branch: coordinator, io: { fs: slow.fs } });
  await busy.emit('session_start', { reason: 'startup' });
  assert.deepEqual(last(busy).lines, expected);
  slow.arm();
  const returned = busy.call('tool_result', { toolName: 'bash' });
  assert.equal(await within(slow.reached, 1000), true, 'the tool result started a read');
  assert.equal(await within(returned, 1000), true, 'the tool_result handler returns while the read is in progress');
  await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), plan('I0001', 'Active work', [['J001', 'completed'], ['J002', 'completed'], ['J003', 'completed'], ['J004', 'pending']]));
  await busy.call('agent_settled', { aborted: false });
  slow.release();
  await new Promise(settle => setTimeout(settle, 200));
  assert.deepEqual(last(busy).lines, ['I0001 Active work · 1 open · next J004', '○ 1 unopened: I0002'], 'the refresh asked for during the read ran afterwards');
  await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), files['I0001/plan.md']);
  await busy.emit('session_shutdown', {});

  // The state directory must be a regular directory: a link in its place is refused, as the status tools do.
  const linked = join(root, 'linked');
  await mkdir(linked);
  await symlink(join(project, '.factory'), join(linked, '.factory'), 'junction');
  const through = session({ branch: coordinator, cwd: linked });
  await through.emit('session_start', { reason: 'startup' });
  assert.deepEqual(through.widgets, [], 'a linked state directory shows nothing');
  await through.emit('session_shutdown', {});

  // A project whose initiatives become unreadable clears the widget.
  const bare = session({ branch: coordinator });
  await bare.emit('session_start', { reason: 'startup' });
  assert.equal(last(bare).lines.length, 2);
  await rm(join(project, '.factory/initiatives'), { recursive: true });
  await bare.emit('agent_settled', {});
  assert.equal(last(bare).lines, undefined, 'an unreadable project clears the widget');
  await bare.emit('session_shutdown', {});
} finally {
  globalThis.setInterval = realSetInterval;
  globalThis.clearInterval = realClearInterval;
  await rm(root, { recursive: true, force: true });
}
console.log('PASS Pi initiatives widget: compact lines within the cap, latch rebuilt from stored entries, trust, mode and setWidget gates, refresh and timer');
