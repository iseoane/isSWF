#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, realpath, mkdir, mkdtemp, lstat, readdir, open, link, unlink } from 'node:fs/promises';
import { dirname, join, resolve, isAbsolute, basename, relative } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyPackage, canonicalPath } from './factory-package.mjs';
import { readReleaseSource, verifyRelease } from './release-source.mjs';
import { stateDirectory } from './project-state.mjs';
import { inspectNativeRecovery } from './native-recovery.mjs';
import { effectIntent, externalEffect } from './external-effect-journal.mjs';
import { recoveryReview } from './recovery-review.mjs';
import { admission, claimSuccessor, validateSuccessorBinding } from './job-successor.mjs';
import { parsePlan } from './isswf-plan.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const installedRelease = verifyRelease(root);
const methodologySha = installedRelease?.methodologySha ?? '37a56ebc902e94f21fc10666f33fceac44946af7';
const runtimeFiles = ['tools/release-source.mjs', 'tools/project-state.mjs', 'tools/platform-runtime.mjs', 'tools/isswf-job.mjs', 'tools/factory-package.mjs', 'tools/pi-worker-task.mjs', 'tools/worker-lifecycle.mjs', 'tools/native-recovery.mjs', 'tools/external-effect-journal.mjs', 'tools/recovery-review.mjs', 'tools/job-successor.mjs', 'tools/isswf-plan.mjs'];
const profileFiles = ['.agents/roles/worker.md', '.agents/roles/references/bug-diagnosis.md', '.agents/roles/references/tdd.md', '.agents/roles/references/design-principles.md', '.agents/roles/references/execution-principles.md', '.agents/roles/references/verification-principles.md', '.agents/roles/references/code-quality.md', '.agents/roles/references/comments.md', ...(installedRelease?.files['.agents/skills/isswf-e2e/SKILL.md'] ? ['.agents/skills/isswf-e2e/SKILL.md', '.agents/skills/isswf-e2e/references/browser.md', '.agents/skills/isswf-e2e/references/cli-and-api.md', '.agents/skills/isswf-e2e/references/test-quality.md'] : [])];
for (const name of ['debug', 'tdd', 'security', 'performance', 'observability']) {
  const path = `.agents/skills/isswf-${name}/SKILL.md`;
  if (installedRelease?.files[path]) profileFiles.push(path);
}
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
function ownSourceBlob(repo, revision, path) {
  if (repo === root) {
    const released = readReleaseSource(repo, revision, path);
    if (released !== null) return released;
  }
  return blob(repo, revision, path);
}
function baselineTree(repo, revision, strict = false) {
  const tree = Object.create(null);
  const entries = invoke('git', ['-C', repo, 'ls-tree', strict ? '-rtz' : '-rz', '--full-tree', revision]).toString().split('\0').filter(Boolean);
  for (const entry of entries) {
    const tab = entry.indexOf('\t'), [mode, type, object] = entry.slice(0, tab).split(' '), path = entry.slice(tab+1);
    if (strict && type === 'tree' && mode === '040000') {
      if (!safeRelative(path)) throw Error('unsafe committed baseline path');
      tree[path] = {kind:'directory'};
      continue;
    }
    if (type !== 'blob' || !['100644','100755'].includes(mode)) {
      if (strict) throw Error(`unsupported successor Git baseline entry: ${mode} ${path}`);
      continue;
    }
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
    if (!['--project', '--input-sha', '--job', '--runs-store', '--attempt-id', '--grant-ref', '--mode', '--action', '--grant-file', '--review-file', '--successor-grant', '--capacity-grant', '--dependency-grant'].includes(key) || !values[i + 1] || Object.hasOwn(result, key.slice(2))) throw new Error('invalid or repeated job option');
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
  const released = verifyRelease(root);
  if (released !== null) {
    const pin = JSON.parse(await readFile(join(project, stateDirectory(project), 'install.json'), 'utf8'));
    if (pin.format !== 1 || pin.schemaVersion !== 1 || pin.runtimeId !== released.runtimeId || pin.revision !== revision || released.revision !== revision || pin.version !== released.version) throw Error('installed runtime must match the explicit project pin; inspect and migrate separately');
    return root;
  }
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
async function claimAdmission(store, record, checkOnly = false) {
  for (const name of await readdir(store)) {
    if (!name.endsWith('.job.json')) continue;
    let prior;
    try { prior = JSON.parse(await readFile(join(store, name), 'utf8')); }
    catch { throw Error('ambiguous prior job binding blocks admission'); }
    if (typeof prior.repo !== 'string' || typeof prior.jobPath !== 'string') throw Error('ambiguous prior job binding blocks admission');
    if (await realpath(prior.repo) === record.repo && (typeof prior.logicalJobRef !== 'string' || !prior.logicalJobRef.trim() || prior.logicalJobRef === record.logicalJobRef)) throw Error('prior logical job binding blocks admission; no automatic replacement');
  }
  const directory = join(store, 'admissions');
  if(checkOnly) {
    try {await lstat(join(directory,record.key+'.json'));} catch(error) {if(error.code==='ENOENT')return;throw error;}
    throw Error('logical job admission already claimed; no automatic replacement');
  }
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
async function dependencyAdmission(args, project, job, jobBytes) {
  if (job.prerequisites === undefined && !args['dependency-grant']) return null;
  const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === keys;
  const descriptor = job.prerequisites;
  if (!exactKeys(descriptor, 'jobId,path,sha256') || !/^[A-Z][A-Z0-9-]{0,63}$/.test(descriptor.jobId) || !/^[a-f0-9]{64}$/.test(descriptor.sha256)) throw Error('explicit dependency plan descriptor required');
  const identity = /^\.(?:isswf|factory)\/initiatives\/([A-Z][A-Z0-9-]{0,63})\/plan\.md$/.exec(descriptor.path);
  if (!identity || job.logicalJobRef !== identity[1] + '/' + descriptor.jobId) throw Error('dependency plan job identity mismatch');
  const store = await canonicalStore(args['runs-store'], project, false);
  const grant = await trustedJSON(args['dependency-grant'], project, '--dependency-grant', store);
  if (grant.version !== 1 || grant.role !== 'worker' || grant.allowDependencyCheck !== true || grant.project !== project || grant.runsStore !== store || grant.inputSha !== args['input-sha'] || grant.jobPath !== args.job || grant.jobSha256 !== digest(jobBytes) || grant.runtimeSha !== job.runtimeSha || grant.targetBase !== job.targetBase || grant.attemptId !== args['attempt-id'] || grant.logicalJobRef !== job.logicalJobRef || grant.grantRef !== args['grant-ref'] || !exactKeys(grant.prerequisites, 'jobId,path,sha256') || Object.keys(descriptor).some(key => grant.prerequisites[key] !== descriptor[key])) throw Error('dependency grant binding mismatch');
  const bytes = blob(project, args['input-sha'], descriptor.path);
  if (bytes.length > 256000 || digest(bytes) !== descriptor.sha256) throw Error('pinned dependency plan digest mismatch');
  const markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (!markdown.startsWith('# ' + identity[1] + ': ')) throw Error('pinned dependency plan identity mismatch');
  const blocked = (reason, dependency) => ({ status: 'blocked', reason, ...(dependency ? { dependency } : {}), attemptsConsumed: 0, executionAuthorized: false });
  let jobs;
  try { jobs = parsePlan(markdown); } catch (error) { if (error.message === 'cyclic job dependencies') return blocked('dependency-cycle'); throw error; }
  const byId = new Map(jobs.map(item => [item.id, item])), selected = byId.get(descriptor.jobId);
  if (!selected) throw Error('dependency job missing from pinned plan');
  if (['blocked', 'awaiting-human', 'in-review'].includes(selected.reportedStatus)) return blocked('decision', selected.id);
  if (selected.reportedStatus === 'completed') return blocked('already-completed', selected.id);
  const required = new Set();
  function collect(item) { for (const id of item.dependencies) if (!required.has(id)) { required.add(id); collect(byId.get(id)); } }
  collect(selected);
  if (!grant.attestations || typeof grant.attestations !== 'object' || Array.isArray(grant.attestations) || Object.keys(grant.attestations).some(id => !required.has(id))) throw Error('dependency attestations must match the prerequisite closure');
  const observations = [], deadlineAt = Date.now() + 10000;
  for (const id of required) {
    const dependency = byId.get(id), attestation = grant.attestations[id];
    if (!attestation) return blocked(['blocked', 'awaiting-human', 'in-review'].includes(dependency.reportedStatus) ? 'decision' : 'dependency-evidence', id);
    if (attestation.kind === 'code') {
      if (!exactKeys(attestation, 'commit,kind') || !fullSha(attestation.commit)) throw Error('full attested integration commit required');
      const timeout = deadlineAt - Date.now(); if (timeout <= 0) throw Error('integration ancestry deadline');
      const result = spawnSync('git', ['-C', project, 'merge-base', '--is-ancestor', attestation.commit, job.targetBase], { timeout, stdio: 'ignore', env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1', GIT_GRAFT_FILE: '/dev/null' } });
      if (result.error || ![0, 1].includes(result.status) || Date.now() >= deadlineAt) throw Error('integration ancestry unverifiable');
      if (result.status === 1) return blocked('code-integration', id);
    } else if (attestation.kind === 'decision') {
      if (!exactKeys(attestation, 'kind,reference') || typeof attestation.reference !== 'string' || !attestation.reference.trim() || attestation.reference.length > 4000 || /[\x00-\x1f\x7f]/.test(attestation.reference)) throw Error('explicit dependency decision attestation required');
      if (dependency.reportedStatus !== 'completed' || !dependency.evidence.length) return blocked('decision', id);
    } else throw Error('explicit code or decision dependency kind required');
    observations.push({ id, ...attestation });
  }
  return { status: 'ready', inputSha: args['input-sha'], plan: descriptor, observations, grantValueSha256: digest(JSON.stringify(grant)), provenance: 'operator-attested prerequisite checks at dispatch, not current status or authenticated identity' };
}
async function run(args) {
  if (Object.keys(args).some(key => !['project', 'input-sha', 'job', 'runs-store', 'attempt-id', 'grant-ref', 'mode', 'successor-grant', 'capacity-grant', 'dependency-grant'].includes(key))) throw Error('unsupported run option');
  if (!isAbsolute(args.project || '') || !fullSha(args['input-sha']) || !safeRelative(args.job)) throw new Error('run requires --project absolute --input-sha fullSHA --job committed/relative.json');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(args['attempt-id'] || '') || ['.', '..'].includes(args['attempt-id']) || !args['grant-ref']?.trim()) throw new Error('explicit attempt ID and trusted grant reference required');
  const mode = args.mode || 'real';
  if (!['real', 'offline'].includes(mode)) throw new Error('mode must be real or offline');
  if(args['capacity-grant'] && args['successor-grant'])throw Error('capacity-bound successors require a separately implemented lifecycle contract');
  const project = await realpath(args.project);
  const jobBytes = blob(project, args['input-sha'], args.job);
  const job = JSON.parse(jobBytes);
  if (job.version !== 1 || !fullSha(job.runtimeSha) || !fullSha(job.targetBase) || job.methodologySha !== methodologySha) throw new Error('job version/runtime/base/methodology pins invalid');
  if (job.exclusiveAttempt !== true || job.workerTotal !== (args['successor-grant'] ? 2 : 1)) throw new Error('trusted exclusive-attempt grant and explicit workerTotal=1 (original) or2 (successor) required');
  if (typeof job.logicalJobRef !== 'string' || !job.logicalJobRef.trim() || job.logicalJobRef.length > 200 || /[\x00-\x1f\x7f]/.test(job.logicalJobRef)) throw Error('committed logicalJobRef required for serial job admission');
  if (args['successor-grant'] && (job.prerequisites !== undefined || args['dependency-grant'])) throw Error('dependency-bound successors require a separate lifecycle contract');
  const prerequisites = await dependencyAdmission(args, project, job, jobBytes);
  if (prerequisites?.status === 'blocked') { console.log(JSON.stringify(prerequisites)); process.exitCode = 2; return; }
  const packageRoot = await activePackage(project, job.runtimeSha);
  for (const path of runtimeFiles) if (digest(await readFile(join(root, path))) !== digest(ownSourceBlob(root, job.runtimeSha, path))) throw new Error(`runtime working bytes differ from activated revision: ${path}`);
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
  const request = { repo: project, logicalJobRef: job.logicalJobRef, attemptId: args['attempt-id'], grantRef: args['grant-ref'], packageRoot, runtimeSha: job.runtimeSha, methodologySha, inputSha: args['input-sha'], targetBase: job.targetBase, jobPath: args.job, jobSha256: digest(jobBytes), models: job.models, briefPath: job.briefPath, briefSha256: digest(briefBytes), mode, ...(prerequisites ? { prerequisites } : {}) };
  let capacity, capacityReservation;
  if(args['capacity-grant']) {
    const grant=await trustedJSON(args['capacity-grant'],project,'--capacity-grant',store);
    if(grant.version!==1 || grant.role!=='worker' || grant.mode!==mode || grant.project!==project || grant.runsStore!==store || grant.inputSha!==request.inputSha || grant.jobPath!==request.jobPath || grant.jobSha256!==request.jobSha256 || grant.runtimeSha!==request.runtimeSha || grant.attemptId!==request.attemptId || grant.logicalJobRef!==request.logicalJobRef || grant.grantRef!==request.grantRef || grant.allowCapacity!==true || !grant.capacity)throw Error('worker capacity grant binding mismatch');
    const helper=await readFile(join(root,'tools/execution-capacity.mjs'));
    if(digest(helper)!==grant.capacityRunnerSha256 || digest(helper)!==digest(ownSourceBlob(root,job.runtimeSha,'tools/execution-capacity.mjs')))throw Error('pinned worker capacity helper required');
    const {prepareCapacity,acquireCapacity}=await import(pathToFileURL(join(root,'tools/execution-capacity.mjs')));
    const scope=await prepareCapacity(grant.capacity,[project,root,store],grant.capacityRunnerSha256);
    await claimAdmission(store,admission(request),true);
    const reservation=await acquireCapacity(scope,{role:'worker',logicalJobRef:job.logicalJobRef,mode:mode==='offline'?'fixture':'real',worker:{attemptDir:join(store,request.attemptId),attemptId:request.attemptId,inputSha:request.inputSha,jobSha256:request.jobSha256,runtimeSha:request.runtimeSha,targetBase:request.targetBase}});
    if(!reservation){console.log(JSON.stringify({status:'blocked',reason:'capacity',attemptsConsumed:0,executionAuthorized:false}));process.exitCode=2;return;}
    capacityReservation=reservation;
    capacity={scope,info:reservation.info,grantSha256:digest(await readFile(await realpath(args['capacity-grant'])))};
  }
  let successor;
  if (args['successor-grant']) {
    const grant = await trustedJSON(args['successor-grant'], project, '--successor-grant', store);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(grant.predecessorAttemptId || '')) throw Error('explicit predecessor attempt ID required');
    successor = await claimSuccessor({ store, request, job, baseline: baselineTree(project, job.targetBase, true), grant, load: reviewLoader({ 'runs-store': store, 'attempt-id': grant.predecessorAttemptId }) });
  } else {
    try { await claimAdmission(store, admission(request)); }
    catch(error) {
      if(capacityReservation)await capacityReservation.cancelBeforeDispatch();
      throw error;
    }
  }
  const prepared = await mkdtemp(join(store, '.prepare-'));
  const configPath = join(prepared, 'config.json'), taskPath = join(prepared, 'task.mjs');
  const config = { version: 1, mode, ...paths, profile: { repo: root, sha: methodologySha, files: profileFiles }, brief: { repo: project, inputSha: args['input-sha'], path: job.briefPath }, expectedMutablePaths: job.expectedMutablePaths, protectedCheckCommand: job.protectedCheckCommand, checks: mode === 'offline' ? job.offlineChecks : [] };
  await writeFile(configPath, JSON.stringify(config) + '\n', { mode: 0o600, flag: 'wx' });
  const preparedResult = JSON.parse(invoke(process.execPath, [join(root, 'tools/pi-worker-task.mjs'), 'prepare', '--config', configPath, '--output', taskPath]));
  if (preparedResult.inputSha !== args['input-sha'] || preparedResult.briefPath !== job.briefPath || preparedResult.briefSha256 !== digest(briefBytes) || preparedResult.taskSha256 !== digest(await readFile(taskPath))) throw new Error('prepared task/brief identity mismatch');
  const binding = { version: 1, ...(capacity ? {capacity:capacity.info} : {}), ...(successor ? { successor } : {}), logicalJobRef: job.logicalJobRef, attemptId: args['attempt-id'], repo: project, grantRef: args['grant-ref'], packageRoot, runtimeSha: job.runtimeSha, methodologySha, inputSha: args['input-sha'], targetBase: job.targetBase, jobPath: args.job, jobSha256: digest(jobBytes), models: job.models, ...preparedResult, mode, reviewRequired: true, ...(prerequisites ? { prerequisites } : {}) };
  await writeFile(bindingPath, JSON.stringify(binding) + '\n', { mode: 0o600, flag: 'wx' });
  let capacityArgs=[];
  if(capacity) {
    const modules={};
    for(const name of ['execution-capacity.mjs','native-recovery.mjs']) {const bytes=await readFile(join(root,'tools',name));if(digest(bytes)!==digest(ownSourceBlob(root,job.runtimeSha,'tools/'+name)))throw Error('capacity module changed before dispatch');modules[name]={sha256:digest(bytes),base64:bytes.toString('base64')};}
    const path=join(prepared,'capacity.json');await writeFile(path,JSON.stringify({...capacity,modules})+'\n',{flag:'wx',mode:0o600});capacityArgs=['--capacity-file',path];
  }
  const launched = JSON.parse(invoke(process.execPath, [join(root, 'tools/worker-lifecycle.mjs'), 'launch', '--repo', project, '--input-sha', args['input-sha'], '--brief', job.briefPath, '--target-base', job.targetBase, '--attempt-id', args['attempt-id'], '--runs-store', store, '--grant-ref', args['grant-ref'], '--task-script', taskPath, '--timeout-ms', '120000', '--output-bytes', '16000', ...capacityArgs]));
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
function reviewLoader(args) {
  return async () => {
    const observation = JSON.parse(invoke(process.execPath, [join(root, 'tools/isswf-job.mjs'), 'reconcile', '--runs-store', args['runs-store'] || '', '--attempt-id', args['attempt-id'] || '']));
    const binding = observation.job;
    if (!binding || observation.recovery?.status !== 'stopped-review-required') throw Error('known stopped native recovery required for candidate review');
    const project = await realpath(binding.repo), store = await canonicalStore(args['runs-store'], project, false);
    const attemptDir = join(store, binding.attemptId), dispatch = JSON.parse(await readFile(join(attemptDir, 'dispatch.json'), 'utf8'));
    const bytes = blob(project, binding.inputSha, binding.jobPath);
    if (digest(bytes) !== binding.jobSha256) throw Error('review job binding changed');
    return { observation, binding, dispatch, job: JSON.parse(bytes), baseline: baselineTree(project, binding.targetBase), attemptDir, store };
  };
}
async function review(args) {
  if (Object.keys(args).some(key => !['runs-store', 'attempt-id', 'action', 'review-file'].includes(key)) || !['inspect', 'record', 'check'].includes(args.action) || (args.action !== 'record' && args['review-file'])) throw Error('review requires --action inspect|record|check; only record accepts --review-file');
  const load = reviewLoader(args);
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
  for (const path of runtimeFiles) if (digest(await readFile(join(root, path))) !== digest(ownSourceBlob(root, binding.runtimeSha, path))) throw Error('effect runtime identity changed');
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
Optional for run: --dependency-grant ABS_PATH
  Exact committed plan and external code-integration/decision attestations; no execution authority.
  Prerequisite refusal happens before capacity, permanent writer admission or attempt preparation.
Optional for run: --capacity-grant ABS_PATH
  Bound operator-owned shared capacity; known task/tool cessation is required to release.
  Capacity-bound successors are not supported by this first cut.
Optional for run: --successor-grant ABS_PATH
  Explicit same-runtime original-to-one-successor grant; cumulative workerTotal=2.
  Unknown prior invocation remains consumed, never a retry or charge reconciliation.
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
    if (binding.successor) await validateSuccessorBinding({ store: args['runs-store'], binding });
    else {
      const actual = JSON.parse(await readFile(join(args['runs-store'], 'admissions', admitted.key + '.json'), 'utf8'));
      if (JSON.stringify(actual) !== JSON.stringify(admitted)) throw Error('logical admission mismatch');
    }
    dispatch = JSON.parse(await readFile(join(args['runs-store'], args['attempt-id'], 'dispatch.json'), 'utf8'));
    if (binding.version !== 1 || !fullSha(binding.runtimeSha) || binding.methodologySha !== methodologySha || !/^[0-9a-f]{64}$/.test(binding.jobSha256) || !fullSha(binding.models?.sha) || !/^[0-9a-f]{64}$/.test(binding.models?.sha256) || !['real', 'offline'].includes(binding.mode) || binding.reviewRequired !== true || dispatch.timeoutMs !== 120000 || dispatch.outputBytes !== 16000 || ['attemptId', 'repo', 'grantRef', 'inputSha', 'targetBase', 'briefPath', 'briefSha256', 'taskSha256'].some(key => typeof binding[key] !== 'string' || binding[key] !== dispatch[key]) || binding.attemptId !== args['attempt-id']) throw new Error('binding mismatch');
  } catch {
    console.log(JSON.stringify({ attemptId: args['attempt-id'], state: 'unknown', reason: 'missing, corrupt or mismatched job/dispatch binding', reviewRequired: true }));
    return;
  }
  let capacityStatus;
  if(binding.capacity!==undefined || dispatch.capacity!==undefined) {
    if(JSON.stringify(binding.capacity)!==JSON.stringify(dispatch.capacity?.info) || binding.capacity?.role!=='worker' || binding.capacity.logicalJobRef!==binding.logicalJobRef || binding.capacity.worker?.attemptDir!==join(args['runs-store'],binding.attemptId))throw Error('worker capacity observation binding mismatch');
    capacityStatus={status:'unverified',id:binding.capacity.id};
    for(const [file,status]of [['capacity-completion.json','released'],['capacity-retained.json','retained']]) {
      try {const proof=JSON.parse(await readFile(join(args['runs-store'],binding.attemptId,file),'utf8'));if(proof.status!==status || proof.id!==binding.capacity.id)throw Error('capacity receipt mismatch');capacityStatus={status,id:proof.id};break;} catch(error){if(error.code!=='ENOENT')throw error;}
    }
  }
  let recovery;
  if (command === 'reconcile' && result.state === 'unknown') {
    try {
      const jobBytes=blob(binding.repo,binding.inputSha,binding.jobPath), job=JSON.parse(jobBytes);
      if (digest(jobBytes)!==binding.jobSha256 || job.version!==1 || job.targetBase!==binding.targetBase || job.runtimeSha!==binding.runtimeSha || job.methodologySha!==binding.methodologySha || job.briefPath!==binding.briefPath || JSON.stringify(job.models)!==JSON.stringify(binding.models) || digest(blob(binding.repo,binding.inputSha,binding.briefPath))!==binding.briefSha256 || digest(blob(binding.repo,binding.models.sha,binding.models.path))!==binding.models.sha256) throw Error('committed recovery inputs changed');
      for (const path of runtimeFiles) if (digest(await readFile(join(root,path)))!==digest(ownSourceBlob(root,binding.runtimeSha,path))) throw Error('recovery runtime identity changed');
      await verifyPackage(binding.packageRoot,binding.runtimeSha);
      for (const path of job.referencedInputs || []) if (digest(blob(binding.repo,binding.inputSha,path))!==digest(blob(binding.repo,binding.targetBase,path))) throw Error('recovery input/base mismatch');
      recovery=await inspectNativeRecovery({attemptDir:join(args['runs-store'],args['attempt-id']),dispatch,observation:result,job,baseline:baselineTree(binding.repo,binding.targetBase)});
    } catch { recovery={status:'blocked',reason:'committed recovery pins or runtime could not be revalidated',reviewRequired:true,retry:'never'}; }
  }
  console.log(JSON.stringify({ ...result, job: binding, reviewRequired: true, ...(recovery ? {recovery} : {}), ...(capacityStatus ? {capacity:capacityStatus} : {}) }));
}
try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
