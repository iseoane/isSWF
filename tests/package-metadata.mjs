import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-metadata-')));
const original = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  return result;
};
const git = (...args) => {
  const result = run('git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
git('init', '-q');
const cases = [
  ['native', () => {}, true],
  ['legacy', manifest => { delete manifest.pi.subagents; }, true],
  ['unknown-agent-path', manifest => { manifest.pi.subagents = { agents: ['./unapproved'] }; }, false],
  ['extra-setting', manifest => { manifest.pi.subagents.enabled = true; }, false],
  ['runtime-dependency', manifest => { manifest.dependencies = { 'pi-subagents': '0.83.0' }; }, false],
];
for (const [name, mutate, accepted] of cases) {
  const manifest = structuredClone(original);
  mutate(manifest);
  await writeFile(join(root, 'package.json'), JSON.stringify(manifest));
  git('add', 'package.json');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', name);
  const sha = git('rev-parse', 'HEAD');
  // A manifest-only repository deliberately stops at the NEXT required payload.
  // This checks the real CLI validation branch, not complete package construction.
  for (const [tool, args, nextGate, refusal] of [
    ['factory-package.mjs', ['materialize', '--source', root, '--revision', sha, '--store', root + '-store'], /Missing regular coordinator skill/u, /no-dependency package contract/u],
    ['build-release.mjs', ['--source', root, '--revision', sha, '--output', root + '-release-' + name, '--runtime', 'node'], /release bin target tools\/isswf\.mjs must be committed/u, /release package contract/u],
  ]) {
    const checked = run(process.execPath, [join(source, 'tools', tool), ...args]);
    assert.notEqual(checked.status, 0, 'The deliberately absent payload cannot be built');
    assert.match(checked.stderr, accepted ? nextGate : refusal, name + ': ' + tool);
  }
}
console.log('PASS both CLI metadata validators admit exact native and legacy manifests; reject unknown paths/settings and production dependencies. Manifest-only fixture, not a package build.');
