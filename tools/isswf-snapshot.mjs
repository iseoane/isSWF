#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addRunUsage } from './isswf-run-usage-core.mjs';
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
  const usage = rest.length === 1 && rest[0] === '--usage';
  if (flag !== '--project' || !project || (rest.length && !usage) || !isAbsolute(project)) {
    console.error('Usage: node tools/isswf-snapshot.mjs --project /absolute/project [--usage]');
    process.exitCode = 2;
  } else {
    try {
      const snapshot = await readSnapshot(project);
      if (usage) {
        // Same roots the hosts use: CLAUDE_CONFIG_DIR (as token-native-claude-transcript.mjs) and PI_CODING_AGENT_DIR.
        const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
        const piDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi', 'agent');
        await addRunUsage(snapshot, { fs: nodeFs, claudeDir, piDir, cache: new Map() });
      }
      console.log(JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
