import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

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
export async function runDiagnosticProbes({ targetRepo, targetBase, probes, deadlineAt }) {
  validateProbes(probes);
  assert(isAbsolute(targetRepo ?? '') && /^[a-f0-9]{40}$/u.test(targetBase) && Number.isFinite(deadlineAt), 'explicit-probe-target-required');
  targetRepo = await realpath(targetRepo);
  const metadata = await lstat(join(targetRepo, '.git')); assert(metadata.isDirectory() && !metadata.isSymbolicLink(), 'standalone-git-root-required');
  const unchanged = () => { assert(git(targetRepo, ['rev-parse', '--show-toplevel'], deadlineAt) === targetRepo && git(targetRepo, ['rev-parse', 'HEAD'], deadlineAt) === targetBase && git(targetRepo, ['status', '--porcelain=v1', '--untracked-files=all'], deadlineAt) === '', 'clean-pinned-diagnostic-target-required'); };
  unchanged();
  const results = [], node = await realpath(process.execPath);
  for (const probe of probes) {
    const timeout = Math.min(10000, deadlineAt - Date.now()); assert(timeout > 0, 'diagnostic-probe-deadline');
    const args = ['--unshare-all', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/tmp/home', '--ro-bind', node, '/runtime/node', '--ro-bind', targetRepo, '/work', '--tmpfs', '/work/.git', '--chdir', '/work', '--remount-ro', '/', '--setenv', 'PATH', '/runtime:/usr/bin:/bin', '--setenv', 'HOME', '/tmp/home', '--setenv', 'LANG', 'C.UTF-8', '/bin/sh', '-c', "printf 'ISSWF_PROBE_STARTED\\n'; " + probe.command];
    const run = spawnSync('bwrap', args, { timeout, maxBuffer: 8192, env: { PATH: '/usr/bin:/bin' }, stdio: ['ignore', 'pipe', 'pipe'] });
    assert(!run.error && run.signal === null && Number.isInteger(run.status) && Date.now() < deadlineAt, 'diagnostic-probe-incomplete-no-model');
    assert(run.stdout.length + run.stderr.length <= 8192, 'diagnostic-probe-output-bound');
    const decode = data => new TextDecoder('utf-8', { fatal: true }).decode(data);
    const stdout = decode(run.stdout), stderr = decode(run.stderr), marker = 'ISSWF_PROBE_STARTED\n';
    assert(stdout.startsWith(marker), 'diagnostic-sandbox-unavailable-no-model');
    unchanged();
    results.push({ name: probe.name, command: probe.command, expectedExitCode: probe.expectedExitCode, exitCode: run.status, expectationMatched: run.status === probe.expectedExitCode, stdout: stdout.slice(marker.length), stderr, targetBase, surface: 'host-selected command in read-only pinned clean project; isolated network/home/Git metadata' });
  }
  return results;
}
