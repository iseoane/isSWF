import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function content(root, path) {
  try {
    const file = join(root, path), stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 256000) return null;
    return await readFile(file, 'utf8');
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function qualityInventory(root) {
  const packageText = await content(root, 'package.json');
  let pkg;
  try { pkg = packageText === null ? null : JSON.parse(packageText); } catch { pkg = null; }
  const scripts = pkg?.scripts ?? {};
  const definitions = {
    lint: { scripts: ['lint'], files: ['eslint.config.mjs', 'eslint.config.js', '.eslintrc.json', 'tooling/quality/eslint.config.mjs'], recommendation: 'Select a language-appropriate linter and a reproducible command.' },
    tests: { scripts: ['test'], files: ['tools/check-quality.mjs', 'pytest.ini', 'vitest.config.ts', 'jest.config.js'], recommendation: 'Add a minimal behavior test suite and a documented test command.' },
    build: { scripts: ['build', 'typecheck'], files: ['tsconfig.json', 'Makefile', 'Cargo.toml', 'pom.xml'], recommendation: 'Determine whether compilation is applicable; document the build or an explicit not-applicable decision.' },
    deadcode: { scripts: ['deadcode', 'knip'], files: ['knip.json', 'knip.jsonc', 'tooling/quality/knip.json'], recommendation: 'Evaluate a language-appropriate dead-code analyzer; do not remove public entry points without checking consumers.' },
    duplication: { scripts: ['duplication', 'jscpd'], files: ['.jscpd.json', 'jscpd.json'], recommendation: 'Review repeated logic; add a clone detector only if its maintenance cost is justified.' },
  };
  const checks = {};
  for (const [name, definition] of Object.entries(definitions)) {
    const evidence = [];
    for (const key of definition.scripts) if (typeof scripts[key] === 'string') evidence.push(`package.json#scripts.${key}`);
    for (const path of definition.files) if (await content(root, path) !== null) evidence.push(path);
    checks[name] = { state: evidence.length ? 'configured-unverified' : 'not-detected', evidence, recommendation: evidence.length ? 'Verify the documented command and its result before reporting a pass.' : definition.recommendation };
  }
  return { checks, limits: 'Bounded file/script discovery only, not execution or exhaustive language detection. Missing evidence is not a pass or proof of absence. Build not-applicable requires an explicit project decision. No installation or script execution.' };
}
