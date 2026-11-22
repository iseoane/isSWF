#!/usr/bin/env node
// Reads a pull request's CI state once and exits: 0 success, 1 failure, 2 pending, 3 unreadable (docs/en/operations.md, "CI state").
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { EXIT_CODES, parseArgs, readCiState } from './isswf-ci-state-core.mjs';

const run = promisify(execFile);
const gh = async argv => {
  try {
    return { exitCode: 0, stdout: (await run('gh', argv, { timeout: 30_000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 })).stdout };
  } catch (error) {
    if (typeof error.code === 'number') return { exitCode: error.code, stdout: '' };
    throw error;
  }
};

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(`isswf-ci-state: unreadable: ${error.message}`);
  process.exit(3);
}
try {
  const state = await readCiState({ ...options, gh });
  console.log(JSON.stringify(state, null, 2));
  process.exitCode = EXIT_CODES[state.state];
} catch (error) {
  console.error(`isswf-ci-state: ${error.message}`);
  process.exitCode = 3;
}
