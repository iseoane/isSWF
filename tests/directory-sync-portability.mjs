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
    lines.forEach((line, index) => {
      if (!/\bopen\([^)]*,\s*'r'\)/u.test(line)) return;
      const window = lines.slice(Math.max(0, index - 2), index + 3).join('\n');
      if (!/\.sync\(\)/u.test(window)) return;
      const skipsWindows = /process\.platform\s*!==\s*'win32'\s*\)\s*\{/u.test(window) || /process\.platform\s*===\s*'win32'\s*\)\s*return\b/u.test(window);
      const toleratesWindowsEperm = /process\.platform\s*!==\s*'win32'\s*\|\|\s*error\.code\s*!==\s*'EPERM'\s*\)\s*throw error/u.test(window) || /process\.platform\s*===\s*'win32'\s*&&\s*error\.code\s*===\s*'EPERM'/u.test(window);
      const guarded = skipsWindows || toleratesWindowsEperm;
      if (!guarded) offenders.push(`${directory}/${name}:${index + 1}`);
    });
  }
}
assert.deepEqual(offenders, [], `directory fsync must tolerate only win32 EPERM: ${offenders.join(', ')}`);
console.log('directory sync portability: ok');
