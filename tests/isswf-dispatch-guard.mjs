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

const CHECKPOINT = 'a1'.repeat(20);
const BASE = 'b2'.repeat(20);
const BRIEF = '.factory/initiatives/I0001/jobs/J001/brief-r1.md';
const job = (id, status) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- ${status === 'completed' ? 'Merged.' : 'None.'}\n`;
const plan = (...jobs) => `# I0001: Synthetic\n\nType: bug\n\n${jobs.join('\n')}`;
const dispatchPrompt = (extra = '') => `Work on the brief ${BRIEF}.\nInput checkpoint ${CHECKPOINT}.\nTarget base: main ${BASE}.\n${extra}`;
const selectionFile = agents => JSON.stringify({ schemaVersion: 1, agents });
const claudeAgents = {
  'isswf:isswf-worker': { host: 'claude', model: 'sonnet', effort: 'medium' },
  'isswf-worker': { host: 'claude', model: 'sonnet', effort: 'medium' },
  'isswf:isswf-reviewer': { host: 'claude', model: 'opus', effort: 'medium' },
  'isswf:isswf-researcher': { host: 'pi', model: 'openai-codex/gpt-6-luna', effort: 'high' },
};

// The in-memory io behaves like Claude's `$.fs` and `$.process.run`: it rejects a missing path and lists `{ name, kind }`.
// `git` answers the two Git questions the guard asks, by exit code.
const memoryIo = ({ project = '/work/project', files: raw = {}, dirs = ['.factory'], tracked = true, ignored = false, git } = {}) => {
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
    list: async () => dirs.map(name => ({ name, kind: 'dir' })),
    stat: async path => {
      if (!(norm(path) in files)) throw Error('ENOENT');
      return { kind: 'file', size: files[norm(path)].length };
    },
    git: git ?? (async argv => {
      calls.git.push(argv);
      if (argv[0] === 'ls-files') return tracked ? 0 : 1;
      if (argv[0] === 'check-ignore') return ignored ? 0 : 1;
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
  assert.deepEqual(io.calls.git.map(argv => argv.slice(0, 3)), [['ls-files', '--error-unmatch', '--'], ['check-ignore', '-q', '--']]);
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
  refused(await claude(claudeCall({ subagent_type: 'isswf:isswf-planner' }), withSelection(selectionFile(claudeAgents))), 'selection', 'isswf:isswf-planner', 'no entry');
  refused(await claude(claudeCall(), withSelection(selectionFile({ 'isswf:isswf-worker': { host: 'claude', model: 'sonnet' } }))), 'selection', 'effort', 'entry');
  refused(await claude(claudeCall(), withSelection(selectionFile({ 'isswf:isswf-worker': { host: 'other', model: 'sonnet', effort: 'low' } }))), 'selection', 'host');
  refused(await claude(claudeCall({ subagent_type: 'isswf:isswf-researcher', model: 'openai-codex/gpt-6-luna', effort: 'high' }), memoryIo(base)), 'selection', 'host pi', 'claude');
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
};
const PI_MODEL = 'openai-codex/gpt-6-luna';
const piAgents = {
  'isswf-worker': { host: 'pi', model: PI_MODEL, effort: 'high' },
  'isswf-reviewer': { host: 'pi', model: 'vendor/model:free', effort: 'low' },
  'isswf-planner': { host: 'claude', model: 'opus', effort: 'low' },
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
  await write('.factory/initiatives/I0001/jobs/J001/brief-r2.md', '# untracked\n');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r3.md', '# ignored\n');

  const handlers = [];
  registerGuard({ on: (name, handler) => handlers.push([name, handler]) });
  assert.deepEqual(handlers.map(([name]) => name), ['tool_call'], 'only the call event is used');
  const [[, handler]] = handlers;
  const ctx = { cwd: root };
  const call = (input, context = ctx, toolName = 'subagent') => handler({ type: 'tool_call', toolName, toolCallId: 't1', input }, context);
  const task = (extra = '', brief = BRIEF) => dispatchPrompt(extra).replace(BRIEF, brief);
  const blocked = (result, ...parts) => {
    assert.equal(result?.block, true, `expected a block, got ${JSON.stringify(result)}`);
    for (const part of parts) assert.ok(result.reason.includes(part), `${part}\n${result.reason}`);
  };

  // An allowed call, and the calls the guard does not own, return nothing so the tool runs unchanged.
  assert.equal(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` }), undefined, 'a call that meets every condition');
  assert.equal(await call({ agent: 'isswf-reviewer', task: task(), model: 'vendor/model:free:low' }), undefined, 'a model id that contains a colon');
  assert.equal(await call({ agent: 'scout', task: 'look', model: 'x' }), undefined, 'another agent');
  assert.equal(await call({ action: 'list' }), undefined, 'a management call');
  assert.equal(await call({ agent: 'isswf-worker', task: 'x' }, ctx, 'bash'), undefined, 'another tool');

  // Condition 2 reads the model and the thinking suffix.
  blocked(await call({ agent: 'isswf-worker', task: task(), model: PI_MODEL }), 'effort', 'no effort', 'high');
  blocked(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:low` }), 'effort', 'low', 'high');
  blocked(await call({ agent: 'isswf-worker', task: task(), model: 'other/model:high' }), 'model', 'other/model');
  blocked(await call({ agent: 'isswf-worker', task: task() }), 'no model');
  blocked(await call({ agent: 'isswf-reviewer', task: task(), model: 'vendor/model:free' }), 'effort', 'vendor/model:free');
  blocked(await call({ agent: 'isswf-planner', task: task(), model: 'opus:low' }), 'host claude');
  blocked(await call({ agent: 'isswf-researcher', task: task(), model: 'x:low' }), 'no entry');
  assert.equal(await call({ agent: 'isswf-worker', task: task('Override: model=other/model effort=xhigh'), model: 'other/model:xhigh' }), undefined, 'the override line');
  blocked(await call({ agent: 'isswf-worker', task: task('Override: model=other/model effort=xhigh'), model: `${PI_MODEL}:high` }), 'Override');

  // Conditions 3, 4 and 5 through the real plan and Git.
  blocked(await call({ agent: 'isswf-worker', task: 'do it', model: `${PI_MODEL}:high` }), 'brief');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('J001', 'J009')), model: `${PI_MODEL}:high` }), 'does not exist');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r2')), model: `${PI_MODEL}:high` }), 'not tracked');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r3')), model: `${PI_MODEL}:high` }), 'not tracked');
  await write('.factory/initiatives/I0001/plan.md', plan(job('J001', 'pending')));
  blocked(await call({ agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` }), 'J001', 'pending');
  await write('.factory/initiatives/I0001/plan.md', plan(job('J001', 'in-progress')));
  // A tracked file that an ignore rule matches is reported as ignored once Git is told to look at it.
  git(root, 'add', '-f', '.factory/initiatives/I0001/jobs/J001/brief-r3.md');
  blocked(await call({ agent: 'isswf-worker', task: task('', BRIEF.replace('r1', 'r3')), model: `${PI_MODEL}:high` }), 'ignored');

  // Parallel tasks and chain steps are each checked, and a step without a task uses the request's.
  const good = { agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` };
  assert.equal(await call({ tasks: [good, { ...good, agent: 'scout' }] }), undefined, 'parallel children that pass');
  blocked(await call({ tasks: [good, { ...good, model: `${PI_MODEL}:low` }] }), 'effort');
  blocked(await call({ chain: [{ agent: 'scout', task: 'x' }, { parallel: [good, { ...good, agent: 'isswf-planner' }] }] }), 'isswf-planner', 'host claude');
  assert.equal(await call({ task: task(), chain: [{ agent: 'isswf-worker', model: `${PI_MODEL}:high` }] }), undefined, 'a step uses the original request');
  blocked(await call({ task: 'no references', chain: [{ agent: 'isswf-worker', model: `${PI_MODEL}:high` }] }), 'brief');

  // Without a Git repository the brief check cannot pass; a guard failure refuses the isSWF role call only.
  const plain = join(temp, 'plain');
  await mkdir(join(plain, '.factory/initiatives/I0001/jobs/J001'), { recursive: true });
  for (const path of ['.factory/dispatch-selection.json', '.factory/initiatives/I0001/plan.md', BRIEF]) await writeFile(join(plain, path), await readFile(join(root, path)));
  blocked(await call(good, { cwd: plain }), 'brief', 'not tracked');
  blocked(await call(good, undefined), 'dispatch guard error');
  blocked(await call(good, { cwd: join(temp, 'missing') }), 'dispatch guard error');
  assert.equal(await call({ agent: 'scout', task: 'x' }, undefined), undefined, 'another agent is unaffected by a guard failure');
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('PASS dispatch guard: shared core conditions, override line, fail-closed behavior and the Pi extension');
