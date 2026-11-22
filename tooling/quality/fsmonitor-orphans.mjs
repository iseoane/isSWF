#!/usr/bin/env node
// Lists running `git fsmonitor--daemon` processes whose worktree no longer exists (Windows and Linux). It only reads process state; it never stops a process.
// Stop one with `git -C <worktree> fsmonitor--daemon stop` while its worktree exists; once it is gone, end the listed process by its ID.
// Usage: node tooling/quality/fsmonitor-orphans.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIPE_SUFFIX = '\\fsmonitor--daemon.ipc';

/** The Git directory a Windows daemon serves, from its named pipe (`C_\repo\.git\fsmonitor--daemon.ipc`), or null for any other name. */
export function gitDirOfPipe(name) {
  const match = /^([A-Za-z])_(\\.+)\\fsmonitor--daemon\.ipc$/u.exec(name);
  return match ? `${match[1]}:${match[2]}` : null;
}

/** The daemons in `process ID<TAB>pipe name` lines. The ID is null when the pipe's server could not be read. */
export function parseWindowsDaemons(text) {
  return text.split(/\r?\n/u).flatMap(line => {
    const [pid, name = ''] = line.split('\t');
    const path = gitDirOfPipe(name);
    return path === null ? [] : [{ pid: /^\d+$/u.test(pid) ? Number(pid) : null, path }];
  });
}

/** The daemon for a Linux process, from its NUL-separated `/proc/<pid>/cmdline` and its `/proc/<pid>/cwd` link, or null for any other process. */
export function parseLinuxDaemon(pid, cmdline, cwdLink) {
  const [program, ...args] = cmdline.split('\0');
  if (!/^git(?:\.exe)?$/u.test(program.split('/').pop()) || args[0] !== 'fsmonitor--daemon' || args[1] !== 'run') return null;
  return { pid, path: cwdLink === undefined ? null : cwdLink.replace(/ \(deleted\)$/u, '') };
}

/** Splits daemons into orphans (their path is gone) and unknown ones (their path could not be read). */
export function orphanReport(daemons, exists) {
  const report = { orphans: [], unknown: [] };
  for (const { pid, path } of daemons) {
    if (path === null) report.unknown.push(pid);
    else if (!exists(path)) report.orphans.push({ pid, path });
  }
  return report;
}

// Git names the pipe of a daemon after its Git directory, and the daemon's own working directory is not its worktree on Windows.
// Connecting without sending is what `git fsmonitor--daemon status` does; it yields the server's process ID.
const WINDOWS_SCRIPT = `
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class PipeServer {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] static extern IntPtr CreateFile(string name, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
  [DllImport("kernel32.dll")] static extern bool GetNamedPipeServerProcessId(IntPtr pipe, out uint id);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  public static string Id(string name) {
    IntPtr h = CreateFile("\\\\\\\\.\\\\pipe\\\\" + name, 0x80, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
    if (h == (IntPtr)(-1)) return "";
    try { uint id; return GetNamedPipeServerProcessId(h, out id) ? id.ToString() : ""; } finally { CloseHandle(h); }
  }
}
'@
[System.IO.Directory]::GetFiles('\\\\.\\pipe\\') | ForEach-Object { $_.Substring(9) } | Where-Object { $_ -like '*${PIPE_SUFFIX}' } | ForEach-Object { "$([PipeServer]::Id($_))\`t$_" }
`;

function windowsDaemons() {
  const encoded = Buffer.from(WINDOWS_SCRIPT, 'utf16le').toString('base64');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`cannot list daemons: ${result.error?.message ?? result.stderr}`);
  return parseWindowsDaemons(result.stdout);
}

function linuxDaemons() {
  const found = [];
  for (const name of readdirSync('/proc')) {
    if (!/^\d+$/u.test(name)) continue;
    try {
      let cwdLink;
      try {
        cwdLink = readlinkSync(`/proc/${name}/cwd`);
      } catch {
        // A daemon whose directory cannot be read is reported as unknown.
      }
      const daemon = parseLinuxDaemon(Number(name), readFileSync(`/proc/${name}/cmdline`, 'utf8'), cwdLink);
      if (daemon) found.push(daemon);
    } catch {
      // The process ended while it was read.
    }
  }
  return found;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.platform !== 'win32' && process.platform !== 'linux') {
    console.log(JSON.stringify({ status: 'not-applicable', reason: 'fsmonitor daemons are checked on Windows and Linux only' }));
    process.exit(0);
  }
  try {
    const windows = process.platform === 'win32';
    const daemons = windows ? windowsDaemons() : linuxDaemons();
    // A Windows path is a Git directory, which Git removes with its worktree; a Linux path is the daemon's working directory, a worktree while it holds `.git`.
    const { orphans, unknown } = orphanReport(daemons, path => existsSync(windows ? path : join(path, '.git')));
    console.log(JSON.stringify({ status: orphans.length === 0 ? 'clean' : 'orphans', daemons: daemons.length, orphans, unknown }));
    process.exit(orphans.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
