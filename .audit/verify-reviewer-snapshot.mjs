import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.audit/reviewer-snapshot');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.match(manifest.base, /^[a-f0-9]{40}$/u);
const patch = await readFile(join(root, 'candidate.diff'));
assert.equal(sha(patch), manifest.diffSha256);
const sorted = [...manifest.files].sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
assert.deepEqual(manifest.files, sorted);
assert.equal(new Set(sorted.map(file => file.path)).size, sorted.length);
const fields = [manifest.base, manifest.diffSha256];
for (const file of sorted) {
  assert.equal(file.path.startsWith('/'), false);
  assert.equal(file.path.split('/').some(part => ['', '.', '..'].includes(part)), false);
  assert.match(file.mode, /^100(?:644|755)$/u);
  const path = join(root, 'payload', file.path);
  const stat = await lstat(path);
  assert.equal(stat.isFile() && !stat.isSymbolicLink(), true);
  assert.equal(stat.mode & 0o111 ? '100755' : '100644', file.mode);
  assert.equal(sha(await readFile(path)), file.sha256);
  fields.push(file.path, file.mode, file.sha256);
}
assert.equal(sha(Buffer.from(fields.map(field => `${field}\0`).join(''))), manifest.snapshot);
console.log(JSON.stringify({ snapshot: manifest.snapshot, base: manifest.base, files: sorted.map(file => file.path), scope: 'Owned regular-file review fixture only. Validates stored bytes and digest, not provenance, authenticity, behavior or sandbox.' }, null, 2));
