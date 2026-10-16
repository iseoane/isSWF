import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const revision = process.argv[2];
assert.match(revision ?? '', /^[0-9a-f]{40}$/u);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (bin, args, timeout = 60000) => {
  const r = spawnSync(bin, args, { encoding: 'utf8', timeout, maxBuffer: 2000000 });
  assert.equal(r.error, undefined, r.error?.message);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};
const manifest = JSON.parse(await readFile('.audit/lifecycle-44-snapshot-v3/manifest.json', 'utf8'));
for (const file of manifest.files) assert.equal(sha(await readFile(file.path)), file.sha256);
for (const file of ['tools/worker-lifecycle.mjs', 'docs/local-worker-lifecycle.md']) {
  const committed = run('git', ['show', `${revision}:${file}`]);
  assert.equal(sha(Buffer.from(committed)), sha(await readFile(file)));
}
const cli = resolve('tools/worker-lifecycle.mjs');
const fixturePath = resolve('.audit/lifecycle-44-fixture.json');
const verifier = JSON.parse(run(process.execPath, ['.audit/verify-lifecycle-44.mjs', fixturePath]));
assert.equal(verifier.result, 'PASS');
const regressions = JSON.parse(run(process.execPath, ['.audit/verify-lifecycle-44-regressions.mjs', cli]));
assert.equal(regressions.allPassed, true);
const binary = JSON.parse(run(process.execPath, ['.audit/verify-lifecycle-44-binary.mjs', cli]));
assert.equal(binary.passed, true);
const pi = JSON.parse(run(process.execPath, ['.audit/verify-lifecycle-44-pi-teardown.mjs', cli]));
assert.equal(pi.result, 'PASS');
assert.equal(pi.executableSha256, sha(await readFile(cli)));
assert.equal(pi.providerPromptStarted, false);
console.log(JSON.stringify({ result: 'PASS', revision, executableSha256: pi.executableSha256, frozenSnapshot: manifest.snapshot, verifier, regressions, binary, pi, scope: 'Actual committed source and frozen four-file packet binding with parent-run deterministic process checks and isolated offline Pi RPC teardown. No provider prompt, native model adapter, hostile-task isolation, recovery of arbitrary effects, broad44 completion or client readiness.' }, null, 2));
