import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const core = await load('tools/isswf-parallel-workers-core.mjs');
const { workerCalls } = await load('tools/isswf-dispatch-guard-core.mjs');

// The Node io of the Pi extension and the clear tool: real Git and real files.
const git = (cwd, ...argv) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...argv], { cwd, encoding: 'utf8', timeout: 20000 }).trim();
const nodeIo = (overrides = {}) => ({
  gitOut: (argv, cwd) => {
    const result = spawnSync('git', argv, { cwd, encoding: 'utf8', timeout: 20000 });
    if (result.error) throw result.error;
    return { exitCode: result.status, stdout: result.stdout };
  },
  list: async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : 'file' })),
  read: file => readFile(file, 'utf8'),
  write: async (file, text) => {
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, text);
  },
  remove: file => rm(file, { force: true }),
  ...overrides,
});
const worker = (job = 'J001') => ({ agent: 'isswf-worker', job: `I0058/${job}`, brief: `.factory/initiatives/I0058/jobs/${job}/brief-r1.md` });

const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-parallel-workers-')));
try {
  const main = join(temp, 'main');
  await mkdir(main);
  git(main, 'init', '-q', '.');
  await writeFile(join(main, 'a.txt'), 'a\n');
  git(main, 'add', '-A');
  git(main, 'commit', '-qm', 'fixture');
  const tree = join(temp, 'tree');
  git(main, 'worktree', 'add', '-q', '-b', 'other', tree);
  const io = nodeIo();
  const ledger = join(main, '.git', 'isswf', 'parallel-workers');

  // Absent or invalid limit means 2; the limit is local to the clone and its worktrees share it.
  for (const value of [undefined, '', '0', '-1', 'abc', '2x', '1.5', '99999']) {
    if (value !== undefined) git(main, 'config', '--local', 'isswf.maxParallelWorkers', value);
    assert.deepEqual(await core.readPolicy({ cwd: main, io }), { limit: 2, mode: 'observe' }, `limit ${JSON.stringify(value)}`);
  }
  git(main, 'config', '--local', 'isswf.maxParallelWorkers', '3');
  assert.deepEqual(await core.readPolicy({ cwd: tree, io }), { limit: 3, mode: 'observe' }, 'a linked worktree reads the clone-local limit');
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'enforce');
  assert.equal((await core.readPolicy({ cwd: main, io })).mode, 'enforce');
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'strict');
  assert.equal((await core.readPolicy({ cwd: main, io })).mode, 'observe', 'an unknown mode is observe');
  git(main, 'config', '--local', '--unset', 'isswf.parallelWorkersMode');
  git(main, 'config', '--local', 'isswf.maxParallelWorkers', '2');

  // Both worktrees write the one ledger under the common Git directory, one file per worker, with the agreed fields.
  const [first] = await core.openWorkers({ workers: [worker('J001')], host: 'claude', cwd: tree, io });
  assert.deepEqual((await readdir(ledger)).sort(), [`${first}.json`]);
  const entry = JSON.parse(await readFile(join(ledger, `${first}.json`), 'utf8'));
  assert.deepEqual(Object.keys(entry).sort(), ['agent', 'brief', 'host', 'job', 'startedAt']);
  assert.deepEqual({ agent: entry.agent, job: entry.job, brief: entry.brief, host: entry.host }, { ...worker('J001'), host: 'claude' });
  assert.ok(!Number.isNaN(Date.parse(entry.startedAt)));
  const [second] = await core.openWorkers({ workers: [worker('J002')], host: 'pi', cwd: main, io });
  assert.equal((await core.listWorkers({ cwd: tree, io })).length, 2);

  // Below the limit nothing is said; at it, observe allows with a note that names the clear command, enforce refuses.
  assert.deepEqual(await core.checkWorkerLimit({ count: 1, cwd: main, io: nodeIo({ list: async () => [] }) }), {}, 'no open worker');
  git(main, 'config', '--local', 'isswf.maxParallelWorkers', '3');
  assert.deepEqual(await core.checkWorkerLimit({ count: 1, cwd: main, io }), {}, 'two open and one more fits a limit of 3');
  const over = await core.checkWorkerLimit({ count: 2, cwd: main, io });
  assert.equal(over.deny, undefined, 'observe never refuses');
  for (const part of ['2 open', 'limit 3', 'isswf-parallel-workers.mjs', 'clear']) assert.ok(over.note.includes(part), `${part}\n${over.note}`);
  git(main, 'config', '--local', 'isswf.maxParallelWorkers', '2');
  const atLimit = await core.checkWorkerLimit({ count: 1, cwd: tree, io });
  assert.ok(atLimit.note && atLimit.deny === undefined, 'at the limit, observe allows with a note');
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'enforce');
  const refused = await core.checkWorkerLimit({ count: 1, cwd: tree, io });
  assert.equal(refused.note, undefined);
  for (const part of ['2 open', 'limit 2', 'clear']) assert.ok(refused.deny.includes(part), `${part}\n${refused.deny}`);
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'observe');

  // Faults: observe never refuses, enforce fails closed.
  const broken = nodeIo({ gitOut: () => { throw new Error('git is not available'); } });
  assert.deepEqual(await core.checkWorkerLimit({ count: 1, cwd: main, io: broken }), {}, 'observe with Git down');
  assert.deepEqual(await core.checkWorkerLimit({ count: 1, cwd: temp, io }), {}, 'observe outside a repository');
  await writeFile(join(ledger, 'junk.json'), '{not json');
  assert.equal((await core.listWorkers({ cwd: main, io })).length, 3, 'a damaged entry still counts and is listed');
  assert.ok((await core.checkWorkerLimit({ count: 1, cwd: main, io })).note, 'a damaged entry does not stop the check');
  await rm(join(ledger, 'junk.json'));
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'enforce');
  const gitDown = nodeIo({ gitOut: argv => (argv.includes('rev-parse') ? { exitCode: 128, stdout: '' } : nodeIo().gitOut(argv, main)) });
  assert.match((await core.checkWorkerLimit({ count: 1, cwd: main, io: gitDown })).deny, /could not be checked/u, 'enforce refuses when the ledger cannot be located');
  git(main, 'config', '--local', 'isswf.parallelWorkersMode', 'observe');

  // Close: by token (a foreground call), and by run id once the host has given one (a background or async child).
  await core.markWorkerRun({ token: second, run: 'agent-7', cwd: tree, io });
  assert.equal(JSON.parse(await readFile(join(ledger, `${second}.json`), 'utf8')).run, 'agent-7');
  await core.closeWorker({ token: first, cwd: tree, io });
  assert.deepEqual((await readdir(ledger)).sort(), [`${second}.json`]);
  await core.closeWorkerRun({ run: 'other-run', cwd: main, io });
  assert.equal((await readdir(ledger)).length, 1, 'an unknown run closes nothing');
  await core.closeWorkerRun({ run: 'agent-7', cwd: main, io });
  assert.deepEqual(await readdir(ledger), []);
  await core.closeWorker({ token: first, cwd: main, io });
  await assert.rejects(() => core.closeWorker({ token: '../x', cwd: main, io }), 'a token is a plain name');

  // The operator's tool lists and clears entries; it reads the same ledger from any worktree.
  const tool = (cwd, ...args) => spawnSync(process.execPath, [join(source, 'tools/isswf-parallel-workers.mjs'), ...args, '--project', cwd], { encoding: 'utf8', timeout: 20000 });
  const [a, b] = [(await core.openWorkers({ workers: [worker('J003')], host: 'claude', cwd: main, io }))[0], (await core.openWorkers({ workers: [worker('J004')], host: 'pi', cwd: main, io }))[0]];
  const listed = tool(tree, 'list');
  assert.equal(listed.status, 0, listed.stderr);
  for (const part of [a, b, 'I0058/J003', 'I0058/J004', 'limit 2', 'observe']) assert.ok(listed.stdout.includes(part), `${part}\n${listed.stdout}`);
  assert.notEqual(tool(main, 'clear', '--token', '../x').status, 0, 'an unsafe token is refused');
  const one = tool(tree, 'clear', '--token', a);
  assert.equal(one.status, 0, one.stderr);
  assert.deepEqual(await readdir(ledger), [`${b}.json`]);
  assert.equal(tool(main, 'clear').status, 0);
  assert.deepEqual(await readdir(ledger), []);
  assert.match(tool(main, 'list').stdout, /no open/iu);
  assert.notEqual(tool(main, 'frobnicate').status, 0, 'an unknown verb is refused');

  // The guard reads worker calls only, with their job and brief, for both hosts.
  const prompt = `brief .factory/initiatives/I0058/jobs/J012/brief-r2.md checkpoint ${"a1".repeat(20)} base ${"b2".repeat(20)}`;
  assert.deepEqual(workerCalls('claude', { subagent_type: 'isswf:isswf-worker', prompt }), [{ agent: 'isswf:isswf-worker', job: 'I0058/J012', brief: '.factory/initiatives/I0058/jobs/J012/brief-r2.md' }]);
  assert.deepEqual(workerCalls('claude', { subagent_type: 'isswf:isswf-reviewer', prompt }), [], 'a reviewer is not counted');
  assert.deepEqual(workerCalls('claude', { subagent_type: 'general-purpose', prompt }), []);
  assert.equal(workerCalls('pi', { tasks: [{ agent: 'isswf-worker', task: prompt }, { agent: 'isswf-worker', task: prompt }, { agent: 'isswf-researcher', task: prompt }] }).length, 2);
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('isswf-parallel-workers: ok');
