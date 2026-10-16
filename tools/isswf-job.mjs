#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, realpath, mkdir, mkdtemp, lstat, readdir, open, link, unlink } from 'node:fs/promises';
import { dirname, join, resolve, isAbsolute, basename, relative } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { verifyPackage, canonicalPath } from './factory-package.mjs';
import { inspectNativeRecovery } from './native-recovery.mjs';
import { effectIntent, externalEffect } from './external-effect-journal.mjs';
import { recoveryReview } from './recovery-review.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const methodologySha = '37a56ebc902e94f21fc10666f33fceac44946af7';
const runtimeFiles = ['tools/isswf-job.mjs', 'tools/factory-package.mjs', 'tools/pi-worker-task.mjs', 'tools/worker-lifecycle.mjs', 'tools/native-recovery.mjs', 'tools/external-effect-journal.mjs', 'tools/recovery-review.mjs'];
const profileFiles = ['.agents/roles/worker.md', '.agents/roles/references/execution-principles.md', '.agents/roles/references/verification-principles.md', '.agents/roles/references/code-quality.md'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fullSha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const safeRelative = value => typeof value === 'string' && !value.includes('\\') && !value.includes('\0') && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..');
function invoke(binary, args, timeout = 30000) {
  const result = spawnSync(binary, args, { encoding: 'buffer', timeout, maxBuffer: 4 * 1024 * 1024, env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: '/nonexistent', PI_TELEMETRY: '0' } });
  if (result.error || result.status !== 0) throw new Error(`local ${basename(binary)} operation failed: ${result.stderr?.toString().slice(0, 1200) || result.error?.code || result.status}`);
  return result.stdout;
}
function blob(repo, revision, path) {
  if (!fullSha(revision) || !safeRelative(path)) throw new Error('invalid committed input pin/path');
  const entry = invoke('git', ['-C', repo, 'ls-tree', '-z', revision, '--', path]).toString().split('\0').find(value => value.slice(value.indexOf('\t') + 1) === path);
  if (!entry || !/^100(?:644|755) blob [0-9a-f]{40}\t/.test(entry)) throw new Error(`committed regular file required: ${path}`);
  return invoke('git', ['-C', repo, 'cat-file', 'blob', entry.slice(0, entry.indexOf('\t')).split(' ')[2]]);
}
function baselineTree(repo, revision) {
  const tree = Object.create(null);
  const entries = invoke('git', ['-C', repo, 'ls-tree', '-rz', '--full-tree', revision]).toString().split('\0').filter(Boolean);
  for (const entry of entries) {
    const tab = entry.indexOf('\t'), [mode, type, object] = entry.slice(0, tab).split(' '), path = entry.slice(tab+1);
    if (type !== 'blob' || !['100644','100755'].includes(mode)) continue;
    if (!safeRelative(path)) throw Error('unsafe committed baseline path');
    tree[path] = {kind:'file',sha256:digest(invoke('git', ['-C', repo, 'cat-file', 'blob', object])),executable:mode === '100755'};
    const parts = path.split('/');
    for (let index=1;index<parts.length;index++) tree[parts.slice(0,index).join('/')] = {kind:'directory'};
  }
  return tree;
}
function options(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 2) {
    const key = values[i];
    if (!['--project', '--input-sha', '--job', '--runs-store', '--attempt-id', '--grant-ref', '--mode', '--action', '--grant-file', '--review-file'].includes(key) || !values[i + 1] || Object.hasOwn(result, key.slice(2))) throw new Error('invalid or repeated job option');
    result[key.slice(2)] = values[i + 1];
  }
  return result;
}
async function canonicalStore(path, project, create = true) {
  if (!isAbsolute(path || '')) throw new Error('--runs-store must be an absolute operator-owned path');
  const store = await canonicalPath(path);
  for (const tree of [project, root]) {
    const child = relative(tree, store), parent = relative(store, tree);
    const inside = path => path === '' || (path !== '..' && !path.startsWith('../') && !isAbsolute(path));
    if (inside(child) || inside(parent)) throw new Error('runs store must be outside project and source trees');
  }
  if (create) await mkdir(store, { recursive: true });
  if (await realpath(store) !== store) throw new Error('runs store changed during validation');
  return store;
}
async function runtimePaths(job) {
  let sdkPath = job.sdkPath;
  if (!sdkPath) {
    const managed = process.env.PI_MANAGED_INSTALL_ROOT;
    if (!managed || !isAbsolute(managed)) throw new Error('set job.sdkPath explicitly or run from the existing managed Pi launcher');
    const version = (await readFile(join(managed, 'current-version'), 'utf8')).trim();
    if (!version || version === '.' || version === '..' || !/^[A-Za-z0-9._+-]+$/.test(version)) throw new Error('invalid managed Pi version');
    sdkPath = join(managed, 'releases', version, 'node_modules/@earendil-works/pi-coding-agent');
  }
  if (!isAbsolute(sdkPath)) throw new Error('job.sdkPath must be absolute');
  sdkPath = await realpath(sdkPath);
  const manifest = JSON.parse(await readFile(join(sdkPath, 'package.json'), 'utf8'));
  if (manifest.name !== '@earendil-works/pi-coding-agent') throw new Error('existing Pi SDK package required');
  const agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi/agent');
  const authPath = job.authPath || join(agentDir, 'auth.json');
  if (!isAbsolute(authPath)) throw new Error('host auth path must be absolute');
  return { sdkPath, authPath, nodeBinary: process.execPath };
}
async function activePackage(project, revision) {
  const settings = JSON.parse(await readFile(join(project, '.pi/settings.json'), 'utf8'));
  if (!Array.isArray(settings.packages)) throw new Error('project must declare one activated isSWF package');
  const matches = [];
  for (const entry of settings.packages) {
    const source = typeof entry === 'string' ? entry : entry?.source;
    if (typeof source !== 'string') throw new Error('malformed project package declaration');
    if (/^(?:npm:|git:|github:|https?:|ssh:|builtin:)/.test(source)) {
      if (source.includes('isswf-pi-resources')) throw new Error('ambiguous nonlocal isSWF package declaration');
      continue;
    }
    const local = source === '~' ? homedir() : source.startsWith('~/') ? join(homedir(), source.slice(2)) : /^file:\/\//.test(source) ? fileURLToPath(source) : source;
    const path = resolve(project, '.pi', local);
    let manifest;
    try { manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (manifest.name === 'isswf-pi-resources') matches.push({ path: await realpath(path), entry, absolute: isAbsolute(source) });
  }
  if (matches.length !== 1 || typeof matches[0].entry !== 'string' || !matches[0].absolute || basename(matches[0].path) !== revision) throw new Error('exactly one activated package must match job.runtimeSha');
  await verifyPackage(matches[0].path, revision);
  return matches[0].path;
}
function admission(binding) {
  const key = digest(JSON.stringify(['job-admission-v1', binding.repo, binding.logicalJobRef]));
  return { version: 1, key, repo: binding.repo, logicalJobRef: binding.logicalJobRef, attemptId: binding.attemptId, inputSha: binding.inputSha, jobSha256: binding.jobSha256, grantRef: binding.grantRef, workerTotal: 1 };
}
async function claimAdmission(store, record) {
  for (const name of await readdir(store)) {
    if (!name.endsWith('.job.json')) continue;
    let prior;
    try { prior = JSON.parse(await readFile(join(store, name), 'utf8')); }
    catch { throw Error('ambiguous prior job binding blocks admission'); }
    if (typeof prior.repo !== 'string' || typeof prior.jobPath !== 'string') throw Error('ambiguous prior job binding blocks admission');
    if (await realpath(prior.repo) === record.repo && (typeof prior.logicalJobRef !== 'string' || !prior.logicalJobRef.trim() || prior.logicalJobRef === record.logicalJobRef)) throw Error('prior logical job binding blocks admission; no automatic replacement');
  }
  const directory = join(store, 'admissions');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('admission directory must be a real private directory');
  const sync = async path => { const handle = await open(path, 'r'); try { await handle.sync(); } finally { await handle.close(); } };
  await sync(store);
  const pending = join(directory, '.pending-' + randomUUID());
  const file = await open(pending, 'wx', 0o600);
  try { await file.writeFile(JSON.stringify(record) + '\n'); await file.sync(); } finally { await file.close(); }
  try {
    try { await link(pending, join(directory, record.key + '.json')); }
    catch (error) { if (error.code === 'EEXIST') throw Error('logical job admission already claimed; no automatic replacement'); throw error; }
    await sync(directory);
  } finally { await unlink(pending); }
}
async function run(args) {
  if (Object.keys(args).some(key => !['project', 'input-sha', 'job', 'runs-store', 'attempt-id', 'grant-ref', 'mode'].includes(key))) throw Error('unsupported run option');
  if (!isAbsolute(args.project || '') || !fullSha(args['input-sha']) || !safeRelative(args.job)) throw new Error('run requires --project absolute --input-sha fullSHA --job committed/relative.json');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(args['attempt-id'] || '') || ['.', '..'].includes(args['attempt-id']) || !args['grant-ref']?.trim()) throw new Error('explicit attempt ID and trusted grant reference required');
  const mode = args.mode || 'real';
  if (!['real', 'offline'].includes(mode)) throw new Error('mode must be real or offline');
  const project = await realpath(args.project);
  const jobBytes = blob(project, args['input-sha'], args.job);
  const job = JSON.parse(jobBytes);
  if (job.version !== 1 || !fullSha(job.runtimeSha) || !fullSha(job.targetBase) || job.methodologySha !== methodologySha) throw new Error('job version/runtime/base/methodology pins invalid');
  if (job.exclusiveAttempt !== true || job.workerTotal !== 1) throw new Error('trusted exclusive-attempt grant and workerTotal=1 required');
  if (typeof job.logicalJobRef !== 'string' || !job.logicalJobRef.trim() || job.logicalJobRef.length > 200 || /[\x00-\x1f\x7f]/.test(job.logicalJobRef)) throw Error('committed logicalJobRef required for serial job admission');
  const packageRoot = await activePackage(project, job.runtimeSha);
  for (const path of runtimeFiles) if (digest(await readFile(join(root, path))) !== digest(blob(root, job.runtimeSha, path))) throw new Error(`runtime working bytes differ from activated revision: ${path}`);
  if (!job.models || !fullSha(job.models.sha) || !safeRelative(job.models.path)) throw new Error('committed model config pin required');
  const modelBytes = blob(project, job.models.sha, job.models.path);
  if (digest(modelBytes) !== job.models.sha256) throw new Error('model config digest mismatch');
  const modelConfig = JSON.parse(modelBytes);
  const workerRoutes = modelConfig.roles?.worker;
  if (modelConfig.schemaVersion !== 1 || !Array.isArray(workerRoutes) || workerRoutes.length !== 1 || workerRoutes[0]?.model !== 'openai-codex/gpt-6-luna' || workerRoutes[0]?.effort !== 'high' || Object.keys(workerRoutes[0]).sort().join(',') !== 'effort,model') throw new Error('only exact configured LunaHigh worker route supported; no fallback');
  const briefBytes = blob(project, args['input-sha'], job.briefPath);
  for (const path of job.referencedInputs || []) if (digest(blob(project, args['input-sha'], path)) !== digest(blob(project, job.targetBase, path))) throw new Error(`referenced input differs from target base: ${path}`);
  const paths = await runtimePaths(job);
  const store = await canonicalStore(args['runs-store'], project);
  const bindingPath = join(store, args['attempt-id'] + '.job.json');
  for (const path of [join(store, args['attempt-id']), bindingPath]) {
    try { await lstat(path); throw new Error('attempt already exists; read/reconcile before any operator-authorized replacement'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const admitted = admission({ repo: project, logicalJobRef: job.logicalJobRef, attemptId: args['attempt-id'], inputSha: args['input-sha'], jobSha256: digest(jobBytes), grantRef: args['grant-ref'] });
  await claimAdmission(store, admitted);
  const prepared = await mkdtemp(join(store, '.prepare-'));
  const configPath = join(prepared, 'config.json'), taskPath = join(prepared, 'task.mjs');
  const config = { version: 1, mode, ...paths, profile: { repo: root, sha: methodologySha, files: profileFiles }, brief: { repo: project, inputSha: args['input-sha'], path: job.briefPath }, expectedMutablePaths: job.expectedMutablePaths, protectedCheckCommand: job.protectedCheckCommand, checks: mode === 'offline' ? job.offlineChecks : [] };
  await writeFile(configPath, JSON.stringify(config) + '\n', { mode: 0o600, flag: 'wx' });
  const preparedResult = JSON.parse(invoke(process.execPath, [join(root, 'tools/pi-worker-task.mjs'), 'prepare', '--config', configPath, '--output', taskPath]));
  if (preparedResult.inputSha !== args['input-sha'] || preparedResult.briefPath !== job.briefPath || preparedResult.briefSha256 !== digest(briefBytes) || preparedResult.taskSha256 !== digest(await readFile(taskPath))) throw new Error('prepared task/brief identity mismatch');
  const binding = { version: 1, logicalJobRef: job.logicalJobRef, attemptId: args['attempt-id'], repo: project, grantRef: args['grant-ref'], packageRoot, runtimeSha: job.runtimeSha, methodologySha, inputSha: args['input-sha'], targetBase: job.targetBase, jobPath: args.job, jobSha256: digest(jobBytes), models: job.models, ...preparedResult, mode, reviewRequired: true };
  await writeFile(bindingPath, JSON.stringify(binding) + '\n', { mode: 0o600, flag: 'wx' });
  const launched = JSON.parse(invoke(process.execPath, [join(root, 'tools/worker-lifecycle.mjs'), 'launch', '--repo', project, '--input-sha', args['input-sha'], '--brief', job.briefPath, '--target-base', job.targetBase, '--attempt-id', args['attempt-id'], '--runs-store', store, '--grant-ref', args['grant-ref'], '--task-script', taskPath, '--timeout-ms', '120000', '--output-bytes', '16000']));
  console.log(JSON.stringify({ ...launched, mode, bindingPath, reviewRequired: true }));
}
async function trustedJSON(path, project, label, store) {
  if (!isAbsolute(path || '')) throw Error(`absolute operator-owned ${label} required`);
  const canonical = await realpath(path);
  for (const tree of [project, root, store]) {
    const child = relative(await realpath(tree), canonical);
    if (child === '' || (child !== '..' && !child.startsWith('../') && !isAbsolute(child))) throw Error('file must be outside untrusted project, runtime source and runs store');
  }
  const stat = await lstat(canonical);
  if (!stat.isFile() || stat.size > 16000) throw Error('bounded regular approval file required');
  return JSON.parse(await readFile(canonical, 'utf8'));
}
async function review(args) {
  if (Object.keys(args).some(key => !['runs-store', 'attempt-id', 'action', 'review-file'].includes(key)) || !['inspect', 'record', 'check'].includes(args.action) || (args.action !== 'record' && args['review-file'])) throw Error('review requires --action inspect|record|check; only record accepts --review-file');
  const load = async () => {
    const observation = JSON.parse(invoke(process.execPath, [join(root, 'tools/isswf-job.mjs'), 'reconcile', '--runs-store', args['runs-store'] || '', '--attempt-id', args['attempt-id'] || '']));
    const binding = observation.job;
    if (!binding || observation.recovery?.status !== 'stopped-review-required') throw Error('known stopped native recovery required for candidate review');
    const project = await realpath(binding.repo), store = await canonicalStore(args['runs-store'], project, false);
    const attemptDir = join(store, binding.attemptId), dispatch = JSON.parse(await readFile(join(attemptDir, 'dispatch.json'), 'utf8'));
    const bytes = blob(project, binding.inputSha, binding.jobPath);
    if (digest(bytes) !== binding.jobSha256) throw Error('review job binding changed');
    return { observation, binding, dispatch, job: JSON.parse(bytes), baseline: baselineTree(project, binding.targetBase), attemptDir, store };
  };
  const initial = await load();
  const approval = args.action === 'record' ? await trustedJSON(args['review-file'], initial.binding.repo, '--review-file', initial.store) : undefined;
  console.log(JSON.stringify(await recoveryReview({ action: args.action, load, approval })));
}
async function effect(args) {
  if (Object.keys(args).some(key => !['runs-store', 'attempt-id', 'action', 'grant-file'].includes(key)) || !['prepare', 'inspect', 'publish', 'reconcile'].includes(args.action)) throw Error('effect requires explicit --action prepare|inspect|publish|reconcile');
  const observed = JSON.parse(invoke(process.execPath, [join(root, 'tools/isswf-job.mjs'), 'read', '--runs-store', args['runs-store'] || '', '--attempt-id', args['attempt-id'] || '']));
  const binding = observed.job;
  if (!binding || observed.state !== 'terminal' || observed.terminal.outcome !== 'success' || observed.terminal.captureIncomplete) throw Error('effect requires a validated successful bound attempt; unknown/live/failed writers block');
  const project = await realpath(binding.repo);
  const store = await canonicalStore(args['runs-store'], project, false);
  const bytes = blob(project, binding.inputSha, binding.jobPath), job = JSON.parse(bytes);
  if (digest(bytes) !== binding.jobSha256 || job.version !== 1 || job.runtimeSha !== binding.runtimeSha || job.targetBase !== binding.targetBase || job.methodologySha !== binding.methodologySha) throw Error('effect committed binding mismatch');
  for (const path of runtimeFiles) if (digest(await readFile(join(root, path))) !== digest(blob(root, binding.runtimeSha, path))) throw Error('effect runtime identity changed');
  await verifyPackage(binding.packageRoot, binding.runtimeSha);
  const intent = effectIntent(binding, job);
  let grant;
  if (args.action !== 'inspect') grant = await trustedJSON(args['grant-file'], project, '--grant-file', store);
  console.log(JSON.stringify(await externalEffect({ action: args.action, store, intent, grant })));
}
async function main() {
  const command = process.argv[2];
  if (command === '--help' || command === 'help') {
    console.log(`Usage: isswf-job.mjs <run|read|reconcile|effect|review> [options]

Commands:
  run         Execute a pinned factory job
  read        Read an existing attempt
  reconcile   Reconcile an existing attempt locally (read-only)
  effect      Explicit PR journal action, separate from ordinary observation
  review      Inspect, record or check a recovered-candidate review receipt

Required for run:
  --project ABSOLUTE_PATH  Project checkout
  --input-sha FULL_SHA     Committed input revision
  --job PATH               Committed job JSON path
  --attempt-id ID          Unique attempt identifier
  --grant-ref REF          Trusted authorization reference
  --runs-store ABS_PATH    Operator-owned run storage

Required for read/reconcile:
  --runs-store ABS_PATH    Operator-owned run storage
  --attempt-id ID          Attempt identifier

Required for effect: --runs-store ABS_PATH --attempt-id ID
  --action prepare|inspect|publish|reconcile
  --grant-file ABS_PATH (except read-only inspect)
Effect publish/reconcile contact github.com only under a concrete operator grant.
Required for review: --runs-store ABS_PATH --attempt-id ID
  --action inspect|record|check
  --review-file ABS_PATH (record only; explicit independent review/check grant)
Review never releases a job admission or authorizes a successor.
Optional for run: --mode real|offline
An independent review remains required for every worker result.`);
    return;
  }
  const args = options(process.argv.slice(3));
  if (command === 'run') return run(args);
  if (command === 'effect') return effect(args);
  if (command === 'review') return review(args);
  if (!['read', 'reconcile'].includes(command) || Object.keys(args).some(key => !['runs-store', 'attempt-id'].includes(key))) throw new Error('usage: isswf-job.mjs run|read|reconcile [explicit options]');
  const result = JSON.parse(invoke(process.execPath, [join(root, 'tools/worker-lifecycle.mjs'), command, '--runs-store', args['runs-store'] || '', '--attempt-id', args['attempt-id'] || '']));
  let binding, dispatch;
  try {
    binding = JSON.parse(await readFile(join(args['runs-store'], args['attempt-id'] + '.job.json'), 'utf8'));
    if (typeof binding.logicalJobRef !== 'string' || !binding.logicalJobRef.trim() || await realpath(binding.repo) !== binding.repo) throw Error('missing canonical admission identity');
    const admitted = admission(binding);
    const actual = JSON.parse(await readFile(join(args['runs-store'], 'admissions', admitted.key + '.json'), 'utf8'));
    if (JSON.stringify(actual) !== JSON.stringify(admitted)) throw Error('logical admission mismatch');
    dispatch = JSON.parse(await readFile(join(args['runs-store'], args['attempt-id'], 'dispatch.json'), 'utf8'));
    if (binding.version !== 1 || !fullSha(binding.runtimeSha) || binding.methodologySha !== methodologySha || !/^[0-9a-f]{64}$/.test(binding.jobSha256) || !fullSha(binding.models?.sha) || !/^[0-9a-f]{64}$/.test(binding.models?.sha256) || !['real', 'offline'].includes(binding.mode) || binding.reviewRequired !== true || dispatch.timeoutMs !== 120000 || dispatch.outputBytes !== 16000 || ['attemptId', 'repo', 'grantRef', 'inputSha', 'targetBase', 'briefPath', 'briefSha256', 'taskSha256'].some(key => typeof binding[key] !== 'string' || binding[key] !== dispatch[key]) || binding.attemptId !== args['attempt-id']) throw new Error('binding mismatch');
  } catch {
    console.log(JSON.stringify({ attemptId: args['attempt-id'], state: 'unknown', reason: 'missing, corrupt or mismatched job/dispatch binding', reviewRequired: true }));
    return;
  }
  let recovery;
  if (command === 'reconcile' && result.state === 'unknown') {
    try {
      const jobBytes=blob(binding.repo,binding.inputSha,binding.jobPath), job=JSON.parse(jobBytes);
      if (digest(jobBytes)!==binding.jobSha256 || job.version!==1 || job.targetBase!==binding.targetBase || job.runtimeSha!==binding.runtimeSha || job.methodologySha!==binding.methodologySha || job.briefPath!==binding.briefPath || JSON.stringify(job.models)!==JSON.stringify(binding.models) || digest(blob(binding.repo,binding.inputSha,binding.briefPath))!==binding.briefSha256 || digest(blob(binding.repo,binding.models.sha,binding.models.path))!==binding.models.sha256) throw Error('committed recovery inputs changed');
      for (const path of runtimeFiles) if (digest(await readFile(join(root,path)))!==digest(blob(root,binding.runtimeSha,path))) throw Error('recovery runtime identity changed');
      await verifyPackage(binding.packageRoot,binding.runtimeSha);
      for (const path of job.referencedInputs || []) if (digest(blob(binding.repo,binding.inputSha,path))!==digest(blob(binding.repo,binding.targetBase,path))) throw Error('recovery input/base mismatch');
      recovery=await inspectNativeRecovery({attemptDir:join(args['runs-store'],args['attempt-id']),dispatch,observation:result,job,baseline:baselineTree(binding.repo,binding.targetBase)});
    } catch { recovery={status:'blocked',reason:'committed recovery pins or runtime could not be revalidated',reviewRequired:true,retry:'never'}; }
  }
  console.log(JSON.stringify({ ...result, job: binding, reviewRequired: true, ...(recovery ? {recovery} : {}) }));
}
try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
