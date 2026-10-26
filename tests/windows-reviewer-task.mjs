import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyRelease } from '../tools/release-source.mjs';

async function compiledReview({ root, release, methodologySha }) {
  const assert = (await import('node:assert/strict')).default;
  const { mkdir, readFile, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { createHash } = await import('node:crypto');
  const { spawnSync } = await import('node:child_process');
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const { runReview, readReview } = await import(pathToFileURL(join(release, 'tools/reviewer-task.mjs')));
  const project = join(root, 'project'), store = join(root, 'store'); await mkdir(project); await mkdir(store);
  const git = (...args) => { const value = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 10000 }); assert.ifError(value.error); assert.equal(value.status, 0, value.stderr); return value.stdout.trim(); };
  const commit = () => { git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Synthetic compiled review input'); return git('rev-parse', 'HEAD'); };
  const save = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
  git('init', '-q'); git('config', 'core.autocrlf', 'false');
  await writeFile(join(project, 'app.mjs'), 'export const value=1;\n'); const targetBase = commit();
  await writeFile(join(project, 'app.mjs'), 'export const value=2;\n'); const candidateSha = commit();
  await writeFile(join(project, 'brief.md'), 'Synthetic supplied-evidence transport only; no real provider or verdict.\n');
  await writeFile(join(project, 'models.json'), await readFile(join(release, '.factory/models.json'))); const modelsSha = commit();
  const job = { version: 1, logicalJobRef: 'I0009/J007/compiled-review-fixture', implementerRef: 'synthetic-author', targetRepo: project, targetBase, candidateSha, methodologySha, briefPath: 'brief.md', contextPaths: ['app.mjs'], models: { sha: modelsSha, path: 'models.json', sha256: hash(await readFile(join(project, 'models.json'))) }, sdkPath: join(root, 'synthetic-not-loaded-sdk') };
  await save(join(project, 'review.json'), job); const inputSha = commit();
  const authPath = join(root, 'synthetic-auth.json'); await save(authPath, {});
  const grantFile = join(root, 'grant.json');
  await save(grantFile, { version: 1, role: 'reviewer', project, store, inputSha, jobPath: 'review.json', jobSha256: hash(await readFile(join(project, 'review.json'))), logicalJobRef: job.logicalJobRef, targetRepo: project, targetBase, candidateSha, grantRef: 'Synthetic compiled artifact test only', implementerRef: job.implementerRef, reviewerRef: 'synthetic-independent-reviewer', callerSha256: hash(await readFile(join(release, 'tools/reviewer-task.mjs'))), backendSha256: hash(await readFile(join(release, 'tools/researcher-task.mjs'))), authPath, sdkEntrySha256: '0'.repeat(64), allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0, deadlineMs: 10000, outputBytes: 2048, maxOutputTokens: 512, approvedRoute: [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }] });
  let fetches = 0; globalThis.fetch = () => { throw Error('Real network prohibited'); };
  const backend = { async preflight() { return { model: { provider: 'openai-codex', id: 'gpt-6-luna' }, billingEvidence: { source: 'synthetic' } }; }, async fetch() { fetches++; return new Response('', { status: 200 }); }, stream(model, context, options) { assert.equal(context.tools, undefined); assert.equal(JSON.parse(context.messages[0].content).candidateSha, candidateSha); return { async result() { await options.fetch('https://synthetic.invalid'); return { provider: model.provider, model: model.id, stopReason: 'stop', content: [{ type: 'text', text: 'Synthetic transport; not an independent product verdict.' }] }; } }; } };
  const request = { project, store, inputSha, jobPath: 'review.json', grantFile };
  const result = await runReview(request, { mode: 'fixture', backend }); assert.equal(result.status, 'response-complete', JSON.stringify(result)); assert.equal(fetches, 1);
  assert.equal((await readReview({ project, store, logicalJobRef: job.logicalJobRef })).status, 'recorded');
  await assert.rejects(runReview(request, { mode: 'fixture', backend })); assert.equal(fetches, 1);
  console.log(JSON.stringify({ status: 'PASS', checks: ['actual installed compiled runtime', 'native canonical roots and external boundaries', 'pinned supplied-evidence reviewer', 'synthetic one-fetch transport', 'durable readback and replay refusal'], limits: 'No real SDK/provider, workspace probes or independent product verdict' }));
}

if (process.platform !== 'win32') console.log('SKIP compiled Windows reviewer: not Windows');
else {
  assert(process.env.ISSWF_PLATFORM_ROOT, 'Run platform-package first');
  const report = JSON.parse(await readFile(join(process.env.ISSWF_PLATFORM_ROOT, 'platform-report.json'))), release = report.installed, receipt = verifyRelease(release);
  const root = await mkdtemp(join(tmpdir(), 'isswf compiled review ñ ')), script = join(root, 'review.mjs');
  await writeFile(script, '(' + compiledReview.toString() + ')(' + JSON.stringify({ root, release, methodologySha: receipt.methodologySha }) + ');\n');
  const result = spawnSync(join(release, 'bin/isswf.exe'), [script], { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 }); assert.ifError(result.error); assert.equal(result.status, 0, result.stderr + '\n' + result.stdout);
  console.log(JSON.stringify({ root, revision: receipt.revision, result: JSON.parse(result.stdout.trim()) }));
}
