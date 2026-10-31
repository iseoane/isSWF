import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const temp = await mkdtemp(join(tmpdir(), 'isswf-host-prerequisites-'));
const deps = join(temp, 'dependencies'), sdk = join(deps, '@earendil-works/pi-coding-agent');
const bundleRoot = join(deps, 'pi-subagents'), bundle = join(bundleRoot, 'bundle/index.js');
const run = (piOnly, hostDeps = deps, piSubagents = bundleRoot) => spawnSync(process.execPath, [join(source, 'tests/host-native-delegation.mjs'), source], {
  cwd: source, encoding: 'utf8', timeout: 20000,
  env: { ...process.env, ISSWF_HOST_DEPS: hostDeps, ISSWF_PI_SUBAGENTS: piSubagents, ISSWF_PI_ONLY: piOnly ? '1' : '0' },
});
const blocked = (result, names) => {
  assert.ifError(result.error);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.status, 'BLOCKED');
  assert.deepEqual(report.missing.map(({ name }) => name), names);
  assert.equal(report.root, undefined, 'No fixture root was created before readiness');
  assert.equal(result.stderr, '');
};
try {
  await mkdir(sdk, { recursive: true });
  await writeFile(join(sdk, 'package.json'), JSON.stringify({ main: 'index.cjs' }));
  await writeFile(join(sdk, 'index.cjs'), 'throw new Error("BROKEN_EXISTING_SDK");\n');
  await mkdir(join(bundleRoot, 'bundle'), { recursive: true });
  await writeFile(bundle, '// Present fixture bundle; not a real host integration.\n');
  blocked(run(true, deps, join(temp, 'absent-bundle')), ['pi-subagents@0.83.0 bundle']);
  blocked(run(true, join(temp, 'absent-sdk'), bundleRoot), ['Pi SDK']);
  blocked(run(false), ['Claude Code executable']);

  const broken = run(true);
  assert.ifError(broken.error);
  assert.equal(broken.status, 1, broken.stdout + broken.stderr);
  assert.match(broken.stdout + broken.stderr, /BROKEN_EXISTING_SDK/u);
  assert.doesNotMatch(broken.stdout, /"status":"BLOCKED"/u, 'Pi-only exempts unused Claude; existing dependency failures remain failures');

  await rm(bundle);
  await mkdir(bundle);
  const invalid = run(true);
  assert.ifError(invalid.error);
  assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
  assert.match(invalid.stderr, /Invalid host prerequisite/u);
  assert.doesNotMatch(invalid.stdout, /"status":"BLOCKED"/u);
  console.log(JSON.stringify({ status: 'PASS', scope: 'injected dependency fixtures only; no real host execution', cases: ['missing bundle', 'missing SDK', 'missing required Claude', 'Pi-only optional Claude', 'broken present SDK stays failure', 'invalid present bundle stays failure'] }));
} finally {
  await rm(temp, { recursive: true, force: true });
}
