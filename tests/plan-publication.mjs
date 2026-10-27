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
  assert.ifError(result.error); return result;
}
async function fixture(name) {
  const project = join(root, name), grant = join(root, name + '-grant.json');
  await mkdir(project); assert.equal(spawnSync('git', ['init', '-q', project]).status, 0);
  await writeFile(grant, JSON.stringify({ version: 1, project: await realpath(project), initiative: 'I0042', reference: 'Synthetic plan-only publication check', permissions: ['plan'] }));
  return { project, grant, path: join(project, '.factory/initiatives/I0042/plan.md'), lock: join(project, '.factory/initiatives/I0042/.plan-write') };
}
let passed = false;
try {
  const good = await fixture('successful');
  const created = run(good.project, good.grant);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).status, 'prepared');
  const bytes = await readFile(good.path);
  assert.equal(JSON.parse(run(good.project, good.grant).stdout).status, 'reused');
  assert.deepEqual(await readFile(good.path), bytes);
  await assert.rejects(readdir(good.lock), { code: 'ENOENT' });
  for (const phase of ['file-sync', 'after-link', ...(process.platform === 'linux' ? ['directory-sync'] : [])]) {
    const target = await fixture(phase), preload = join(root, phase + '.mjs');
    const code = phase === 'after-link'
      ? `const original=fs.unlink; fs.unlink=async path=>{if(String(path).includes('.plan-write')) throw Error('injected after-link failure');return original(path);};`
      : `const original=fs.open; fs.open=async (...args)=>{const handle=await original(...args);if(${phase === 'file-sync' ? "args[1]==='wx'" : "args[1]==='r' && (await handle.stat()).isDirectory()"}) handle.sync=async()=>{throw Error('injected ${phase} failure');};return handle;};`;
    await writeFile(preload, `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';${code}syncBuiltinESMExports();`);
    const failed = run(target.project, target.grant, preload);
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, new RegExp('injected ' + phase + ' failure'));
    assert.match(failed.stderr, phase === 'file-sync' ? /before publication/u : /after publication/u);
    assert.match(failed.stderr, /retained.*claim/u);
    assert.ok((await readdir(target.lock)).length >= (phase === 'file-sync' || phase === 'after-link' ? 1 : 0));
    if (phase === 'file-sync') await assert.rejects(readFile(target.path), { code: 'ENOENT' });
    else assert.deepEqual(await readFile(target.path), bytes);
    const retry = run(target.project, target.grant);
    assert.notEqual(retry.status, 0, 'An interrupted claim must not become reused success');
    assert.match(retry.stderr, /claim requires inspection/u);
  }
  passed = true;
  console.log('PASS native plan publication/repeat, fatal file-sync and post-publication failures, retained claims and blocked automatic retries; no providers');
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained publication fixture: ${root}`);
}
