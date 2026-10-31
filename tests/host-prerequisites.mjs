import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '..');
const temp = await mkdtemp(join(tmpdir(), 'isswf-host-prerequisites-'));
const missingBundle = join(temp, 'absent-pi-subagents');
const deps = resolve(source, 'tooling/host-tests/node_modules');
const minimalDeps = join(temp, 'minimal-dependencies');
const run = (piOnly, hostDeps, piSubagents) => spawnSync(process.execPath, [join(source, 'tests/host-native-delegation.mjs'), source], {
  cwd: source, encoding: 'utf8', timeout: 5000, env: { ...process.env, ISSWF_HOST_DEPS: hostDeps, ISSWF_PI_SUBAGENTS: piSubagents, ISSWF_PI_ONLY: piOnly ? '1' : '0' },
});
try {
  await mkdir(join(minimalDeps, '@earendil-works'), { recursive: true });
  await symlink(resolve(deps, '@earendil-works/pi-coding-agent'), join(minimalDeps, '@earendil-works/pi-coding-agent'), 'junction');
  await symlink(resolve(deps, 'pi-subagents'), join(minimalDeps, 'pi-subagents'), 'junction');
  const absentBundle = run(true, deps, missingBundle);
  assert.equal(absentBundle.status, 2, absentBundle.stdout + absentBundle.stderr);
  const blocked = JSON.parse(absentBundle.stdout.trim());
  assert.equal(blocked.status, 'BLOCKED');
  assert.deepEqual(blocked.missing, ['pi-subagents@0.83.0']);
  assert.doesNotMatch(absentBundle.stderr, /Error/u);

  const unusedClaude = run(true, minimalDeps, resolve(deps, 'pi-subagents'));
  assert.notEqual(unusedClaude.status, 2, 'Pi-only must not require Claude');

  const absentClaude = run(false, minimalDeps, resolve(deps, 'pi-subagents'));
  assert.equal(absentClaude.status, 2, absentClaude.stdout + absentClaude.stderr);
  const claudeBlocked = JSON.parse(absentClaude.stdout.trim());
  assert.equal(claudeBlocked.status, 'BLOCKED');
  assert.deepEqual(claudeBlocked.missing, ['claude-code executable']);
  console.log(JSON.stringify({ status: 'PASS', cases: ['missing bundle is blocked before fixtures', 'Pi-only exempts Claude', 'missing required Claude executable is blocked'] }));
} finally {
  await rm(temp, { recursive: true, force: true });
}
