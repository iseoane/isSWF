import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const repo = await mkdtemp(join(tmpdir(), 'isswf-workflow-citations-'));
try {
  const git = (...args) => {
    const result = spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const run = (...args) => spawnSync(process.execPath, [join(source, 'tooling/maintenance/workflow-citations.mjs'), '--root', repo, ...args], { encoding: 'utf8' });
  git('init', '-q');
  await mkdir(join(repo, 'docs/diagrams'), { recursive: true });
  const body = ['# Title', 'intro', '## Moves', 'move one', 'move two', '## Edited', 'old text', '## Repeats', 'same', 'single'];
  await writeFile(join(repo, 'a.md'), body.join('\n') + '\n');
  const citation = (line, end_line) => end_line === undefined ? { path: 'a.md', line } : { path: 'a.md', line, end_line };
  const diagram = revision => ({ workflow: { meta: { repository: { revision } }, nodes: [{ sources: [citation(4, 5), citation(4, 5)] }, { sources: [citation(7, 7), citation(9, 9), citation(10)] }] }, overview: { nodes: [] } });
  const diagramPath = join(repo, 'docs/diagrams/workflow.json');
  git('add', '-A');
  git('commit', '-qm', 'one');
  const first = git('rev-parse', 'HEAD');
  await writeFile(diagramPath, JSON.stringify(diagram(first), null, 2) + '\n');
  git('add', '-A');
  git('commit', '-qm', 'pin');
  const next = ['# Title', 'added', 'added', 'intro', '## Moves', 'move one', 'move two', '## Edited', 'new text', '## Repeats', 'same', 'same', 'single'];
  await writeFile(join(repo, 'a.md'), next.join('\n') + '\n');
  git('commit', '-qam', 'two');
  const second = git('rev-parse', 'HEAD');

  const preview = run(second);
  assert.equal(preview.status, 1, 'unresolved citations make the command fail');
  assert.match(preview.stdout, /moved a\.md:4-5 -> 6-7/u);
  assert.match(preview.stdout, /UNRESOLVED a\.md:7-7 \(cited text not found; under: ## Edited\)/u);
  assert.match(preview.stdout, /UNRESOLVED a\.md:9-9 \(cited text occurs 2 times; under: ## Repeats\)/u);
  assert.match(preview.stdout, /moved a\.md:10-10 -> 13-13/u);
  assert.equal((preview.stdout.match(/a\.md:4-5/gu) ?? []).length, 1, 'a repeated citation is processed once');
  assert.match(preview.stdout, /4 citations: 0 unchanged, 2 moved, 2 unresolved/u);
  assert.deepEqual(JSON.parse(await readFile(diagramPath, 'utf8')), diagram(first), 'preview must not write');

  const written = run('--write', second);
  assert.equal(written.status, 1);
  const result = JSON.parse(await readFile(diagramPath, 'utf8'));
  assert.equal(result.workflow.meta.repository.revision, second);
  assert.deepEqual(result.workflow.nodes[0].sources, [citation(6, 7), citation(6, 7)]);
  assert.deepEqual(result.workflow.nodes[1].sources, [citation(7, 7), citation(9, 9), citation(13)], 'unresolved citations are never guessed and a single-line citation keeps its shape');
  assert.equal(run('nonexistent-revision').status, 2);
} finally {
  await rm(repo, { recursive: true, force: true });
}
console.log('PASS workflow citations: exact-text re-pin, unresolved and ambiguous reports, single processing, write and preview modes.');
