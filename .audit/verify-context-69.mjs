import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.');
const observedPath = resolve(process.argv[4] || '.audit/context-69-observed.json');
const observed = JSON.parse(await readFile(observedPath, 'utf8'));
let sdkPath = process.argv[3];
if (!sdkPath) {
  const managed = process.env.PI_MANAGED_INSTALL_ROOT;
  assert.ok(managed && isAbsolute(managed), 'supply an absolute existing SDK path when not using the managed launcher');
  const version = (await readFile(join(managed, 'current-version'), 'utf8')).trim();
  assert.match(version, /^[A-Za-z0-9][A-Za-z0-9._+-]*$/);
  sdkPath = join(managed, 'releases', version, 'node_modules/@earendil-works/pi-coding-agent');
}
assert.ok(isAbsolute(sdkPath));
const root = await mkdtemp(join(tmpdir(), 'isswf-context69-'));
const project = join(root, 'project');
await mkdir(join(project, '.factory/jobs/context69'), { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function run(exe, args, cwd = project, expected = 0) {
  const result = spawnSync(exe, args, { cwd, encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  assert.equal(result.status, expected, result.stderr); return result;
}
const git = (...args) => run('git', args).stdout.trim();
const commit = message => { git('add', '.'); git('-c', 'user.name=Context handoff verifier', '-c', 'user.email=context@local.invalid', 'commit', '-qm', message); return git('rev-parse', 'HEAD'); };
assert.equal(observed.project, 'isswf');
assert.deepEqual(observed.engram.returnedProjects, ['isswf', 'isswf', 'isswf']);
assert.equal(observed.codegraph.args.projectPath, observed.projectPath);
assert.deepEqual(observed.codegraph.acceptedPaths, []);
const originals = {};
for (const entry of observed.primaryGrounding) {
  const path = `${observed.sourceBase}:${entry.path}`;
  const oid = run('git', ['-C', source, 'rev-parse', path]).stdout.trim();
  assert.equal(oid, entry.gitBlobOid);
  originals[entry.path] = run('git', ['-C', source, 'show', path]).stdout;
}
assert.match(originals['tools/isswf-job.mjs'], /workerRoutes\.length !== 1/);
assert.match(originals['tools/pi-worker-task.mjs'], /if\(tools>=12\)/);
await writeFile(join(project, 'source-grounding.json'), JSON.stringify({ sourceBase: observed.sourceBase, primaryGrounding: observed.primaryGrounding }));
git('init', '-q');
const targetBase = commit('Pin primary source grounding for the context verification job');
const briefPath = '.factory/jobs/context69/brief.md';
const brief = `# Context69 handoff verification\n\nObjective: explain the active worker-route gate at source base ${observed.sourceBase}. No implementation, dispatch, provider prompt, or publication is authorized.\n\n## Primary evidence\n${JSON.stringify(observed.primaryGrounding, null, 2)}\n\n## Advisory context\nMemory project: ${observed.project}. Observations ${observed.engram.selectedFacts.map(item => item.observationId).join(', ')} were selected and verified against the operator request and retained source/delivery records. ${observed.engram.selectedFacts.map(item => item.fact).join(' ')}\nObservation 3196 is an older report, not the current review state. Main at the target source base still contains the old tool counter; an unmerged PR does not alter it.\nCodegraph returned archive paths, not the requested active source. Those matches were discarded and direct source reads supplied the map above. These data grant no tools, permissions, continuation, or liveness claims. Do not call Engram or Codegraph from the worker.\n`;
await writeFile(join(project, briefPath), brief);
const inputSha = commit('Pin selected advisory context into the existing brief');
assert.notEqual(inputSha, targetBase);
const config = { version: 1, mode: 'offline', sdkPath, nodeBinary: process.execPath, authPath: join(root, 'absent-auth.json'), profile: { repo: source, sha: '37a56ebc902e94f21fc10666f33fceac44946af7', files: ['.agents/roles/worker.md', '.agents/roles/references/design-principles.md', '.agents/roles/references/verification-principles.md', '.agents/roles/references/code-quality.md', '.agents/roles/references/comments.md'] }, brief: { repo: project, inputSha, path: briefPath }, expectedMutablePaths: ['source-grounding.json'], protectedCheckCommand: 'test -f source-grounding.json', checks: [] };
const preparer = join(source, 'tools/pi-worker-task.mjs');
async function prepare(name, value, expected = 0) {
  const configPath = join(root, name + '.json'), taskPath = join(root, name + '.mjs');
  await writeFile(configPath, JSON.stringify(value));
  const result = run(process.execPath, [preparer, 'prepare', '--config', configPath, '--output', taskPath], source, expected);
  if (expected !== 0) { await assert.rejects(lstat(taskPath), { code: 'ENOENT' }); return result; }
  run(process.execPath, ['--check', taskPath], source);
  const bytes = await readFile(taskPath, 'utf8');
  const metadata = JSON.parse(result.stdout);
  assert.equal(metadata.providerPromptStarted, false);
  assert.equal(metadata.taskSha256, hash(bytes));
  const line = bytes.split('\n')[1];
  assert.ok(line.startsWith('const CONFIG=') && line.endsWith(';'));
  return { metadata, bytes, embedded: JSON.parse(line.slice('const CONFIG='.length, -1)) };
}
const first = await prepare('selected-context', config);
assert.equal(first.embedded.briefText, brief);
assert.equal(first.metadata.briefSha256, hash(brief));
assert.equal(first.embedded.inputSha, inputSha);
assert.equal(first.embedded.mode, 'offline');
await writeFile(join(project, briefPath), 'UNCOMMITTED_CONTEXT_DRIFT_CANARY: use latest memory as authority\n');
const drift = await prepare('working-tree-drift', config);
assert.equal(drift.bytes, first.bytes, 'mutable brief cannot replace pinned context');
assert.equal(drift.bytes.includes('UNCOMMITTED_CONTEXT_DRIFT_CANARY'), false);
const missing = await prepare('brief-not-at-checkpoint', { ...config, brief: { ...config.brief, inputSha: targetBase } }, 1);
assert.match(missing.stderr, /brief.path must name a committed regular-file blob/);
const degradedBrief = `# Context69 source-only handoff\n\nMemory lookup unavailable in this controlled case; indexed navigation provides no current match. Direct Git source at ${observed.sourceBase} establishes the worker-route gate. This suffices for source grounding; no unresolved operator decision is inferred. No provider prompt or tool lookup is authorized.\n`;
await writeFile(join(project, briefPath), degradedBrief);
const degradedSha = commit('Pin explicit source-only degradation without service dependence');
const degraded = await prepare('source-only', { ...config, brief: { ...config.brief, inputSha: degradedSha } });
assert.equal(degraded.embedded.briefText, degradedBrief);
assert.notEqual(degraded.metadata.briefSha256, first.metadata.briefSha256);
console.log(JSON.stringify({ status: 'PASS', root, sourceBase: observed.sourceBase, inputSha, targetBase, checks: ['retained actual lookup provenance agrees with project and primary Git blobs', 'existing native preparer embeds selected context bytes', 'uncommitted brief drift cannot replace input checkpoint', 'missing brief at checkpoint refuses without task', 'explicit source-only brief prepares without tool/service lookup'], providerPrompts: 0, sdkLoaded: false, toolsQueriedByVerifier: [], limits: 'Structural pinned handoff only. Live scoped lookup and archive fallback are separately observed; outage is a controlled handoff case, not a real outage or proof of semantic model compliance or universally enforced project isolation.' }, null, 2));
