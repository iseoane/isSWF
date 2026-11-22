import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { gitFixtureArgs, initRepository } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const generator = join(source, 'tooling/maintenance/workflow-flow.mjs');
const tr = (en, es = `${en} (es)`) => ({ en, es });
const baseData = () => ({
  ui: Object.fromEntries(['pageTitle', 'intro', 'legendOperator', 'legendCoordinator', 'legendHelper', 'legendOptional', 'legendLoop', 'legendGuard', 'guardMark', 'questionOne', 'questionMany', 'questionsHeading', 'yes', 'no', 'answer', 'goTo', 'guardsHeading', 'guardsNote', 'see', 'otherLanguage', 'svgDescription'].map(key => [key, tr(key)])),
  nodes: [
    { id: 'a', kind: 'operator', x: 10, y: 10, label: tr('A'), sub: tr('a'), who: tr('who'), guards: [{ id: 'g1', text: tr('guard'), path: 'cited.md' }],
      questions: [{ id: 'q1', to: 'b', ask: tr('ask'), yes: tr('yes'), no: tr('no'), cites: [{ label: 'cited.md', path: 'cited.md' }] }] },
    { id: 'b', kind: 'helper', optional: true, x: 10, y: 90, label: tr('B <b>'), sub: tr('b'), who: tr('who'), guards: [], questions: [] },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b', label: tr('go') }],
});

const fixture = await mkdtemp(join(tmpdir(), 'isswf-workflow-flow-'));
const dataPath = join(fixture, 'docs/diagrams/flow.json');
const run = (...args) => {
  const result = spawnSync(process.execPath, [generator, '--root', fixture, ...args], { encoding: 'utf8', timeout: 30000 });
  assert.ifError(result.error);
  return result;
};
const expectFailure = (pattern, ...args) => {
  const result = run(...args);
  assert.notEqual(result.status, 0, 'The invalid fixture must be rejected.');
  assert.match(result.stderr, pattern);
};
const writeData = data => writeFile(dataPath, JSON.stringify(data, null, 2));
async function mutate(change, pattern) {
  const data = baseData();
  change(data);
  await writeData(data);
  expectFailure(pattern, '--check');
}
try {
  initRepository(fixture);
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(join(fixture, 'cited.md'), '# Cited\n');
  await writeData(baseData());
  const git = (...args) => assert.equal(spawnSync('git', gitFixtureArgs(['-C', fixture, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args]), { encoding: 'utf8' }).status, 0);
  git('add', '-A');
  git('commit', '-qm', 'fixture');

  expectFailure(/Regenerate/u, '--check');
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0, 'A freshly generated fixture must pass.');

  const html = await readFile(join(fixture, 'docs/en/workflow.html'), 'utf8');
  assert.ok(html.includes(`B ${String.fromCharCode(92)}u003cb>`), 'Data containing markup must be embedded without a raw "<".');
  assert.ok(!html.includes('<b>'), 'Data containing markup must not become markup.');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gu)];
  assert.equal(scripts.length, 1);
  new Script(scripts[0][1]);
  assert.match(await readFile(join(fixture, 'docs/es/workflow.html'), 'utf8'), /\(es\)/u, 'The Spanish page must carry the Spanish text.');

  await writeFile(join(fixture, 'docs/es/workflow.html'), `${await readFile(join(fixture, 'docs/es/workflow.html'), 'utf8')}<!-- stale -->`);
  expectFailure(/Regenerate/u, '--check');
  assert.equal(run().status, 0);

  const image = await readFile(join(fixture, 'docs/en/workflow.svg'), 'utf8');
  assert.ok(image.includes('B &lt;b&gt;') && !image.includes('<b>'), 'Data containing markup must be escaped in the image.');
  assert.ok(!/<script|son[a-z]+=|<a[s>]/u.test(image), 'The image carries nodes and arrows only: no script, handler or link.');
  assert.equal((image.match(/<path d="[^"]*" fill="none"/gu) ?? []).length, 1, 'One arrow per edge.');
  assert.match(await readFile(join(fixture, 'docs/es/workflow.svg'), 'utf8'), /(es)/u, 'The Spanish image must carry the Spanish text.');
  await writeFile(join(fixture, 'docs/es/workflow.svg'), `${await readFile(join(fixture, 'docs/es/workflow.svg'), 'utf8')}<!-- stale -->`);
  expectFailure(/workflow.svg/u, '--check');
  assert.equal(run().status, 0);

  await mutate(data => { delete data.nodes[0].label.es; }, /Every translated field needs exactly en and es/u);
  await mutate(data => { data.nodes[0].questions[0].yes = 'untranslated'; }, /Every translated field needs exactly en and es/u);
  await mutate(data => { data.edges[0].to = 'missing'; }, /Unknown edge endpoint/u);
  await mutate(data => { data.nodes[0].questions[0].to = 'missing'; }, /Unknown destination/u);
  await mutate(data => { data.nodes[0].questions[0].cites[0].path = 'absent.md'; }, /does not exist at HEAD/u);
  await mutate(data => { data.nodes[1].id = 'a'; }, /IDs must be unique/u);

  const real = spawnSync(process.execPath, [generator, '--check'], { encoding: 'utf8', timeout: 30000, cwd: source });
  assert.equal(real.status, 0, real.stderr);
  console.log('PASS workflow flow: current pages and images, generation, missing translation, unknown edge target and destination, missing cited path, duplicate IDs, stale page, stale image, escaped markup, image without script and page script syntax. No browser or network required.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
