import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const { gitDirOfPipe, parseWindowsDaemons, parseLinuxDaemon, orphanReport } = await import(pathToFileURL(join(source, 'tooling/quality/fsmonitor-orphans.mjs')).href);

// Windows names a daemon's pipe after its Git directory, with the drive colon written as `_`.
const linked = String.raw`C_\0-Work\repo\.git\worktrees\job-1\fsmonitor--daemon.ipc`;
assert.equal(gitDirOfPipe(linked), String.raw`C:\0-Work\repo\.git\worktrees\job-1`);
assert.equal(gitDirOfPipe(String.raw`C_\Users\me\.git\fsmonitor--daemon.ipc`), String.raw`C:\Users\me\.git`);
assert.equal(gitDirOfPipe('logitech_kiros_updater'), null);

// `process ID<TAB>pipe name` lines; the ID is empty when the pipe's server could not be read.
assert.deepEqual(parseWindowsDaemons(`39728\t${linked}\r\n\t${linked}\r\nnoise\r\n14624\tlogitech_kiros_updater\r\n`), [
  { pid: 39728, path: String.raw`C:\0-Work\repo\.git\worktrees\job-1` },
  { pid: null, path: String.raw`C:\0-Work\repo\.git\worktrees\job-1` },
]);

// Linux: /proc/<pid>/cmdline is NUL-separated and the cwd link gains " (deleted)" once its directory is removed.
const daemon = 'git\0fsmonitor--daemon\0run\0--detach\0--ipc-threads=8\0';
assert.deepEqual(parseLinuxDaemon(77, daemon, '/srv/wt-a'), { pid: 77, path: '/srv/wt-a' });
assert.deepEqual(parseLinuxDaemon(78, daemon, '/srv/wt-gone (deleted)'), { pid: 78, path: '/srv/wt-gone' });
assert.deepEqual(parseLinuxDaemon(79, daemon, undefined), { pid: 79, path: null });
assert.equal(parseLinuxDaemon(80, 'git\0status\0', '/srv/wt-a'), null, 'another git command is not a daemon');
assert.equal(parseLinuxDaemon(81, 'git\0fsmonitor--daemon\0status\0', '/srv/wt-a'), null, 'a daemon status call is not a running daemon');
assert.equal(parseLinuxDaemon(82, 'vim\0fsmonitor--daemon\0run\0', '/srv/wt-a'), null, 'only git runs the daemon');

// A daemon is orphaned when its path is gone; one with an unreadable path is reported apart, never as an orphan.
const present = new Set(['/srv/wt-a']);
assert.deepEqual(orphanReport([{ pid: 1, path: '/srv/wt-a' }, { pid: 2, path: '/srv/wt-gone' }, { pid: 3, path: null }], path => present.has(path)), {
  orphans: [{ pid: 2, path: '/srv/wt-gone' }],
  unknown: [3],
});
assert.deepEqual(orphanReport([], () => true), { orphans: [], unknown: [] });
console.log('fsmonitor-orphans: PASS');
