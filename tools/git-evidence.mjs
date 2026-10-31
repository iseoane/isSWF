#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, opendir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = value => typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value);
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const failure = (reason, binding = null, operation = 'identity') => ({
  version: 1, status: 'error', operation, reason,
  ...(binding ? { repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha, bindingSha256: digest(binding) } : {}),
});
const wireBytes = value => Buffer.byteLength(JSON.stringify(value) + '\n');
function boundedResult(value, limit = 512) {
  if (wireBytes(value) <= limit) return value;
  const operation = value.operation ?? 'identity';
  return {
    version: 1, status: 'error', operation, reason: `${operation}-output-limit`,
    ...(value.bindingSha256 ? { bindingSha256: value.bindingSha256 } : {}),
  };
}

function validateGitBinding(value, maxOutputBytes) {
  if (!ownKeys(value, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes']) || value.version !== 1) throw Error('invalid-binding-shape');
  if (typeof value.repository !== 'string' || !isAbsolute(value.repository) || value.repository.includes('\0')) throw Error('invalid-repository-binding');
  if (!sha(value.baseSha) || !sha(value.candidateSha) || value.baseSha.length !== value.candidateSha.length) throw Error('full-commit-identities-required');
  if (typeof value.gitExecutable !== 'string' || !isAbsolute(value.gitExecutable) || value.gitExecutable.includes('\0')) throw Error('absolute-git-executable-required');
  if (!Number.isSafeInteger(value.timeoutMs) || value.timeoutMs < 100 || value.timeoutMs > 10000) throw Error('invalid-time-bound');
  if (!Number.isSafeInteger(value.outputBytes) || value.outputBytes < 512 || value.outputBytes > maxOutputBytes) throw Error('invalid-output-bound');
  return Object.freeze({ version: 1, repository: value.repository, baseSha: value.baseSha, candidateSha: value.candidateSha, gitExecutable: value.gitExecutable, timeoutMs: value.timeoutMs, outputBytes: value.outputBytes });
}

export function validateBinding(value) {
  const binding = validateGitBinding(value, 8192);
  if (wireBytes(failure('x'.repeat(160), binding)) > binding.outputBytes) throw Error('binding-context-exceeds-output-bound');
  return binding;
}

function runGit(binding, args, deadline, maxBuffer = 8192, extraEnv = {}) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw Error('identity-timeout');
  const env = {
    PATH: dirname(binding.gitExecutable), HOME: process.platform === 'win32' ? 'C:\\\\' : '/nonexistent',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0',
    GIT_ATTR_NOSYSTEM: '1', GIT_GRAFT_FILE: process.platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_PAGER: 'cat', PAGER: 'cat', LC_ALL: 'C', ...extraEnv,
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
  try { await lstat(join(gitEntry, 'commondir')); throw Error('common-git-storage-refused'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
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
    for await (const entry of await opendir(directory)) {
      if (Date.now() >= deadline) throw Error('identity-timeout');
      if (++metadataEntries > 32768) throw Error('repository-metadata-limit');
      const path = join(directory, entry.name);
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
    if (key.startsWith('include.') || key.startsWith('includeif.') || ['core.fsmonitor', 'core.sshcommand', 'core.gitproxy', 'core.askpass', 'core.hookspath', 'core.alternaterefscommand', 'core.attributesfile'].includes(key) || key.startsWith('filter.') || key.startsWith('diff.') || key.startsWith('merge.')) throw Error('executable-or-external-git-configuration-refused');
  }
}

export function validateDiffBinding(value) {
  try { return validateGitBinding(value, 192000); }
  catch (error) {
    if (error.message === 'invalid-output-bound') throw Error('invalid-diff-output-bound');
    throw error;
  }
}

const contentPath = value => {
  if (typeof value !== 'string' || !value || Buffer.byteLength(value, 'utf8') > 1024 || value.includes('\0') || value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/u.test(value) || value.startsWith('\\') || value.startsWith(':(') || value.startsWith(':/') || value.startsWith('!') || value.startsWith('^') || /[*?\[\]]/u.test(value)) return false;
  const parts = value.split('/');
  return parts.every(part => part && part !== '.' && part !== '..');
};

export function validateContentBinding(value) {
  if (!ownKeys(value, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes', 'paths']) || value.version !== 1) throw Error('invalid-content-binding-shape');
  const binding = validateGitBinding({ version: value.version, repository: value.repository, baseSha: value.baseSha, candidateSha: value.candidateSha, gitExecutable: value.gitExecutable, timeoutMs: value.timeoutMs, outputBytes: value.outputBytes }, 65536);
  if (!Array.isArray(value.paths) || value.paths.length < 1 || value.paths.length > 64 || !value.paths.every(contentPath) || new Set(value.paths).size !== value.paths.length || value.paths.reduce((size, path) => size + Buffer.byteLength(path, 'utf8'), 0) > 8192) throw Error('invalid-content-path-allowlist');
  if (wireBytes(failure('x'.repeat(160), binding, 'content')) > binding.outputBytes) throw Error('binding-context-exceeds-output-bound');
  return Object.freeze({ ...binding, paths: Object.freeze([...value.paths]) });
}

export async function content(input, slot, path) {
  let binding;
  try {
    binding = validateContentBinding(input);
    if (!['base', 'candidate'].includes(slot)) throw Error('invalid-content-slot');
    if (!contentPath(path)) throw Error('invalid-content-path');
    if (!binding.paths.includes(path)) throw Error('content-path-not-allowed');
    const deadline = Date.now() + binding.timeoutMs;
    await assertSupportedRepository(binding, deadline);
    const expectedFormat = binding.baseSha.length === 64 ? 'sha256' : 'sha1';
    const objectFormat = runGit(binding, ['rev-parse', '--show-object-format'], deadline).toString('ascii').trim();
    if (objectFormat !== expectedFormat) throw Error('commit-format-mismatch');
    const commitSha = slot === 'base' ? binding.baseSha : binding.candidateSha;
    const resolved = runGit(binding, ['rev-parse', '--verify', `${commitSha}^{commit}`], deadline).toString('ascii').trim();
    if (resolved !== commitSha) throw Error('content-commit-identity-mismatch');
    const treeEntry = runGit(binding, ['ls-tree', '-z', '--full-tree', commitSha, '--', `:(literal)${path}`], deadline, 8192);
    if (!treeEntry.length) {
      const absent = { version: 1, status: 'absent', operation: 'content', repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha, commitSha, path, bindingSha256: digest(binding) };
      if (wireBytes(absent) > 98304) throw Error('content-response-limit');
      return absent;
    }
    const record = treeEntry.subarray(0, treeEntry.length - 1).toString('utf8');
    const tab = record.indexOf('\t');
    if (tab < 0 || Buffer.from(record.slice(tab + 1), 'utf8').compare(Buffer.from(path, 'utf8')) !== 0) throw Error('invalid-tree-entry');
    const [mode, type, object] = record.slice(0, tab).split(' ');
    if (!['100644', '100755'].includes(mode) || type !== 'blob' || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(object)) throw Error('content-entry-type-refused');
    const bytes = runGit(binding, ['cat-file', 'blob', object], deadline, binding.outputBytes + 1);
    if (bytes.length > binding.outputBytes) throw Error('content-output-limit');
    const result = {
      version: 1, status: 'ok', operation: 'content', repository: binding.repository,
      baseSha: binding.baseSha, candidateSha: binding.candidateSha, commitSha, path,
      bindingSha256: digest(binding), contentEncoding: 'base64', contentBytes: bytes.length,
      contentSha256: createHash('sha256').update(bytes).digest('hex'), content: bytes.toString('base64'),
      limits: { timeoutMs: binding.timeoutMs, contentBytes: binding.outputBytes },
    };
    if (wireBytes(result) > 98304) throw Error('content-response-limit');
    return result;
  } catch (error) {
    const reason = error?.message === 'git-output-limit' ? 'content-output-limit' : typeof error?.message === 'string' ? error.message.slice(0, 160) : 'content-refused';
    const result = failure(reason, binding, 'content');
    if (!binding && ownKeys(input, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes', 'paths'])) result.bindingSha256 = digest(input);
    return boundedResult(result, binding?.outputBytes ?? 512);
  }
}

export async function diff(input) {
  let binding;
  try {
    binding = validateDiffBinding(input);
    const bindingSha256 = digest(binding);
    const deadline = Date.now() + binding.timeoutMs;
    await assertSupportedRepository(binding, deadline);
    try { await lstat(join(binding.repository, '.git', 'info', 'attributes')); throw Error('local-attributes-refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const expectedFormat = binding.baseSha.length === 64 ? 'sha256' : 'sha1';
    const objectFormat = runGit(binding, ['rev-parse', '--show-object-format'], deadline).toString('ascii').trim();
    if (objectFormat !== expectedFormat) throw Error('commit-format-mismatch');
    for (const [name, expected] of [['base', binding.baseSha], ['candidate', binding.candidateSha]]) {
      const resolved = runGit(binding, ['rev-parse', '--verify', `${expected}^{commit}`], deadline).toString('ascii').trim();
      if (resolved !== expected) throw Error(`${name}-commit-identity-mismatch`);
    }
    const env = { GIT_INDEX_FILE: process.platform === 'win32' ? 'NUL' : '/dev/null' };
    const patch = runGit(binding, ['--no-pager', `--attr-source=${binding.candidateSha}`, '-c', `core.attributesFile=${process.platform === 'win32' ? 'NUL' : '/dev/null'}`, 'diff', '--no-color', '--no-ext-diff', '--no-textconv', '--binary', '--full-index', binding.baseSha, binding.candidateSha], deadline, binding.outputBytes + 1, env);
    if (patch.length > binding.outputBytes) throw Error('diff-output-limit');
    const result = {
      version: 1, status: 'ok', operation: 'diff', repository: binding.repository,
      baseSha: binding.baseSha, candidateSha: binding.candidateSha, bindingSha256,
      patchEncoding: 'base64', patchBytes: patch.length,
      patchSha256: createHash('sha256').update(patch).digest('hex'), patch: patch.toString('base64'),
      limits: { timeoutMs: binding.timeoutMs, patchBytes: binding.outputBytes },
    };
    if (wireBytes(result) > 262144) throw Error('diff-response-limit');
    return result;
  } catch (error) {
    const reason = error?.message === 'git-output-limit' ? 'diff-output-limit' : typeof error?.message === 'string' ? error.message.slice(0, 160) : 'diff-refused';
    const result = failure(reason, binding, 'diff');
    if (!binding && ownKeys(input, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes'])) result.bindingSha256 = digest(input);
    return boundedResult(result, binding ? 262144 : 512);
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
    return boundedResult(result, binding.outputBytes);
  } catch (error) {
    const result = failure(typeof error?.message === 'string' ? error.message.slice(0, 160) : 'identity-refused', binding);
    if (!binding && ownKeys(input, ['version', 'repository', 'baseSha', 'candidateSha', 'gitExecutable', 'timeoutMs', 'outputBytes'])) result.bindingSha256 = digest(input);
    return boundedResult(result, binding?.outputBytes ?? 512);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const operation = process.argv[2];
    if (!['identity', 'diff', 'content'].includes(operation) || (operation === 'content' ? process.argv.length !== 5 : process.argv.length !== 3)) throw Error('supported-operation-required');
    const chunks = [];
    let size = 0;
    // The operation timeout is unavailable until JSON/EOF arrives, so input has its own fixed deadline.
    const inputDeadline = setTimeout(() => process.stdin.destroy(Error('binding-input-timeout')), 2000);
    try {
      for await (const chunk of process.stdin) {
        size += chunk.length;
        if (size > 16384) throw Error('binding-input-limit');
        chunks.push(chunk);
      }
    } finally {
      clearTimeout(inputDeadline);
    }
    let binding;
    try { binding = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw Error('invalid-binding-json'); }
    const result = operation === 'identity' ? await identity(binding) : operation === 'diff' ? await diff(binding) : await content(binding, process.argv[3], process.argv[4]);
    process.stdout.write(JSON.stringify(result) + '\n');
    if (result.status === 'error') process.exitCode = 2;
  } catch (error) {
    process.stdout.write(JSON.stringify(boundedResult(failure(error.message.slice(0, 160), null, process.argv[2] === 'diff' ? 'diff' : process.argv[2] === 'content' ? 'content' : 'identity'))) + '\n');
    process.exitCode = 2;
  }
}
