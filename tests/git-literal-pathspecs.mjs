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
