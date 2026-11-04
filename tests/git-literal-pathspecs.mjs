import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

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

  // Behavior through a tool entry point: worker-lifecycle refuses the brief before any launch when the
  // requested path is not an exact committed regular file. 'dir/' would list 'dir/brief.md' first, and
  // ':/x' would resolve to 'x' without literal pathspecs; both must be refused, not substituted.
  await writeFile(join(root, 'brief.md'), 'brief\n');
  await mkdir(join(root, 'dir'));
  await writeFile(join(root, 'dir/brief.md'), 'nested brief\n');
  assert.equal(git({}, 'add', 'brief.md', 'dir').status, 0);
  assert.equal(git({}, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'briefs').status, 0);
  const sha = git({}, 'rev-parse', 'HEAD').stdout.trim();
  const runs = join(root, '..', `${basename(root)}-runs`);
  const task = join(root, 'task.mjs');
  await writeFile(task, '');
  const repo = await realpath(root);
  for (const brief of ['dir/', ':/x', ':(top)brief.md']) {
    const result = spawnSync(process.execPath, [join(source, 'tools/worker-lifecycle.mjs'), 'launch', '--repo', repo, '--input-sha', sha, '--target-base', sha, '--attempt-id', 'A1', '--runs-store', runs, '--grant-ref', 'test', '--brief', brief, '--task-script', task, '--timeout-ms', '1000', '--output-bytes', '1024'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, `worker-lifecycle must refuse brief ${brief}`);
    assert.match(result.stderr, /brief must be a committed regular file at input SHA/u, `worker-lifecycle must refuse brief ${brief} as not an exact committed file: ${result.stderr}`);
  }

  // pi-worker-task prepare: profile files are read from the pinned methodology baseline of the source
  // checkout. ':/GLOSSARY.md' would resolve to GLOSSARY.md without literal pathspecs; it must be refused.
  const sourceRepo = await realpath(source);
  const config = join(root, 'pi-config.json');
  await writeFile(config, JSON.stringify({ version: 1, mode: 'offline', sdkPath: root, nodeBinary: process.execPath, authPath: join(root, 'auth.json'), profile: { repo: sourceRepo, sha: '37a56ebc902e94f21fc10666f33fceac44946af7', files: [':/GLOSSARY.md'] } }));
  const prepared = spawnSync(process.execPath, [join(source, 'tools/pi-worker-task.mjs'), 'prepare', '--config', config, '--output', join(root, 'task-out.mjs')], { encoding: 'utf8' });
  assert.notEqual(prepared.status, 0, 'pi-worker-task must refuse a magic profile path');
  assert.match(prepared.stderr, /profile reference is not a committed regular file: :\/GLOSSARY\.md/u, `pi-worker-task must refuse the magic profile path itself: ${prepared.stderr}`);

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
  await rm(join(root, '..', `${basename(root)}-runs`), { recursive: true, force: true });
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
