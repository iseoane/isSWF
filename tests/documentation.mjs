import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const root = await mkdtemp(join(tmpdir(), 'isswf-documentation-'));
const checker = join(source, 'tooling/quality/check-docs.mjs');
function check(expected) {
  const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  if (!expected) assert.equal(result.status, 0, result.stderr);
  else {
    assert.notEqual(result.status, 0, 'Expected documentation control to fail');
    assert.match(result.stderr, expected);
  }
}
try {
  for (const path of ['docs', '.agents', 'README.md', 'README.es.md', 'GLOSSARY.md', 'GLOSSARY.es.md', 'AGENTS.md']) {
    await cp(join(source, path), join(root, path), { recursive: true });
  }
  await mkdir(join(root, '.factory'));
  for (const path of ['models.json', 'templates']) await cp(join(source, '.factory', path), join(root, '.factory', path), { recursive: true });
  check();
  const mirror = join(root, 'docs/es/future-actions.md');
  const mirrorBytes = await readFile(mirror);
  await rm(mirror);
  check(/English\/Spanish mirrors/u);
  await writeFile(mirror, mirrorBytes);
  const technical = join(root, 'docs/host-portability.md');
  const guide = await readFile(technical);
  await writeFile(technical, Buffer.concat([guide, Buffer.from('\nRun `node .audit/verify-obsolete.mjs`.\n')]));
  check(/Historical procedure in current guide/u);
  await writeFile(technical, guide);
  check();
  console.log('PASS documentation: current links and mirrors, historical-procedure refusal; disposable mutations only, no examples executed');
} finally {
  await rm(root, { recursive: true, force: true });
}
