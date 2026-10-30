import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const root = await mkdtemp(join(tmpdir(), 'isswf-plan-publication-'));
const proposal = join(root, 'proposal.json');
const input = { version: 1, initiative: 'I0042', title: 'First plan', type: 'maintenance', jobs: [{ id: 'J001', objective: 'Observe publication', status: 'pending', dependsOn: [], acceptance: ['No provider calls'], blocker: 'None', nextStep: 'Read plan', evidence: [] }] };
await writeFile(proposal, JSON.stringify(input));
function run(project, grant, preload) {
  const result = spawnSync(process.execPath, [...(preload ? ['--import', pathToFileURL(preload).href] : []), join(source, 'tools/isswf-plan.mjs'), 'prepare', '--project', project, '--initiative', 'I0042', '--proposal', proposal, '--grant', grant], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  return result;
}
function gitInit(project) {
  const result = spawnSync('git', ['init', '-q', project], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `git init failed\n${result.stderr}\n${result.stdout}`);
}
async function fixture(name) {
  const project = join(root, name), grant = join(root, name + '-grant.json');
  await mkdir(project);
  gitInit(project);
  await writeFile(grant, JSON.stringify({ version: 1, project: await realpath(project), initiative: 'I0042', reference: 'Synthetic plan-only publication check', permissions: ['plan'] }));
  return { project, grant, path: join(project, '.factory/initiatives/I0042/plan.md'), lock: join(project, '.factory/initiatives/I0042/.plan-write') };
}
async function retainedFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await retainedFiles(path));
    else files.push({ path, bytes: await readFile(path) });
  }
  return files;
}
let expectedPlanBytes;
async function injected(name, phase, hook) {
  const target = await fixture(name), preload = join(root, name + '.mjs');
  await writeFile(preload, `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';${hook}\nsyncBuiltinESMExports();`);
  const failed = run(target.project, target.grant, preload);
  assert.notEqual(failed.status, 0, `${name} unexpectedly succeeded`);
  assert.match(failed.stderr, new RegExp(`injected ${name} failure`, 'u'));
  assert.match(failed.stderr, new RegExp(`failed ${phase} publication; retained plan write claim requires inspection, no automatic recovery`, 'u'));
  if (phase === 'before') await assert.rejects(readFile(target.path), { code: 'ENOENT' });
  else assert.deepEqual(await readFile(target.path), expectedPlanBytes);
  const claim = await retainedFiles(target.lock);
  assert.ok(await readdir(target.lock), `${name} claim directory must remain`);
  assert.ok(claim.every(file => file.bytes.equals(expectedPlanBytes)), `${name} must preserve every available pending byte`);
  if (['file-sync', 'before-publication', 'after-publication'].includes(name)) assert.ok(claim.length > 0, `${name} must retain pending plan bytes`);
  const retry = run(target.project, target.grant);
  assert.notEqual(retry.status, 0, 'an interrupted claim must not become reused success');
  assert.match(retry.stderr, /Existing plan write claim requires inspection/u);
  assert.deepEqual(await retainedFiles(target.lock), claim);
}

let passed = false;
try {
  const good = await fixture('successful');
  const created = run(good.project, good.grant);
  assert.ifError(created.error);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).status, 'prepared');
  const bytes = await readFile(good.path);
  expectedPlanBytes = bytes;
  const repeated = run(good.project, good.grant);
  assert.ifError(repeated.error);
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(JSON.parse(repeated.stdout).status, 'reused');
  assert.deepEqual(await readFile(good.path), bytes);
  await assert.rejects(readdir(good.lock), { code: 'ENOENT' });

  for (const name of ['empty-claim', 'uncertain-claim']) {
    const target = await fixture(name);
    await mkdir(dirname(target.lock), { recursive: true });
    await mkdir(target.lock);
    if (name === 'uncertain-claim') await writeFile(join(target.lock, 'pending'), 'uncertain bytes');
    const refused = run(target.project, target.grant);
    assert.ifError(refused.error);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /Existing plan write claim requires inspection/u);
    assert.equal((await retainedFiles(target.lock)).length, name === 'empty-claim' ? 0 : 1);
  }

  await injected('file-sync', 'before', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='wx')handle.sync=async()=>{throw Error('injected file-sync failure');};return handle;};`);
  await injected('before-publication', 'before', `fs.link=async()=>{throw Error('injected before-publication failure');};`);
  await injected('after-publication', 'after', `const original=fs.unlink;fs.unlink=async path=>{if(String(path).includes('.plan-write'))throw Error('injected after-publication failure');return original(path);};`);
  if (process.platform === 'linux') {
    await injected('directory-open', 'after', `const original=fs.open;fs.open=async(path,...args)=>{if(args[0]==='r'&&String(path).includes('I0042'))throw Error('injected directory-open failure');return original(path,...args);};`);
    await injected('directory-sync', 'after', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='r'&&(await handle.stat()).isDirectory())handle.sync=async()=>{throw Error('injected directory-sync failure');};return handle;};`);
  }
  passed = true;
  console.log('PASS native plan publication/repeat, empty and uncertain claim refusal, fatal file flush, pre/post-publication failure preservation, and Linux directory-open/sync failures; no providers or power-loss claim');
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained publication fixture: ${root}`);
}
