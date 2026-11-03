import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Pinned reads pass candidate-controlled paths to `git ls-tree -- <paths>`. Without literal
// pathspecs, a committed name such as ':/x' is parsed as pathspec magic and resolves to 'x'.
const source = resolve(process.argv[2] ?? '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-literal-pathspecs-'));
try {
  const git = (env, ...args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', ...env } });
  assert.equal(git({}, 'init', '-q').status, 0);
  await writeFile(join(root, 'x'), 'x\n');
  assert.equal(git({}, 'add', 'x').status, 0);
  assert.equal(git({}, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x').status, 0);
  assert.match(git({}, 'ls-tree', '-z', 'HEAD', '--', ':/x').stdout, /\tx\0/u, 'git interprets the magic pathspec without the literal setting');
  assert.equal(git({ GIT_LITERAL_PATHSPECS: '1' }, 'ls-tree', '-z', 'HEAD', '--', ':/x').stdout, '', 'literal pathspecs must not resolve :/x to x');
} finally {
  await rm(root, { recursive: true, force: true });
}
for (const tool of ['reviewer-task', 'planner-task', 'diagnostic-task', 'pi-worker-task', 'worker-lifecycle', 'isswf-job', 'factory-package']) {
  assert.match(await readFile(join(source, 'tools', tool + '.mjs'), 'utf8'), /GIT_LITERAL_PATHSPECS: ["']1["']/u, `tools/${tool}.mjs must read pinned paths as literal pathspecs`);
}
// Pinned single-path reads must select the entry whose name equals the requested path, not the first entry.
for (const tool of ['pi-worker-task', 'worker-lifecycle', 'factory-package']) {
  const text = await readFile(join(source, 'tools', tool + '.mjs'), 'utf8');
  assert.doesNotMatch(text, /'ls-tree', '-z', [^\n]*\.find\(Boolean\)|'ls-tree', '-z', [^\n]*filter\(Boolean\)\[0\]|"ls-tree", "-z", revision[^\n]*filter\(Boolean\)/u, `tools/${tool}.mjs must select ls-tree entries by exact name`);
}
console.log('git literal pathspecs: ok');
