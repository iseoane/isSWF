import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { guardDispatch } = await load('tools/isswf-dispatch-guard-core.mjs');
const { default: registerGuard } = await load('tools/isswf-dispatch-guard-pi-extension.mjs');
const { buildEnvelope, handoffReferences, sha256Hex } = await load('tools/isswf-handoff-core.mjs');
const { diffArguments } = await load('tools/git-evidence.mjs');

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
// The parallel-worker limit: a worker call counts the ledger entries; reviewers and other agents are not counted.
{
  const gitAnswers = mode => async argv => {
    if (argv[0] === 'rev-parse') return { exitCode: 0, stdout: '.git\n' };
    const value = { 'isswf.maxParallelWorkers': '1', 'isswf.parallelWorkersMode': mode }[argv.at(-1)];
    return value === undefined ? { exitCode: 1, stdout: '' } : { exitCode: 0, stdout: `${value}\n` };
  };
  const counted = (mode, open = 1) => {
    const io = memoryIo(project());
    const names = Array.from({ length: open }, (_, index) => ({ name: `t${index}.json`, kind: 'file' }));
    io.gitOut = gitAnswers(mode);
    io.list = async dir => (dir === '/work/project/.git/isswf/parallel-workers' ? names : [{ name: '.factory', kind: 'dir' }]);
    return io;
  };
  refused(await claude(claudeCall(), counted('enforce')), 'parallel-limit', '1 open', 'limit 1');
  const noted = await claude(claudeCall(), counted('observe'));
  assert.equal(noted.deny, undefined);
  assert.ok(noted.allow && noted.note.includes('1 open') && noted.note.includes('clear'), JSON.stringify(noted));
  assert.deepEqual(await claude(claudeCall(), counted('enforce', 0)), { allow: true }, 'below the limit');
  const down = counted('enforce');
  down.gitOut = async () => { throw Error('git is not available'); };
  assert.deepEqual(await claude(claudeCall(), Object.assign(counted('observe'), { gitOut: down.gitOut })), { allow: true }, 'a Git fault in observe mode');
  assert.deepEqual(await claude(claudeCall({ subagent_type: 'isswf:isswf-planner', prompt: dispatchPrompt() }), counted('enforce')).then(verdict => verdict.condition === 'parallel-limit'), false, 'only workers are counted');
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

// A read-only role (researcher, planner) may name a committed retrospective record instead of a job brief (#355).
{
  const RETRO = '.factory/retrospectives/2026-11-18-session.md';
  const readOnly = { 'isswf:isswf-researcher': { model: 'haiku', effort: 'high' }, 'isswf-planner': { model: 'opus', effort: 'low' } };
  const retroProject = (overrides = {}) => project({ files: {
    '/work/project/.factory/dispatch-selection.json': selectionFile({ ...claudeAgents, claude: { ...claudeAgents.claude, ...readOnly } }),
    [`/work/project/${RETRO}`]: '# retrospective\n',
  }, ...overrides });
  const retroPrompt = (path = RETRO) => `Analyse for the retrospective ${path}.\nInput checkpoint ${CHECKPOINT}.\n`;
  const researcher = (prompt = retroPrompt(), call = {}) => claudeCall({ subagent_type: 'isswf:isswf-researcher', model: 'haiku', effort: 'high', prompt, ...call });
  {
    const io = memoryIo(retroProject());
    assert.deepEqual(await claude(researcher(), io), { allow: true }, 'a researcher with a committed retrospective record');
    assert.deepEqual(io.calls.git.map(argv => argv.slice(0, 3)), [['ls-files', '--error-unmatch', '--'], ['check-ignore', '--no-index', '-q'], ['cat-file', '-e', `${CHECKPOINT}:./${RETRO}`]]);
  }
  assert.deepEqual(await claude(researcher(retroPrompt(), { subagent_type: 'isswf-planner', model: 'opus', effort: 'low' }), memoryIo(retroProject())), { allow: true }, 'a bare-name planner');
  assert.deepEqual(await claude(researcher(retroPrompt(RETRO.replaceAll('/', '\\'))), memoryIo(retroProject())), { allow: true }, 'a Windows-spelled record path');
  // Model and effort are still enforced.
  refused(await claude(researcher(retroPrompt(), { effort: 'low' }), memoryIo(retroProject())), 'selection', 'effort');
  // A worker or a reviewer without a job brief is still refused for the brief.
  refused(await claude(researcher(retroPrompt(), { subagent_type: 'isswf:isswf-worker', model: 'sonnet', effort: 'medium' }), memoryIo(retroProject())), 'references', 'brief');
  refused(await claude(researcher(retroPrompt(), { subagent_type: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium' }), memoryIo(retroProject())), 'references', 'brief');
  // The record needs a full checkpoint, must exist, be tracked, not ignored and committed at the checkpoint.
  refused(await claude(researcher(`retrospective ${RETRO} checkpoint ${CHECKPOINT.slice(0, 12)}`), memoryIo(retroProject())), 'references', 'checkpoint');
  refused(await claude(researcher(retroPrompt('.factory/retrospectives/missing.md')), memoryIo(retroProject())), 'brief', 'missing.md', 'does not exist');
  refused(await claude(researcher(), memoryIo(retroProject({ tracked: false }))), 'brief', 'not tracked');
  refused(await claude(researcher(), memoryIo(retroProject({ ignored: true }))), 'brief', 'ignored');
  refused(await claude(researcher(), memoryIo(retroProject({ committed: false }))), 'brief', 'checkpoint', CHECKPOINT);
  // A path outside retrospectives/ or with a traversal is not a record.
  refused(await claude(researcher(retroPrompt('.factory/notes/2026.md')), memoryIo(retroProject())), 'references', 'brief');
  refused(await claude(researcher(retroPrompt('.factory/retrospectives/../plan.md')), memoryIo(retroProject())), 'references', 'brief');
  // A prompt that also names a job brief keeps the job path: the brief's plan decides.
  const both = retroProject({ files: { ...retroProject().files, '/work/project/.factory/initiatives/I0001/plan.md': plan(job('J001', 'pending')), [`/work/project/${BRIEF}`]: '# brief\n' } });
  refused(await claude(researcher(`${retroPrompt()}${BRIEF} base ${BASE}`), memoryIo(both)), 'plan', 'pending');
  // Pi takes the same path through its extension's core.
  const pi = await guardDispatch({ host: 'pi', input: { agent: 'isswf-researcher', task: retroPrompt(), model: `${PI_MODEL}:high` }, io: memoryIo(retroProject()) });
  assert.deepEqual(pi, { allow: true }, 'pi researcher with a retrospective record');
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
  diff: { path: DIFF_PATH, argv: diffArguments(BASE, CANDIDATE), bytes: diff.length, sha256: sha256Hex(diff) },
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

// A code-only review: no brief, a `review-mode: code-only` line and the base; the handoff carries the request and no job identity.
{
  const codeEnvelope = () => buildEnvelope({
    mode: 'code-only', initiative: null, job: null, brief: null, request: 'Scope the command guard to isSWF projects.', base: BASE, candidate: CANDIDATE,
    diff: { path: DIFF_PATH, argv: diffArguments(BASE, CANDIDATE), bytes: DIFF.length, sha256: sha256Hex(DIFF) }, reviewGuide: null, round: 1, priorReviews: [],
    reviewer: { host: 'claude', agent: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium' }, resources: [],
  });
  const codeReview = async ({ mutate, lines = digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}\nbase ${BASE}\nreview-mode: code-only`, agent = 'isswf:isswf-reviewer' } = {}) => {
    const envelope = codeEnvelope();
    mutate?.(envelope);
    const genuine = bytesOf(JSON.stringify(envelope, null, 2));
    const io = memoryIo({ ...project(), files: { ...project().files, [HANDOFF_PATH]: genuine, [DIFF_PATH]: DIFF } });
    return claude(claudeCall({ subagent_type: agent, model: agent.endsWith('reviewer') ? 'opus' : undefined, effort: agent.endsWith('reviewer') ? 'medium' : undefined, prompt: `Review the change.\n${lines(sha256Hex(genuine))}` }), io);
  };
  assert.deepEqual(await codeReview(), { allow: true }, 'a code-only review without an initiative');
  refused(await codeReview({ lines: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}\nreview-mode: code-only` }), 'references', 'base');
  refused(await codeReview({ lines: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}\nbase ${BASE}` }), 'references', 'brief');
  refused(await codeReview({ lines: digest => `handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}\nbase ${'d4'.repeat(20)}\nreview-mode: code-only` }), 'handoff', 'base');
  refused(await codeReview({ mutate: envelope => { delete envelope.mode; } }), 'handoff', 'code-only');
  refused(await codeReview({ mutate: envelope => { envelope.job = 'J001'; } }), 'handoff', 'no initiative, job or brief');
  refused(await codeReview({ mutate: envelope => { envelope.request = ' '; } }), 'handoff', 'request');
  // A job handoff cannot be passed off as code-only, nor the reverse.
  {
    const genuine = bytesOf(JSON.stringify(envelopeOf(DIFF), null, 2));
    const io = memoryIo({ ...project(), files: { ...project().files, [HANDOFF_PATH]: genuine, [DIFF_PATH]: DIFF } });
    refused(await claude(reviewerCall(`handoff: ${HANDOFF_PATH}\nhandoff-sha256: ${sha256Hex(genuine)}\ncandidate ${CANDIDATE}\nbase ${BASE}\nreview-mode: code-only`), io), 'handoff', 'code-only');
  }
  // Only the reviewer has a code-only mode.
  refused(await claude(claudeCall({ prompt: `review-mode: code-only\nbase ${BASE}` }), memoryIo(project())), 'references', 'brief');
}
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
// The files must be consistent with this call, not only with each other: the bound diff argument list, and the reviewer the call names.
refused(await reviewed({ mutate: envelope => { envelope.diff.argv = [...envelope.diff.argv, '--ext-diff']; } }), 'handoff', 'argv');
refused(await reviewed({ mutate: envelope => { envelope.diff.argv = diffArguments(BASE, 'd4'.repeat(20)); } }), 'handoff', 'argv');
refused(await reviewed({ mutate: envelope => { envelope.reviewer.host = 'pi'; } }), 'handoff', 'host');
refused(await reviewed({ mutate: envelope => { envelope.reviewer.agent = 'isswf-worker'; } }), 'handoff', 'agent');
// A UNC path would make the guard read a network share, so it is refused for both files.
refused(await reviewed({ handoffPath: '//host/share/h.json' }), 'handoff', 'absolute');
refused(await reviewed({ handoffPath: String.raw`\\host\share\h.json` }), 'handoff', 'absolute');
refused(await reviewed({ mutate: envelope => { envelope.diff.path = '//host/share/x.diff'; } }), 'handoff', 'diff', 'absolute');
refused(await reviewed({ mutate: envelope => { envelope.diff.path = String.raw`\\host\share\x.diff`; } }), 'handoff', 'diff', 'absolute');
// A label given twice with different values is ambiguous; the same value twice is not.
const twice = (extra, order = lines => lines) => digest => order(`handoff: ${HANDOFF_PATH}
handoff-sha256: ${digest}
candidate ${CANDIDATE}
${extra(digest)}`);
refused(await reviewed({ line: twice(() => 'handoff: /tmp/other.handoff.json') }), 'handoff', 'more than one');
refused(await reviewed({ line: twice(() => `handoff-sha256: ${'0'.repeat(64)}`) }), 'handoff', 'more than one');
refused(await reviewed({ line: twice(() => `candidate ${'d4'.repeat(20)}`) }), 'handoff', 'more than one');
assert.deepEqual(await reviewed({ line: twice(() => `handoff: ${HANDOFF_PATH}`) }), { allow: true }, 'an identical repeat');
// A long run of spaces followed by a non-space on the handoff line is read in linear time.
{
  const started = performance.now();
  const parsed = handoffReferences(`handoff: /tmp/h.json${' '.repeat(100000)}x
`);
  assert.ok(performance.now() - started < 500, `handoffReferences took ${performance.now() - started} ms`);
  assert.ok(parsed.error, 'the digest and candidate lines are missing');
}
{
  // A runtime that cannot read bytes makes the check fail, not pass.
  const { io, prompt } = handoffCase();
  delete io.readBytes;
  refused(await claude(reviewerCall(prompt), io), 'handoff', 'cannot be read');
}
// A file the prompt names is not read when its size already exceeds the limit.
{
  const { io, prompt } = handoffCase({ tamper: () => new Uint8Array(1024 * 1024 + 1) });
  refused(await claude(reviewerCall(prompt), io), 'handoff', 'over 1 MiB');
  assert.ok(!io.calls.read.includes(HANDOFF_PATH), 'an oversized handoff is not read');
  const big = handoffCase({ stored: new Uint8Array(4 * 1024 * 1024 + 1) });
  refused(await claude(reviewerCall(big.prompt), big.io), 'handoff', 'diff file', 'bytes the handoff records');
  assert.ok(!big.io.calls.read.includes(DIFF_PATH), 'an oversized diff file is not read');
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
    'isswf-researcher': { model: PI_MODEL, effort: 'high' },
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
  await write('.factory/retrospectives/session.md', '# retrospective\n');
  initRepository(root);
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'fixture');
  const head = git(root, 'rev-parse', 'HEAD');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r2.md', '# untracked\n');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r3.md', '# ignored\n');
  await write('.factory/initiatives/I0001/jobs/J001/brief-r4.md', '# later\n');

  const handlers = [];
  registerGuard({ on: (name, handler) => handlers.push([name, handler]) });
  assert.deepEqual(handlers.map(([name]) => name), ['tool_call', 'tool_result'], 'the call event refuses and opens; the result event closes');
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
  // A researcher may name a committed retrospective record instead of a job brief (#355), through real Git.
  assert.equal(await call({ agent: 'isswf-researcher', task: `retrospective .factory/retrospectives/session.md checkpoint ${head}`, model: `${PI_MODEL}:high` }), undefined, 'a researcher with a committed retrospective record');
  blocked(await call({ agent: 'isswf-researcher', task: `retrospective .factory/retrospectives/later.md checkpoint ${head}`, model: `${PI_MODEL}:high` }), 'retrospective record', 'does not exist');
  // A reviewer call also needs a handoff that verifies against the real files, which live outside the project.
  const handoffDir = join(temp, 'handoffs');
  await mkdir(handoffDir);
  const handoffEnvelope = buildEnvelope({
    initiative: 'I0001', job: 'J001', base: BASE, candidate: CANDIDATE,
    diff: { path: join(handoffDir, 'x.diff'), argv: diffArguments(BASE, CANDIDATE), bytes: DIFF.length, sha256: sha256Hex(DIFF) },
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
  // A bound Pi review, launched with extensionBindings, also carries the handoff: the guard asks for it on every reviewer call.
  const bound = { extensionBindings: { 'isswf.git-evidence/1': { version: 1 } } };
  blocked(await call({ agent: 'isswf-reviewer', task: task(), model: 'vendor/model:free:low', async: false, options: bound }), 'handoff');
  assert.equal(await call({ agent: 'isswf-reviewer', task: task(handoffLines()), model: 'vendor/model:free:low', async: false, options: bound }), undefined, 'a bound review with a verifying handoff');
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
  blocked(await call({ agent: 'isswf-researcher', task: task(), model: 'x:low' }), 'selection', 'model x', PI_MODEL);
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

  // The parallel-worker limit through the extension and real Git: open on an accepted call, close on the result or the async completion.
  {
    const ledger = join(root, '.git', 'isswf', 'parallel-workers');
    await rm(ledger, { recursive: true, force: true });
    const notes = [];
    const piHandlers = new Map();
    const piEvents = new Map();
    registerGuard({ on: (name, handler) => piHandlers.set(name, handler), events: { on: (name, handler) => piEvents.set(name, handler) } });
    const piCtx = { cwd: root, ui: { notify: message => notes.push(message) } };
    const open = async () => (await readdir(ledger).catch(() => [])).length;
    const dispatch = (input, id) => piHandlers.get('tool_call')({ type: 'tool_call', toolName: 'subagent', toolCallId: id, input }, piCtx);
    const finish = (input, id, details = {}, isError = false) => piHandlers.get('tool_result')({ type: 'tool_result', toolName: 'subagent', toolCallId: id, input, isError, details });
    const one = { agent: 'isswf-worker', task: task(), model: `${PI_MODEL}:high` };
    git(root, 'config', '--local', 'isswf.maxParallelWorkers', '1');

    assert.equal(await dispatch(one, 'a'), undefined);
    assert.equal(await open(), 1);
    assert.deepEqual(notes, [], 'one worker fits a limit of 1');
    assert.equal(await dispatch(one, 'b'), undefined, 'observe mode allows a worker over the limit');
    assert.equal(await open(), 2);
    assert.ok(notes.length === 1 && notes[0].includes('1 open') && notes[0].includes('limit 1'), notes.join('\n'));
    await finish(one, 'b');
    assert.equal(await open(), 1, 'a synchronous result closes its entry');
    git(root, 'config', '--local', 'isswf.parallelWorkersMode', 'enforce');
    blocked(await dispatch(one, 'c'), '1 open', 'limit 1');
    assert.equal(await open(), 1, 'a refused call opens nothing');
    await finish(one, 'a');
    blocked(await dispatch({ tasks: [one, one] }, 'd'), '2 requested', 'limit 1');
    assert.equal(await dispatch({ ...one, async: true }, 'e'), undefined);
    await finish({ ...one, async: true }, 'e', { asyncId: 'run-9' });
    assert.equal(await open(), 1, 'an async launch stays open until its completion');
    await piEvents.get('subagent:async-complete')({ runId: 'other' });
    assert.equal(await open(), 1, 'another run does not close it');
    await piEvents.get('subagent:async-complete')({ runId: 'run-9' });
    assert.equal(await open(), 0, 'the async completion closes it');
    assert.equal(await dispatch(one, 'f'), undefined);
    await finish(one, 'f', {}, true);
    assert.equal(await open(), 0, 'a failed call closes its entry');
    assert.equal(await dispatch({ agent: 'isswf-researcher', task: `retrospective .factory/retrospectives/session.md checkpoint ${head}`, model: `${PI_MODEL}:high` }, 'g'), undefined);
    assert.equal(await open(), 0, 'a researcher is not counted');
    git(root, 'config', '--local', '--unset', 'isswf.parallelWorkersMode');
    git(root, 'config', '--local', '--unset', 'isswf.maxParallelWorkers');
  }

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
  initRepository(outer);
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
assert.deepEqual(manifest.pi.extensions, ['./tools/isswf-record-guard-pi-extension.mjs', './tools/isswf-dispatch-guard-pi-extension.mjs', './tools/isswf-command-guard-pi-extension.mjs', './tools/isswf-compaction-pi-extension.mjs', './tools/isswf-initiatives-pi-extension.mjs']);

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
assert.ok(hooks.includes('$.process.run('), 'Git runs through the host');
for (const part of ["host: 'claude'", 'gitRun($, ', '$.session.cwd()', '$.fs.read(', '$.fs.list(', '$.fs.stat(', "as: 'bytes'", 'readBytes', 'return { deny:']) assert.ok(hook.includes(part), part);
for (const part of ['openWorkers(', 'closeWorker(', 'markWorkerRun(', 'closeWorkerRun(', "status === 'async_launched'", 'gitOut']) assert.ok(hooks.includes(part), part);
assert.ok(hooks.slice(hooks.indexOf("on('turn.complete'")).includes('closeWorkerRun('), 'a child turn closes its ledger entry');
assert.ok(hooks.includes('if (exitCode !== 0) throw'), 'a failed removal leaves the entry'); // source check: register.tsx has no runner
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
