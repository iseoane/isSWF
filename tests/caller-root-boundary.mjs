import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { preparePlanProposal } = await import(pathToFileURL(join(source, 'tools/planner-task.mjs')));
const { prepareReview } = await import(pathToFileURL(join(source, 'tools/reviewer-task.mjs')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (cwd, args) => {
  const result = spawnSync(args[0], args.slice(1), { cwd, encoding: 'utf8', timeout: 20000, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const root = await mkdtemp(join(tmpdir(), 'isswf caller Ñ '));
const project = join(root, 'Project Ω'), target = join(root, 'Target Ω');
const store = join(root, 'Project Ω sibling store'), auth = join(root, 'auth.json'), grantFile = join(root, 'grant.json');
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
function git(repo, ...args) { return run(repo, ['git', ...args]); }
function commit(repo) {
  git(repo, 'add', '.');
  git(repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'pinned fixture');
  return git(repo, 'rev-parse', 'HEAD');
}
try {
  await Promise.all([mkdir(project), mkdir(target), mkdir(store)]);
  for (const repo of [project, target]) git(repo, 'init', '-q');
  await writeFile(join(target, 'change.txt'), 'base\n');
  await writeFile(join(target, 'standards.md'), 'Pinned synthetic standards.\n');
  const targetBase = commit(target);
  await writeFile(join(target, 'change.txt'), 'candidate\n');
  const candidateSha = commit(target);
  await writeFile(join(project, 'brief.md'), 'Pinned synthetic preparation only.\n');
  await writeFile(join(project, 'standards.md'), 'Pinned synthetic standards.\n');
  await writeFile(join(project, 'models.json'), await readFile(join(source, '.factory/models.json')));
  const modelsPath = 'models.json', modelsBytes = await readFile(join(project, modelsPath));
  const methodologySha = git(source, 'rev-parse', 'HEAD');
  const modelsSha = commit(project);
  await writeFile(auth, '{}\n');

  async function prepare(role) {
    const planner = role === 'planner';
    const jobPath = planner ? 'planning.json' : 'reviewing.json';
    const logicalJobRef = `I0001/J018/${role}`;
    const job = {
      version: 1, logicalJobRef, ...(planner ? { coordinatorRef: 'synthetic-coordinator' } : { implementerRef: 'synthetic-implementer' }),
      targetRepo: target, targetBase, ...(planner ? {} : { candidateSha }), methodologySha, briefPath: 'brief.md',
      contextPaths: ['standards.md'], models: { sha: modelsSha, path: modelsPath, sha256: hash(modelsBytes) }, sdkPath: '/synthetic/not-loaded',
    };
    await json(join(project, jobPath), job);
    const inputSha = commit(project);
    const grant = {
      version: 1, role, project, store, inputSha, jobPath, jobSha256: hash(await readFile(join(project, jobPath))), logicalJobRef,
      targetRepo: target, targetBase, ...(planner ? { coordinatorRef: job.coordinatorRef, plannerRef: 'synthetic-planner' } : { candidateSha, implementerRef: job.implementerRef, reviewerRef: 'synthetic-reviewer' }),
      grantRef: 'Synthetic fixture only', callerSha256: hash(await readFile(join(source, `tools/${planner ? 'planner' : 'reviewer'}-task.mjs`))),
      backendSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), authPath: auth, sdkEntrySha256: '0'.repeat(64),
      allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0,
      deadlineMs: 1000, outputBytes: 2048, maxOutputTokens: 512,
      approvedRoute: [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }],
    };
    grant.inputSha = inputSha;
    grant.jobSha256 = hash(await readFile(join(project, jobPath)));
    await json(grantFile, grant);
    const request = { project: project + sep + '.', store, inputSha, jobPath, grantFile };
    const prepared = planner ? await preparePlanProposal(request) : await prepareReview(request);
    assert.equal(prepared.project, project, `${role}: caller path canonicalized`);
    assert.equal(prepared.job.logicalJobRef, logicalJobRef);
    assert.equal(prepared.job.targetRepo, target);
    const bundle = JSON.parse(prepared.prompt);
    assert.equal(bundle.targetBase, targetBase);
    if (planner) {
      assert.equal(bundle.inputSha, inputSha);
      assert.equal(bundle.brief, 'Pinned synthetic preparation only.\n');
    } else {
      assert.equal(bundle.assignment.inputSha, inputSha);
      assert.equal(bundle.candidateSha, candidateSha);
      assert.equal(bundle.changes[0].candidate, 'candidate\n');
    }
    assert.deepEqual(await readdir(store), [], `${role}: preparation must not mutate store`);
    return { request, grant, jobPath, planner };
  }

  for (const role of ['planner', 'reviewer']) {
    const valid = await prepare(role);
    await assert.rejects((valid.planner ? preparePlanProposal : prepareReview)({ ...valid.request, project: join(project, 'brief.md') }), undefined, `${role}: nested project is not the Git root`);
    await assert.rejects((valid.planner ? preparePlanProposal : prepareReview)({ ...valid.request, store: project }), /private-external-store-required/u, `${role}: store inside project is protected`);
    await assert.rejects((valid.planner ? preparePlanProposal : prepareReview)({ ...valid.request, store: root }), /private-external-store-required/u, `${role}: store ancestor of project is protected`);

    const original = valid.grant;
    for (const [label, changes] of [
      ['grant inside project', { grantFile: join(project, 'grant-inside.json') }],
      ['auth inside project', { authPath: join(project, 'auth-inside.json') }],
      ['auth inside target', { authPath: join(target, 'auth-inside.json') }],
      ['grant binding mismatch', { logicalJobRef: 'I0001/J018/wrong' }],
      ['target-store overlap', { targetRepo: store }],
    ]) {
      const request = { ...valid.request };
      let changesToGrant = changes;
      if (label === 'grant inside project') {
        await json(changes.grantFile, original);
        request.grantFile = changes.grantFile;
        changesToGrant = {};
      }
      if (label === 'auth inside project' || label === 'auth inside target') {
        await writeFile(changes.authPath, '{}\n');
        changesToGrant = { authPath: changes.authPath };
      }
      await json(grantFile, { ...original, ...changesToGrant });
      await assert.rejects((valid.planner ? preparePlanProposal : prepareReview)(request), undefined, `${role}: ${label} must refuse`);
      await json(grantFile, original);
    }
  }
  assert.deepEqual(await readdir(store), [], 'refusals must not mutate the external store');
  console.log('PASS black-box planner/reviewer preparation roots: pinned bundles, Unicode/space paths, prefix-sibling containment, protected roots, canonical aliases and fail-closed bindings; no provider/store writes');
} finally {
  await rm(root, { recursive: true, force: true });
}
