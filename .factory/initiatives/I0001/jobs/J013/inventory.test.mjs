import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const scanner = fileURLToPath(new URL('./inventory.mjs', import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'isswf-audit-inventory-'));
try {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  fs.mkdirSync(root + '/.audit');
  fs.writeFileSync(root + '/.audit/evidence.json', 'SYNTHETIC_PRIVATE_PAYLOAD_NEVER_READ');
  fs.writeFileSync(root + '/README.md', 'Historical evidence .audit/evidence.json and unresolved .audit/absent.json\n');
  git('init', '-q'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', 'commit', '-qm', 'fixture');
  fs.writeFileSync(root + '/.audit/untracked.txt', 'SYNTHETIC_OTHER_PAYLOAD');
  const guard = root + '/guard.mjs';
  fs.writeFileSync(guard, "import fs from 'node:fs';import path from 'node:path';const old=fs.readFileSync;fs.readFileSync=function(p,...a){if(path.resolve(String(p)).includes('/.audit/'))throw Error('audit payload read');return old.call(this,p,...a)};\n");
  const output = execFileSync(process.execPath, ['--import', guard, scanner], { cwd: root, encoding: 'utf8', timeout: 20000 });
  const result = JSON.parse(output);
  assert.equal(result.counts.tracked, 1);
  assert.equal(result.counts.untracked, 1);
  assert.equal(result.counts.literalEdges, 1);
  assert.equal(result.counts.unresolvedLiteralReferences, 1);
  assert.equal(output.includes('SYNTHETIC_PRIVATE_PAYLOAD_NEVER_READ'), false);
  const artifact = result.artifacts.find(item => item.path === '.audit/evidence.json');
  assert.equal(artifact.literalReferences[0].consumer, 'README.md');
  assert.equal(artifact.role, 'unknown; preserve');
  assert.equal(artifact.reproductionDependencies, 'unknown; preserve');
  assert.equal(fs.readFileSync(root + '/.audit/evidence.json', 'utf8'), 'SYNTHETIC_PRIVATE_PAYLOAD_NEVER_READ');
  console.log('PASS audit metadata fixture: tracked/untracked paths, exact reference, explicit unresolved/unknown roles, forbidden payload reads and unchanged evidence; no deletion policy inferred.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
