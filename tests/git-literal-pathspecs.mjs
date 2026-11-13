import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
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

  // factory-package install-tools: a fixed tool name committed as a directory is refused, not replaced
  // by an entry inside it.
  const toolSource = join(root, 'tool-source'), toolProject = join(root, 'tool-project');
  await mkdir(join(toolSource, 'tools/isswf-plan.mjs'), { recursive: true });
  await writeFile(join(toolSource, 'tools/isswf-plan.mjs/inner.mjs'), 'export {};\n');
  const sourceGit = (...args) => spawnSync('git', ['-C', toolSource, ...args], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
  assert.equal(sourceGit('init', '-q').status, 0);
  assert.equal(sourceGit('add', '.').status, 0);
  assert.equal(sourceGit('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'tools').status, 0);
  await mkdir(toolProject);
  assert.equal(spawnSync('git', ['-C', toolProject, 'init', '-q']).status, 0);
  const installed = spawnSync(process.execPath, [join(source, 'tools/factory-package.mjs'), 'install-tools', '--source', await realpath(toolSource), '--revision', sourceGit('rev-parse', 'HEAD').stdout.trim(), '--project', await realpath(toolProject)], { encoding: 'utf8' });
  assert.notEqual(installed.status, 0, 'factory-package must refuse a tool committed as a directory');
  assert.match(installed.stderr, /Missing regular committed tool: isswf-plan\.mjs/u, `factory-package must refuse the directory entry: ${installed.stderr}`);
} finally {
  await rm(root, { recursive: true, force: true });
}
{
  const tool = 'factory-package', text = await readFile(join(source, 'tools', tool + '.mjs'), 'utf8');
  assert.match(text, /GIT_LITERAL_PATHSPECS: ["']1["']/u, `tools/${tool}.mjs must read pinned paths as literal pathspecs`);
  assert.doesNotMatch(text, /'ls-tree', '-z', [^\n]*\.find\(Boolean\)|'ls-tree', '-z', [^\n]*filter\(Boolean\)\[0\]|"ls-tree", "-z", revision[^\n]*filter\(Boolean\)/u, `tools/${tool}.mjs must select ls-tree entries by exact name`);
}
console.log('git literal pathspecs: ok');
