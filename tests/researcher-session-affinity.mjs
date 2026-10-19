import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareResearch, runResearch, sdkResearchBackend } from '../tools/researcher-task.mjs';
import { prepareCapacity, acquireCapacity } from '../tools/execution-capacity.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const sdkPath = process.argv[3];
if (sdkPath) assert(isAbsolute(sdkPath), 'optional SDK path must be absolute');
const root = await mkdtemp(join(tmpdir(), 'isswf-session66-'));
const project = join(root, 'project');
const hash = b => createHash('sha256').update(b).digest('hex');
function git(...args) {
  const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: root, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
}
const commit = message => { git('add', '.'); git('-c', 'user.name=Session fixture', '-c', 'user.email=session@invalid', 'commit', '-qm', message); return git('rev-parse', 'HEAD'); };
const resultText = '21 (facts.md).';
const savedFetch = globalThis.fetch;
let forbiddenFetches = 0;
globalThis.fetch = async () => { forbiddenFetches++; throw Error('network forbidden'); };
try {
  await mkdir(join(project, '.factory'), { recursive: true });
  const config = await readFile(join(source, '.factory/models.json'));
  const route = JSON.parse(config).roles.researcher;
  await writeFile(join(project, '.factory/models.json'), config);
  await writeFile(join(project, 'facts.md'), 'The protected result is 21.\n');
  await writeFile(join(project, 'brief.md'), 'Report the result and cite facts.md.\n');
  git('init', '-q'); const targetBase = commit('Pin research sources');
  const key = 'synthetic-session-test-credential';
  const authPath = join(root, 'synthetic-auth.json');
  await writeFile(authPath, JSON.stringify({ 'opencode-go': { type: 'api_key', key } }), { mode: 0o600 });
  const pool = join(root,'capacity'); await mkdir(pool); await mkdir(join(pool,'completed'));
  const policy = JSON.stringify({version:1,limit:1,reference:'Synthetic mixed planner/researcher pool'}); await writeFile(join(pool,'policy.json'),policy);
  const capacity = {pool,policySha256:hash(policy)}, capacityRunnerSha256=hash(await readFile(join(source,'tools/execution-capacity.mjs')));
  const poolScope=await prepareCapacity(capacity,[project,source],capacityRunnerSha256);
  const sessionIds = [];
  for (const number of (sdkPath ? [1, 2, 4] : [1, 2, 3, 4])) {
    const logicalJobRef = `session-fixture-${number}`, store = join(root, `store-${number}`);
    await mkdir(store);
    const job = { version: 1, logicalJobRef, models: { sha: targetBase, path: '.factory/models.json', sha256: hash(config) }, briefPath: 'brief.md', sources: ['facts.md'], targetRepo: project, targetBase, sdkPath: sdkPath || '/unused-injected-sdk' };
    await writeFile(join(project, 'job.json'), JSON.stringify(job)); const inputSha = commit('Pin scoped research job');
    const grant = { version: 1, ...(number===4?{}:{capacity,capacityRunnerSha256}), role: 'researcher', project, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), logicalJobRef, grantRef: 'synthetic-offline-session-test', targetRepo: project, targetBase, store, allowResultArtifact: true, callerSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), approvedRoute: route, totalAttempts: 3, retryBudget: 1, deadlineMs: 5000, outputBytes: 8192, maxOutputTokens: 512, apiCostsAllowed: false, temporaryUnavailableStatuses: [503], allowProviderCalls: false, authPath, subscriptionAttestations: [{ provider: 'opencode-go', coversCallsWithoutAdditionalApiCost: true, reference: 'synthetic-not-account-evidence' }] };
    if (sdkPath) grant.sdkEntrySha256 = hash(await readFile(join(sdkPath, 'dist/index.js')));
    const grantFile = join(root, `grant-${number}.json`); await writeFile(grantFile, JSON.stringify(grant));
    const optionsSeen = [], headersSeen = [], leaseIds=[]; let sends = 0;
    const backend = sdkPath ? await sdkResearchBackend(job, grant) : {
      preflight: async tuple => { const slash = tuple.model.indexOf('/'); return { model: { provider: tuple.model.slice(0, slash), id: tuple.model.slice(slash + 1) }, billingEvidence: { source: 'synthetic' } }; },
      stream: (model, _context, options) => ({ result: async () => { optionsSeen.push(options.sessionId); assert.equal(options.maxRetries, 0); const response = await options.fetch('https://fixture.invalid'); return { provider: model.provider, model: model.id, stopReason: response.status === 200 ? 'stop' : 'error', content: [{ type: 'text', text: resultText }] }; } }),
    };
    backend.fetch = async (input, init) => {
      sends++;
      if(number!==4){const lease=JSON.parse(await readFile(join(pool,'slot-0/lease.json')));assert.equal(lease.role,'researcher');leaseIds.push(lease.id);}
      if (sdkPath) {
        const request = new Request(input, init), id = request.headers.get('x-opencode-session'); headersSeen.push(id);
        assert.equal(request.headers.get('x-opencode-client'), null);
        if (!id) return new Response(JSON.stringify({ error: { type: 'MissingSessionID', message: 'Request is missing x-opencode-session' } }), { status: 400 });
      }
      if ((number === 1 && sends === 1) || (number === 3 && sends <= 2)) return new Response('{}', { status: 503 });
      const chunks = [
        { id: 'fixture', object: 'chat.completion.chunk', model: 'glm-5.3-flash', choices: [{ index: 0, delta: { role: 'assistant', content: resultText }, finish_reason: null }] },
        { id: 'fixture', object: 'chat.completion.chunk', model: 'glm-5.3-flash', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] },
      ];
      return new Response(chunks.map(c => 'data: ' + JSON.stringify(c) + '\n\n').join('') + 'data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
    };
    if(number===1){
      for(const change of [{capacityRunnerSha256:'0'.repeat(64)},{capacity:{pool,policySha256:'0'.repeat(64)}}]){
        await writeFile(grantFile,JSON.stringify({...grant,...change}));await assert.rejects(prepareResearch({project,inputSha,jobPath:'job.json',grantFile,store}));
        assert.deepEqual(await readdir(store),[]);
      }
      await writeFile(grantFile,JSON.stringify(grant));
      const held=await acquireCapacity(poolScope,{role:'planner',logicalJobRef:'synthetic-held-planner',mode:'fixture'});
      assert(held);
      const blocked=await runResearch({project,inputSha,jobPath:'job.json',grantFile,store},{mode:'fixture',backend});
      assert.equal(blocked.reason,'capacity');assert.equal(blocked.attemptsConsumed,0);assert.equal(sends,0);assert.deepEqual(await readdir(store),[]);
      await held.complete();
    }
    const result = await runResearch({ project, inputSha, jobPath: 'job.json', grantFile, store }, { mode: 'fixture', backend });
    assert.equal(result.status, 'complete', JSON.stringify(result)); assert.equal(result.text, resultText);
    assert.equal(new Set(leaseIds).size,number===4?0:1);assert.equal((await readdir(pool)).includes('slot-0'),false);
    const sendsBeforeReplay=sends;await assert.rejects(runResearch({project,inputSha,jobPath:'job.json',grantFile,store},{mode:'fixture',backend}));assert.equal(sends,sendsBeforeReplay);
    assert.equal(sends, number === 3 ? 3 : number === 1 ? 2 : 1);
    const [dir] = await readdir(store), binding = JSON.parse(await readFile(join(store, dir, 'binding.json')));
    if(number===4)assert.equal(binding.capacity,undefined);else assert.equal(binding.capacity.role,'researcher');assert.deepEqual(result.capacity,binding.capacity);
    assert.match(binding.sessionId || '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    assert.deepEqual(sdkPath ? headersSeen : optionsSeen, Array(sends).fill(binding.sessionId)); sessionIds.push(binding.sessionId);
  }
  assert.equal(new Set(sessionIds).size, sessionIds.length); assert.equal(forbiddenFetches, 0);
  console.log(JSON.stringify({ status: 'PASS', mode: sdkPath ? 'actual-SDK-synthetic-auth-and-transport' : 'injected-caller-contract', sameSessionAcrossRetry: true, distinctSessionAcrossJobs: true, persistedOpaqueUUID: true, forbiddenNetworkFetches: forbiddenFetches, realRuntimeCalls: 0, limits: 'Synthetic provider acceptance only; no real service availability or fallback integration proof.' }, null, 2));
} finally { globalThis.fetch = savedFetch; await rm(root, { recursive: true, force: true }); }
