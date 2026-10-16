import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function tree(root, directory = '') {
  const files = {};
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const name = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(files, await tree(root, name));
    else {
      const stat = await lstat(join(root, name));
      assert(stat.isFile(), `non-regular project path: ${name}`);
      files[name] = { sha256: hash(await readFile(join(root, name))), mode: stat.mode & 0o777 };
    }
  }
  return files;
}
function checks(root) {
  const args = ['--unshare-user', '--unshare-pid', '--unshare-net', '--unshare-ipc', '--unshare-uts', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/runtime', '--ro-bind', process.execPath, '/runtime/node', '--ro-bind', root, '/work', '--chdir', '/work', '--remount-ro', '/', '--setenv', 'HOME', '/tmp', '--', '/runtime/node', 'check.mjs'];
  const run = spawnSync('/usr/bin/bwrap', args, { cwd: '/', encoding: 'utf8', timeout: 5000, killSignal: 'SIGKILL', maxBuffer: 16384, env: { PATH: '/usr/bin:/bin' } });
  assert(!run.error, 'check invocation must complete within bounds');
  return { exit: run.status, stdout: run.stdout, stderr: run.stderr };
}
const [mode, workspaceInput, checkpointPath, allowedJson] = process.argv.slice(2);
assert(['before', 'after'].includes(mode), 'usage: before|after absolute-workspace checkpoint.json [allowed-paths-JSON]');
assert(isAbsolute(workspaceInput), 'workspace must be absolute');
const workspace = resolve(workspaceInput);
const files = await tree(workspace);
if (mode === 'before') {
  const allowed = JSON.parse(allowedJson);
  assert(Array.isArray(allowed) && allowed.length > 0 && allowed.every(p => typeof p === 'string' && !isAbsolute(p) && !p.split('/').some(part => !part || part === '.' || part === '..')), 'explicit safe allowed paths required');
  const run = checks(workspace);
  assert.equal(run.exit, 1, 'fixture must start failing');
  assert.match(run.stderr, /11 !== 21/, 'baseline failure must be the expected product defect');
  assert(files['check.mjs'], 'original check file required');
  const checkpoint = { workspace, allowed, files, baseline: { exit: run.exit, expected: 21, actual: 11 } };
  await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ status: 'PASS', stage: 'before', fileCount: Object.keys(files).length, baseline: checkpoint.baseline }));
} else {
  const before = JSON.parse(await readFile(checkpointPath, 'utf8'));
  assert.equal(workspace, before.workspace, 'checkpoint must bind the exact workspace');
  const changed = [...new Set([...Object.keys(files), ...Object.keys(before.files)])].filter(p => JSON.stringify(files[p]) !== JSON.stringify(before.files[p])).sort();
  assert(changed.length > 0, 'worker must produce an actual project change');
  assert(changed.every(p => before.allowed.includes(p)), `unauthorized changes: ${changed.filter(p => !before.allowed.includes(p)).join(', ')}`);
  assert.deepEqual(files['check.mjs'], before.files['check.mjs'], 'original checks must remain byte/mode identical');
  const run = checks(workspace);
  assert.equal(run.exit, 0, 'original checks must pass after worker execution');
  assert.equal(run.stdout.trim(), 'PASS two sum and three product assertions');
  console.log(JSON.stringify({ status: 'PASS', stage: 'after', workspace, changed, originalChecksPreserved: true, checkExit: run.exit, observed: run.stdout.trim(), evidence: 'Independent project outcome only, not provider attribution or lifecycle/OS isolation proof.' }));
}
