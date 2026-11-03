import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, win32 } from 'node:path';

// path.relative() uses the platform separator, so a containment check that compares
// its result with a literal '../' treats every outside path as inside on Windows.
const source = resolve(process.argv[2] ?? '.');
const tools = join(source, 'tools');
const offenders = [];
for (const name of (await readdir(tools)).filter(name => name.endsWith('.mjs')).sort()) {
  const lines = (await readFile(join(tools, name), 'utf8')).split('\n');
  lines.forEach((line, index) => {
    if (/startsWith\(\s*(['"`])\.\.\/\1\s*\)/u.test(line)) offenders.push(`tools/${name}:${index + 1}`);
  });
}
assert.deepEqual(offenders, [], `use '..' + sep instead of '../' after path.relative(): ${offenders.join(', ')}`);

// The separator-aware form rejects an outside Windows path and accepts an inside one.
const inside = (root, path) => { const part = win32.relative(root, path); return part === '' || (part !== '..' && !part.startsWith('..' + win32.sep) && !win32.isAbsolute(part)); };
assert.equal(inside('C:\\work\\project', 'C:\\Users\\me\\AppData\\Local\\Temp\\store'), false);
assert.equal(inside('C:\\work\\project', 'C:\\work\\project\\.factory'), true);
assert.equal(inside('C:\\work\\project', 'C:\\work\\project'), true);
assert.equal(inside('C:\\work\\project', 'D:\\store'), false);
console.log('path containment portability: ok');
