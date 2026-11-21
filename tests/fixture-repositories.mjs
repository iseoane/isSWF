import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.');

// A fixture repository started by a bare `git init` or `git clone` inherits the operator's global `core.fsmonitor=true`, which leaves one
// `git fsmonitor--daemon` per fixture running after the test. Fixtures go through tests/support/git-fixture.mjs instead, which turns it off.
// A call is a raw one when a Git runner named like git, sh, run or command carries a quoted `init` or `clone` argument on its line; `-m init` is a message and an isSWF `init` runs through `process.execPath`.
const RAW = /\b(?:git\w*|sh|run|runAsync|command|execFileSync|spawnSync)\b(?:(?!execPath)[^\n])*(?<!'-m',\s*)['"](?:init|clone)['"]/u;

// Returns "file:line" for each line of `text` that starts a repository without the helper.
function rawRepositories(file, text) {
  return text.split('\n').flatMap((line, index) => (RAW.test(line) ? [`${file}:${index + 1}`] : []));
}

// The checker catches each raw shape this repository uses and leaves the helper and unrelated `init` arguments alone.
assert.deepEqual(rawRepositories('a', "git('init', '-q', root);"), ['a:1']);
assert.deepEqual(rawRepositories('a', "run('git', ['clone', '-q', source, fixture]);"), ['a:1']);
assert.deepEqual(rawRepositories('a', "spawnSync('git', ['-C', project, 'init', '-q']);"), ['a:1']);
assert.deepEqual(rawRepositories('a', "gitIn('commit', '-q', '-m', 'init');"), []);
assert.deepEqual(rawRepositories('a', "cli('init', ['--tracking', 'local']);"), []);
assert.deepEqual(rawRepositories('a', "initRepository(root, ['-b', 'main']);"), []);

const files = async directory => (await Promise.all((await readdir(join(source, directory), { withFileTypes: true }))
  .map(async entry => (entry.isDirectory() ? files(`${directory}/${entry.name}`) : /\.(?:mjs|tsx)$/u.test(entry.name) ? [`${directory}/${entry.name}`] : [])))).flat();
const scanned = [...await files('tests'), ...await files('hooks')].filter(file => file !== 'tests/support/git-fixture.mjs' && file !== 'tests/fixture-repositories.mjs');
const violations = [];
for (const file of scanned) violations.push(...rawRepositories(file, await readFile(join(source, file), 'utf8')));
assert.deepEqual(violations, [], 'fixture repositories created without tests/support/git-fixture.mjs');
console.log(JSON.stringify({ status: 'PASS', scanned: scanned.length }));
