import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const { gitDirLive, gitDirOfPipe, parseUnixSockets, parseWindowsDaemons, parseLinuxDaemon, orphanReport } = await import(pathToFileURL(join(source, 'tooling/quality/fsmonitor-orphans.mjs')).href);

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

// Linux: the daemon changes to its home directory, so its Git directory comes from the IPC socket it listens on.
const unix = [
  'Num       RefCount Protocol Flags    Type St Inode Path',
  'ffff0001: 00000002 00000000 00010000 0001 01 5001 /srv/repo/.git/fsmonitor--daemon.ipc',
  'ffff0002: 00000002 00000000 00010000 0001 01 5002 /srv/my repo/.git/worktrees/job-1/fsmonitor--daemon.ipc',
  'ffff0003: 00000003 00000000 00000000 0001 03 5003 /srv/repo/.git/fsmonitor--daemon.ipc',
  'ffff0004: 00000002 00000000 00010000 0001 01 5004 /run/user/1000/bus',
  'ffff0005: 00000002 00000000 00010000 0001 01 5005',
].join('\n');
const sockets = parseUnixSockets(unix);
assert.deepEqual([...sockets], [['5001', '/srv/repo/.git'], ['5002', '/srv/my repo/.git/worktrees/job-1'], ['5003', '/srv/repo/.git']]);
const daemon = 'git\0fsmonitor--daemon\0run\0--detach\0--ipc-threads=8\0';
assert.deepEqual(parseLinuxDaemon(77, daemon, ['/dev/null', 'socket:[9]', 'socket:[5002]'], sockets), { pid: 77, path: '/srv/my repo/.git/worktrees/job-1' });
assert.deepEqual(parseLinuxDaemon(78, daemon, ['socket:[5004]'], sockets), { pid: 78, path: null }, 'no daemon socket: unknown');
assert.deepEqual(parseLinuxDaemon(79, daemon, [], sockets), { pid: 79, path: null });
assert.equal(parseLinuxDaemon(80, 'git\0status\0', ['socket:[5001]'], sockets), null, 'another git command is not a daemon');
assert.equal(parseLinuxDaemon(81, 'git\0fsmonitor--daemon\0status\0', ['socket:[5001]'], sockets), null, 'a daemon status call is not a running daemon');
assert.equal(parseLinuxDaemon(82, 'vim\0fsmonitor--daemon\0run\0', ['socket:[5001]'], sockets), null, 'only git runs the daemon');

// A daemon is orphaned when its path is gone; one with an unreadable path is reported apart, never as an orphan.
const present = new Set(['/srv/wt-a']);
assert.deepEqual(orphanReport([{ pid: 1, path: '/srv/wt-a' }, { pid: 2, path: '/srv/wt-gone' }, { pid: 3, path: null }], path => present.has(path)), {
  orphans: [{ pid: 2, path: '/srv/wt-gone' }],
  unknown: [3],
});
assert.deepEqual(orphanReport([], () => true), { orphans: [], unknown: [] });
// A Git directory is live while it exists and, for a linked worktree, its `gitdir` file names a `.git` that exists.
const scratch = mkdtempSync(join(tmpdir(), 'isswf-orphans-'));
try {
  const checkout = join(scratch, 'wt');
  mkdirSync(checkout);
  writeFileSync(join(checkout, '.git'), 'gitdir: elsewhere\n');
  const main = join(scratch, 'main-git');
  const linked = join(scratch, 'linked-git');
  mkdirSync(main);
  mkdirSync(linked);
  writeFileSync(join(linked, 'gitdir'), `${join(checkout, '.git')}\n`);
  assert.equal(gitDirLive(main), true, 'a main repository has no gitdir file');
  assert.equal(gitDirLive(linked), true);
  rmSync(checkout, { recursive: true });
  assert.equal(gitDirLive(linked), false, 'the worktree was deleted by hand while its Git directory remains');
  assert.equal(gitDirLive(join(scratch, 'missing')), false);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
console.log('fsmonitor-orphans: PASS');
