import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function sdkPackageManifest(name, entry) {
  let directory = dirname(createRequire(entry).resolve(name));
  for (let depth = 0; depth < 64; depth += 1) {
    const path = join(directory, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(path, 'utf8'));
      if (manifest.name === name) return path;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw Error('Resolved SDK dependency has no matching package manifest: ' + name);
}
