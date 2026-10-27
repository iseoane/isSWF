import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? '.');
const { runReview, readReview, prepareReview } = await import(pathToFileURL(join(source, 'tools/reviewer-task.mjs')));
const { runPlanProposal, preparePlanProposal } = await import(pathToFileURL(join(source, 'tools/planner-task.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-panel-capacity-')), project = join(root, 'project'), pool = join(root, 'pool');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => { const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const commit = () => { git('add', '.'); git('commit', '-qm', 'Pin synthetic panel input'); return git('rev-parse', 'HEAD'); };
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
const route = [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }];
const pending = new Set(), controls = new Map(), sessions = new Set(); let active = 0, peak = 0, fetches = 0;
const wait = async (promise, label) => { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('panel progress timeout: ' + label)), 5000); })]); } finally { clearTimeout(timer); } };
try {
  await mkdir(project); await mkdir(pool); await mkdir(join(pool, 'completed')); git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@invalid');
  await writeFile(join(project, 'app.mjs'), 'export const answer = 1;\n');
  await writeFile(join(project, 'standards.md'), 'Synthetic capacity test only; no product review or acceptance.\n');
  await writeFile(join(project, 'brief.md'), 'Synthetic bounded panel; all returned review text is fixture data, not independent source review.\n');
  const fixtureModels = JSON.parse(await readFile(join(source, '.factory/models.json'))); fixtureModels.roles.reviewer = [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }];
  await writeFile(join(project, 'models.json'), JSON.stringify(fixtureModels) + '\n'); const base = commit();
  await writeFile(join(project, 'app.mjs'), 'export const answer = 2;\n'); const candidate = commit(), modelSha = candidate;
  const sourceRevision = spawnSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const authPath = join(root, 'empty-auth.json'); await json(authPath, {});
  const policy = JSON.stringify({ version: 1, limit: 2, reference: 'Synthetic shared scope for three-reviewer panel and unrelated planner' }) + '\n'; await writeFile(join(pool, 'policy.json'), policy);
  async function assignment(id, role) {
    const store = join(root, 'store-' + id); await mkdir(store);
    const job = { version: 1, logicalJobRef: 'I0001/J005/panel/' + id, targetRepo: project, targetBase: base, candidateSha: candidate, methodologySha: sourceRevision, sdkPath: '/synthetic/not-loaded', briefPath: 'brief.md', contextPaths: ['standards.md'], models: { sha: modelSha, path: 'models.json', sha256: hash(await readFile(join(project, 'models.json'))) }, ...(role === 'reviewer' ? { implementerRef: 'synthetic-implementer' } : { coordinatorRef: 'synthetic-coordinator' }) };
    await json(join(project, id + '.json'), job); const inputSha = commit(), grantFile = join(root, id + '-grant.json');
    const grant = { version: 1, role, project, store, inputSha, jobPath: id + '.json', jobSha256: hash(await readFile(join(project, id + '.json'))), logicalJobRef: job.logicalJobRef, targetRepo: project, targetBase: base, candidateSha: candidate, grantRef: 'Synthetic fixture only; no provider authority', callerSha256: hash(await readFile(join(source, 'tools', role === 'reviewer' ? 'reviewer-task.mjs' : 'planner-task.mjs'))), backendSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), authPath, sdkEntrySha256: '0'.repeat(64), allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0, deadlineMs: 15000, outputBytes: 2048, maxOutputTokens: 512, approvedRoute: route, capacity: { pool, policySha256: hash(policy) }, capacityRunnerSha256: hash(await readFile(join(source, 'tools/execution-capacity.mjs'))), ...(role === 'reviewer' ? { implementerRef: job.implementerRef, reviewerRef: 'synthetic-independent-' + id } : { coordinatorRef: job.coordinatorRef, plannerRef: 'synthetic-' + id }) };
    await json(grantFile, grant); controls.set(id, { entered: Promise.withResolvers(), finish: Promise.withResolvers() });
    const request = { project, store, inputSha, jobPath: id + '.json', grantFile };
    await (role === 'reviewer' ? prepareReview : preparePlanProposal)(request);
    return { id, role, job, request };
  }
  const planner = await assignment('planner', 'planner'), panel = [];
  for (const id of ['P1', 'P2', 'P3']) panel.push(await assignment(id, 'reviewer'));
  assert.equal(new Set(panel.map(item => item.job.logicalJobRef)).size, 3);
  const unrelated = await assignment('unrelated-planner', 'planner');
  function backend(id) { return {
    async preflight(tuple) { assert.deepEqual(tuple, route[0]); return { model: { provider: 'openai-codex', id: 'gpt-6-luna' }, billingEvidence: { source: 'synthetic' } }; },
    async fetch() { fetches++; return new Response('', { status: 200 }); },
    stream(model, context, options) {
      assert.match(options.sessionId, /^[a-f0-9-]{36}$/u); assert(!sessions.has(options.sessionId)); sessions.add(options.sessionId);
      assert.equal(options.reasoning, 'high'); assert.equal(options.maxRetries, 0); assert.equal(context.tools, undefined);
      return { async result() {
      active++; peak = Math.max(peak, active);
      try { await options.fetch('https://synthetic.invalid'); controls.get(id).entered.resolve(); await controls.get(id).finish.promise; return { provider: model.provider, model: model.id, stopReason: 'stop', content: [{ type: 'text', text: 'Standards: inconclusive. Spec: inconclusive. Synthetic capacity test; no product verdict or acceptance.' }] }; }
      finally { active--; }
    } }; },
  }; }
  function start(item) { const run = item.role === 'reviewer' ? runReview : runPlanProposal; const promise = run(item.request, { mode: 'fixture', backend: backend(item.id) }); pending.add(promise); promise.then(() => pending.delete(promise), () => pending.delete(promise)); return promise; }
  const entered = (item, run) => wait(Promise.race([controls.get(item.id).entered.promise, run.then(result => { throw Error('entry did not start: ' + item.id + ' ' + JSON.stringify(result)); })]), item.id + ' enters slot');
  async function capacityRefusal(item) { const before = fetches, result = await start(item); assert.equal(result.reason, 'capacity'); assert.equal(result.attemptsConsumed, 0); assert.equal(fetches, before); assert.deepEqual(await readdir(item.request.store), []); }
  const plannerRun = start(planner), first = start(panel[0]);
  await Promise.all([entered(planner, plannerRun), entered(panel[0], first)]);
  await capacityRefusal(panel[1]);
  controls.get('planner').finish.resolve(); assert.equal((await wait(plannerRun, 'planner completion')).status, 'proposal-complete');
  const second = start(panel[1]); await entered(panel[1], second);
  await capacityRefusal(panel[2]);
  controls.get('P1').finish.resolve(); const firstResult = await wait(first, 'first reviewer completes'); assert.equal(firstResult.status, 'response-complete'); assert.match(firstResult.report, /inconclusive/u); assert.equal(firstResult.reason, 'review-report-requires-coordinator-assessment');
  const third = start(panel[2]); await entered(panel[2], third);
  controls.get('P2').finish.resolve(); controls.get('P3').finish.resolve();
  for (const result of await wait(Promise.all([second, third]), 'panel completion')) assert.equal(result.status, 'response-complete');
  assert.equal(peak, 2); assert.equal(active, 0); assert.equal(fetches, 4);
  assert.equal((await readdir(pool)).filter(name => name.startsWith('slot-')).length, 0);
  assert.equal((await readdir(join(pool, 'completed'))).length, 4);
  for (const item of panel) { const read = await readReview({ project, store: item.request.store, logicalJobRef: item.job.logicalJobRef }); assert.equal(read.status, 'recorded'); assert.equal(read.binding.capacity.pool, pool); assert.equal(read.binding.capacity.role, 'reviewer'); assert.equal(read.result.mode, 'fixture'); assert.equal(read.executionAuthorized, false); assert.match(read.result.report, /inconclusive/u); }
  await assert.rejects(start(panel[0])); assert.equal(fetches, 4, 'completed participant cannot replay');
  controls.get(unrelated.id).finish.resolve(); assert.equal((await wait(start(unrelated), 'unrelated job progress')).status, 'proposal-complete');
  assert.equal((await readdir(join(pool, 'completed'))).length, 5); assert.equal(fetches, 5); assert.equal(sessions.size, 5);
  console.log('PASS native caller fixture panel: three distinct reviewer refs share two global slots with planner, blocked entries consume zero attempts, successive slots complete without deadlock, pending verdicts retain no execution slot, unrelated work proceeds and replay refuses; no provider calls or actual product review');
} finally {
  for (const control of controls.values()) control.finish.resolve(); await Promise.allSettled([...pending]); await rm(root, { recursive: true, force: true });
}
