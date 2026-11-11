import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.cwd();
const root = await mkdtemp(join(tmpdir(), 'isswf-state-publication-'));
const target = join(source, 'tools/state-migration.mjs');
const mover = join(root, 'move.mjs');
await writeFile(mover, `import { createHash } from 'node:crypto';import { readFile } from 'node:fs/promises';import { join } from 'node:path';import { inspectStateMigration, moveState } from ${JSON.stringify(pathToFileURL(target).href)};const project=process.argv[2],store=process.argv[3];const state=await inspectStateMigration(project);const key=createHash('sha256').update(project).digest('hex');const expected=state?.expected??JSON.parse(await readFile(join(store,'state-migrations',key,'S0001/record.json'),'utf8')).expected;console.log(JSON.stringify(await moveState({project,store,id:'S0001',expected,reference:'Fixture has no legacy or external writers',owner:{fixture:true}})));`);
function run(project, store, preload) {
  const result = spawnSync(process.execPath, [...(preload ? ['--import', pathToFileURL(preload).href] : []), mover, project, store], { cwd: root, encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  return result;
}
async function fixture(label) {
  const project = join(root, label), store = join(root, label + '-store');
  await mkdir(join(project, '.factory/initiatives/I0001/jobs/J001'), { recursive: true });
  await writeFile(join(project, '.factory/initiatives/I0001/jobs/J001/brief-r1.md'), 'Historical .factory path and payload stay byte-identical.\n');
  const init = spawnSync('git', ['init', '-q', project], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(init.error); assert.equal(init.status, 0, init.stderr);
  for (const args of [['-C', project, 'add', '-f', '.factory'], ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture']]) {
    const result = spawnSync('git', args, { encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
  }
  return { project, store, bytes: await readFile(join(project, '.factory/initiatives/I0001/jobs/J001/brief-r1.md')) };
}
async function injected(label, code) {
  const test = await fixture(label), preload = join(root, label + '.mjs');
  await writeFile(preload, `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';${code}\nsyncBuiltinESMExports();`);
  const result = run(test.project, test.store, preload);
  assert.notEqual(result.status, 0, `${label} unexpectedly succeeded`);
  assert.match(result.stderr, new RegExp(`injected ${label} failure`, 'u'));
  assert.deepEqual(await readFile(join(test.project, '.factory/initiatives/I0001/jobs/J001/brief-r1.md')), test.bytes);
  await assert.rejects(readFile(join(test.project, '.isswf')),{code:'ENOENT'});
}
let passed = false;
try {
  await injected('file-write', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='wx')handle.writeFile=async()=>{throw Error('injected file-write failure');};return handle;};`);
  await injected('file-sync', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='wx')handle.sync=async()=>{throw Error('injected file-sync failure');};return handle;};`);
  await injected('file-close', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='wx'){const close=handle.close.bind(handle);handle.close=async()=>{await close();throw Error('injected file-close failure');};}return handle;};`);
  if (process.platform === 'linux') {
    await injected('directory-open', `const original=fs.open;fs.open=async(path,...args)=>{if(args[0]==='r'&&String(path).includes('.isswf-transition-stage-'))throw Error('injected directory-open failure');return original(path,...args);};`);
    await injected('directory-sync', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='r'&&(await handle.stat()).isDirectory())handle.sync=async()=>{throw Error('injected directory-sync failure');};return handle;};`);
    await injected('directory-close', `const original=fs.open;fs.open=async(...args)=>{const handle=await original(...args);if(args[1]==='r'&&(await handle.stat()).isDirectory()){const close=handle.close.bind(handle);handle.close=async()=>{await close();throw Error('injected directory-close failure');};}return handle;};`);
  }
  const windows = await fixture('windows-directory-policy'), windowsPreload = join(root, 'windows-directory-policy.mjs');
  await writeFile(windowsPreload, `import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';Object.defineProperty(process,'platform',{value:'win32'});const original=fs.open;fs.open=async(path,...args)=>{if(args[0]==='r'&&String(path).includes('.isswf-transition-stage-'))throw Error('injected windows-directory-policy failure');return original(path,...args);};syncBuiltinESMExports();`);
  const windowsResult = run(windows.project, windows.store, windowsPreload);
  assert.ifError(windowsResult.error); assert.equal(windowsResult.status, 0, `Windows unsupported-directory policy should omit directory flush: ${windowsResult.stderr}`);
  const test = await fixture('portable-success');
  const migrated = run(test.project, test.store);
  assert.ifError(migrated.error); assert.equal(migrated.status, 0, migrated.stderr);
  assert.equal((await readFile(join(test.project, '.isswf/initiatives/I0001/jobs/J001/brief-r1.md'))).toString(), test.bytes.toString());
  await assert.rejects(readFile(join(test.project, '.factory')),{code:'ENOENT'});
  const repeated = run(test.project, test.store);
  assert.ifError(repeated.error); assert.equal(repeated.status, 0, repeated.stderr);
  assert.match(repeated.stdout, /"status":"unchanged"/u);
  assert.equal(await readFile(join(test.project, '.isswf/initiatives/I0001/jobs/J001/brief-r1.md'), 'utf8'), test.bytes.toString());
  passed = true;
  console.log(`PASS ${process.platform} state-migration publication: mandatory file write/sync/close failures, Linux directory open/sync/close refusal, installed-source migration bytes and identical repeat; fault injections are not native Windows or power-loss evidence`);
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained migration publication fixture: ${root}`);
}
