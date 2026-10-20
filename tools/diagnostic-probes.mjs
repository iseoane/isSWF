import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, realpath, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const sourceObjectsPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.git/objects');

const git = (project, args, deadlineAt) => {
  const timeout = Math.min(10000, deadlineAt - Date.now()); assert(timeout > 0, 'diagnostic-probe-deadline');
  const run = spawnSync('git', ['-C', project, '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...args], { encoding: 'utf8', timeout, maxBuffer: 256000, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' } });
  assert(!run.error && run.status === 0 && Date.now() < deadlineAt, 'diagnostic-target-unavailable'); return run.stdout.trim();
};
export function validateProbes(probes) {
  assert(Array.isArray(probes) && probes.length > 0 && probes.length <= 3, 'one-to-three-explicit-probes-required');
  const names = new Set();
  for (const probe of probes) {
    assert(probe && Object.keys(probe).sort().join(',') === 'command,expectedExitCode,name' && typeof probe.name === 'string' && /^[a-z][a-z0-9-]{0,63}$/u.test(probe.name) && !names.has(probe.name), 'unique-probe-name-required');
    names.add(probe.name);
    assert(typeof probe.command === 'string' && probe.command.trim() && Buffer.byteLength(probe.command) <= 2000 && !/[\x00-\x1f\x7f]/u.test(probe.command) && Number.isInteger(probe.expectedExitCode) && probe.expectedExitCode >= 0 && probe.expectedExitCode <= 255, 'bounded-probe-command-required');
  }
}
// Optional original evidence is operator-selected, not a model-selected host mount.
export async function evidenceDigest(path, deadlineAt = Date.now() + 10000) {
  assert(Number.isFinite(deadlineAt), 'finite-evidence-deadline-required');
  assert(typeof path === 'string' && (path === sourceObjectsPath || /^\/(?:var\/)?tmp\/[^/]+(?:\/[^/]+)*$/u.test(path)) && await realpath(path) === path, 'canonical-temporary-evidence-root-required');
  const digest = createHash('sha256'); let entries = 0, bytes = 0;
  async function visit(current, relative) {
    assert(Date.now() < deadlineAt && ++entries <= 4096, 'evidence-bound-or-deadline');
    const stat = await lstat(current);
    assert(!stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), 'regular-evidence-required');
    digest.update(JSON.stringify([relative, stat.isDirectory() ? 'directory' : 'file', stat.mode & 0o777]));
    if (stat.isDirectory()) {
      for (const name of (await readdir(current)).sort()) await visit(join(current, name), relative + '/' + name);
    } else {
      assert(stat.nlink === 1, 'single-link-evidence-required');
      bytes += stat.size; assert(bytes <= 64 * 1024 * 1024, 'evidence-byte-bound');
      const content = await readFile(current, { signal: AbortSignal.timeout(Math.max(1, Math.ceil(deadlineAt - Date.now()))) }); assert(content.length === stat.size, 'evidence-changed');
      digest.update(JSON.stringify([content.length, createHash('sha256').update(content).digest('hex')]));
    }
  }
  await visit(path, ''); assert(Date.now() < deadlineAt, 'evidence-bound-or-deadline'); return digest.digest('hex');
}
export async function runDiagnosticProbes({ targetRepo, targetBase, probes, deadlineAt, evidence }) {
  validateProbes(probes);
  assert(isAbsolute(targetRepo ?? '') && /^[a-f0-9]{40}$/u.test(targetBase) && Number.isFinite(deadlineAt), 'explicit-probe-target-required');
  targetRepo = await realpath(targetRepo);
  const metadata = await lstat(join(targetRepo, '.git')); assert(metadata.isDirectory() && !metadata.isSymbolicLink(), 'standalone-git-root-required');
  const unchanged = () => { assert(git(targetRepo, ['rev-parse', '--show-toplevel'], deadlineAt) === targetRepo && git(targetRepo, ['rev-parse', 'HEAD'], deadlineAt) === targetBase && git(targetRepo, ['status', '--porcelain=v1', '--untracked-files=all'], deadlineAt) === '', 'clean-pinned-diagnostic-target-required'); };
  unchanged();
  const checkEvidence = async () => {
    if (evidence === undefined) return;
    assert(evidence && ['path,sha256', 'path,sha256,sourceObjectsSha256'].includes(Object.keys(evidence).sort().join(',')) && /^[a-f0-9]{64}$/u.test(evidence.sha256), 'explicit-evidence-pin-required');
    assert(!targetRepo.startsWith(evidence.path + '/') && !evidence.path.startsWith(targetRepo + '/') && evidence.path !== targetRepo, 'separate-evidence-root-required');
    assert(evidence.path !== sourceObjectsPath && await evidenceDigest(evidence.path, deadlineAt) === evidence.sha256, 'evidence-pin-mismatch');
    if (evidence.sourceObjectsSha256 !== undefined) assert(/^[a-f0-9]{64}$/u.test(evidence.sourceObjectsSha256) && await evidenceDigest(sourceObjectsPath, deadlineAt) === evidence.sourceObjectsSha256, 'source-object-pin-mismatch');
  };
  await checkEvidence();
  const results = [], node = await realpath(process.execPath);
  for (const probe of probes) {
    const timeout = Math.min(10000, deadlineAt - Date.now()); assert(timeout > 0, 'diagnostic-probe-deadline');
    const args = ['--unshare-all', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/tmp/home', '--ro-bind', node, '/runtime/node', '--ro-bind', targetRepo, '/work', '--tmpfs', '/work/.git', '--chdir', '/work', ...(evidence ? ['--ro-bind', evidence.path, evidence.path, ...(evidence.sourceObjectsSha256 ? ['--ro-bind', sourceObjectsPath, sourceObjectsPath] : [])] : []), '--remount-ro', '/', '--setenv', 'PATH', '/runtime:/usr/bin:/bin', '--setenv', 'HOME', '/tmp/home', '--setenv', 'LANG', 'C.UTF-8', '/bin/sh', '-c', "printf 'ISSWF_PROBE_STARTED\\n'; " + probe.command];
    const run = spawnSync('bwrap', args, { timeout, maxBuffer: 8192, env: { PATH: '/usr/bin:/bin' }, stdio: ['ignore', 'pipe', 'pipe'] });
    assert(!run.error && run.signal === null && Number.isInteger(run.status) && Date.now() < deadlineAt, 'diagnostic-probe-incomplete-no-model');
    assert(run.stdout.length + run.stderr.length <= 8192, 'diagnostic-probe-output-bound');
    const decode = data => new TextDecoder('utf-8', { fatal: true }).decode(data);
    const stdout = decode(run.stdout), stderr = decode(run.stderr), marker = 'ISSWF_PROBE_STARTED\n';
    assert(stdout.startsWith(marker), 'diagnostic-sandbox-unavailable-no-model');
    unchanged(); await checkEvidence();
    results.push({ name: probe.name, command: probe.command, expectedExitCode: probe.expectedExitCode, exitCode: run.status, expectationMatched: run.status === probe.expectedExitCode, stdout: stdout.slice(marker.length), stderr, targetBase, surface: 'host-selected command in read-only pinned clean project; isolated network/home/Git metadata' });
  }
  return results;
}
