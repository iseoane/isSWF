import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

// Optional installed integration: never use the user's store or inherit cloud/auth configuration.
// Intentionally outside portable aggregate checks: Engram is not a factory dependency.
const binary = process.argv[2];
assert.ok(binary && isAbsolute(binary), 'supply the absolute existing Engram executable');
const executable = await realpath(binary);
const root = await mkdtemp(join(tmpdir(), 'isswf-context-boundary-'));
const observations = [];
try {
  await mkdir(join(root, 'home'));
  await mkdir(join(root, 'data'));
  const env = { PATH: '/usr/bin:/bin', HOME: join(root, 'home'), ENGRAM_DATA_DIR: join(root, 'data'), ENGRAM_PROJECT: 'fixture-foreign', ENGRAM_CLOUD_AUTOSYNC: '0', ENGRAM_NO_UPDATE_CHECK: '1' };
  function run(...args) {
    const result = spawnSync(executable, args, { cwd: root, env, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    observations.push({ args, exitCode: result.status, stdout: result.stdout });
    return result.stdout;
  }
  const version = run('version').trim();
  const own = 'synthetic-current-decision-coral814';
  const foreign = 'synthetic-foreign-decision-violet927';
  run('save', 'Current decision', own, '--project', 'fixture-own', '--scope', 'project');
  run('save', 'Foreign decision', foreign, '--project', 'fixture-foreign', '--scope', 'project');
  // Each CLI invocation is a new process, with an intentionally conflicting default project.
  const recovered = run('search', own, '--project', 'fixture-own', '--scope', 'project');
  assert.ok(recovered.includes(own) && recovered.includes('project: fixture-own'));
  const rejected = run('search', foreign, '--project', 'fixture-own', '--scope', 'project');
  assert.match(rejected, /^No memories found for:/);
  const context = run('context', '--project', 'fixture-own', '--scope', 'project');
  assert.ok(context.includes(own));
  assert.ok(!context.includes(foreign));
  const otherContext = run('context', '--project', 'fixture-foreign', '--scope', 'project');
  assert.ok(otherContext.includes(foreign) && !otherContext.includes(own));
  console.log(JSON.stringify({ status: 'PASS', executable, binarySha256: createHash('sha256').update(await readFile(executable)).digest('hex'), version, observations, checks: ['fresh-process own-project recall', 'explicit project overrides conflicting process default', 'foreign observation absent from scoped search and context', 'reverse separation'], limits: ['Synthetic disposable store, not the user store or MCP transport', 'Project selectors are cooperative selection, not access-control credentials; broad queries remain possible', 'No claim of semantic secret detection, autonomous context selection, real service outage or client-ready isolation'] }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
