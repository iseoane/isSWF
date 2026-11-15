import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { guardDispatch } = await load('tools/isswf-dispatch-guard-core.mjs');
const { default: registerGuard } = await load('tools/isswf-dispatch-guard-pi-extension.mjs');
const { buildEnvelope, sha256Hex } = await load('tools/isswf-handoff-core.mjs');

const CHECKPOINT = 'a1'.repeat(20);
const BASE = 'b2'.repeat(20);
const BRIEF = '.factory/initiatives/I0001/jobs/J001/brief-r1.md';
const job = (id, status) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- ${status === 'completed' ? 'Merged.' : 'None.'}\n`;
const plan = (...jobs) => `# I0001: Synthetic\n\nType: bug\n\n${jobs.join('\n')}`;
const dispatchPrompt = (extra = '') => `Work on the brief ${BRIEF}.\nInput checkpoint ${CHECKPOINT}.\nTarget base: main ${BASE}.\n${extra}`;
const selectionFile = agents => JSON.stringify({ schemaVersion: 1, agents });
const PI_MODEL = 'openai-codex/gpt-6-luna';
// Entries are keyed by host, then by agent, so one bare name can carry a different model on each host.
const claudeAgents = {
  claude: {
    'isswf:isswf-worker': { model: 'sonnet', effort: 'medium' },
    'isswf-worker': { model: 'sonnet', effort: 'medium' },
    'isswf:isswf-reviewer': { model: 'opus', effort: 'medium' },
  },
  pi: {
    'isswf-worker': { model: PI_MODEL, effort: 'high' },
    'isswf-researcher': { model: PI_MODEL, effort: 'high' },
  },
};

// The in-memory io behaves like Claude's `$.fs` and `$.process.run`: it rejects a missing path and lists `{ name, kind }`.
// `git` answers the two Git questions the guard asks, by exit code.
const memoryIo = ({ project = '/work/project', files: raw = {}, dirs = ['.factory'], tracked = true, ignored = false, committed = true, git } = {}) => {
  const norm = path => path.replaceAll('\\', '/');
  const files = Object.fromEntries(Object.entries(raw).map(([path, text]) => [norm(path), text]));
  const calls = { git: [], read: [] };
  return {
    calls,
    project: () => project,
    read: async path => {
      calls.read.push(path);
      if (!(norm(path) in files)) throw Error('ENOENT');
      return files[norm(path)];
    },
    readBytes: async path => {
      calls.read.push(path);
      if (!(norm(path) in files)) throw Error('ENOENT');
      const value = files[norm(path)];
      return typeof value === 'string' ? new TextEncoder().encode(value) : value;
    },
    list: async () => dirs.map(name => ({ name, kind: 'dir' })),
    stat: async path => {
      if (!(norm(path) in files)) throw Error('ENOENT');
      return { kind: 'file', size: files[norm(path)].length };
    },
    git: git ?? (async argv => {
      calls.git.push(argv);
      if (argv[0] === 'ls-files') return tracked ? 0 : 1;
      if (argv[0] === 'check-ignore') return ignored ? 0 : 1;
      if (argv[0] === 'cat-file') return committed ? 0 : 128;
      throw Error(`unexpected git ${argv.join(' ')}`);
    }),
  };
};
const project = (overrides = {}, root = '/work/project') => ({
  project: root,
  files: {
    [`${root}/.factory/dispatch-selection.json`]: selectionFile(claudeAgents),
    [`${root}/.factory/initiatives/I0001/plan.md`]: plan(job('J001', 'in-progress')),
    [`${root}/${BRIEF}`]: '# brief\n',
  },
  ...overrides,
});
const claudeCall = (overrides = {}) => ({ tool: 'Agent', subagent_type: 'isswf:isswf-worker', model: 'sonnet', effort: 'medium', run_in_background: false, description: 'x', prompt: dispatchPrompt(), ...overrides });
const claude = (input, io) => guardDispatch({ host: 'claude', input, io });
const refused = (verdict, condition, ...parts) => {
  assert.equal(typeof verdict.deny, 'string', JSON.stringify(verdict));
  assert.equal(verdict.condition, condition, verdict.deny);
  for (const part of parts) assert.ok(verdict.deny.includes(part), `${part}\n${verdict.deny}`);
};

// Condition 1: only isSWF role agents are checked; any other call is allowed and no input is read.
for (const subagent_type of [undefined, 'general-purpose', 'Explore', 'isswf:other', 'my-isswf-worker', 'isswf', '']) {
  const io = memoryIo({ files: {} });
  io.project = () => { throw Error('must not be asked'); };
  assert.deepEqual(await claude(claudeCall({ subagent_type, model: undefined, effort: undefined, prompt: 'hi' }), io), { allow: true }, String(subagent_type));
}

// A delegation that meets every condition is allowed, for the plugin name and the bare name, and carries nothing that reads as a grant.
for (const subagent_type of ['isswf:isswf-worker', 'isswf-worker']) {
  const io = memoryIo(project());
  assert.deepEqual(await claude(claudeCall({ subagent_type }), io), { allow: true }, subagent_type);
  assert.deepEqual(io.calls.git.map(argv => argv.slice(0, 3)), [['ls-files', '--error-unmatch', '--'], ['check-ignore', '--no-index', '-q'], ['cat-file', '-e', `${CHECKPOINT}:./${BRIEF}`]]);
  assert.equal(io.calls.git[2][2], `${CHECKPOINT}:./${BRIEF}`, 'the brief must exist at the named checkpoint');
}
// Windows spelling of the project root works the same.
assert.deepEqual(await claude(claudeCall(), memoryIo(project({}, 'C:\\work\\project'))), { allow: true }, 'a backslash project root');
// `.isswf` is a state directory too.
{
  const files = Object.fromEntries(Object.entries(project().files).map(([path, text]) => [path.replace('/.factory/', '/.isswf/'), text]));
  assert.deepEqual(await claude(claudeCall({ prompt: dispatchPrompt().replace('.factory/', '.isswf/') }), memoryIo({ files, dirs: ['.isswf'] })), { allow: true }, '.isswf');
}

// Condition 2: the selection file and the agent's own entry.
{
  const base = project();
  const withSelection = text => memoryIo({ ...base, files: { ...base.files, '/work/project/.factory/dispatch-selection.json': text } });
  const noFile = { ...base.files };
  delete noFile['/work/project/.factory/dispatch-selection.json'];
  refused(await claude(claudeCall(), memoryIo({ ...base, files: noFile })), 'selection', 'dispatch-selection.json', 'missing');
  refused(await claude(claudeCall(), withSelection('{not json')), 'selection', 'valid JSON');
  refused(await claude(claudeCall(), withSelection(JSON.stringify({ schemaVersion: 2, agents: claudeAgents }))), 'selection', 'schemaVersion');
  refused(await claude(claudeCall(), withSelection(JSON.stringify({ schemaVersion: 1 }))), 'selection', 'agents');
  refused(await claude(claudeCall(), withSelection(JSON.stringify({ schemaVersion: 1, agents: { 'isswf:isswf-worker': { model: 'sonnet', effort: 'medium' } } }))), 'selection', 'no entry', 'claude');
  refused(await claude(claudeCall({ subagent_type: 'isswf:isswf-planner' }), withSelection(selectionFile(claudeAgents))), 'selection', 'isswf:isswf-planner', 'no entry');
  refused(await claude(claudeCall(), withSelection(selectionFile({ claude: { 'isswf:isswf-worker': { model: 'sonnet' } } }))), 'selection', 'effort', 'entry');
  // An agent listed only under another host has no entry for this one.
  refused(await claude(claudeCall({ subagent_type: 'isswf:isswf-researcher', model: PI_MODEL, effort: 'high' }), memoryIo(base)), 'selection', 'no entry', 'isswf:isswf-researcher', 'claude');
  refused(await claude(claudeCall({ model: PI_MODEL, effort: 'high' }), memoryIo(base)), 'selection', 'model', 'sonnet');
  // The same bare name carries its own model on each host.
  const piWorker = model => guardDispatch({ host: 'pi', input: { agent: 'isswf-worker', task: dispatchPrompt(), model }, io: memoryIo(base) });
  assert.deepEqual(await claude(claudeCall({ subagent_type: 'isswf-worker' }), memoryIo(base)), { allow: true }, 'claude entry of the bare name');
  assert.deepEqual(await piWorker(`${PI_MODEL}:high`), { allow: true }, 'pi entry of the same bare name');
  refused(await piWorker('sonnet:medium'), 'selection', 'model', PI_MODEL);
  refused(await claude(claudeCall(), memoryIo({ ...base, dirs: ['.factory', '.isswf'] })), 'selection', '.isswf', '.factory');
  refused(await claude(claudeCall(), memoryIo({ ...base, dirs: [] })), 'selection', 'state directory');

  refused(await claude(claudeCall({ model: undefined }), memoryIo(base)), 'selection', 'model', 'no model', 'sonnet');
  refused(await claude(claudeCall({ effort: undefined }), memoryIo(base)), 'selection', 'effort', 'no effort', 'medium');
  refused(await claude(claudeCall({ model: 'opus' }), memoryIo(base)), 'selection', 'model', 'opus', 'sonnet');
  refused(await claude(claudeCall({ effort: 'high' }), memoryIo(base)), 'selection', 'effort', 'high', 'medium');
  refused(await claude(claudeCall({ model: '' }), memoryIo(base)), 'selection', 'no model');
}

// The Override line replaces the entry for that one call and nothing else.
{
  const base = project();
  const override = (line, call = {}) => claude(claudeCall({ prompt: dispatchPrompt(line), ...call }), memoryIo(base));
  assert.deepEqual(await override('Override: model=opus effort=high', { model: 'opus', effort: 'high' }), { allow: true }, 'a matching override');
  refused(await override('Override: model=opus effort=high'), 'selection', 'model', 'sonnet', 'Override');
  refused(await override('Override: model=opus effort=high', { model: 'opus' }), 'selection', 'effort', 'medium', 'high');
  refused(await override('Override: model=opus'), 'selection', 'Override: model=<m> effort=<e>');
  refused(await override('Override: model=opus effort=high\nOverride: model=haiku effort=low', { model: 'opus', effort: 'high' }), 'selection', 'one Override');
  refused(await override('Note: Override: model=opus effort=high mid-line is not a line start', { model: 'opus', effort: 'high' }), 'selection', 'sonnet');
  // The override does not waive the other conditions.
  refused(await claude(claudeCall({ model: 'opus', effort: 'high', prompt: `Override: model=opus effort=high\nbrief ${BRIEF}` }), memoryIo(base)), 'references');
  refused(await claude(claudeCall({ subagent_type: 'isswf:isswf-planner', model: 'opus', effort: 'low', prompt: dispatchPrompt('Override: model=opus effort=low') }), memoryIo(base)), 'selection', 'no entry');
}

// Condition 3: the prompt names a brief path and two full SHAs.
{
  const io = () => memoryIo(project());
  refused(await claude(claudeCall({ prompt: `checkpoint ${CHECKPOINT} base ${BASE}` }), io()), 'references', 'brief');
  refused(await claude(claudeCall({ prompt: `${BRIEF} base ${BASE}` }), io()), 'references', 'checkpoint');
  refused(await claude(claudeCall({ prompt: `${BRIEF} checkpoint ${CHECKPOINT}` }), io()), 'references', 'base');
  refused(await claude(claudeCall({ prompt: `${BRIEF} checkpoint ${CHECKPOINT.slice(0, 12)} base ${BASE}` }), io()), 'references', 'checkpoint');
  refused(await claude(claudeCall({ prompt: `${BRIEF} checkpoint ${CHECKPOINT} base ${BASE.slice(0, 39)}` }), io()), 'references', 'base');
  refused(await claude(claudeCall({ prompt: `${BRIEF} checkpoint ${CHECKPOINT}0 base ${BASE}` }), io()), 'references', 'checkpoint');
  refused(await claude(claudeCall({ prompt: `.factory/initiatives/I0001/jobs/J001/notes.md checkpoint ${CHECKPOINT} base ${BASE}` }), io()), 'references', 'brief');
  refused(await claude(claudeCall({ prompt: undefined }), io()), 'references', 'brief');
  // A Windows-spelled brief path and a prompt with the SHAs on one line are fine.
  assert.deepEqual(await claude(claudeCall({ prompt: `C:\\work\\project\\.factory\\initiatives\\I0001\\jobs\\J001\\brief-r1.md, checkpoint ${CHECKPOINT}, base ${BASE}` }), io()), { allow: true });
}

// A Pi management action is exempt only when it names no isSWF role agent anywhere.
{
  const pi = input => guardDispatch({ host: 'pi', input, io: memoryIo({ files: {}, dirs: [] }) });
  assert.deepEqual(await pi({ action: 'list' }), { allow: true }, 'a plain management action');
  assert.deepEqual(await pi({ action: 'list', agent: 'scout' }), { allow: true }, 'an action that names another agent');
  for (const input of [{ action: 'run', agent: 'isswf-worker', task: 'x' }, { action: 'unknown', tasks: [{ agent: 'isswf-worker' }] }, { action: 'x', chain: [{ parallel: [{ agent: 'isswf-reviewer' }] }] }]) {
    refused(await pi(input), 'selection', 'state directory');
  }
}

// Condition 4: the plan parses and the named job is in-progress.
{
  const at = text => memoryIo(project({ files: { ...project().files, '/work/project/.factory/initiatives/I0001/plan.md': text } }));
  for (const status of ['pending', 'blocked', 'in-review', 'awaiting-human', 'completed']) {
    refused(await claude(claudeCall(), at(plan(job('J001', status), job('J002', 'in-progress')))), 'plan', 'J001', status, 'in-progress');
  }
  refused(await claude(claudeCall(), at(plan(job('J002', 'in-progress')))), 'plan', 'J001', 'not in the plan');
  refused(await claude(claudeCall(), at(plan(job('J001', 'invented')))), 'plan', 'invalid-job', 'Status');
  refused(await claude(claudeCall(), at('not a plan')), 'plan', 'invalid-plan-type');
  refused(await claude(claudeCall(), at(`${plan(job('J001', 'in-progress'))}${'x'.repeat(1024 * 1024)}`)), 'plan', '1 MiB');
  const noPlan = project();
  delete noPlan.files['/work/project/.factory/initiatives/I0001/plan.md'];
  refused(await claude(claudeCall(), memoryIo(noPlan)), 'plan', 'plan.md');
  assert.deepEqual(await claude(claudeCall(), at(plan(job('J002', 'pending'), job('J001', 'in-progress')))), { allow: true }, 'other jobs do not matter');
}

// Condition 5: the brief exists, is tracked and is not ignored; a Git failure refuses.
{
  const noBrief = project();
  delete noBrief.files[`/work/project/${BRIEF}`];
  refused(await claude(claudeCall(), memoryIo(noBrief)), 'brief', 'brief-r1.md', 'does not exist');
  refused(await claude(claudeCall(), memoryIo(project({ tracked: false }))), 'brief', 'not tracked');
  refused(await claude(claudeCall(), memoryIo(project({ ignored: true }))), 'brief', 'ignored');
  refused(await claude(claudeCall(), memoryIo(project({ git: async () => { throw Error('git is not available'); } }))), 'brief', 'git is not available');
  refused(await claude(claudeCall(), memoryIo(project({ git: async argv => (argv[0] === 'ls-files' ? 0 : 128) }))), 'brief', 'check-ignore');
  refused(await claude(claudeCall(), memoryIo(project({ committed: false }))), 'brief', 'checkpoint', CHECKPOINT);
}

// Condition 6: a reviewer dispatch carries the handoff the tool wrote, and the handoff, its digest and the diff file all verify.
const CANDIDATE = 'c3'.repeat(20);
const HANDOFF_PATH = '/tmp/handoffs/J001-c3c3c3c3c3c3.handoff.json';
const DIFF_PATH = '/tmp/handoffs/J001-c3c3c3c3c3c3.diff';
const bytesOf = text => new TextEncoder().encode(text);
const DIFF = bytesOf('diff --git a/x b/x\n+changed\n');
const envelopeOf = diff => buildEnvelope({
  initiative: 'I0001', job: 'J001', base: BASE, candidate: CANDIDATE,
  diff: { path: DIFF_PATH, argv: ['diff'], bytes: diff.length, sha256: sha256Hex(diff) },
  brief: { path: BRIEF, revision: '1', checkpoint: CHECKPOINT, blob: null }, reviewGuide: null, round: 1, priorReviews: [],
  reviewer: { host: 'claude', agent: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium' }, resources: [],
});
const reviewerCall = prompt => claudeCall({ subagent_type: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium', prompt });
// `mutate` changes the envelope before it is hashed, `tamper` changes the stored handoff bytes afterwards, `stored` replaces the diff file.
const handoffCase = ({ mutate, tamper, stored = DIFF, drop = [], handoffPath = HANDOFF_PATH, line = digest => `handoff: ${handoffPath}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}` } = {}) => {
  const envelope = envelopeOf(DIFF);
  mutate?.(envelope);
  const genuine = bytesOf(JSON.stringify(envelope, null, 2));
  const files = { ...project().files, [handoffPath]: tamper?.(genuine) ?? genuine, [DIFF_PATH]: stored };
  for (const path of drop) delete files[path];
  return { io: memoryIo({ ...project(), files }), prompt: dispatchPrompt(line(sha256Hex(genuine))) };
};
const reviewed = async options => {
  const { io, prompt } = handoffCase(options);
  return claude(reviewerCall(prompt), io);
};
assert.deepEqual(await reviewed(), { allow: true }, 'a verifying handoff');
assert.deepEqual(await reviewed({ handoffPath: 'C:\\tmp\\handoffs\\J001.handoff.json' }), { allow: true }, 'a Windows handoff path');
assert.deepEqual(await reviewed({ line: digest => `handoff ${HANDOFF_PATH}\nhandoff-sha256 ${digest}\ncandidate: ${CANDIDATE}` }), { allow: true }, 'the labels with or without a colon');
// Only a reviewer needs a handoff; the worker dispatch above carries none.
assert.deepEqual(await claude(claudeCall({ subagent_type: 'isswf-worker' }), memoryIo(project())), { allow: true });
refused(await claude(reviewerCall(dispatchPrompt()), memoryIo(project())), 'handoff', 'handoff');
refused(await reviewed({ line: digest => `handoff-sha256: ${digest}\ncandidate ${CANDIDATE}` }), 'handoff', 'handoff');
refused(await reviewed({ line: () => `handoff: ${HANDOFF_PATH}\ncandidate ${CANDIDATE}` }), 'handoff', 'handoff-sha256');
refused(await reviewed({ line: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest.slice(0, 40)}\ncandidate ${CANDIDATE}` }), 'handoff', 'handoff-sha256');
refused(await reviewed({ line: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}` }), 'handoff', 'candidate');
refused(await reviewed({ line: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE.slice(0, 12)}` }), 'handoff', 'candidate');
refused(await reviewed({ line: digest => `handoff: handoffs/h.json\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}` }), 'handoff', 'absolute');
refused(await reviewed({ drop: [HANDOFF_PATH] }), 'handoff', 'cannot be read');
refused(await reviewed({ tamper: bytes => bytesOf(`${new TextDecoder().decode(bytes)} `) }), 'handoff', 'does not match');
refused(await reviewed({ tamper: () => bytesOf('{not json') }), 'handoff', 'does not match');
refused(await reviewed({ mutate: envelope => { envelope.schema = 'isswf.handoff/2'; } }), 'handoff', 'schema');
refused(await reviewed({ mutate: envelope => { envelope.kind = 'work'; } }), 'handoff', 'review');
refused(await reviewed({ mutate: envelope => { envelope.candidate = 'd4'.repeat(20); } }), 'handoff', 'candidate');
refused(await reviewed({ mutate: envelope => { envelope.base = 'd4'.repeat(20); } }), 'handoff', 'base');
refused(await reviewed({ mutate: envelope => { envelope.job = 'J002'; } }), 'handoff', 'job');
refused(await reviewed({ mutate: envelope => { envelope.initiative = 'I0002'; } }), 'handoff', 'initiative');
refused(await reviewed({ mutate: envelope => { envelope.brief.checkpoint = 'd4'.repeat(20); } }), 'handoff', 'checkpoint');
refused(await reviewed({ mutate: envelope => { envelope.brief.revision = '2'; } }), 'handoff', 'revision');
refused(await reviewed({ drop: [DIFF_PATH] }), 'handoff', 'diff', 'cannot be read');
refused(await reviewed({ stored: bytesOf('diff --git a/x b/x\n+CHANGED\n') }), 'handoff', 'diff', 'sha-256');
refused(await reviewed({ stored: bytesOf('diff --git a/x b/x\n+changed\n+more\n') }), 'handoff', 'diff', 'bytes');
refused(await reviewed({ mutate: envelope => { envelope.diff.path = 'relative.diff'; } }), 'handoff', 'diff', 'absolute');
{
  // A runtime that cannot read bytes makes the check fail, not pass.
  const { io, prompt } = handoffCase();
  delete io.readBytes;
  refused(await claude(reviewerCall(prompt), io), 'handoff', 'cannot be read');
}
// The handoff check follows the others: a reviewer with no brief is refused for the brief first.
{
  const base = project();
  delete base.files[`/work/project/${BRIEF}`];
  refused(await claude(reviewerCall(handoffCase().prompt), memoryIo(base)), 'brief');
}

// The guard fails closed for an isSWF role call and never for another agent.
{
  const broken = memoryIo(project());
  broken.project = () => { throw Error('cwd is gone'); };
  refused(await claude(claudeCall(), broken), 'error', 'dispatch guard error: cwd is gone');
  const noList = memoryIo(project());
  noList.list = async () => { throw Error('EACCES'); };
  refused(await claude(claudeCall(), noList), 'error', 'dispatch guard error: EACCES');
  assert.deepEqual(await claude(claudeCall({ subagent_type: 'general-purpose' }), broken), { allow: true }, 'another agent is unaffected');
  refused(await guardDispatch({ host: 'claude', input: claudeCall(), io: undefined }), 'error', 'dispatch guard error');
  assert.deepEqual(await guardDispatch({ host: 'claude', input: undefined, io: undefined }), { allow: true }, 'no call, nothing to guard');
}
// Pi: the extension blocks a `subagent` call in a real project with a real Git repository.
const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-dispatch-guard-')));
const git = (cwd, ...args) => {
  const result = spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const piAgents = {
  pi: {
    'isswf-worker': { model: PI_MODEL, effort: 'high' },
    'isswf-reviewer': { model: 'vendor/model:free', effort: 'low' },
  },
  claude: { 'isswf-planner': { model: 'opus', effort: 'low' } },
};
try {
  const root = join(temp, 'project');
  const write = async (path, text) => {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), text);
  };
  await write('.factory/dispatch-selection.json', selectionFile(piAgents));
  await write('.factory/initiatives/I0001/plan.md', plan(job('J001', 'in-progress')));
  await write(BRIEF, '# brief\n');
  await write('.gitignore', 'brief-r3.md\n');
  git(temp, 'init', '-q', 'project');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'fixture');
  const head = git(root, 'rev-parse', 'HEAD');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r2.md', '# untracked\n');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r3.md', '# ignored\n');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r4.md', '# later\n');

  const handlers = [];
  registerGuard({ on: (name, handler) => handlers.push([name, handler]) });
  assert.deepEqual(handlers.map(([name]) => name), ['tool_call'], 'only the call event is used');
  const [[, handler]] = handlers;
  const ctx = { cwd: root };
  const call = (input, context = ctx, toolName = 'subagent') => handler({ type: 'tool_call', toolName, toolCallId: 't1', input }, context);
  // The checkpoint is the fixture commit, so the brief exists at it.
  const task = (extra = '', brief = BRIEF) => dispatchPrompt(extra).replace(BRIEF, brief).replace(CHECKPOINT, head);
  const blocked = (result, ...parts) => {
    assert.equal(result?.block, true, `expected a block, got ${JSON.stringify(result)}`);
    for (const part of parts) assert.ok(result.reason.includes(part), `${part}\n${result.reason}`);
  };

  // An allowed call, and the calls the guard does not own, return nothing so the tool runs unchanged.
  assert.equal(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` }), undefined, 'a call that meets every condition');
  // A reviewer call also needs a handoff that verifies against the real files, which live outside the project.
  const handoffDir = join(temp, 'handoffs');
  await mkdir(handoffDir);
  const handoffEnvelope = buildEnvelope({
    initiative: 'I0001', job: 'J001', base: BASE, candidate: CANDIDATE,
    diff: { path: join(handoffDir, 'x.diff'), argv: ['diff'], bytes: DIFF.length, sha256: sha256Hex(DIFF) },
    brief: { path: BRIEF, revision: '1', checkpoint: head, blob: null }, reviewGuide: null, round: 1, priorReviews: [],
    reviewer: { host: 'pi', agent: 'isswf-reviewer', model: 'vendor/model:free', effort: 'low' }, resources: [],
  });
  const handoffText = bytesOf(JSON.stringify(handoffEnvelope, null, 2));
  await writeFile(join(handoffDir, 'x.diff'), DIFF);
  await writeFile(join(handoffDir, 'x.handoff.json'), handoffText);
  const handoffLines = (digest = sha256Hex(handoffText)) => `handoff: ${join(handoffDir, 'x.handoff.json')}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}`;
  assert.equal(await call({ agent: 'isswf-reviewer', task: task(handoffLines()), model: 'vendor/model:free:low' }), undefined, 'a model id that contains a colon, with a verifying handoff');
  blocked(await call({ agent: 'isswf-reviewer', task: task(), model: 'vendor/model:free:low' }), 'handoff');
  blocked(await call({ agent: 'isswf-reviewer', task: task(handoffLines('0'.repeat(64))), model: 'vendor/model:free:low' }), 'does not match');
  await writeFile(join(handoffDir, 'x.diff'), bytesOf('diff --git a/x b/x\n+CHANGED\n'));
  blocked(await call({ agent: 'isswf-reviewer', task: task(handoffLines()), model: 'vendor/model:free:low' }), 'diff', 'sha-256');
  await writeFile(join(handoffDir, 'x.diff'), DIFF);
  assert.equal(await call({ agent: 'scout', task: 'look', model: 'x' }), undefined, 'another agent');
  assert.equal(await call({ action: 'list' }), undefined, 'a management call');
  blocked(await call({ action: 'run', agent: 'isswf-worker', task: 'x', model: `${PI_MODEL}:high` }), 'brief');
  assert.equal(await call({ agent: 'isswf-worker', task: 'x' }, ctx, 'bash'), undefined, 'another tool');

  // Condition 2 reads the model and the thinking suffix.
  blocked(await call({ agent: 'isswf-worker', task: task(), model: PI_MODEL }), 'effort', 'no effort', 'high');
  blocked(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:low` }), 'effort', 'low', 'high');
  blocked(await call({ agent: 'isswf-worker', task: task(), model: 'other/model:high' }), 'model', 'other/model');
  blocked(await call({ agent: 'isswf-worker', task: task() }), 'no model');
  blocked(await call({ agent: 'isswf-reviewer', task: task(), model: 'vendor/model:free' }), 'effort', 'no effort', 'low');
  blocked(await call({ agent: 'isswf-planner', task: task(), model: 'opus:low' }), 'no entry', 'pi');
  blocked(await call({ agent: 'isswf-researcher', task: task(), model: 'x:low' }), 'no entry');
  assert.equal(await call({ agent: 'isswf-worker', task: task('Override: model=other/model effort=xhigh'), model: 'other/model:xhigh' }), undefined, 'the override line');
  blocked(await call({ agent: 'isswf-worker', task: task('Override: model=other/model effort=xhigh'), model: `${PI_MODEL}:high` }), 'Override');

  // Conditions 3, 4 and 5 through the real plan and Git.
  blocked(await call({ agent: 'isswf-worker', task: 'do it', model: `${PI_MODEL}:high` }), 'brief');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r9')), model: `${PI_MODEL}:high` }), 'does not exist');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r2')), model: `${PI_MODEL}:high` }), 'not tracked');
  // A force-added brief under an ignored path is still tracked, so only `check-ignore --no-index` refuses it.
  git(root, 'add', '-f', '.factory/initiatives/I0001/jobs/J001/brief-r3.md');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r3')), model: `${PI_MODEL}:high` }), 'ignored by Git');
  // A brief that is only staged is not committed at the checkpoint.
  git(root, 'add', '.factory/initiatives/I0001/jobs/J001/brief-r4.md');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r4')), model: `${PI_MODEL}:high` }), 'checkpoint', head);
  await write('.factory/initiatives/I0001/plan.md', plan(job('J001', 'pending')));
  blocked(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` }), 'J001', 'pending');
  await write('.factory/initiatives/I0001/plan.md', plan(job('J001', 'in-progress')));

  // Parallel tasks and chain steps are each checked, and a step without a task uses the request's.
  const good = { agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` };
  assert.equal(await call({ tasks: [good, { ...good, agent: 'scout' }] }), undefined, 'parallel children that pass');
  blocked(await call({ tasks: [good, { ...good, model: `${PI_MODEL}:low` }] }), 'effort');
  blocked(await call({ chain: [{ agent: 'scout', task: 'x' }, { parallel: [good, { ...good, agent: 'isswf-planner' }] }] }), 'isswf-planner', 'no entry');
  assert.equal(await call({ task: task(), chain: [{ agent: 'isswf-worker', model: `${PI_MODEL}:high` }] }), undefined, 'a step uses the original request');
  blocked(await call({ task: 'no references', chain: [{ agent: 'isswf-worker', model: `${PI_MODEL}:high` }] }), 'brief');

  // Without a Git repository the brief check cannot pass; a guard failure refuses the isSWF role call only.
  const plain = join(temp, 'plain');
  await mkdir(join(plain, '.factory/initiatives/I0001/jobs/J001'), { recursive: true });
  for (const path of ['.factory/dispatch-selection.json', '.factory/initiatives/I0001/plan.md', BRIEF]) await writeFile(join(plain, path), await readFile(join(root, path)));
  blocked(await call(good, { cwd: plain }), 'brief', 'not tracked');
  blocked(await call(good, null), 'dispatch guard error');
  blocked(await call(good, { cwd: join(temp, 'missing') }), 'dispatch guard error');
  assert.equal(await call({ agent: 'scout', task: 'x' }, null), undefined, 'another agent is unaffected by a guard failure');

  // A project in a subdirectory of its repository: the commit check resolves the brief from the project, like the other Git checks.
  const outer = join(temp, 'outer');
  const nested = join(outer, 'sub/project');
  for (const path of ['.factory/dispatch-selection.json', '.factory/initiatives/I0001/plan.md', BRIEF]) {
    await mkdir(join(nested, path, '..'), { recursive: true });
    await writeFile(join(nested, path), await readFile(join(root, path)));
  }
  git(outer, 'init', '-q', '.');
  git(outer, 'add', '-A');
  git(outer, 'commit', '-qm', 'fixture');
  const outerHead = git(outer, 'rev-parse', 'HEAD');
  const nestedTask = (brief = BRIEF) => dispatchPrompt('').replace(BRIEF, brief).replace(CHECKPOINT, outerHead);
  const nestedCall = brief => call({ agent: 'isswf-worker', task: nestedTask(brief), model: `${PI_MODEL}:high` }, { cwd: nested });
  assert.equal(await nestedCall(), undefined, 'a committed brief in a project below the repository root');
  await writeFile(join(nested, '.factory/initiatives/I0001/jobs/J001/brief-r2.md'), '# staged only\n');
  git(outer, 'add', 'sub/project/.factory/initiatives/I0001/jobs/J001/brief-r2.md');
  blocked(await nestedCall(BRIEF.replace('r1', 'r2')), 'checkpoint', outerHead);
} finally {
  await rm(temp, { recursive: true, force: true });
}
// Packaging: the package declares the extension for the Pi main session, next to the record guard's.
const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
assert.deepEqual(manifest.pi.extensions, ['./tools/isswf-record-guard-pi-extension.mjs', './tools/isswf-dispatch-guard-pi-extension.mjs', './tools/isswf-command-guard-pi-extension.mjs', './tools/isswf-compaction-pi-extension.mjs']);

// Claude: the one `tool.call` hook (the engine refuses a second unmatched one) refuses an Agent call before `next(e)`,
// whatever the pane option is, and runs Git through `$.process.run`. register.tsx has no runner, so this is a source check.
const hooks = await readFile(join(source, 'hooks/register.tsx'), 'utf8');
const hookAt = hooks.indexOf("on('tool.call'");
const hook = hooks.slice(hookAt);
assert.equal(hooks.match(/on\('tool\.call'/gu).length, 1, 'a single tool.call hook');
assert.ok(hookAt < hooks.indexOf('options?.initiativesPane !== true'), 'registered whatever the pane option is');
const guardAt = hook.indexOf('guardDispatch(');
assert.ok(guardAt > 0 && guardAt < hook.indexOf('await next(e)'), 'the guard runs before the tool is called');
assert.ok(hook.slice(0, guardAt).includes("e.tool === 'Agent'"), 'only the Agent tool is guarded');
for (const part of ["host: 'claude'", '$.process.run(', '$.session.cwd()', '$.fs.read(', '$.fs.list(', '$.fs.stat(', "as: 'bytes'", 'readBytes', 'return { deny:']) assert.ok(hook.includes(part), part);
// The reference parser stays linear on a long unbroken token and still returns the brief path with its state root.
{
  const { checkReferences } = await load('tools/isswf-dispatch-guard-core.mjs');
  const brief = '.factory/initiatives/I0057/jobs/J005/brief-r3.md';
  const prompt = `${'a'.repeat(200000)} ${brief} checkpoint ${'c'.repeat(40)} base ${'d'.repeat(40)}`;
  const started = performance.now();
  const refs = checkReferences(prompt);
  assert.ok(performance.now() - started < 200, 'checkReferences on a 200000-character token returns within 200 ms');
  assert.equal(refs.path, brief, 'the full path is kept with its state root');
}
console.log('PASS dispatch guard: shared core conditions, override line, fail-closed behavior, the Pi extension, its packaging and the Claude hook');
