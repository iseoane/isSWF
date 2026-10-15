import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import vm from 'node:vm';

const source = process.argv[2];
assert.ok(source, 'Supply the exact installer source path');
const bytes = readFileSync(source);
const text = bytes.toString('utf8');
const start = text.indexOf('async function canonicalPath(');
const end = text.indexOf('\nfunction assertSeparateTrees(', start);
assert.ok(start >= 0 && end > start, 'Expected the reviewed canonical path helper');
const helper = text.slice(start, end);
const canonical = vm.runInNewContext('(' + helper + ')', {
  resolve, dirname, relative,
  realpath: async path => {
    if (path === '/') return '/';
    throw Object.assign(new Error('synthetic missing path'), { code: 'ENOENT' });
  },
}, { timeout: 1000 });
const cases = [];
for (const supplied of ['/fresh-store', '/fresh/store', '/a/b/c']) {
  const actual = await canonical(supplied);
  cases.push({ supplied, expected: supplied, actual, matches: supplied === actual });
}
console.log(JSON.stringify({ result: cases.every(item => item.matches) ? 'PASS' : 'FAIL', source, sha256: createHash('sha256').update(bytes).digest('hex'), cases, scope: 'Exact frozen/source helper unit with synthetic filesystem where only root exists. No actual filesystem canonicalization, root write, isolation or full CLI proof.' }, null, 2));
if (cases.some(item => !item.matches)) process.exitCode = 1;
