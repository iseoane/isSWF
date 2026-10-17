import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { qualityInventory } = await import(pathToFileURL(join(resolve(process.argv[2] || '.'), 'tools/project-quality.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-inventory-'));
try {
  const absent = await qualityInventory(root);
  for (const check of Object.values(absent.checks)) { assert.equal(check.state, 'not-detected'); assert.ok(check.recommendation); }
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { lint: 'touch SHOULD_NOT_RUN', test: 'exit 99', build: 'exit 99', jscpd: 'exit 99' } }));
  await mkdir(join(root, 'tooling/quality'), { recursive: true }); await writeFile(join(root, 'tooling/quality/knip.json'), '{}');
  const configured = await qualityInventory(root);
  for (const check of Object.values(configured.checks)) assert.equal(check.state, 'configured-unverified');
  assert.deepEqual(configured.checks.lint.evidence, ['package.json#scripts.lint']);
  assert.deepEqual(configured.checks.deadcode.evidence, ['tooling/quality/knip.json']);
  await writeFile(join(root, 'package.json'), 'not JSON');
  assert.equal((await qualityInventory(root)).checks.build.state, 'not-detected');
  console.log('PASS: five quality controls discovered without executing scripts, absent controls recommend bounded next steps and never become PASS');
} finally { await rm(root, { recursive: true, force: true }); }
