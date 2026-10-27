#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, link, unlink, realpath, open, rm } from 'node:fs/promises';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { syncDirectory } from './platform-runtime.mjs';
import { windowsWorkerProcess, windowsWorkerState, validWindowsWorkerIdentity } from './windows-worker-identity.mjs';

const self = fileURLToPath(import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fullSha = value => /^[0-9a-f]{40}$/.test(value);
const attemptId = value => /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value) && value !== '.' && value !== '..';
const parseArgs = values => {
  const result = {};
  for (let i = 0; i < values.length; i += 1) {
    const key = values[i];
    const name = key.startsWith('--') ? key.slice(2) : '';
    if (!name || i + 1 >= values.length || Object.hasOwn(result, name)) throw new Error(`invalid or repeated option: ${key}`);
    result[name] = values[++i];
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
    await syncDirectory(dirname(path));
  } catch (error) { await rm(temp, { force: true }); throw error; }
};
const atomicWriteOnce = async (path, value) => {
  await atomicCreate(path, `${JSON.stringify(value, null, 2)}\n`);
};
const parseJson = async path => JSON.parse(await readFile(path, 'utf8'));

function windowsEnvironment(home) {
  const values = { HOME: home, TEMP: home, TMP: home, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' };
  for (const key of ['SystemRoot', 'LOCALAPPDATA', 'PATH']) if (process.env[key]) values[key] = process.env[key];
  return values;
}

async function windowsHost(attemptDir, nonce, dispatch) {
  if (hash(await readFile(dispatch.taskCopy)) !== dispatch.taskSha256) throw Error('trusted task snapshot hash mismatch');
  const owner = { ...currentIdentity(nonce), startedAt: new Date().toISOString() };
  await atomicWriteOnce(join(attemptDir, 'owner.json'), owner);
  await mkdir(dispatch.workspace, { recursive: false });
  await materialize(dispatch.repo, dispatch.targetBase, dispatch.workspace);
  let result;
  try {
    const { runWindowsWorkerTask } = await import('./windows-worker-host.mjs');
    result = await runWindowsWorkerTask({ binary: process.execPath, dispatch, attemptDir, environment: windowsEnvironment(join(attemptDir, 'host-temp')) });
  } catch {
    result = { exitCode: null, timedOut: false, stopped: false, stdout: '', stderr: '', error: 'Windows task controller incomplete; cessation unknown' };
  }
  const stdout = renderCapture(Buffer.from(result.stdout, 'base64'), result.stdoutTruncated === true, dispatch.outputBytes);
  const stderr = renderCapture(Buffer.from(result.stderr, 'base64'), result.stderrTruncated === true, dispatch.outputBytes);
  const terminal = {
    version: 1, attemptId: dispatch.attemptId, finishedAt: new Date().toISOString(),
    outcome: result.timedOut ? 'timeout' : result.exitCode === 0 && result.stopped ? 'success' : 'failure',
    exitCode: result.exitCode, signal: null, error: result.error || null,
    stdout: stdout.text, stderr: stderr.text, stdoutTruncated: stdout.truncated, stderrTruncated: stderr.truncated,
    captureIncomplete: result.stopped !== true, descendants: result.stopped === true ? 'not-claimed' : 'uncertain',
    windowsJobCessation: result.stopped === true, timedOut: result.timedOut, workspace: dispatch.workspace,
  };
  await atomicWriteOnce(join(attemptDir, 'terminal.json'), terminal);
  if (dispatch.capacity) {
    try {
      for (const [name, sha] of Object.entries(dispatch.capacity.modules)) if (hash(await readFile(join(attemptDir, name))) !== sha) throw Error('capacity runtime snapshot changed');
      const { completeWorkerCapacity } = await import('./execution-capacity.mjs');
      await atomicWriteOnce(join(attemptDir, 'capacity-completion.json'), await completeWorkerCapacity({ scope: dispatch.capacity.scope, info: dispatch.capacity.info }));
    } catch (error) {
      const failureCode = /^[a-z-]{1,100}$/.test(error.message || '') ? error.message : /^[A-Z_]{1,40}$/.test(error.code || '') ? error.code : 'unconfirmed-completion';
      await atomicWriteOnce(join(attemptDir, 'capacity-retained.json'), { version: 1, status: 'retained', id: dispatch.capacity.info.id, failureCode, reason: 'successful bound task/tool cessation not proven; no automatic release' });
    }
  }
}

function linuxStat(pid) {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('process PID must be a positive integer');
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { pid, startTicks: fields[19], pgid: Number(fields[2]), state: fields[0] };
}

function linuxProcess(pid) {
  return {
    ...linuxStat(pid),
    bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(),
    exe: realpathSync(`/proc/${pid}/exe`),
  };
}

function linuxIdentity(pid, nonce) {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('process PID must be a positive integer');
  if (typeof nonce !== 'string' || !/^[0-9a-f]{48}$/.test(nonce)) throw new Error('process nonce must be 48 lowercase hexadecimal characters');
  const bootId = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const close = stat.lastIndexOf(')');
  const fields = stat.slice(close + 2).trim().split(/\s+/);
  const startTicks = fields[19];
  const exe = realpathSync(`/proc/${pid}/exe`);
  const argv = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean);
  if (!argv.includes(nonce)) throw new Error('process nonce does not match');
  return { bootId, pid, startTicks, exe, nonce };
}
import { readFileSync, realpathSync } from 'node:fs';

const currentIdentity = nonce => process.platform === 'win32' ? windowsWorkerProcess(process.pid, nonce).process : linuxIdentity(process.pid, nonce);
const identityMatches = owner => {
  if (process.platform === 'win32') return owner?.nonce !== undefined && windowsWorkerState(owner) === 'live';
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
  onlyOptions(args, ['repo', 'input-sha', 'brief', 'target-base', 'attempt-id', 'runs-store', 'grant-ref', 'task-script', 'timeout-ms', 'output-bytes', 'capacity-file']);
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
  if (process.platform === 'win32') await mkdir(join(directory, 'host-temp'));
  const taskCopy = join(directory, 'task.mjs');
  const lifecycleCopy = join(directory, 'worker-lifecycle.mjs');
  const lifecycleBytes = await readFile(self);
  await writeFile(taskCopy, scriptBytes, { mode: 0o600, flag: 'wx' });
  await writeFile(lifecycleCopy, lifecycleBytes, { mode: 0o600, flag: 'wx' });
  const dependencies = {};
  for (const name of ['platform-runtime.mjs', 'windows-worker-identity.mjs', 'windows-worker-host.mjs', 'windows-tool-sandbox.mjs']) {
    const bytes = await readFile(join(dirname(self), name));
    await writeFile(join(directory, name), bytes, { mode: 0o400, flag: 'wx' });
    dependencies[name] = hash(bytes);
  }
  const workspace = join(directory, 'workspace');
  const nonce = randomBytes(24).toString('hex');
  const dispatch = {
    version: 1, attemptId: id, createdAt: new Date().toISOString(), repo, inputSha,
    targetBase, briefPath, briefSha256: hash(brief), grantRef, taskSha256: hash(scriptBytes),
    timeoutMs, outputBytes, workspace, taskCopy, lifecycleCopy, lifecycleSourceSha256: hash(lifecycleBytes), dependencies,
  };
  if(args['capacity-file']) {
    const bytes=await readFile(required(args,'capacity-file'));if(bytes.length>128000)throw Error('bounded private capacity dispatch required');
    const capacity=JSON.parse(bytes);
    if(capacity.info?.role!=='worker' || capacity.info.worker?.attemptDir!==directory || capacity.info.worker.attemptId!==id || capacity.info.worker.inputSha!==inputSha || capacity.info.worker.targetBase!==targetBase)throw Error('worker capacity dispatch binding mismatch');
    const modules={};
    for(const name of ['execution-capacity.mjs','native-recovery.mjs','platform-runtime.mjs','windows-worker-identity.mjs']) {
      const record=capacity.modules?.[name];if(!record || typeof record.base64!=='string' || !/^[a-f0-9]{64}$/.test(record.sha256))throw Error('pinned capacity runtime snapshot required');
      const data=Buffer.from(record.base64,'base64');if(hash(data)!==record.sha256)throw Error('capacity runtime snapshot hash mismatch');
      if (Object.hasOwn(dependencies, name)) { if (dependencies[name] !== record.sha256) throw Error('capacity/runtime helper pin mismatch'); }
      else await writeFile(join(directory,name),data,{flag:'wx',mode:0o400});modules[name]=record.sha256;
    }
    dispatch.capacity={scope:capacity.scope,info:capacity.info,grantSha256:capacity.grantSha256,modules};
  }
  await atomicWriteOnce(join(directory, 'dispatch.json'), dispatch);
  const child = spawn(process.execPath, [lifecycleCopy, 'host', '--attempt-dir', directory, '--nonce', nonce], {
    detached: true, stdio: 'ignore', env: process.platform === 'win32' ? windowsEnvironment(join(directory, 'host-temp')) : { PATH: process.env.PATH || '/usr/bin:/bin', HOME: process.env.HOME || '/tmp', LANG: process.env.LANG || 'C.UTF-8' },
  });
  child.unref();
  process.stdout.write(`${JSON.stringify({ attemptId: id, attemptDir: directory, launchedPid: child.pid })}\n`);
}

async function host(attemptDir, nonce) {
  const dispatch = await parseJson(join(attemptDir, 'dispatch.json'));
  if (hash(await readFile(self)) !== dispatch.lifecycleSourceSha256) throw new Error('pinned lifecycle executable hash mismatch');
  for (const [name, sha] of Object.entries(dispatch.dependencies || {})) if (hash(await readFile(join(attemptDir, name))) !== sha) throw Error('lifecycle dependency snapshot changed');
  if (process.platform === 'win32') return windowsHost(attemptDir, nonce, dispatch);
  const copiedTask = await readFile(dispatch.taskCopy);
  if (hash(copiedTask) !== dispatch.taskSha256) throw new Error('trusted task snapshot hash mismatch');
  const owner = { ...currentIdentity(nonce), startedAt: new Date().toISOString() };
  await atomicWriteOnce(join(attemptDir, 'owner.json'), owner);
  let stdout = Buffer.alloc(0); let stderr = Buffer.alloc(0); let timedOut = false;
  let stdoutTruncated = false; let stderrTruncated = false; let captureIncomplete = false;
  const add = (previous, chunk, max) => {
    const joined = Buffer.concat([previous, chunk]);
    return { bytes: joined.subarray(Math.max(0, joined.length - max)), truncated: joined.length > max };
  };
  const textOutput = renderCapture;  await mkdir(dispatch.workspace, { recursive: false });
  await materialize(dispatch.repo, dispatch.targetBase, dispatch.workspace);
  const child = spawn(process.execPath, [dispatch.taskCopy, dispatch.workspace], {
    cwd: dispatch.workspace, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: '/nonexistent', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' },
  });
  const childRecord = new Promise(resolveRecord => {
    child.once('error', () => resolveRecord());
    child.once('spawn', async () => {
      try {
        const { state, ...identity } = linuxProcess(child.pid);
        await atomicWriteOnce(join(attemptDir, 'execution-child.json'), {
          version: 1, attemptId: dispatch.attemptId, taskSha256: dispatch.taskSha256,
          child: { ...identity, spawnedAt: new Date().toISOString() },
        });
      } catch { /* A missing record remains unknown; it never authorizes replacement. */ }
      resolveRecord();
    });
  });
  const killGroup = signal => { try { process.kill(-child.pid, signal); } catch {} };
  const result = await new Promise(resolveResult => {
    let settled = false;
    let closeGrace;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      clearTimeout(closeGrace);
      resolveResult(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup('SIGTERM');
      killTimer = setTimeout(() => {
        killGroup('SIGKILL');
        closeGrace = setTimeout(() => {
          captureIncomplete = true;
          child.stdout.destroy();
          child.stderr.destroy();
          finish({ exitCode: child.exitCode, signal: child.signalCode, error: null });
        }, 250);
      }, 250);
    }, dispatch.timeoutMs);
    let killTimer;
    child.stdout.on('data', chunk => {
      const result = add(stdout, chunk, dispatch.outputBytes);
      stdout = result.bytes; stdoutTruncated ||= result.truncated;
    });
    child.stderr.on('data', chunk => {
      const result = add(stderr, chunk, dispatch.outputBytes);
      stderr = result.bytes; stderrTruncated ||= result.truncated;
    });
    child.once('error', error => finish({ exitCode: null, signal: null, error: error.message }));
    child.once('close', (code, signal) => finish({ exitCode: code, signal, error: null }));
  });
  await childRecord;
  const renderedStdout = textOutput(stdout, stdoutTruncated, dispatch.outputBytes);
  const renderedStderr = textOutput(stderr, stderrTruncated, dispatch.outputBytes);
  const terminal = {
    version: 1, attemptId: dispatch.attemptId, finishedAt: new Date().toISOString(),
    outcome: timedOut ? 'timeout' : result.exitCode === 0 ? 'success' : 'failure',
    exitCode: result.exitCode, signal: result.signal, error: result.error,
    stdout: renderedStdout.text,
    stderr: renderedStderr.text,
    stdoutTruncated: renderedStdout.truncated, stderrTruncated: renderedStderr.truncated, captureIncomplete,
    descendants: captureIncomplete ? 'uncertain' : 'not-claimed',
    timedOut, workspace: dispatch.workspace,
  };
  await atomicWriteOnce(join(attemptDir, 'terminal.json'), terminal);
  if(dispatch.capacity) {
    try {
      for(const name of ['execution-capacity.mjs','native-recovery.mjs','platform-runtime.mjs','windows-worker-identity.mjs'])if(hash(await readFile(join(attemptDir,name)))!==dispatch.capacity.modules[name])throw Error('capacity runtime snapshot changed');
      const {completeWorkerCapacity}=await import(pathToFileURL(join(attemptDir,'execution-capacity.mjs')));
      const completed=await completeWorkerCapacity({scope:dispatch.capacity.scope,info:dispatch.capacity.info});
      await atomicWriteOnce(join(attemptDir,'capacity-completion.json'),completed);
    } catch {
      await atomicWriteOnce(join(attemptDir,'capacity-retained.json'),{version:1,status:'retained',id:dispatch.capacity.info.id,reason:'bound successful task and tool-namespace cessation could not be proved; no automatic release'});
    }
  }
}

const renderCapture = (bytes, rawTruncated, max) => {
    const marker = '[...truncated...]\n';
    const text = bytes.toString('utf8');
    const omitted = rawTruncated || Buffer.byteLength(text) > max;
    if (!omitted) return { text, truncated: false };

    const available = max - Buffer.byteLength(marker);
    let start = text.length;
    let retainedBytes = 0;
    while (start > 0) {
      let codePointStart = start - 1;
      const lastUnit = text.charCodeAt(codePointStart);
      if (lastUnit >= 0xdc00 && lastUnit <= 0xdfff && codePointStart > 0) {
        const previousUnit = text.charCodeAt(codePointStart - 1);
        if (previousUnit >= 0xd800 && previousUnit <= 0xdbff) codePointStart -= 1;
      }
      const codePoint = text.codePointAt(codePointStart);
      const codePointBytes = codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
      if (retainedBytes + codePointBytes > available) break;
      retainedBytes += codePointBytes;
      start = codePointStart;
    }
    return { text: marker + text.slice(start), truncated: true };
  };

async function observeExecutionChild(attemptDir, dispatch) {
  let record;
  try { record = await parseJson(join(attemptDir, 'execution-child.json')); }
  catch (error) { return { state: 'unknown', reason: error.code === 'ENOENT' ? 'child identity not published' : 'corrupt child identity' }; }
  const child = record?.child;
  if (process.platform === 'win32') {
    if (record?.version !== 1 || record.attemptId !== dispatch.attemptId || record.taskSha256 !== dispatch.taskSha256 || !validWindowsWorkerIdentity(child) || !Number.isFinite(Date.parse(child.spawnedAt))) return { state: 'unknown', reason: 'invalid Windows child identity' };
    const state = windowsWorkerState(child);
    return state === 'unknown' ? { state, reason: 'Windows child identity unavailable or mismatched' } : { state, identity: child, descendants: 'unproven' };
  }
  if (record?.version !== 1 || record.attemptId !== dispatch.attemptId || record.taskSha256 !== dispatch.taskSha256 || !child || !Number.isInteger(child.pid) || child.pid <= 0 || child.pgid !== child.pid || typeof child.bootId !== 'string' || !/^[0-9a-f-]{36}$/.test(child.bootId) || typeof child.startTicks !== 'string' || !/^\d+$/.test(child.startTicks) || typeof child.exe !== 'string' || !isAbsolute(child.exe) || typeof child.spawnedAt !== 'string' || !Number.isFinite(Date.parse(child.spawnedAt))) return { state: 'unknown', reason: 'invalid child identity' };
  try {
    if (readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim() !== child.bootId) return { state: 'unknown', reason: 'child boot identity mismatched' };
    let actual;
    try { actual = linuxStat(child.pid); }
    catch (error) {
      return error.code === 'ENOENT' || error.code === 'ESRCH'
        ? { state: 'not-live', identity: child, descendants: 'unproven' }
        : { state: 'unknown', reason: 'child process observation unavailable' };
    }
    if (actual.startTicks !== child.startTicks || actual.pgid !== child.pgid) return { state: 'unknown', reason: 'child process identity mismatched' };
    if (actual.state === 'Z') return { state: 'not-live', identity: child, descendants: 'unproven' };
    if (realpathSync(`/proc/${child.pid}/exe`) !== child.exe) return { state: 'unknown', reason: 'child executable identity mismatched' };
    return { state: 'live', identity: child, descendants: 'unproven' };
  } catch { return { state: 'unknown', reason: 'child process observation unavailable' }; }
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
      if (terminal.version !== 1 || terminal.attemptId !== dispatch.attemptId || terminal.workspace !== dispatch.workspace || !['success', 'failure', 'timeout'].includes(terminal.outcome) || typeof terminal.finishedAt !== 'string' || typeof terminal.timedOut !== 'boolean' || !(Number.isInteger(terminal.exitCode) || terminal.exitCode === null) || typeof terminal.stdout !== 'string' || typeof terminal.stderr !== 'string' || Buffer.byteLength(terminal.stdout) > dispatch.outputBytes || Buffer.byteLength(terminal.stderr) > dispatch.outputBytes || typeof terminal.stdoutTruncated !== 'boolean' || typeof terminal.stderrTruncated !== 'boolean' || typeof terminal.captureIncomplete !== 'boolean' || terminal.descendants !== (terminal.captureIncomplete ? 'uncertain' : 'not-claimed') || !validResult) return { state: 'unknown', reason: 'invalid terminal' };
      return { state: 'terminal', terminal };
    }
    const executionChild = await observeExecutionChild(attemptDir, dispatch);
    let owner;
    try { owner = await parseJson(join(attemptDir, 'owner.json')); } catch (error) { return { state: 'unknown', reason: error.code === 'ENOENT' ? 'owner not published' : 'corrupt owner', executionChild }; }
    if (identityMatches(owner)) return { state: 'running', owner: { pid: owner.pid, startedAt: owner.startedAt }, executionChild };
    return { state: 'unknown', reason: 'owner identity absent or mismatched', executionChild };
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
main().catch(async error => {
  // Startup can fail before owner/terminal publication. Preserve bounded failure
  // evidence, never a cessation assertion or permission to release capacity.
  try {
    if (process.platform === 'win32' && process.argv[2] === 'host') {
      const args = parseArgs(process.argv.slice(3)), directory = required(args, 'attempt-dir');
      const dispatch = await parseJson(join(directory, 'dispatch.json'));
      if (dispatch.lifecycleCopy === self && hash(await readFile(self)) === dispatch.lifecycleSourceSha256) {
        const reasons = ['Windows worker process observation unavailable', 'Windows worker identity mismatch', 'pinned lifecycle executable hash mismatch', 'lifecycle dependency snapshot changed', 'trusted task snapshot hash mismatch'];
        await atomicWriteOnce(join(directory, 'host-failure.json'), { version: 1, attemptId: dispatch.attemptId, taskSha256: dispatch.taskSha256, reason: reasons.includes(error.message) ? error.message : 'host startup incomplete', errorName: error.name === 'Error' ? 'Error' : 'Other', code: /^[A-Z_]{1,40}$/.test(error.code || '') ? error.code : null });
      }
    }
  } catch { /* Missing or corrupt publication remains unknown, never clean. */ }
  process.stderr.write(`${error.message}\n`); process.exitCode = 1;
});
