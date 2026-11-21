#!/usr/bin/env node
// Runs a command (by default the job-tier verification of a project) and reports any `git fsmonitor--daemon` process that started during it and is still alive.
// Windows only: on another platform it reports "not applicable" and runs nothing. It only reads the process list; it never stops a process.
// Usage: node tooling/quality/fsmonitor-daemons.mjs [--project <absolute dir>] [-- <command> <args>...]
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const argv = process.argv.slice(2);
const separator = argv.indexOf('--');
const own = separator === -1 ? argv : argv.slice(0, separator);
const projectAt = own.indexOf('--project');
const project = projectAt === -1 ? root : resolve(own[projectAt + 1] ?? '');
const command = separator === -1 ? [process.execPath, join(root, 'tools/isswf-verify.mjs'), '--project', project, '--tier', 'job'] : argv.slice(separator + 1);

if (process.platform !== 'win32') {
  console.log(JSON.stringify({ status: 'not-applicable', reason: 'fsmonitor daemons are checked on Windows only' }));
  process.exit(0);
}

// The process IDs of every running `git fsmonitor--daemon`.
function daemons() {
  const script = "Get-CimInstance Win32_Process -Filter \"Name='git.exe'\" | Where-Object { $_.CommandLine -like '*fsmonitor--daemon*' } | ForEach-Object { $_.ProcessId }";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) {
    console.error(`cannot list processes: ${result.error?.message ?? result.stderr}`);
    process.exit(2);
  }
  return new Set(result.stdout.split(/\r?\n/u).filter(line => /^\d+$/u.test(line.trim())).map(line => Number(line.trim())));
}

const before = daemons();
const ran = spawnSync(command[0], command.slice(1), { cwd: project, stdio: 'inherit', windowsHide: true });
const after = daemons();
const leftover = [...after].filter(pid => !before.has(pid)).sort((a, b) => a - b);
console.log(JSON.stringify({ status: leftover.length === 0 ? 'clean' : 'leftover', before: before.size, after: after.size, newDaemonPids: leftover, commandExit: ran.status }));
process.exit(leftover.length > 0 ? 1 : (ran.status ?? 1));
