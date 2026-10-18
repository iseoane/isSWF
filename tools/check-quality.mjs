import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPackage } from './factory-package.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
function run(binary, args) {
  const result = spawnSync(binary, args, {
    cwd: source, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result.stdout.trim();
}
async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name)));
    else if (entry.isFile()) files.push(join(directory, entry.name));
  }
  return files;
}
const syntaxFiles = (await Promise.all(['tools', 'tests'].map(path => filesUnder(join(source, path)))))
  .flat().filter(path => path.endsWith('.mjs')).sort();
for (const path of syntaxFiles) run(process.execPath, ['--check', path]);
const markdownFiles = (await filesUnder(join(source, '.agents'))).filter(path => path.endsWith('.md'));
let checkedLinks = 0;
for (const path of markdownFiles) {
  const text = await readFile(path, 'utf8');
  assert.equal(/[\t ]+$/mu.test(text), false, `trailing whitespace: ${path}`);
  if (basename(path) === 'SKILL.md') {
    assert.match(text, /^---\nname: [a-z0-9-]+\ndescription: .+\n(?:disable-model-invocation: (?:true|false)\n)?---\n/u, path);
    assert.equal(text.match(/^name: (.+)$/mu)?.[1], basename(dirname(path)));
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const link = match[1];
    if (/^[a-z]+:/iu.test(link) || link.startsWith('#')) continue;
    await readFile(resolve(dirname(path), link.split('#')[0]));
    checkedLinks++;
  }
}
const revision = run('git', ['rev-parse', 'HEAD']);
const store = await mkdtemp(join(tmpdir(), 'isswf-quality-package-'));
try {
  run(process.execPath, [join(source, 'tools/factory-package.mjs'), 'materialize', '--source', source, '--revision', revision, '--store', store]);
  await verifyPackage(join(store, revision), revision);
} finally {
  await rm(store, { recursive: true, force: true });
}
const statusResult = run(process.execPath, [join(source, 'tests/initiative-status.mjs'), source]);
const panelResult = run(process.execPath, [join(source, 'tests/initiative-panel.mjs'), source]);
const plannerResult = run(process.execPath, [join(source, 'tests/planner-task.mjs'), source]);
const reviewerResult = run(process.execPath, [join(source, 'tests/reviewer-task.mjs'), source]);
const planResult = run(process.execPath, [join(source, 'tests/initiative-plan.mjs'), source]);
const inventoryResult = run(process.execPath, [join(source, 'tests/project-quality.mjs'), source]);
const intakeResult = run(process.execPath, [join(source, 'tests/issue-intake.mjs'), source]);
const methodologyResult = run(process.execPath, [join(source, 'tests/worker-methodology.mjs'), source]);
const routeResult = run(process.execPath, [join(source, 'tests/worker-route-admission.mjs'), source]);
const sessionResult = run(process.execPath, [join(source, 'tests/researcher-session-affinity.mjs'), source]);
const quotaResult = run(process.execPath, [join(source, 'tests/researcher-quota-fallback.mjs'), source]);
console.log(JSON.stringify({ status: 'PASS', statusResult, panelResult, plannerResult, reviewerResult, planResult, inventoryResult, intakeResult, methodologyResult, sessionResult, quotaResult, revision, syntaxFiles: syntaxFiles.length, markdownFiles: markdownFiles.length, checkedLinks, package: 'materialized committed HEAD and verified receipt/payload', routeResult, limits: 'No lint or dead-code analyzer. No native Pi catalog, SDK, provider, bwrap, Python or external-service checks.' }, null, 2));
