#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, link, unlink, realpath, open, rm } from 'node:fs/promises';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fullSha = value => /^[0-9a-f]{40}$/.test(value);
const attemptId = value => /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value) && value !== '.' && value !== '..';
const parseArgs = values => {
  const result = {};
  for (let i = 0; i < values.length; i += 1) {
    const key = values[i];
    if (!key.startsWith('--') || i + 1 >= values.length || key in result) throw new Error(`invalid or repeated option: ${key}`);
    result[key.slice(2)] = values[++i];
  }
  return result;
};
const required = (args, name) => {
  if (!args[name]) throw new Error(`missing --${name}`);
  return args[name];
};
const onlyOptions = (args, allowed) => {
  for (const name of Object.keys(args)) if (!allowed.includes(name)) throw new Error(`unsupported option: --${name}`);
};
const runGit = (repo, args, input) => {
  const result = spawnSync('git', ['-C', repo, ...args], { input, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr?.toString().slice(0, 1000) || result.error?.message}`);
  return result.stdout;
};
const commitExists = (repo, sha) => runGit(repo, ['cat-file', '-e', `${sha}^{commit}`]);
const atomicCreate = async (path, content) => {
  const temp = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(content); await handle.sync(); } finally { await handle.close(); }
  try {
    await link(temp, path);
    await unlink(temp);
    const directory = await open(dirname(path), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } catch (error) { await rm(temp, { force: true }); throw error; }
};
const atomicWriteOnce = async (path, value) => {
  await atomicCreate(path, `${JSON.stringify(value, null, 2)}\n`);
};
const parseJson = async path => JSON.parse(await readFile(path, 'utf8'));

function linuxIdentity(pid, nonce) {
  const bootId = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const close = stat.lastIndexOf(')');
  const fields = stat.slice(close + 2).trim().split(/\s+/);
  const startTicks = fields[19];
  const exe = realpathSync(`/proc/${pid}/exe`);
  const cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf8').replaceAll('\0', ' ');
  if (!cmdline.includes(nonce)) throw new Error('process nonce does not match');
  return { bootId, pid, startTicks, exe, nonce };
}
import { readFileSync, realpathSync } from 'node:fs';

const currentIdentity = nonce => linuxIdentity(process.pid, nonce);
const identityMatches = owner => {
  try {
    const actual = linuxIdentity(owner.pid, owner.nonce);
    return actual.bootId === owner.bootId && actual.startTicks === owner.startTicks && actual.exe === owner.exe;
  } catch { return false; }
};

async function materialize(repo, targetBase, workspace) {
  const entries = runGit(repo, ['ls-tree', '-r', '-z', '--full-tree', targetBase]).toString('utf8').split('\0').filter(Boolean);
  for (const entry of entries) {
    const tab = entry.indexOf('\t');
    const [mode, type, object] = entry.slice(0, tab).split(' ');
    const name = entry.slice(tab + 1);
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) continue;
    if (name.startsWith('/') || name.split('/').some(part => part === '..' || part === '.')) throw new Error(`unsafe committed path: ${name}`);
    const destination = join(workspace, name);
    if (!relative(workspace, destination) || relative(workspace, destination).startsWith('..')) throw new Error(`unsafe committed path: ${name}`);
    await mkdir(dirname(destination), { recursive: true });
    const data = runGit(repo, ['cat-file', 'blob', object]);
    await writeFile(destination, data, { mode: mode === '100755' ? 0o755 : 0o644, flag: 'wx' });
  }
}

async function launch(args) {
  onlyOptions(args, ['repo', 'input-sha', 'brief', 'target-base', 'attempt-id', 'runs-store', 'grant-ref', 'task-script', 'timeout-ms', 'output-bytes']);
  const repoInput = required(args, 'repo');
  if (!isAbsolute(repoInput)) throw new Error('--repo must be absolute');
  const repo = await realpath(repoInput);
  const inputSha = required(args, 'input-sha');
  const targetBase = required(args, 'target-base');
  const id = required(args, 'attempt-id');
  const runsValue = required(args, 'runs-store');
  if (!isAbsolute(runsValue)) throw new Error('--runs-store must be absolute');
  const runs = resolve(runsValue);
  const grantRef = required(args, 'grant-ref');
  const briefPath = required(args, 'brief');
  const taskScriptInput = required(args, 'task-script');
  if (!isAbsolute(taskScriptInput)) throw new Error('--task-script must be absolute');
  const taskScript = await realpath(taskScriptInput);
  const timeoutMs = Number(required(args, 'timeout-ms'));
  const outputBytes = Number(required(args, 'output-bytes'));
  if (!fullSha(inputSha) || !fullSha(targetBase)) throw new Error('input SHA and target base must be full lowercase 40-character Git SHAs');
  if (!attemptId(id)) throw new Error('invalid attempt ID');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) throw new Error('timeout must be 100..120000 ms');
  if (!Number.isInteger(outputBytes) || outputBytes < 256 || outputBytes > 1048576) throw new Error('output bound must be 256..1048576 bytes');
  if (isAbsolute(briefPath) || briefPath.split('/').includes('..') || !briefPath) throw new Error('brief must be a safe repository-relative path');
  commitExists(repo, inputSha);
  commitExists(repo, targetBase);
  const briefEntry = runGit(repo, ['ls-tree', '-z', inputSha, '--', briefPath]).toString('utf8').split('\0').filter(Boolean)[0];
  if (!briefEntry || !briefEntry.startsWith('100644 blob ') && !briefEntry.startsWith('100755 blob ')) throw new Error('brief must be a committed regular file at input SHA');
  const briefObject = briefEntry.slice(0, briefEntry.indexOf('\t')).split(' ')[2];
  const brief = runGit(repo, ['cat-file', 'blob', briefObject]);
  const scriptBytes = await readFile(taskScript);
  const directory = join(runs, id);
  await mkdir(runs, { recursive: true });
  await mkdir(directory, { recursive: false });
  const taskCopy = join(directory, 'task.mjs');
  const lifecycleCopy = join(directory, 'worker-lifecycle.mjs');
  const lifecycleBytes = await readFile(self);
  await writeFile(taskCopy, scriptBytes, { mode: 0o600, flag: 'wx' });
  await writeFile(lifecycleCopy, lifecycleBytes, { mode: 0o600, flag: 'wx' });
  const workspace = join(directory, 'workspace');
  const nonce = randomBytes(24).toString('hex');
  const dispatch = {
    version: 1, attemptId: id, createdAt: new Date().toISOString(), repo, inputSha,
    targetBase, briefPath, briefSha256: hash(brief), grantRef, taskSha256: hash(scriptBytes),
    timeoutMs, outputBytes, workspace, taskCopy, lifecycleCopy, lifecycleSourceSha256: hash(lifecycleBytes),
  };
  await atomicWriteOnce(join(directory, 'dispatch.json'), dispatch);
  const child = spawn(process.execPath, [lifecycleCopy, 'host', '--attempt-dir', directory, '--nonce', nonce], {
    detached: true, stdio: 'ignore', env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: process.env.HOME || '/tmp', LANG: process.env.LANG || 'C.UTF-8' },
  });
  child.unref();
  process.stdout.write(`${JSON.stringify({ attemptId: id, attemptDir: directory, launchedPid: child.pid })}\n`);
}

async function host(attemptDir, nonce) {
  const dispatch = await parseJson(join(attemptDir, 'dispatch.json'));
  if (hash(await readFile(self)) !== dispatch.lifecycleSourceSha256) throw new Error('pinned lifecycle executable hash mismatch');
  const copiedTask = await readFile(dispatch.taskCopy);
  if (hash(copiedTask) !== dispatch.taskSha256) throw new Error('trusted task snapshot hash mismatch');
  const owner = { ...currentIdentity(nonce), startedAt: new Date().toISOString() };
  await atomicWriteOnce(join(attemptDir, 'owner.json'), owner);
  let stdout = Buffer.alloc(0); let stderr = Buffer.alloc(0); let timedOut = false;
  const add = (previous, chunk, max) => Buffer.concat([previous, chunk]).subarray(Math.max(0, previous.length + chunk.length - max));
  await mkdir(dispatch.workspace, { recursive: false });
  await materialize(dispatch.repo, dispatch.targetBase, dispatch.workspace);
  const child = spawn(process.execPath, [dispatch.taskCopy, dispatch.workspace], {
    cwd: dispatch.workspace, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: '/nonexistent', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' },
  });
  const killGroup = signal => { try { process.kill(-child.pid, signal); } catch {} };
  const timer = setTimeout(() => {
    timedOut = true;
    killGroup('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) killGroup('SIGKILL');
    }, 250).unref();
  }, dispatch.timeoutMs);
  child.stdout.on('data', chunk => { stdout = add(stdout, chunk, dispatch.outputBytes); });
  child.stderr.on('data', chunk => { stderr = add(stderr, chunk, dispatch.outputBytes); });
  const result = await new Promise(resolveResult => {
    child.once('error', error => resolveResult({ exitCode: null, signal: null, error: error.message }));
    child.once('close', (code, signal) => resolveResult({ exitCode: code, signal, error: null }));
  });
  clearTimeout(timer);
  const terminal = {
    version: 1, attemptId: dispatch.attemptId, finishedAt: new Date().toISOString(),
    outcome: timedOut ? 'timeout' : result.exitCode === 0 ? 'success' : 'failure',
    exitCode: result.exitCode, signal: result.signal, error: result.error,
    stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'),
    timedOut, workspace: dispatch.workspace,
  };
  await atomicWriteOnce(join(attemptDir, 'terminal.json'), terminal);
}

async function observe(attemptDir) {
  try {
    const dispatch = await parseJson(join(attemptDir, 'dispatch.json'));
    if (dispatch.version !== 1 || !attemptId(dispatch.attemptId) || resolve(dispatch.workspace) !== join(resolve(attemptDir), 'workspace') || !fullSha(dispatch.inputSha) || !fullSha(dispatch.targetBase) || !/^[0-9a-f]{64}$/.test(dispatch.taskSha256) || !/^[0-9a-f]{64}$/.test(dispatch.lifecycleSourceSha256)) return { state: 'unknown', reason: 'invalid dispatch' };
    let terminal;
    try { terminal = await parseJson(join(attemptDir, 'terminal.json')); } catch (error) { if (error.code !== 'ENOENT') return { state: 'unknown', reason: 'corrupt terminal' }; }
    if (terminal) {
      const validResult = terminal.timedOut === true
        ? terminal.outcome === 'timeout'
        : terminal.exitCode === 0 && terminal.signal === null && terminal.error === null
          ? terminal.outcome === 'success'
          : terminal.outcome === 'failure';
      if (terminal.version !== 1 || terminal.attemptId !== dispatch.attemptId || terminal.workspace !== dispatch.workspace || !['success', 'failure', 'timeout'].includes(terminal.outcome) || typeof terminal.finishedAt !== 'string' || typeof terminal.timedOut !== 'boolean' || !(Number.isInteger(terminal.exitCode) || terminal.exitCode === null) || typeof terminal.stdout !== 'string' || typeof terminal.stderr !== 'string' || Buffer.byteLength(terminal.stdout) > dispatch.outputBytes || Buffer.byteLength(terminal.stderr) > dispatch.outputBytes || !validResult) return { state: 'unknown', reason: 'invalid terminal' };
      return { state: 'terminal', terminal };
    }
    let owner;
    try { owner = await parseJson(join(attemptDir, 'owner.json')); } catch (error) { return { state: 'unknown', reason: error.code === 'ENOENT' ? 'owner not published' : 'corrupt owner' }; }
    if (identityMatches(owner)) return { state: 'running', owner: { pid: owner.pid, startedAt: owner.startedAt } };
    return { state: 'unknown', reason: 'owner identity absent or mismatched' };
  } catch { return { state: 'unknown', reason: 'missing or corrupt dispatch' }; }
}

async function main() {
  const [command, ...values] = process.argv.slice(2);
  const args = parseArgs(values);
  if (command === 'launch') return launch(args);
  if (command === 'host') {
    onlyOptions(args, ['attempt-dir', 'nonce']);
    return host(required(args, 'attempt-dir'), required(args, 'nonce'));
  }
  if (command === 'read' || command === 'reconcile') {
    onlyOptions(args, ['runs-store', 'attempt-id']);
    const id = required(args, 'attempt-id');
    if (!attemptId(id)) throw new Error('invalid attempt ID');
    const storeInput = required(args, 'runs-store');
    if (!isAbsolute(storeInput)) throw new Error('--runs-store must be absolute');
    const store = resolve(storeInput);
    const result = await observe(join(store, id));
    process.stdout.write(`${JSON.stringify({ attemptId: id, ...result })}\n`);
    return;
  }
  throw new Error('usage: worker-lifecycle.mjs launch|read|reconcile [explicit options]');
}
main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
