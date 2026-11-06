import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Local entry for the host checks that CI runs outside tools/check-quality.mjs.
// It never installs dependencies or creates the platform output; a missing prerequisite is an explicit SKIPPED.
const source = resolve(process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '../..'));
const platformRoot = process.env.ISSWF_PLATFORM_ROOT && resolve(process.env.ISSWF_PLATFORM_ROOT);

const checks = [
  { name: 'tests/host-prerequisites.mjs', missing: () => null },
  {
    name: 'tests/source-host-isolation.mjs',
    missing: () => {
      if (!existsSync(join(source, 'tooling/host-tests/node_modules'))) return 'tooling/host-tests dependencies are not installed (npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund)';
      if (!platformRoot) return 'ISSWF_PLATFORM_ROOT is not set';
      if (!existsSync(join(platformRoot, 'platform-report.json'))) return `no platform-report.json in ISSWF_PLATFORM_ROOT (${platformRoot}); run tests/platform-package.mjs first`;
      if (existsSync(join(platformRoot, 'source-isolation'))) return `${join(platformRoot, 'source-isolation')} already exists; use a fresh platform-package output`;
      return null;
    },
  },
];

let failed = false;
for (const check of checks) {
  const reason = check.missing();
  if (reason) { console.log(`SKIPPED ${check.name}: ${reason}`); continue; }
  const result = spawnSync(process.execPath, [join(source, check.name), source], { cwd: source, stdio: 'inherit', env: process.env });
  const passed = !result.error && result.status === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${check.name}`);
  failed ||= !passed;
}
process.exitCode = failed ? 1 : 0;
