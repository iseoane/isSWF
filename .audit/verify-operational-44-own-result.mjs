#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';

const fixture = JSON.parse(await readFile(process.argv[2], 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (exe, args) => spawnSync(exe, args, { encoding: 'buffer', timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
const cli = run(process.execPath, [join(fixture.source, 'tools/isswf-job.mjs'), 'read', '--runs-store', fixture.runsStore, '--attempt-id', fixture.attemptId]);
assert.equal(cli.status, 0, cli.stderr?.toString());
const observation = JSON.parse(cli.stdout);
assert.equal(observation.state, 'terminal');
assert.equal(observation.terminal.outcome, 'success');
assert.equal(observation.reviewRequired, true);
const attempt = join(fixture.runsStore, fixture.attemptId), workspace = join(attempt, 'workspace');
const task = JSON.parse(await readFile(join(attempt, 'pi-result.json'), 'utf8'));
assert.equal(task.mode, 'real');
assert.equal(task.providerPromptStarted, true);
assert.equal(task.provider, 'openai-codex');
assert.equal(task.model, 'gpt-6-luna');
assert.equal(task.effort, 'high');
assert.equal(task.status, 'completed');
assert.equal(task.acceptance, true);
assert.equal(task.boundaryCallAttributed, true);
assert.equal(task.protectedHashesPreserved, true);
assert.equal(task.checkExitCode, 0);
assert.ok(task.toolCalls > 0 && task.toolCalls <= 12);
assert.deepEqual(task.mutablePaths, ['tools/isswf-job.mjs']);
assert.equal(observation.job.runtimeSha, fixture.runtimeSha);
assert.equal(observation.job.inputSha, fixture.inputSha);
assert.equal(observation.job.targetBase, fixture.targetBase);
assert.equal(observation.job.taskSha256, hash(await readFile(join(attempt, 'task.mjs'))));
const tree = run('git', ['-C', fixture.project, 'ls-tree', '-r', '-z', fixture.targetBase]);
assert.equal(tree.status, 0);
const originals = {};
for (const entry of tree.stdout.toString().split('\0').filter(Boolean)) {
  const tab = entry.indexOf('\t'), [mode, type, oid] = entry.slice(0, tab).split(' '), path = entry.slice(tab + 1);
  if (type !== 'blob' || !['100644', '100755'].includes(mode)) continue;
  const blob = run('git', ['-C', fixture.project, 'cat-file', 'blob', oid]);
  assert.equal(blob.status, 0);
  originals[path] = hash(blob.stdout);
}
const current = {};
async function walk(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name, absolute = join(dir, entry.name);
    if (entry.isDirectory()) await walk(absolute, path + '/');
    else { assert.equal((await lstat(absolute)).isFile(), true, 'no unexpected symlinks or special files'); current[path] = hash(await readFile(absolute)); }
  }
}
await walk(workspace);
assert.deepEqual(Object.keys(current).sort(), Object.keys(originals).sort());
const changed = Object.keys(originals).filter(path => originals[path] !== current[path]);
assert.deepEqual(changed, ['tools/isswf-job.mjs']);
const bwrap = run('/usr/bin/bwrap', ['--unshare-all', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--ro-bind', process.execPath, '/runtime/node', '--ro-bind', workspace, '/work', '--chdir', '/work', '--remount-ro', '/', '--setenv', 'PATH', '/runtime:/usr/bin:/bin', '--setenv', 'HOME', '/tmp', '--', '/runtime/node', '.factory/jobs/J802/check.mjs']);
assert.equal(bwrap.status, 0, bwrap.stderr?.toString());
assert.equal(bwrap.stdout.toString().trim(), '3 original operational CLI checks passed');
for (const [path, digest] of Object.entries(fixture.protectedHashes)) assert.equal(hash(await readFile(join(fixture.project, path))), digest);
const checkPath = '.factory/jobs/J802/check.mjs';
assert.equal(current[checkPath], originals[checkPath]);
console.log(JSON.stringify({ status: 'PASS', runtimeSha: fixture.runtimeSha, inputSha: fixture.inputSha, targetBase: fixture.targetBase, workspace, toolCalls: task.toolCalls, route: { provider: task.provider, model: task.model, effort: task.effort }, trustedBoundaryAttributed: true, changed, candidateSha256: current['tools/isswf-job.mjs'], originalCheckSha256: originals[checkPath], originalChecks: 3, parentSandboxCheckExit: bwrap.status, jobBindingCorrelated: true, reviewRequired: true, preservedFiles: Object.keys(originals).length - 1 }, null, 2));
