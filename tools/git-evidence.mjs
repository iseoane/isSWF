#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readdir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = value => typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value);
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const failure = (reason, binding = null) => ({
  version: 1, status: 'error', operation: 'identity', reason,
  ...(binding ? { repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha, bindingSha256: digest(binding) } : {}),
});

export function validateBinding(value) {
  if (!ownKeys(value, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes']) || value.version !== 1) throw Error('invalid-binding-shape');
  if (typeof value.repository !== 'string' || !isAbsolute(value.repository) || value.repository.includes('\0')) throw Error('invalid-repository-binding');
  if (!sha(value.baseSha) || !sha(value.candidateSha) || value.baseSha.length !== value.candidateSha.length) throw Error('full-commit-identities-required');
  if (typeof value.gitExecutable !== 'string' || !isAbsolute(value.gitExecutable) || value.gitExecutable.includes('\0')) throw Error('absolute-git-executable-required');
  if (!Number.isSafeInteger(value.timeoutMs) || value.timeoutMs < 100 || value.timeoutMs > 10000) throw Error('invalid-time-bound');
  if (!Number.isSafeInteger(value.outputBytes) || value.outputBytes < 512 || value.outputBytes > 8192) throw Error('invalid-output-bound');
  return Object.freeze({ version: 1, repository: value.repository, baseSha: value.baseSha, candidateSha: value.candidateSha, gitExecutable: value.gitExecutable, timeoutMs: value.timeoutMs, outputBytes: value.outputBytes });
}

function runGit(binding, args, deadline, maxBuffer = 8192) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw Error('identity-timeout');
  const env = {
    PATH: dirname(binding.gitExecutable), HOME: process.platform === 'win32' ? 'C:\\\\' : '/nonexistent',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0',
    GIT_ATTR_NOSYSTEM: '1', GIT_GRAFT_FILE: process.platform === 'win32' ? 'NUL' : '/dev/null', LC_ALL: 'C',
  };
  const result = spawnSync(binding.gitExecutable, ['-C', binding.repository, ...args], {
    shell: false, windowsHide: true, env, encoding: 'buffer', timeout: Math.min(binding.timeoutMs, remaining), maxBuffer,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error?.code === 'ETIMEDOUT') throw Error('git-timeout');
  if (result.error?.code === 'ENOBUFS') throw Error('git-output-limit');
  if (result.error || result.status !== 0) throw Error('git-identity-command-failed');
  return result.stdout;
}

async function assertSupportedRepository(binding, deadline) {
  const root = await realpath(binding.repository);
  if (root !== binding.repository) throw Error('repository-binding-not-canonical');
  const gitEntry = join(root, '.git');
  const gitStat = await lstat(gitEntry);
  if (!gitStat.isDirectory() || gitStat.isSymbolicLink() || await realpath(gitEntry) !== gitEntry) throw Error('unsupported-gitdir-topology');
  const objectDir = join(gitEntry, 'objects');
  const objectStat = await lstat(objectDir);
  if (!objectStat.isDirectory() || objectStat.isSymbolicLink() || await realpath(objectDir) !== objectDir) throw Error('unsupported-object-store-topology');
  for (const path of [join(objectDir, 'info', 'alternates'), join(gitEntry, 'info', 'grafts')]) {
    try { await lstat(path); throw Error(path.endsWith('alternates') ? 'alternate-object-store-refused' : 'grafts-refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  // Git can follow links below objects, refs or config even when .git itself is regular.
  // Bound the inspected metadata and refuse unsupported topology before invoking Git.
  const pending = [gitEntry];
  let metadataEntries = 0;
  while (pending.length) {
    if (Date.now() >= deadline) throw Error('identity-timeout');
    const directory = pending.pop();
    for (const name of await readdir(directory)) {
      if (++metadataEntries > 32768) throw Error('repository-metadata-limit');
      const path = join(directory, name);
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || !stat.isDirectory() && !stat.isFile()) {
        throw Error(path.startsWith(objectDir + sep) ? 'unsupported-object-store-topology' : 'unsupported-gitdir-topology');
      }
      if (stat.isDirectory()) pending.push(path);
    }
  }
  const executableStat = await lstat(binding.gitExecutable);
  if (!executableStat.isFile() || executableStat.isSymbolicLink() || await realpath(binding.gitExecutable) !== binding.gitExecutable) throw Error('git-executable-not-canonical-regular-file');
  const config = runGit(binding, ['config', '--local', '--null', '--list', '--no-includes'], deadline, 65536);
  if (config.length > 65536) throw Error('repository-config-too-large');
  const entries = config.toString('utf8').split('\0').filter(Boolean);
  for (const entry of entries) {
    const key = entry.slice(0, entry.indexOf('\n')).toLowerCase();
    if (key.startsWith('include.') || ['core.fsmonitor', 'core.sshcommand', 'core.gitproxy', 'core.askpass', 'core.hookspath', 'core.alternaterefscommand'].includes(key) || key.startsWith('filter.') || key.startsWith('diff.') || key.startsWith('merge.')) throw Error('executable-or-external-git-configuration-refused');
  }
}

export async function identity(input) {
  let binding;
  try {
    binding = validateBinding(input);
    const bindingSha256 = digest(binding);
    const deadline = Date.now() + binding.timeoutMs;
    await assertSupportedRepository(binding, deadline);
    const objectFormat = runGit(binding, ['rev-parse', '--show-object-format'], deadline).toString('ascii').trim();
    const expectedFormat = binding.baseSha.length === 64 ? 'sha256' : 'sha1';
    if (objectFormat !== expectedFormat) throw Error('commit-format-mismatch');
    for (const [name, expected] of [['base', binding.baseSha], ['candidate', binding.candidateSha]]) {
      const resolved = runGit(binding, ['rev-parse', '--verify', `${expected}^{commit}`], deadline).toString('ascii').trim();
      if (resolved !== expected) throw Error(`${name}-commit-identity-mismatch`);
    }
    const headSha = runGit(binding, ['rev-parse', '--verify', 'HEAD^{commit}'], deadline).toString('ascii').trim();
    if (!sha(headSha) || headSha.length !== binding.baseSha.length) throw Error('observed-head-invalid');
    const gitVersion = runGit(binding, ['--version'], deadline).toString('ascii').trim();
    const result = {
      version: 1, status: 'ok', operation: 'identity', repository: binding.repository,
      baseSha: binding.baseSha, candidateSha: binding.candidateSha, observedHeadSha: headSha,
      gitExecutable: binding.gitExecutable, gitVersion, bindingSha256,
      limits: { timeoutMs: binding.timeoutMs, outputBytes: binding.outputBytes },
    };
    if (Buffer.byteLength(JSON.stringify(result)) > binding.outputBytes) throw Error('identity-output-limit');
    return result;
  } catch (error) {
    return failure(typeof error?.message === 'string' ? error.message.slice(0, 160) : 'identity-refused', binding);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3 || process.argv[2] !== 'identity') throw Error('identity-operation-required');
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 16384) throw Error('binding-input-limit');
      chunks.push(chunk);
    }
    let binding;
    try { binding = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw Error('invalid-binding-json'); }
    const result = await identity(binding);
    process.stdout.write(JSON.stringify(result) + '\n');
    if (result.status !== 'ok') process.exitCode = 2;
  } catch (error) {
    process.stdout.write(JSON.stringify(failure(error.message.slice(0, 160))) + '\n');
    process.exitCode = 2;
  }
}
