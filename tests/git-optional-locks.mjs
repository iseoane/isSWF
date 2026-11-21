import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.');

// Git runs from hooks, guards, the pane and their runners read state while the operator or another agent commits, so each call must not take
// the index lock opportunistically: GIT_OPTIONAL_LOCKS=0 in the child's environment, or the equivalent `--no-optional-locks` global option
// for the Claude engine's `$.process.run`, whose environment this repository does not control.
const SPAWN = /(?:\b(?:execFile|execFileSync|spawn|spawnSync|run|runAsync)\(\s*|process\.run\(\s*\[\s*)(['"])git\1/gu;
const MARKER = /GIT_OPTIONAL_LOCKS|--no-optional-locks/u;

// Returns "file:line" for each Git spawn in `text` whose statement (up to the next semicolon) carries no marker.
function unlockedSpawns(file, text) {
  const found = [];
  for (const match of text.matchAll(SPAWN)) {
    const statement = text.slice(match.index, text.indexOf(';', match.index) + 1 || undefined);
    if (!MARKER.test(statement)) found.push(`${file}:${text.slice(0, match.index).split('\n').length}`);
  }
  return found;
}

// The checker catches an unmarked call and accepts a marked one, in the spawn shapes this repository uses.
assert.deepEqual(unlockedSpawns('a', "execFile('git', argv, { cwd });"), ['a:1']);
assert.deepEqual(unlockedSpawns('a', "spawnSync('git', args, { cwd, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });"), []);
assert.deepEqual(unlockedSpawns('a', "\n$.process.run(['git', ...argv], { cwd })\n;"), ['a:2']);
assert.deepEqual(unlockedSpawns('a', "$.process.run(['git', '--no-optional-locks', ...argv], { cwd });"), []);

const scanned = [
  ...(await readdir(join(source, 'hooks'))).filter(name => name.endsWith('.tsx') && !name.endsWith('.test.tsx')).map(name => `hooks/${name}`),
  ...(await readdir(join(source, 'tools'))).filter(name => /guard|pi-extension|parallel-workers|panel|verify|record-check/u.test(name)).map(name => `tools/${name}`),
];
const violations = [];
for (const file of scanned) violations.push(...unlockedSpawns(file, await readFile(join(source, file), 'utf8')));
assert.deepEqual(violations, [], 'Git spawns without GIT_OPTIONAL_LOCKS=0 or --no-optional-locks');
console.log(JSON.stringify({ status: 'PASS', scanned: scanned.length }));
