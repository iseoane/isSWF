import assert from 'node:assert/strict';
import { dirname, join, resolve, win32 } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const { isWithin } = await import(pathToFileURL(join(source, 'tools/factory-package.mjs')).href);
const within = (parent, child) => isWithin(parent, child, win32);

// The release build must accept an output on another drive and still refuse one inside the source.
assert.equal(within(String.raw`D:\a\isSWF`, String.raw`C:\Users\x\Temp\out`), false);
assert.equal(within(String.raw`C:\Users\x\Temp\out`, String.raw`D:\a\isSWF`), false);
assert.equal(within(String.raw`D:\a\isSWF`, String.raw`D:\a\isSWF\out`), true);
assert.equal(within(String.raw`D:\a\isSWF`, String.raw`D:\a\isSWF`), true);
assert.equal(within(String.raw`D:\a\isSWF`, String.raw`D:\a\other`), false);
assert.equal(within(String.raw`D:\a\isSWF\out`, String.raw`D:\a\isSWF`), false);
console.log('path-within: PASS');
