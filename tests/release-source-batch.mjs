import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? '.');
const { readReleaseSources, readReleaseSource } = await import(pathToFileURL(join(source, 'tools/release-source.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-source-batch-')), sha = '1'.repeat(40);
const digest = b => createHash('sha256').update(b).digest('hex');
const oid = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const payloads = { 'one.txt': Buffer.from('first pinned source\n'), 'nested/two.txt': Buffer.from('second pinned source\n'), 'guard.bin': Buffer.from('Unrelated inventory must still be verified') };
await mkdir(join(root, 'nested'));
for (const [path, bytes] of Object.entries(payloads)) await writeFile(join(root, path), bytes);
const paths = ['one.txt', 'nested/two.txt'];
const receipt = { format: 1, version: '1.0.0', revision: sha, methodologySha: sha, files: Object.fromEntries(Object.entries(payloads).map(([p,b]) => [p,digest(b)])), sources: { [sha]: Object.fromEntries(paths.map(p => [p,{ file:p,sha256:digest(payloads[p]),oid:oid(payloads[p]) }])) } };
const receiptPath = join(root, '.isswf-release.json');
await writeFile(receiptPath, JSON.stringify(receipt));
const originalRead = fs.readFileSync;
let guardReads = 0;
fs.readFileSync = (path, ...args) => { if (String(path) === join(root, 'guard.bin')) guardReads++; return originalRead(path, ...args); };
syncBuiltinESMExports();
try {
  const result = readReleaseSources(root, sha, paths);
  for (const path of paths) assert.deepEqual(result[path], payloads[path]);
  assert.equal(guardReads, 1, 'One batch must not rehash unrelated inventory for every selected file');
  assert.deepEqual(readReleaseSource(root, sha, 'one.txt'), payloads['one.txt']);
  for (const path of ['../secret', '/absolute', 'bad\\path', '', null]) assert.throws(() => readReleaseSources(root, sha, [path]), /invalid release source pin\/path/u);
  for (const paths of [[], null, 'one.txt']) assert.throws(() => readReleaseSources(root, sha, paths), /invalid release source pin\/path/u);
  for (const path of ['missing.txt', 'toString', '__proto__']) assert.throws(() => readReleaseSources(root, sha, [path]), /Pinned release source is missing/u);
  assert.throws(() => readReleaseSources(root, '2'.repeat(40), paths), /Pinned release source is missing/u);
  // Inject a different selected read after whole-inventory verification: its bytes
  // must still match the pin, rather than inheriting the earlier verification.
  const countingRead = fs.readFileSync;
  let selectedReads = 0;
  fs.readFileSync = (path, ...args) => {
    const bytes = countingRead(path, ...args);
    return String(path) === join(root, 'one.txt') && ++selectedReads === 2 ? Buffer.from('changed after inventory verification') : bytes;
  };
  syncBuiltinESMExports();
  try { assert.throws(() => readReleaseSources(root, sha, paths), /Release source payload mismatch/u); }
  finally { fs.readFileSync = countingRead; syncBuiltinESMExports(); }
  await writeFile(join(root, 'guard.bin'), 'unrelated corruption');
  assert.throws(() => readReleaseSources(root, sha, paths), /Release file hash mismatch/u, 'No stale success may survive corruption between calls');
  await writeFile(join(root, 'guard.bin'), payloads['guard.bin']);
  const altered = Buffer.from('self-consistent digest but wrong pinned Git object');
  await writeFile(join(root, 'one.txt'), altered);
  const changed = structuredClone(receipt); changed.files['one.txt'] = digest(altered); changed.sources[sha]['one.txt'].sha256 = digest(altered);
  await writeFile(receiptPath, JSON.stringify(changed));
  assert.throws(() => readReleaseSources(root, sha, paths), /Release source payload mismatch/u, 'Pinned Git oid must remain enforced');
  await writeFile(join(root, 'one.txt'), payloads['one.txt']); await writeFile(receiptPath, JSON.stringify(receipt));
  assert.deepEqual(readReleaseSources(root, sha, paths)['one.txt'], payloads['one.txt']);
  await writeFile(receiptPath, '{not-json');
  assert.throws(() => readReleaseSources(root, sha, paths), /Malformed release receipt/u);
  assert.throws(() => readReleaseSource(root, sha, paths[0]), /Malformed release receipt/u);
  await writeFile(receiptPath, JSON.stringify(receipt));
  const checkout = await mkdtemp(join(tmpdir(), 'isswf-no-receipt-'));
  assert.equal(readReleaseSources(checkout, sha, paths), null); assert.equal(readReleaseSource(checkout, sha, paths[0]), null);
} finally { fs.readFileSync = originalRead; syncBuiltinESMExports(); }
console.log('PASS batch pinned bytes, singleton/null compatibility, unsafe/missing pins, whole-inventory and Git-oid tamper refusal; fresh verification without persistent cache');
