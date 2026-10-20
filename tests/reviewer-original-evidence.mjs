import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { prepareReview, runReview, readReview } = await import(pathToFileURL(join(source, 'tools/reviewer-task.mjs')));
const { evidenceDigest, sourceObjectsPath } = await import(pathToFileURL(join(source, 'tools/diagnostic-probes.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-review-original-')), project = join(root, 'input'), checkout = join(root, 'checkout');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (repo, ...args) => { const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', timeout: 20000 }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
const commit = () => { git(project, 'add', '.'); git(project, '-c', 'user.name=Test', '-c', 'user.email=test@invalid', 'commit', '-qm', 'fixture'); return git(project, 'rev-parse', 'HEAD'); };
let fetches = 0;
try {
  await mkdir(project); git(project, 'init', '-q');
  await writeFile(join(project, 'app'), 'before'); await writeFile(join(project, 'standards'), 'Keep supplied evidence exact.'); const base = commit();
  await writeFile(join(project, 'app'), 'after'); const candidate = commit();
  git(root, 'clone', '--quiet', '--no-hardlinks', project, checkout);
  await writeFile(join(project, 'brief'), 'Verify explicitly granted original evidence only. No provider calls, real credentials or hardware case.');
  await writeFile(join(project, 'models.json'), await readFile(join(source, '.factory/models.json'))); const modelsSha = commit();
  const auth = join(root, 'auth.json'); await json(auth, {});
  const original = join(root, 'original'); await mkdir(original); await writeFile(join(original, 'record'), 'original');
  const alternate = join(root, 'alternate'); await mkdir(alternate);
  git(root, 'clone', '--quiet', '--shared', '--no-checkout', source, join(alternate, 'repo'));
  assert.equal((await readFile(join(alternate, 'repo/.git/objects/info/alternates'), 'utf8')).trim(), sourceObjectsPath);
  const sourceSha = git(source, 'rev-parse', 'HEAD');
  async function assignment(name, evidence, command, extra = {}) {
    const store = join(root, name); await mkdir(store);
    const workspace = { repo: checkout, evidence, probes: [{ name: 'original', command, expectedExitCode: 0 }] };
    const job = { version: 1, logicalJobRef: 'I0001/J006/' + name, implementerRef: 'synthetic-implementer', targetRepo: project, targetBase: base, candidateSha: candidate, methodologySha: sourceSha, briefPath: 'brief', contextPaths: ['standards'], sdkPath: '/synthetic/not-loaded', models: { sha: modelsSha, path: 'models.json', sha256: hash(await readFile(join(project, 'models.json'))) }, workspace };
    const jobPath = name + '.json'; await json(join(project, jobPath), job); const inputSha = commit();
    const grant = { version: 1, role: 'reviewer', project, store, inputSha, jobPath, jobSha256: hash(await readFile(join(project, jobPath))), logicalJobRef: job.logicalJobRef, targetRepo: project, targetBase: base, candidateSha: candidate, implementerRef: job.implementerRef, reviewerRef: 'synthetic-independent', grantRef: 'Synthetic read-only original evidence test, no real provider permission', callerSha256: hash(await readFile(join(source, 'tools/reviewer-task.mjs'))), backendSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0, deadlineMs: 10000, outputBytes: 2048, maxOutputTokens: 512, approvedRoute: [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }], authPath: auth, sdkEntrySha256: '0'.repeat(64), workspace, allowWorkspaceProbes: true, targetMode: 'read-only', probeRunnerSha256: hash(await readFile(join(source, 'tools/diagnostic-probes.mjs'))), allowOriginalEvidence: true, ...extra };
    const grantFile = join(root, name + '-grant.json'); await json(grantFile, grant);
    return { job, grant, grantFile, workspace, request: { project, store, inputSha, jobPath, grantFile } };
  }
  const originalCommand = `node -e 'const f=require("node:fs");if(f.readFileSync(${JSON.stringify(join(original, 'record'))},"utf8")!=="original")throw Error("missing");try{f.writeFileSync(${JSON.stringify(join(original, 'record'))},"bad");process.exitCode=1}catch(e){if(e.code!=="EROFS")throw e}console.log("original-readonly")'`;
  const ordinary = await assignment('ordinary', { path: original, sha256: await evidenceDigest(original) }, originalCommand);
  await prepareReview(ordinary.request);
  for (const changed of [{ allowOriginalEvidence: false }, { workspace: { ...ordinary.workspace, evidence: { path: original, sha256: '0'.repeat(64) } } }]) {
    await json(ordinary.grantFile, { ...ordinary.grant, ...changed }); await assert.rejects(prepareReview(ordinary.request));
  }
  const alias = join(root, 'auth-alias'); await symlink(join(original, 'record'), alias);
  await json(ordinary.grantFile, { ...ordinary.grant, authPath: alias });
  await assert.rejects(prepareReview(ordinary.request), /separate-original-evidence/u);
  await json(ordinary.grantFile, ordinary.grant);
  await link(auth, join(original, 'hard-auth')); await assert.rejects(prepareReview(ordinary.request), /single-link-evidence/u); await rm(join(original, 'hard-auth'));
  await writeFile(join(original, 'record'), 'tampered'); await assert.rejects(prepareReview(ordinary.request), /evidence-pin-mismatch/u); await writeFile(join(original, 'record'), 'original');
  assert.deepEqual(await readdir(ordinary.request.store), []); assert.equal(fetches, 0);
  const objectCommand = `git -C ${JSON.stringify(join(alternate, 'repo'))} cat-file -e ${sourceSha}:tools/diagnostic-probes.mjs && node -e 'const f=require("node:fs");if(!f.statSync(${JSON.stringify(sourceObjectsPath)}).isDirectory()||f.existsSync(${JSON.stringify(join(source, '.git/config'))}))throw Error("object-only-boundary");console.log("alternate-objects-visible-config-hidden")'`;
  const objects = await assignment('objects', { path: alternate, sha256: await evidenceDigest(alternate), sourceObjectsSha256: await evidenceDigest(sourceObjectsPath) }, objectCommand, { allowSourceObjects: true });
  await json(objects.grantFile, { ...objects.grant, allowSourceObjects: false }); await assert.rejects(prepareReview(objects.request), /source-object-pin/u);
  await json(objects.grantFile, objects.grant); await prepareReview(objects.request);
  for (const current of [ordinary, objects]) {
    const p = await prepareReview(current.request);
    const bundle = JSON.parse(p.prompt);
    assert.deepEqual(bundle.assignment.workspace, current.workspace); assert.deepEqual(bundle.authorization.workspace, current.workspace);
    assert.equal(bundle.assignment.inputSha, current.request.inputSha); assert.equal(bundle.authorization.jobSha256, bundle.assignment.jobSha256);
    assert.equal(bundle.authorization.allowOriginalEvidence, true); assert.equal(bundle.authorization.allowSourceObjects, current === objects);
    assert.equal(p.prompt.includes(auth), false, 'auth locator must not enter the model evidence');
    assert.equal(Object.hasOwn(bundle.authorization, 'authPath'), false);
    const backend = {
      async preflight() { return { model: { provider: 'openai-codex', id: 'gpt-6-luna' }, billingEvidence: { source: 'synthetic' } }; },
      async fetch() { fetches++; return new Response('', { status: 200 }); },
      stream(model, context, options) { return { async result() {
        const verified = JSON.parse(context.messages[0].content).workspaceVerification;
        assert.deepEqual(verified.evidence, current.workspace.evidence); assert.equal(verified.results[0].expectationMatched, true);
        assert.equal(JSON.parse(await readFile(join(p.dir, 'probe-intent.json'))).providerPromptStarted, false);
        await options.fetch('https://synthetic.invalid');
        return { provider: model.provider, model: model.id, stopReason: 'stop', content: [{ type: 'text', text: 'Synthetic original-evidence test only, not hardware acceptance.' }] };
      } }; },
    };
    const fixtureProbe = async request => { assert.deepEqual(request.evidence, current.workspace.evidence); return [{ ...current.workspace.probes[0], exitCode: 0, expectationMatched: true, stdout: 'synthetic', stderr: '', targetBase: candidate }]; };
    const result = await runReview(current.request, { mode: 'fixture', backend, ...(process.argv.includes('--sandbox') ? {} : { probeRunner: fixtureProbe }) });
    assert.equal(result.status, 'response-complete', JSON.stringify(result));
    const record = await readReview({ project, store: current.request.store, logicalJobRef: current.job.logicalJobRef });
    assert.equal(record.status, 'recorded', JSON.stringify(record)); assert.deepEqual(record.binding.workspace.evidence, current.workspace.evidence);
    if (process.argv.includes('--sandbox')) assert.equal(record.binding.workspace.results[0].stdout, current === ordinary ? 'original-readonly\n' : 'alternate-objects-visible-config-hidden\n');
    const intentPath = join(p.dir, 'probe-intent.json'), originalIntent = await readFile(intentPath);
    const intent = JSON.parse(originalIntent); intent.workspace.evidence.sha256 = '0'.repeat(64); await json(intentPath, intent);
    assert.equal((await readReview({ project, store: current.request.store, logicalJobRef: current.job.logicalJobRef })).status, 'unknown'); await writeFile(intentPath, originalIntent);
    await assert.rejects(runReview(current.request, { mode: 'fixture', backend }));
  }
  assert.equal(fetches, 2);
  console.log(process.argv.includes('--sandbox') ? 'PASS actual original-evidence reviewer: original readonly, alternate objects usable with source config hidden, canonical auth and hardlink refusal, durable binding; no real provider calls' : 'PASS original-evidence grants, canonical auth and hardlink refusal, pins, durable readback and no replay; synthetic transport/probes only');
} finally { await rm(root, { recursive: true, force: true }); }
