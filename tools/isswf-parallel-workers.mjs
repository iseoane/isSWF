#!/usr/bin/env node
// The operator's view of the per-clone parallel-worker ledger (docs/en/operations.md, "Parallel worker limit").
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { clearWorkers, listWorkers, readPolicy } from './isswf-parallel-workers-core.mjs';

const run = promisify(execFile);
const io = {
  gitOut: async (argv, cwd) => {
    try {
      return { exitCode: 0, stdout: (await run('git', argv, { cwd, timeout: 20_000, windowsHide: true })).stdout };
    } catch (error) {
      if (typeof error.code === 'number') return { exitCode: error.code, stdout: '' };
      throw error;
    }
  },
  list: async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : 'file' })),
  read: file => readFile(file, 'utf8'),
  write: async (file, text) => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text);
  },
  remove: file => rm(file, { force: true }),
};

const USAGE = 'Usage: node tools/isswf-parallel-workers.mjs list|clear [--token <token>] [--project <dir>]';
const [verb, ...rest] = process.argv.slice(2);
const fail = message => {
  console.error(message);
  process.exit(2);
};

// An option that is present needs a value: `clear --token` must not read as `clear` everything.
const option = name => {
  if (!rest.includes(name)) return undefined;
  const value = rest[rest.indexOf(name) + 1];
  if (value === undefined || value.startsWith('--')) fail(`${name} needs a value. ${USAGE}`);
  return value;
};

if (!['list', 'clear'].includes(verb)) fail(USAGE);
const cwd = resolve(option('--project') ?? process.cwd());
try {
  if (verb === 'list') {
    const { limit, mode } = await readPolicy({ cwd, io });
    const open = await listWorkers({ cwd, io });
    console.log(`limit ${limit}, mode ${mode}, ${open.length} open`);
    if (!open.length) console.log('no open workers');
    for (const { token, entry } of open) console.log(entry ? `${token}  ${entry.job ?? '?'}  ${entry.agent}  ${entry.host}  since ${entry.startedAt}${entry.run ? `  run ${entry.run}` : ''}` : `${token}  (unreadable entry)`);
  } else {
    const removed = await clearWorkers({ token: option('--token'), cwd, io });
    console.log(removed.length ? `cleared ${removed.join(', ')}` : 'nothing to clear');
  }
} catch (error) {
  fail(`isswf-parallel-workers: ${error.message}`);
}
