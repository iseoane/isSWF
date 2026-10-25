import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const fixture = await mkdtemp(join(tmpdir(), 'isswf-workflow-diagrams-'));
const files = ['docs/diagrams/workflow.json', 'docs/diagrams/workflow.generated.json', 'docs/en/workflow.svg', 'docs/es/workflow.svg', 'docs/en/workflow.html', 'docs/es/workflow.html', 'tooling/maintenance/workflow-diagrams.mjs'];
function check(expected) {
  const result = spawnSync(process.execPath, [join(fixture, 'tooling/maintenance/workflow-diagrams.mjs'), '--check'], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  if (expected) {
    assert.notEqual(result.status, 0, 'The invalid fixture must be rejected.');
    assert.match(result.stderr, expected);
  } else assert.equal(result.status, 0, result.stderr);
}
async function mutate(path, change, expected) {
  const target = join(fixture, path);
  const bytes = await readFile(target, 'utf8');
  await writeFile(target, change(bytes));
  check(expected);
  await writeFile(target, bytes);
}
const changeSource = change => bytes => {
  const value = JSON.parse(bytes);
  change(value);
  return JSON.stringify(value);
};
try {
  for (const path of files) {
    await mkdir(dirname(join(fixture, path)), { recursive: true });
    await cp(join(source, path), join(fixture, path));
  }
  check();
  await mutate('docs/diagrams/workflow.json', changeSource(value => { delete value.workflow.meta.title.es; }), /Every translated field needs exactly en and es/u);
  await mutate('docs/diagrams/workflow.json', changeSource(value => { value.workflow.cards[0].items[0].en += ' Changed.'; }), /Regenerate diagrams after editing/u);
  await mutate('docs/diagrams/workflow.json', changeSource(value => { value.overview.rows[0].steps[0].node = 'missing'; }), /Unknown overview node/u);
  await mutate('docs/diagrams/workflow.json', changeSource(value => { value.workflow.nodes.push(value.workflow.nodes[0]); }), /Node IDs must be unique/u);
  await mutate('docs/es/workflow.svg', bytes => `${bytes}<!-- changed -->`, /Regenerate/u);
  await mutate('docs/en/workflow.html', bytes => `${bytes}<!-- changed -->`, /Artifact changed/u);
  check();
  console.log('PASS workflow diagrams: shared bilingual source, current SVG and HTML, missing translation, stale source, invalid overview reference, duplicate IDs and artifact tampering. No Archify, browser or network required.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
