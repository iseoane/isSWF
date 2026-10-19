import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? '.');
const { plan } = await import(pathToFileURL(join(source, 'tools/isswf-plan.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-worker-dependencies-')), project = join(root, 'project'), store = join(root, 'runs');
const hash = value => createHash('sha256').update(value).digest('hex');
const git = (...args) => { const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
const commit = () => { git('add', '.'); git('commit', '--allow-empty', '-qm', 'Pinned synthetic dependency input'); return git('rev-parse', 'HEAD'); };
try {
  await mkdir(project); await mkdir(store); git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@invalid');
  await writeFile(join(project, 'code.txt'), 'already integrated\n'); const base = commit();
  const proposalPath = join(root, 'proposal.json'), planGrant = join(root, 'plan-grant.json');
  const jobRecord = (id, dependsOn, status) => ({ id, dependsOn, status, objective: id, acceptance: ['Observable result'], blocker: 'None', nextStep: 'Prepare', evidence: status === 'completed' ? [base] : [] });
  await json(proposalPath, { version: 1, initiative: 'I0001', title: 'Admission fixture', type: 'enhancement', jobs: [jobRecord('J001', [], 'completed'), jobRecord('J002', ['J001'], 'pending'), jobRecord('J003', [], 'pending')] });
  await json(planGrant, { version: 1, project, initiative: 'I0001', permissions: ['plan'], reference: 'Synthetic fixture-only authority' });
  const created = await plan({ action: 'prepare', project, initiative: 'I0001', proposalPath, grantPath: planGrant });
  const original = await readFile(created.path, 'utf8'), path = '.factory/initiatives/I0001/plan.md';
  let serial = 0;
  async function invoke({ markdown = original, attestations = {}, selectedJob = 'J002', descriptor = {}, grantChange = {}, includeGrant = true, dirty = false, legacy = false } = {}) {
    await writeFile(created.path, markdown);
    const job = { version: 1, runtimeSha: '2'.repeat(40), targetBase: base, methodologySha: '37a56ebc902e94f21fc10666f33fceac44946af7', exclusiveAttempt: true, workerTotal: 1, logicalJobRef: 'I0001/' + selectedJob, ...(legacy ? {} : { prerequisites: { path, sha256: hash(markdown), jobId: selectedJob, ...descriptor } }) };
    await json(join(project, 'job.json'), job); const inputSha = commit(), attemptId = 'dependency-' + serial++;
    const grantFile = join(root, attemptId + '.json');
    const grant = { version: 1, role: 'worker', project, runsStore: store, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), runtimeSha: job.runtimeSha, targetBase: base, attemptId, logicalJobRef: job.logicalJobRef, grantRef: 'synthetic-dependency-only', allowDependencyCheck: true, prerequisites: job.prerequisites, attestations: typeof attestations === 'function' ? attestations(inputSha) : attestations, ...grantChange };
    await json(grantFile, grant);
    if (dirty) await writeFile(created.path, original.replace('- Status: pending', '- Status: awaiting-human'));
    const args = [join(source, 'tools/isswf-job.mjs'), 'run', '--project', project, '--input-sha', inputSha, '--job', 'job.json', '--runs-store', store, '--attempt-id', attemptId, '--grant-ref', grant.grantRef, '--mode', 'offline'];
    if (includeGrant && !legacy) args.push('--dependency-grant', grantFile);
    const before = await readFile(created.path), result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 15000 });
    assert.deepEqual(await readdir(store), [], 'gate must not claim a writer, lease, binding or attempt');
    assert((await readFile(created.path)).equals(before), 'gate must not rewrite the canonical plan');
    if (dirty) { await writeFile(created.path, markdown); }
    return result;
  }
  async function blocked(options, reason) { const r = await invoke(options); assert.equal(r.status, 2, r.stderr); const value = JSON.parse(r.stdout); assert.equal(value.reason, reason); assert.equal(value.attemptsConsumed, 0); }
  await blocked({ markdown: original.replace('## J002\n\n- Status: pending', '## J002\n\n- Status: awaiting-human') }, 'decision');
  await blocked({}, 'dependency-evidence');
  await blocked({ markdown: original.replace('- Status: completed', '- Status: awaiting-human') }, 'decision');
  await blocked({ attestations: sha => ({ J001: { kind: 'code', commit: sha } }) }, 'code-integration');
  await blocked({ markdown: original.replace('- Depends on: None', '- Depends on: J002') }, 'dependency-cycle');
  await blocked({ markdown: original.replace('- Status: completed', '- Status: pending'), attestations: { J001: { kind: 'decision', reference: 'Synthetic operator decision' } } }, 'decision');
  for (const options of [{ includeGrant: false }, { descriptor: { sha256: '0'.repeat(64) } }, { grantChange: { jobSha256: '0'.repeat(64) } }, { grantChange: { allowDependencyCheck: false } }, { attestations: { J001: { kind: 'code', commit: base }, J003: { kind: 'code', commit: base } } }]) {
    const r = await invoke(options); assert.notEqual(r.status, 0); assert(!r.stderr.includes('.pi/settings.json'), 'invalid authority must not reach activation');
  }
  for (const options of [{ attestations: { J001: { kind: 'code', commit: base } } }, { attestations: { J001: { kind: 'code', commit: base } }, dirty: true }, { attestations: { J001: { kind: 'decision', reference: 'Synthetic accepted decision' } } }, { selectedJob: 'J003' }, { legacy: true }]) {
    const r = await invoke(options); assert.equal(r.status, 1); assert.match(r.stderr, /\.pi\/settings\.json/u, 'satisfied gate reaches the deliberately absent activation, not a worker execution');
  }
  console.log('PASS normal worker dependency gate: decision/evidence/ancestry/cycle refusal before all admission effects; pinned input ignores dirty replacement, valid and unrelated cases reach activation; no worker execution claimed');
} finally { await rm(root, { recursive: true, force: true }); }
