#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSnapshot as readSnapshotCore } from './isswf-snapshot-core.mjs';
import { stateDirectory } from './project-state.mjs';

export const nodeFs = {
  exists: async path => existsSync(path),
  list: async path => (await readdir(path, { withFileTypes: true })).map(e => ({ name: e.name, kind: e.isFile() ? 'file' : e.isDirectory() ? 'dir' : 'other' })),
  stat: async path => ({ size: (await stat(path)).size }),
  read: path => readFile(path, 'utf8'),
};

// Node path: adds project-state.mjs's regular-directory (non-symlink) guard, which the core cannot
// apply without lstat, and refuses if the core's selection through `fs` disagrees with it.
export async function readSnapshot(project, fs = nodeFs) {
  if (!isAbsolute(project)) throw Error('absolute --project required');
  const expected = stateDirectory(project);
  const snapshot = await readSnapshotCore(project, fs);
  if (basename(dirname(snapshot.stateDir)) !== expected) throw Error(`state directory ${snapshot.stateDir} disagrees with ${expected}`);
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [flag, project, ...rest] = process.argv.slice(2);
  if (flag !== '--project' || !project || rest.length || !isAbsolute(project)) {
    console.error('Usage: node tools/isswf-snapshot.mjs --project /absolute/project');
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(await readSnapshot(project), null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
