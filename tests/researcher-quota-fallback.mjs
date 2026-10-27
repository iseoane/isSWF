import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm , realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runResearch, sdkResearchBackend } from '../tools/researcher-task.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const sdkPath = process.argv[3];
if (sdkPath) assert(isAbsolute(sdkPath));
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-quota66-')));
const project = join(root, 'project'), hash = b => createHash('sha256').update(b).digest('hex');
const text = '21 (facts.md).', canary = 'synthetic-private-error-message';
const envelope = type => JSON.stringify({ type: 'error', error: { type, message: canary } });
const cases = [
  { name: 'known-Go-quota-advances-without-retry', body: envelope('GoUsageLimitError'), advance: true },
  { name: 'quota-does-not-widen-total-budget', body: envelope('GoUsageLimitError'), quota: true, totalAttempts: 1 },
  { name: 'rate-limit-is-not-quota', body: envelope('RateLimitError') },
  { name: 'free-tier-not-supported-by-Go-contract', body: envelope('FreeUsageLimitError') },
  { name: 'prose-never-authorizes-transition', body: JSON.stringify({ type: 'error', error: { type: 'unknown', message: 'GoUsageLimitError quota exceeded' } }) },
  { name: 'wrong-envelope-blocks', body: JSON.stringify({ type: 'GoUsageLimitError' }) },
  { name: 'unknown-429-blocks', body: '{}' },
  { name: 'malformed-JSON-blocks', body: '{' },
  { name: 'oversized-body-blocks', body: JSON.stringify({ type: 'error', error: { type: 'GoUsageLimitError', message: 'x'.repeat(9000) } }) },
  { name: 'auth-status-cannot-be-quota', body: envelope('GoUsageLimitError'), status: 401 },
  { name: 'other-provider-cannot-use-Go-contract', body: envelope('GoUsageLimitError'), otherProvider: true },
  { name: 'clone-failure-preserves-response', body: envelope('GoUsageLimitError'), cloneFailure: true },
  { name: 'capture-stall-remains-deadline-bounded', body: envelope('GoUsageLimitError'), stall: true },
];
const savedFetch = globalThis.fetch; let forbiddenFetches = 0;
globalThis.fetch = async () => { forbiddenFetches++; throw Error('network forbidden'); };
function git(...args) {
  const r = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: root, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
}
const commit = () => { git('add', '.'); git('-c', 'user.name=Quota fixture', '-c', 'user.email=quota@invalid', 'commit', '-qm', 'Pin quota fixture'); return git('rev-parse', 'HEAD'); };
try {
  await mkdir(join(project, '.factory'), { recursive: true });
  const config = await readFile(join(source, '.factory/models.json')), route = JSON.parse(config).roles.researcher;
  await writeFile(join(project, '.factory/models.json'), config); await writeFile(join(project, 'facts.md'), 'The result is 21.\n'); await writeFile(join(project, 'brief.md'), 'Read facts.md and cite the result.\n');
  git('init', '-q'); const targetBase = commit(), authPath = join(root, 'synthetic-auth.json');
  await writeFile(authPath, JSON.stringify({ 'opencode-go': { type: 'api_key', key: 'synthetic-quota-test-key' } }), { mode: 0o600 });
  for (const [i, c] of cases.entries()) {
    const logicalJobRef = `quota-fixture-${i}`, store = join(root, `store-${i}`); await mkdir(store);
    const pool=join(root,`capacity-${i}`);await mkdir(pool);await mkdir(join(pool,'completed'));
    const policy=JSON.stringify({version:1,limit:1,reference:'Synthetic researcher quota capacity'});await writeFile(join(pool,'policy.json'),policy);
    const capacity={pool,policySha256:hash(policy)},capacityRunnerSha256=hash(await readFile(join(source,'tools/execution-capacity.mjs')));
    const job = { version: 1, logicalJobRef, models: { sha: targetBase, path: '.factory/models.json', sha256: hash(config) }, briefPath: 'brief.md', sources: ['facts.md'], targetRepo: project, targetBase, sdkPath: sdkPath || '/unused-injected-sdk' };
    await writeFile(join(project, 'job.json'), JSON.stringify(job)); const inputSha = commit();
    const grant = { version: 1, capacity, capacityRunnerSha256, role: 'researcher', project, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), logicalJobRef, grantRef: 'synthetic-not-runtime-authority', targetRepo: project, targetBase, store, allowResultArtifact: true, callerSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), approvedRoute: route, totalAttempts: c.totalAttempts || 3, retryBudget: 1, deadlineMs: c.stall ? 100 : 5000, outputBytes: 1024, maxOutputTokens: 256, apiCostsAllowed: false, temporaryUnavailableStatuses: [503], allowProviderCalls: false, authPath, subscriptionAttestations: [{ provider: 'opencode-go', coversCallsWithoutAdditionalApiCost: true, reference: 'synthetic-only' }] };
    if (sdkPath) grant.sdkEntrySha256 = hash(await readFile(join(sdkPath, 'dist/index.js')));
    const grantFile = join(root, `grant-${i}.json`); await writeFile(grantFile, JSON.stringify(grant));
    const actual = sdkPath ? await sdkResearchBackend(job, grant) : null;
    const attempts = [], originalBodies = []; let sends = 0, ended = 0;
    const backend = {
      async preflight(tuple) {
        attempts.push(tuple); if (actual && tuple.model === route[0].model && !c.otherProvider) return actual.preflight(tuple);
        const [provider, id] = tuple.model.split('/'); return { model: { provider: c.otherProvider ? 'openai-codex' : provider, id }, billingEvidence: { source: 'synthetic' } };
      },
      stream(model, context, options) {
        if (actual && model.provider === 'opencode-go') return actual.stream(model, context, options);
        return { result: async () => { const response = await options.fetch('https://fixture.invalid'); originalBodies.push(await response.text()); ended++; return { provider: model.provider, model: model.id, stopReason: response.status === 200 ? 'stop' : 'error', content: [{ type: 'text', text }] }; } };
      },
      async fetch() {
        sends++; if (sends > 1) { assert.equal(ended, actual ? 0 : 1); return new Response(text); }
        const response = new Response(c.body, { status: c.status || 429 });
        if (c.cloneFailure) response.clone = () => { throw Error('synthetic clone failure'); };
        if (c.stall) response.clone = () => new Response(new ReadableStream({ start() {} }));
        return response;
      },
    };
    const result = await runResearch({ project, inputSha, jobPath: 'job.json', grantFile, store }, { mode: 'fixture', backend });
    assert.equal(result.status, c.advance ? 'complete' : 'blocked', `${c.name}: ${JSON.stringify(result)}`);
    assert.equal(sends, c.advance ? 2 : 1, c.name); assert.equal(result.attemptsConsumed, sends);
    assert.deepEqual(attempts, c.advance ? route : [route[0]], c.name);
    if (c.advance) assert.equal(result.text, text);
    if (c.advance || c.quota) { assert.equal(result.records[0].outcome, 'quota-exhausted'); assert.deepEqual(result.records[0].quotaEvidence, { source: 'opencode-go-json-error', code: 'GoUsageLimitError' }); }
    else assert.equal(result.records[0].quotaEvidence, undefined, c.name);
    if (c.quota) assert.equal(result.reason, 'total-attempt-budget-exhausted');
    assert(!JSON.stringify(result).includes(canary));
    if (!actual || c.otherProvider) assert.equal(originalBodies[0], c.body, c.name);
    const [dir] = await readdir(store), durable = JSON.parse(await readFile(join(store, dir, 'result.json'))); assert.deepEqual(durable, result);
    const binding=JSON.parse(await readFile(join(store,dir,'binding.json')));assert.deepEqual(binding.capacity,result.capacity);assert.equal(binding.capacity.role,'researcher');
    assert.equal((await readdir(pool)).includes('slot-0'),!c.advance,c.name);assert.equal((await readdir(join(pool,'completed'))).length,c.advance?1:0,c.name);
  }
  assert.equal(forbiddenFetches, 0);
  console.log(JSON.stringify({ status: 'PASS', controls: cases.map(c => c.name), mode: sdkPath ? 'actual-primary-SDK-synthetic-transport-and-injected-alternate' : 'portable-injected-caller', forbiddenNetworkFetches: forbiddenFetches, realRuntimeCalls: 0, limits: 'Known versioned Go error envelope only. No current-service quota response, all-provider classifier or actual fallback claim.' }, null, 2));
} finally { globalThis.fetch = savedFetch; await rm(root, { recursive: true, force: true }); }
