import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { NOTE_DIR, parseNote } from './isswf-compaction-core.mjs';
import { RECORD_NAME } from './isswf-snapshot-core.mjs';

/** The accepted dispatches that returned a run ID, from every Claude session note; a missing directory is no launch. Pi keeps its dispatches only in the running extension, so it has none here. */
export async function launchesFor() {
  const dir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), ...NOTE_DIR);
  const launches = [];
  try { for (const name of await readdir(dir)) launches.push(...(parseNote(await readFile(join(dir, name), 'utf8').catch(() => '')) ?? [])); } catch { /* no notes */ }
  return launches.filter(({ run }) => run);
}

/** The other records in the directory of the record at `path`, as `{ name, text }`. */
export async function siblingRecordsOf(path) {
  const own = basename(path);
  const dir = dirname(path);
  try { return await Promise.all((await readdir(dir)).filter(name => RECORD_NAME.test(name) && name !== own).map(async name => ({ name, text: await readFile(join(dir, name), 'utf8') }))); } catch { return []; }
}

/** The texts of the other records in the directory of the record at `path`. */
export async function siblingsOf(path) {
  return (await siblingRecordsOf(path)).map(({ text }) => text);
}
