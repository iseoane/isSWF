// Measures what one pane snapshot read costs a project: file-system calls by kind and wall-clock time.
// Usage: node tooling/maintenance/snapshot-cost.mjs [--project /absolute/project] [--runs N]
// Direct Node reads only; the Claude pane routes each call through the host engine, so its latency is higher.
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSnapshot } from '../../tools/isswf-snapshot-core.mjs';

const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const project = resolve(args.includes('--project') ? option('--project') : join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const runs = args.includes('--runs') ? Number(option('--runs')) : 5;

const calls = { exists: 0, list: 0, stat: 0, read: 0 };
const fs = {
  exists: async path => (calls.exists++, existsSync(path)),
  list: async path => (calls.list++, (await readdir(path, { withFileTypes: true })).map(e => ({ name: e.name, kind: e.isFile() ? 'file' : e.isDirectory() ? 'dir' : 'other' }))),
  stat: async path => (calls.stat++, { size: (await stat(path)).size }),
  read: path => (calls.read++, readFile(path, 'utf8')),
};

const times = [];
let snapshot;
for (let i = 0; i < runs; i++) {
  for (const key of Object.keys(calls)) calls[key] = 0;
  const started = performance.now();
  snapshot = await readSnapshot(project, fs);
  times.push(performance.now() - started);
}
times.sort((a, b) => a - b);
console.log(JSON.stringify({
  project,
  initiativesShown: snapshot.initiatives.length,
  fsCalls: { ...calls, total: Object.values(calls).reduce((sum, n) => sum + n, 0) },
  readMs: { median: Math.round(times[Math.floor(times.length / 2)]), min: Math.round(times[0]), runs },
}));
