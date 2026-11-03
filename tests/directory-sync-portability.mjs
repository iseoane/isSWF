import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Windows refuses fsync on directory handles with EPERM. A directory sync must either
// skip win32 explicitly or tolerate exactly win32 EPERM; any other error must still throw.
const source = resolve(process.argv[2] ?? '.');
const offenders = [];
for (const directory of ['tools', 'tooling/maintenance']) {
  for (const name of (await readdir(join(source, directory))).filter(name => name.endsWith('.mjs')).sort()) {
    const lines = (await readFile(join(source, directory, name), 'utf8')).split('\n');
    const tolerates = text => /process\.platform\s*!==\s*'win32'\s*\|\|\s*error\.code\s*!==\s*'EPERM'\s*\)\s*throw error/u.test(text) || /process\.platform\s*===\s*'win32'\s*&&\s*error\.code\s*===\s*'EPERM'/u.test(text);
    const skips = text => /process\.platform\s*!==\s*'win32'\s*\)\s*\{/u.test(text) || /process\.platform\s*===\s*'win32'\s*\)\s*return\b/u.test(text);
    lines.forEach((line, index) => {
      // Each sync of a handle opened read-only (a directory) within the two previous lines must carry its own guard.
      for (const match of line.matchAll(/await (\w+)\.sync\(\)[^;]*/gu)) {
        const opener = new RegExp(`\\b${match[1]}\\s*=\\s*await (?:fs\\.)?open\\([^)]*,\\s*'r'\\)`, 'u');
        const context = lines.slice(Math.max(0, index - 2), index + 1).join('\n');
        if (!opener.test(context)) continue;
        if (tolerates(match[0]) || tolerates(lines[index + 1] ?? '') && /^\s*catch/u.test(lines[index + 1] ?? '') || skips(lines.slice(Math.max(0, index - 3), index + 1).join('\n'))) continue;
        offenders.push(`${directory}/${name}:${index + 1}`);
      }
    });
  }
}
assert.deepEqual(offenders, [], `directory fsync must tolerate only win32 EPERM: ${offenders.join(', ')}`);
console.log('directory sync portability: ok');
