import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import * as fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const command = (cwd, args) => {
  const result = spawnSync(args[0], args.slice(1), { cwd, encoding: 'utf8', timeout: 20000, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
};
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
const root = await mkdtemp(join(tmpdir(), 'isswf-directory-sync-'));
try {
  const implementations = {
    planner: await import(pathToFileURL(join(source, 'tools/planner-task.mjs'))),
    reviewer: await import(pathToFileURL(join(source, 'tools/reviewer-task.mjs'))),
  };
  for (const role of Object.keys(implementations)) {
    const planner = role === 'planner', { [planner ? 'runPlanProposal' : 'runReview']: run, [planner ? 'readPlanProposal' : 'readReview']: read } = implementations[role];
    const home = join(root, role), project = join(home, 'project'), target = join(home, 'target'), store = join(home, 'store');
    await mkdir(home, { recursive: true });
    await Promise.all([mkdir(project), mkdir(target), mkdir(store)]);
    const git = (repo, ...args) => command(repo, ['git', ...args]);
    const commit = repo => { git(repo, 'add', '.'); git(repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'); return git(repo, 'rev-parse', 'HEAD'); };
    for (const repo of [project, target]) git(repo, 'init', '-q');
    await writeFile(join(target, 'change.txt'), 'base\n'); await writeFile(join(target, 'standards.md'), 'Synthetic standards.\n');
    const targetBase = commit(target); await writeFile(join(target, 'change.txt'), 'candidate\n'); const candidateSha = commit(target);
    await writeFile(join(project, 'brief.md'), 'Synthetic task.\n'); await writeFile(join(project, 'standards.md'), 'Synthetic standards.\n');
    await writeFile(join(project, 'models.json'), await readFile(join(source, '.factory/models.json')));
    const modelsSha = commit(project);
    const job = { version: 1, logicalJobRef: `I0001/J018/${role}`, ...(planner ? { coordinatorRef: 'synthetic-coordinator' } : { implementerRef: 'synthetic-implementer' }), targetRepo: target, targetBase, ...(planner ? {} : { candidateSha }), methodologySha: git(source, 'rev-parse', 'HEAD'), briefPath: 'brief.md', contextPaths: ['standards.md'], models: { sha: modelsSha, path: 'models.json', sha256: hash(await readFile(join(project, 'models.json'))) }, sdkPath: '/synthetic/not-loaded' };
    const jobPath = planner ? 'planning.json' : 'reviewing.json'; await json(join(project, jobPath), job); const inputSha = commit(project);
    const authPath = join(home, 'auth.json'), grantFile = join(home, 'grant.json'); await json(authPath, {});
    const grant = { version: 1, role, project, store, inputSha, jobPath, jobSha256: hash(await readFile(join(project, jobPath))), logicalJobRef: job.logicalJobRef, targetRepo: target, targetBase, ...(planner ? { coordinatorRef: job.coordinatorRef, plannerRef: 'synthetic-planner' } : { candidateSha, implementerRef: job.implementerRef, reviewerRef: 'synthetic-reviewer' }), grantRef: 'Synthetic fixture only', callerSha256: hash(await readFile(join(source, `tools/${planner ? 'planner' : 'reviewer'}-task.mjs`))), backendSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), authPath, sdkEntrySha256: '0'.repeat(64), allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0, deadlineMs: 1000, outputBytes: 2048, maxOutputTokens: 512, approvedRoute: [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }] };
    await json(grantFile, grant);
    const request = { project, store, inputSha, jobPath, grantFile };
    const backend = { async preflight() { return { model: { provider: 'openai-codex', id: 'gpt-6-luna' }, billingEvidence: { source: 'synthetic' } }; }, async fetch() { return new Response('', { status: 200 }); }, stream(model, context, options) { return { async result() { await options.fetch('https://synthetic.invalid'); return { provider: model.provider, model: model.id, stopReason: 'stop', content: [{ type: 'text', text: 'Synthetic result.' }] }; } }; } };
    let result;
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    try { result = await run(request, { mode: 'fixture', backend }); }
    finally { mock.timers.reset(); }
    assert.equal(result.status, planner ? 'proposal-complete' : 'response-complete');
    if (process.platform === 'win32') assert.ok(result.limits.some(limit => /directory synchronization may be unsupported/u.test(limit)));
    assert.equal((await read({ project, store, logicalJobRef: job.logicalJobRef })).status, 'recorded');
    await assert.rejects(run(request, { mode: 'fixture', backend }), /EEXIST|already exists|file exists/iu);
    assert.deepEqual(await readdir(store), [hash(project + '\0' + (planner ? 'planner' : 'reviewer') + '\0' + job.logicalJobRef)]);

    const originalOpen = fs.promises.open;
    async function injectedOpen(path, ...args) {
      const handle = await originalOpen(path, ...args);
      if (path === failureStore) handle.sync = async () => { const error = new Error('synthetic sync failure'); error.code = 'EIO'; throw error; };
      return handle;
    }
    // Separate empty attempt roots so injected failures occur before any claim or result publication.
    const failureStore = join(home, 'failure-store'); await mkdir(failureStore);
    grant.store = failureStore; await json(grantFile, grant);
    const failureRequest = { ...request, store: failureStore };
    fs.promises.open = injectedOpen; syncBuiltinESMExports();
    try { await assert.rejects(run(failureRequest, { mode: 'fixture', backend }), /synthetic sync failure/u); }
    finally { fs.promises.open = originalOpen; syncBuiltinESMExports(); }
    // Real file synchronization remains strict even on Windows; this deterministic fault is not a directory operation.
    const fileStore = join(home, 'file-failure-store'); await mkdir(fileStore);
    grant.store = fileStore; await json(grantFile, grant);
    const fileRequest = { ...request, store: fileStore };
    fs.promises.open = async (path, ...args) => {
      const handle = await originalOpen(path, ...args);
      if (String(path).endsWith('.pending')) handle.sync = async () => { const error = new Error('synthetic file sync failure'); error.code = 'EIO'; throw error; };
      return handle;
    }; syncBuiltinESMExports();
    try { await assert.rejects(run(fileRequest, { mode: 'fixture', backend }), /synthetic file sync failure/u); }
    finally { fs.promises.open = originalOpen; syncBuiltinESMExports(); }
  }
  console.log('PASS actual planner/reviewer directory sync persistence/readback/no-replay and fatal directory/file sync errors; no provider calls');
} finally { await rm(root, { recursive: true, force: true }); }
