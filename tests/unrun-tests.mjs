import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const module = await import(pathToFileURL(join(source, 'tooling/quality/unrun-tests.mjs')).href).catch(() => ({}));
assert.equal(typeof module.unrunTests, 'function', 'tooling/quality/unrun-tests.mjs must export unrunTests');
const { unrunTests } = module;

const root = await mkdtemp(join(tmpdir(), 'unrun-tests-'));
try {
  await mkdir(join(root, 'tests/support'), { recursive: true });
  await mkdir(join(root, 'tools'));
  await mkdir(join(root, '.github/workflows'), { recursive: true });
  await writeFile(join(root, 'tools/check-quality.mjs'), "run('tests/by-quality.mjs');\n");
  await writeFile(join(root, '.github/workflows/ci.yml'), 'run: node tests/by-ci.mjs .\n');
  await writeFile(join(root, 'tests/by-quality.mjs'), "import './imported.mjs';\nspawn(join(root, 'tests/spawned.mjs'));\n");
  await writeFile(join(root, 'tests/spawned.mjs'), '');
  await writeFile(join(root, 'tests/by-ci.mjs'), '');
  await writeFile(join(root, 'tests/imported.mjs'), '');
  await writeFile(join(root, 'tests/orphan.mjs'), '');
  await writeFile(join(root, 'tests/exempt.mjs'), '');
  await writeFile(join(root, 'tests/support/helper.mjs'), '');
  assert.deepEqual(await unrunTests(root, { 'exempt.mjs': 'needs an external tool' }), ['orphan.mjs']);
  await rm(join(root, 'tests/orphan.mjs'));
  assert.deepEqual(await unrunTests(root, { 'exempt.mjs': 'needs an external tool' }), []);
  await assert.rejects(unrunTests(root, { 'exempt.mjs': '' }), /reason/u);
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log('unrun-tests: PASS');
