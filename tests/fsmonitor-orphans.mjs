import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const { parseWindowsDaemons, parseLinuxDaemon, orphanReport } = await import(pathToFileURL(join(source, 'tooling/quality/fsmonitor-orphans.mjs')).href);

// Windows: one `pid<TAB>working directory` line per daemon; a daemon whose directory could not be read has an empty one.
assert.deepEqual(parseWindowsDaemons(String.raw`39728	C:\work\wt-a` + '\r\n14624\t\r\n\r\nnoise\r\n' + String.raw`30360	C:\work\wt b` + '\r\n'), [
  { pid: 39728, cwd: String.raw`C:\work\wt-a` },
  { pid: 14624, cwd: null },
  { pid: 30360, cwd: String.raw`C:\work\wt b` },
]);

// Linux: /proc/<pid>/cmdline is NUL-separated and the cwd link gains " (deleted)" once its directory is removed.
const daemon = 'git\0fsmonitor--daemon\0run\0--detach\0--ipc-threads=8\0';
assert.deepEqual(parseLinuxDaemon(77, daemon, '/srv/wt-a'), { pid: 77, cwd: '/srv/wt-a' });
assert.deepEqual(parseLinuxDaemon(78, daemon, '/srv/wt-gone (deleted)'), { pid: 78, cwd: '/srv/wt-gone' });
assert.deepEqual(parseLinuxDaemon(79, daemon, undefined), { pid: 79, cwd: null });
assert.equal(parseLinuxDaemon(80, 'git\0status\0', '/srv/wt-a'), null, 'another git command is not a daemon');
assert.equal(parseLinuxDaemon(81, 'git\0fsmonitor--daemon\0status\0', '/srv/wt-a'), null, 'a daemon status call is not a running daemon');
assert.equal(parseLinuxDaemon(82, 'vim\0fsmonitor--daemon\0run\0', '/srv/wt-a'), null, 'only git runs the daemon');

// A daemon is orphaned when its worktree is missing; one with an unreadable directory is reported apart, never as an orphan.
const present = new Set(['/srv/wt-a']);
assert.deepEqual(orphanReport([{ pid: 1, cwd: '/srv/wt-a' }, { pid: 2, cwd: '/srv/wt-gone' }, { pid: 3, cwd: null }], cwd => present.has(cwd)), {
  orphans: [{ pid: 2, worktree: '/srv/wt-gone' }],
  unknown: [3],
});
assert.deepEqual(orphanReport([], () => true), { orphans: [], unknown: [] });
console.log('fsmonitor-orphans: PASS');
