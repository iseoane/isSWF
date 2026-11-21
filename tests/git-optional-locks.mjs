import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.');

// Git runs from hooks, guards, the pane and their runners read state while the operator or another agent commits, so each call must not take
// the index lock opportunistically: GIT_OPTIONAL_LOCKS=0 in the child's environment, or the equivalent `--no-optional-locks` global option
// for the Claude engine's `$.process.run`, whose environment this repository does not control.
const SPAWN = /(?:\b(?:execFile|execFileSync|spawn|spawnSync|run|runAsync)\(\s*|process\.run\(\s*\[\s*)(['"])git\1/gu;
const MARKER = /GIT_OPTIONAL_LOCKS|--no-optional-locks/u;

// Blanks every comment (keeping newlines, so line numbers hold) and leaves strings as they are, so a marker in a comment does not count.
function withoutComments(text) {
  let out = '';
  for (let i = 0; i < text.length;) {
    const two = text.slice(i, i + 2);
    if (two === '//') { while (i < text.length && text[i] !== '\n') { out += ' '; i++; } }
    else if (two === '/*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/gu, ' ');
      i = stop;
    } else if (/['"`]/u.test(text[i])) {
      const start = i++;
      while (i < text.length && text[i] !== text[start]) i += text[i] === '\\' ? 2 : 1;
      out += text.slice(start, ++i);
    } else out += text[i++];
  }
  return out;
}

// The text of the call whose opening parenthesis is at `open`, up to its balanced closing one; parentheses inside strings do not count.
function callText(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (/['"`]/u.test(text[i])) { const quote = text[i++]; while (i < text.length && text[i] !== quote) i += text[i] === '\\' ? 2 : 1; }
    else if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) return text.slice(open, i + 1);
  }
  return text.slice(open);
}

// Returns "file:line" for each Git spawn in `text` whose call, comments aside, carries no marker.
function unlockedSpawns(file, source) {
  const text = withoutComments(source);
  const found = [];
  for (const match of text.matchAll(SPAWN)) {
    const open = match.index + match[0].lastIndexOf('(', match[0].indexOf(match[1]));
    if (!MARKER.test(callText(text, open))) found.push(`${file}:${text.slice(0, match.index).split('\n').length}`);
  }
  return found;
}

// The checker catches an unmarked call and accepts a marked one, in the spawn shapes this repository uses.
assert.deepEqual(unlockedSpawns('a', "execFile('git', argv, { cwd });"), ['a:1']);
assert.deepEqual(unlockedSpawns('a', "spawnSync('git', args, { cwd, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });"), []);
assert.deepEqual(unlockedSpawns('a', "\n$.process.run(['git', ...argv], { cwd })\n;"), ['a:2']);
assert.deepEqual(unlockedSpawns('a', "$.process.run(['git', '--no-optional-locks', ...argv], { cwd });"), []);
// A raw call before a marked one in a file without semicolons is reported, and so is a marker that appears only in a comment.
assert.deepEqual(unlockedSpawns('a', "$.process.run(['git', 'status'], { cwd })\nconst g = () => $.process.run(['git', '--no-optional-locks'], { cwd })\n"), ['a:1']);
assert.deepEqual(unlockedSpawns('a', "// GIT_OPTIONAL_LOCKS=0\nexecFile('git', argv, { cwd })\n"), ['a:2']);
assert.deepEqual(unlockedSpawns('a', "execFile('git', argv, { cwd, /* --no-optional-locks */ })"), ['a:1']);
assert.deepEqual(unlockedSpawns('a', "spawnSync('git', ['status'], { env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })\nspawnSync('git', ['log'])"), ['a:2']);

const scanned = [
  ...(await readdir(join(source, 'hooks'))).filter(name => name.endsWith('.tsx') && !name.endsWith('.test.tsx')).map(name => `hooks/${name}`),
  'tools/isswf-plan.mjs',
  'tools/isswf-intake.mjs',
  ...(await readdir(join(source, 'tools'))).filter(name => /guard|pi-extension|parallel-workers|panel|verify|record-check/u.test(name)).map(name => `tools/${name}`),
];
const violations = [];
for (const file of scanned) violations.push(...unlockedSpawns(file, await readFile(join(source, file), 'utf8')));
assert.deepEqual(violations, [], 'Git spawns without GIT_OPTIONAL_LOCKS=0 or --no-optional-locks');
console.log(JSON.stringify({ status: 'PASS', scanned: scanned.length }));
