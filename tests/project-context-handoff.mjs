import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { preparePlanProposal } = await import(pathToFileURL(join(source, 'tools/planner-task.mjs')));
const selectedContext = {
  project: 'fixture-own',
  facts: [{ id: 1, fact: 'Selected advisory context is not execution authority.' }],
};
const root = await mkdtemp(join(tmpdir(), 'isswf-context-handoff-')), project = join(root, 'project'), store = join(root, 'store');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (cwd, ...args) => { const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', timeout: 10000 }); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); };
const commit = () => { git(project, 'add', '.'); git(project, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'context input'); return git(project, 'rev-parse', 'HEAD'); };
try {
  await mkdir(project); await mkdir(store); git(project, 'init', '-q');
  await writeFile(join(project, 'primary.md'), 'Current primary source: CI succeeded; memory is not authority.\n');
  const base = commit();
  // The coordinator has already selected these facts. This exercises transport, not a semantic filter.
  const selected = JSON.stringify(selectedContext);
  const brief = 'Explain the current primary source. No tools, adoption or remote actions.\nAdvisory selected facts:\n' + selected + '\n';
  await writeFile(join(project, 'brief.md'), brief);
  await writeFile(join(project, 'models.json'), await readFile(join(source, '.factory/models.json')));
  const modelsSha = commit();
  const job = { version: 1, logicalJobRef: 'I0001/J007/context-handoff', coordinatorRef: 'test-coordinator', targetRepo: project, targetBase: base, methodologySha: git(source, 'rev-parse', 'HEAD'), briefPath: 'brief.md', contextPaths: ['primary.md'], models: { sha: modelsSha, path: 'models.json', sha256: hash(await readFile(join(project, 'models.json'))) }, sdkPath: '/synthetic/not-loaded' };
  await writeFile(join(project, 'job.json'), JSON.stringify(job)); const inputSha = commit();
  const grant = { version: 1, role: 'planner', project, store, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), logicalJobRef: job.logicalJobRef, targetRepo: project, targetBase: base, grantRef: 'Synthetic prepare-only grant, no provider permission', coordinatorRef: job.coordinatorRef, plannerRef: 'test-planner', callerSha256: hash(await readFile(join(source, 'tools/planner-task.mjs'))), backendSha256: hash(await readFile(join(source, 'tools/researcher-task.mjs'))), authPath: join(root, 'absent-auth'), sdkEntrySha256: '0'.repeat(64), allowResultArtifact: true, allowProviderCalls: false, apiCostsAllowed: false, totalAttempts: 1, retryBudget: 0, deadlineMs: 1000, outputBytes: 2048, maxOutputTokens: 512, approvedRoute: [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }] };
  await writeFile(grant.authPath, '{}\n');
  const grantFile = join(root, 'grant.json'); await writeFile(grantFile, JSON.stringify(grant));
  const request = { project, store, inputSha, jobPath: 'job.json', grantFile };
  const forbidden = ['SYNTHETIC_SECRET_DO_NOT_HAND_OFF_927', 'SYNTHETIC_FOREIGN_CONTEXT_814'];
  await writeFile(join(project, 'brief.md'), forbidden.join('\n'));
  const prepared = await preparePlanProposal(request), bundle = JSON.parse(prepared.prompt);
  assert.equal(bundle.brief, brief);
  assert.deepEqual(bundle.context, [{ path: 'primary.md', checkpoint: inputSha, text: 'Current primary source: CI succeeded; memory is not authority.\n' }]);
  for (const marker of forbidden) assert.equal(prepared.prompt.includes(marker), false);
  assert.deepEqual(await readdir(store), []);
  // Controlled absence uses only the primary source; no optional service or substitute store.
  await writeFile(join(project, 'brief.md'), 'Optional context unavailable; explain primary.md only. No unresolved decision is inferred.\n');
  const degradedBrief = await readFile(join(project, 'brief.md'), 'utf8'), degradedInput = commit();
  await writeFile(grantFile, JSON.stringify({ ...grant, inputSha: degradedInput }));
  const degraded = await preparePlanProposal({ ...request, inputSha: degradedInput });
  assert.equal(JSON.parse(degraded.prompt).brief, degradedBrief);
  assert.equal(degraded.prompt.includes(selected), false);
  assert.deepEqual(await readdir(store), []);
  console.log('PASS actual native prepare-only handoff: exact coordinator-selected facts and primary source; mutable foreign/secret markers excluded; source-only controlled absence; no SDK, provider, optional service or store writes. Not an automatic semantic filter.');
} finally {
  await rm(root, { recursive: true, force: true });
}
