#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, realpath, mkdir, mkdtemp, lstat } from 'node:fs/promises';
import { dirname, join, resolve, isAbsolute, basename, relative } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { verifyPackage, canonicalPath } from './factory-package.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const methodologySha = '37a56ebc902e94f21fc10666f33fceac44946af7';
const runtimeFiles = ['tools/isswf-job.mjs', 'tools/factory-package.mjs', 'tools/pi-worker-task.mjs', 'tools/worker-lifecycle.mjs'];
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
function options(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 2) {
    const key = values[i];
    if (!['--project', '--input-sha', '--job', '--runs-store', '--attempt-id', '--grant-ref', '--mode'].includes(key) || !values[i + 1] || Object.hasOwn(result, key.slice(2))) throw new Error('invalid or repeated job option');
    result[key.slice(2)] = values[i + 1];
  }
  return result;
}
async function canonicalStore(path, project) {
  if (!isAbsolute(path || '')) throw new Error('--runs-store must be an absolute operator-owned path');
  const store = await canonicalPath(path);
  for (const tree of [project, root]) {
    const child = relative(tree, store), parent = relative(store, tree);
    if (!child || (!child.startsWith('..') && !isAbsolute(child)) || (!parent.startsWith('..') && !isAbsolute(parent))) throw new Error('runs store must be outside project and source trees');
  }
  await mkdir(store, { recursive: true });
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
    const path = typeof entry === 'string' ? entry : entry?.source;
    if (typeof path !== 'string' || !isAbsolute(path)) continue;
    let manifest;
    try { manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (manifest.name === 'isswf-pi-resources') matches.push({ path: await realpath(path), entry });
  }
  if (matches.length !== 1 || typeof matches[0].entry !== 'string' || basename(matches[0].path) !== revision) throw new Error('exactly one activated package must match job.runtimeSha');
  await verifyPackage(matches[0].path, revision);
  return matches[0].path;
}
async function run(args) {
  if (!isAbsolute(args.project || '') || !fullSha(args['input-sha']) || !safeRelative(args.job)) throw new Error('run requires --project absolute --input-sha fullSHA --job committed/relative.json');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(args['attempt-id'] || '') || ['.', '..'].includes(args['attempt-id']) || !args['grant-ref']?.trim()) throw new Error('explicit attempt ID and trusted grant reference required');
  const mode = args.mode || 'real';
  if (!['real', 'offline'].includes(mode)) throw new Error('mode must be real or offline');
  const project = await realpath(args.project);
  const jobBytes = blob(project, args['input-sha'], args.job);
  const job = JSON.parse(jobBytes);
  if (job.version !== 1 || !fullSha(job.runtimeSha) || !fullSha(job.targetBase) || job.methodologySha !== methodologySha) throw new Error('job version/runtime/base/methodology pins invalid');
  if (job.exclusiveAttempt !== true || job.workerTotal !== 1) throw new Error('trusted exclusive-attempt grant and workerTotal=1 required');
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
  try { await lstat(join(store, args['attempt-id'])); throw new Error('attempt already exists; read/reconcile before any operator-authorized replacement'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const prepared = await mkdtemp(join(store, '.prepare-'));
  const configPath = join(prepared, 'config.json'), taskPath = join(prepared, 'task.mjs');
  const config = { version: 1, mode, ...paths, profile: { repo: root, sha: methodologySha, files: profileFiles }, brief: { repo: project, inputSha: args['input-sha'], path: job.briefPath }, expectedMutablePaths: job.expectedMutablePaths, protectedCheckCommand: job.protectedCheckCommand, checks: mode === 'offline' ? job.offlineChecks : [] };
  await writeFile(configPath, JSON.stringify(config) + '\n', { mode: 0o600, flag: 'wx' });
  const preparedResult = JSON.parse(invoke(process.execPath, [join(root, 'tools/pi-worker-task.mjs'), 'prepare', '--config', configPath, '--output', taskPath]));
  if (preparedResult.inputSha !== args['input-sha'] || preparedResult.briefPath !== job.briefPath || preparedResult.briefSha256 !== digest(briefBytes) || preparedResult.taskSha256 !== digest(await readFile(taskPath))) throw new Error('prepared task/brief identity mismatch');
  const launched = JSON.parse(invoke(process.execPath, [join(root, 'tools/worker-lifecycle.mjs'), 'launch', '--repo', project, '--input-sha', args['input-sha'], '--brief', job.briefPath, '--target-base', job.targetBase, '--attempt-id', args['attempt-id'], '--runs-store', store, '--grant-ref', args['grant-ref'], '--task-script', taskPath, '--timeout-ms', '120000', '--output-bytes', '16000']));
  const binding = { version: 1, packageRoot, runtimeSha: job.runtimeSha, methodologySha, inputSha: args['input-sha'], targetBase: job.targetBase, jobPath: args.job, jobSha256: digest(jobBytes), models: job.models, ...preparedResult, mode, reviewRequired: true };
  await writeFile(join(launched.attemptDir, 'job.json'), JSON.stringify(binding) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ ...launched, mode, reviewRequired: true }));
}
async function main() {
  const command = process.argv[2], args = options(process.argv.slice(3));
  if (command === 'run') return run(args);
  if (!['read', 'reconcile'].includes(command) || Object.keys(args).some(key => !['runs-store', 'attempt-id'].includes(key))) throw new Error('usage: isswf-job.mjs run|read|reconcile [explicit options]');
  const result = JSON.parse(invoke(process.execPath, [join(root, 'tools/worker-lifecycle.mjs'), command, '--runs-store', args['runs-store'] || '', '--attempt-id', args['attempt-id'] || '']));
  console.log(JSON.stringify({ ...result, reviewRequired: true }));
}
try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
