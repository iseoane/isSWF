import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const script = join(source, 'tooling/maintenance/ci-minutes.mjs');
const { summarizeRuns } = await import(pathToFileURL(script));

const run = (event, headBranch, conclusion, created, updated, databaseId) => ({ event, headBranch, conclusion, createdAt: created, updatedAt: updated, databaseId });
const runs = [
  run('pull_request', 'feat/a', 'success', '2026-11-20T10:00:00Z', '2026-11-20T10:05:00Z', 1),
  run('pull_request', 'feat/a', 'cancelled', '2026-11-20T10:10:00Z', '2026-11-20T10:11:30Z', 2),
  run('pull_request', 'feat/b', 'failure', '2026-11-20T11:00:00Z', '2026-11-20T11:04:00Z', 3),
  run('push', 'main', 'success', '2026-11-20T12:00:00Z', '2026-11-20T12:06:00Z', 4),
  run('push', 'feat/a', 'success', '2026-11-20T12:00:00Z', '2026-11-20T12:02:00Z', 5),
];

const summary = summarizeRuns(runs);
assert.deepEqual(summary.groups, [
  { key: 'pull_request feat/a', runs: 2, cancelled: 1, minutes: 6.5 },
  { key: 'pull_request feat/b', runs: 1, cancelled: 0, minutes: 4 },
  { key: 'push feat/a', runs: 1, cancelled: 0, minutes: 2 },
  { key: 'push main', runs: 1, cancelled: 0, minutes: 6 },
]);
assert.deepEqual(summary.total, { runs: 5, cancelled: 1, minutes: 18.5 });

const directory = await mkdtemp(join(tmpdir(), 'isswf-ci-minutes-'));
try {
  const file = join(directory, 'runs.json');
  await writeFile(file, JSON.stringify(runs));
  const fromFile = spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
  assert.equal(fromFile.status, 0, fromFile.stderr);
  assert.match(fromFile.stdout, /pull_request feat\/a\s+2 runs\s+1 cancelled\s+6\.5 min/u);
  assert.match(fromFile.stdout, /total\s+5 runs\s+1 cancelled\s+18\.5 min/u);
  const fromStdin = spawnSync(process.execPath, [script], { input: JSON.stringify(runs), encoding: 'utf8' });
  assert.equal(fromStdin.stdout, fromFile.stdout);
  const bad = spawnSync(process.execPath, [script], { input: 'not json', encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
} finally {
  await rm(directory, { recursive: true, force: true });
}
console.log('ci-minutes ok');
