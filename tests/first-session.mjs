import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitFixtureArgs, initRepository } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const generator = join(source, 'tooling/maintenance/first-session.mjs');
const tr = (en, es = `${en} (es)`) => ({ en, es });
const baseData = () => ({
  ui: Object.fromEntries(['sessionTitle', 'sessionDescription', 'simulatedLabel', 'panelTitle', 'panelDescription', 'panelSimulatedLabel'].map(key => [key, tr(key)])),
  session: {
    holdSeconds: 2,
    steps: [
      { id: 'a', kind: 'caption', delay: 0.5, text: tr('1 · One'), source: 'cited.md' },
      { id: 'b', kind: 'you', delay: 1, text: tr('Say <b> & more'), source: 'cited.md' },
      { id: 'c', kind: 'reply', delay: 1, text: tr('Reply'), source: 'cited.md' },
    ],
  },
  panel: {
    source: 'cited.md',
    secondsPerFrame: 3,
    title: 'demo v1 · demo',
    labels: Object.fromEntries(['autoWakeUp', 'tabInitiatives', 'tabAgents', 'tabFiles', 'jobsLine', 'completed', 'inactive'].map(key => [key, tr(key === 'jobsLine' ? 'jobs %d/%d open %d' : key === 'completed' || key === 'inactive' ? `${key} %d` : key)])),
    initiative: { id: 'I1', title: tr('Active') },
    inactive: { id: 'I2', title: tr('Other') },
    jobs: [{ id: 'J1', objective: tr('First') }, { id: 'J2', objective: tr('Second') }],
    frames: [
      { caption: tr('Pending'), first: { status: 'pending' } },
      { caption: tr('Done'), first: { status: 'in-review', pills: [{ role: 'worker', state: 'passed' }, { role: 'reviewer', state: 'running' }] } },
    ],
  },
});

const fixture = await mkdtemp(join(tmpdir(), 'isswf-first-session-'));
const dataPath = join(fixture, 'docs/diagrams/first-session.json');
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

  const session = await readFile(join(fixture, 'docs/en/first-session.svg'), 'utf8');
  assert.ok(session.includes('Say &lt;b&gt; &amp; more') && !session.includes('<b>'), 'Data containing markup must be escaped.');
  assert.ok(!/<script|\son[a-z]+=|<a[\s>]/u.test(session), 'The images carry no script, handler or link.');
  assert.match(session, /simulatedLabel/u, 'The simulated label is visible.');
  assert.match(await readFile(join(fixture, 'docs/es/first-session.svg'), 'utf8'), /\(es\)/u, 'The Spanish image carries the Spanish text.');
  assert.match(await readFile(join(fixture, 'docs/en/initiatives-panel.svg'), 'utf8'), /panelSimulatedLabel/u);

  for (const name of ['docs/es/first-session.svg', 'docs/en/initiatives-panel.svg']) {
    const path = join(fixture, name);
    await writeFile(path, `${await readFile(path, 'utf8')}<!-- stale -->`);
    expectFailure(new RegExp(name.split('/')[2].replace('.', '\.'), 'u'), '--check');
    assert.equal(run().status, 0);
  }

  await mutate(data => { delete data.session.steps[1].text.es; }, /Every translated field needs exactly en and es/u);
  await mutate(data => { data.panel.frames[0].caption = 'untranslated'; }, /Every translated field needs exactly en and es/u);
  await mutate(data => { data.session.steps[0].source = 'absent.md'; }, /does not exist at HEAD/u);
  await mutate(data => { data.session.steps[1].id = 'a'; }, /unique/u);
  await mutate(data => { data.session.steps[1].kind = 'other'; }, /Unknown kind/u);
  await mutate(data => { data.panel.frames[0].first.status = 'done'; }, /unknown status/u);

  const real = spawnSync(process.execPath, [generator, '--check'], { encoding: 'utf8', timeout: 30000, cwd: source });
  assert.equal(real.status, 0, real.stderr);
  console.log('PASS first session: current images, generation, missing translation, missing cited path, duplicate step, unknown kind and status, stale session image, stale panel image, escaped markup and no script. No browser or network required.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
