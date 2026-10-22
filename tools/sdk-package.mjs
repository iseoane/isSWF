import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function sdkPackageManifest(name, entry) {
  for (const directory of createRequire(entry).resolve.paths(name) || []) {
    const path = join(directory, name, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(path, 'utf8'));
      if (manifest.name !== name) throw Error('SDK dependency manifest name mismatch: ' + name);
      return path;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw Error(`Cannot find module '${name}' package metadata`);
}
