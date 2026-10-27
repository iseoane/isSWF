import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, symlink, link , realpath } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createWindowsToolRunner } from '../tools/windows-tool-sandbox.mjs';

if (process.platform !== 'win32') console.log('SKIP Windows lifetime and alias controls: not Windows');
else {
  let binary = process.env.ISSWF_TEST_WINDOWS_BINARY;
  if (!binary && process.env.ISSWF_PLATFORM_ROOT) {
    const report = JSON.parse(await readFile(join(process.env.ISSWF_PLATFORM_ROOT, 'platform-report.json'), 'utf8'));
    binary = join(report.installed, 'bin/isswf.exe');
  }
  assert(binary, 'Supply the compiled Windows artifact'); binary = resolve(binary);
  const hash = createHash('sha256').update(await readFile(binary)).digest('hex');
  const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf lifetime ñ '))), factory = join(root, 'factory'), secret = join(root, 'secret');
  await mkdir(factory); await writeFile(secret, 'synthetic-only');
  for (const kind of ['junction', 'hardlink']) {
    const attempt = join(root, kind), work = join(attempt, 'work'); await mkdir(attempt); await mkdir(work);
    if (kind === 'junction') { const target = join(root, 'alias-target'); await mkdir(target); await writeFile(join(target, 'canary'), 'unchanged'); await symlink(target, join(work, 'alias'), 'junction'); }
    else await link(secret, join(work, 'alias.txt'));
    const runner = await createWindowsToolRunner({ work, factoryRoot: factory, nodeBinary: binary, binarySha256: hash });
    await assert.rejects(runner('echo MUST-NOT-RUN'), /controller failed/u);
    assert.equal((await readdir(runner.paths.records)).some(name => name.endsWith('.started.json')), false);
    await assert.rejects(runner('echo MUST-NOT-RETRY'), /unresolved/u);
    assert.equal(await readFile(secret, 'utf8'), 'synthetic-only');
  }
  const interrupted = join(root, 'startup-conflict'), interruptedWork = join(interrupted, 'work'); await mkdir(interrupted); await mkdir(interruptedWork);
  const interruptedRunner = await createWindowsToolRunner({ work: interruptedWork, factoryRoot: factory, nodeBinary: binary, binarySha256: hash });
  const conflict = join(interruptedRunner.paths.records, '000001.started.json'); await writeFile(conflict, 'owned-conflict\n');
  await assert.rejects(interruptedRunner('echo MUST-NOT-RUN>startup-marker'), /controller failed/u);
  assert.equal(await readFile(conflict, 'utf8'), 'owned-conflict\n');
  await assert.rejects(readFile(join(interruptedWork, 'startup-marker')), error => error.code === 'ENOENT');
  await assert.rejects(interruptedRunner('echo MUST-NOT-RETRY'), /unresolved/u);
  const attempt = join(root, 'parent-death'), work = join(attempt, 'work'); await mkdir(attempt); await mkdir(work);
  const ready = join(attempt, 'ready.json'), script = join(attempt, 'controller.mjs');
  await writeFile(join(factory, 'alive.mjs'), "import fs from 'node:fs';let n=0;const tick=()=>fs.writeFileSync('alive.json',JSON.stringify({pid:process.pid,n:++n}));tick();setInterval(tick,20);\n");
  await writeFile(script, `import {createWindowsToolRunner} from ${JSON.stringify(new URL('../tools/windows-tool-sandbox.mjs', import.meta.url).href)};import fs from 'node:fs/promises';const r=await createWindowsToolRunner(${JSON.stringify({ work, factoryRoot: factory, nodeBinary: binary, binarySha256: hash })});await fs.writeFile(${JSON.stringify(ready)},JSON.stringify(r.paths));await r(${JSON.stringify('node "' + join(factory, 'alive.mjs') + '"')},10000);\n`);
  const owner = spawn(process.execPath, [script], { stdio: ['ignore', 'ignore', 'pipe'] }); let stderr = ''; owner.stderr.on('data', bytes => { stderr += bytes; });
  const closed = new Promise(done => owner.once('close', done));
  const waitFor = async callback => { for (let n = 0; n < 500; n++) { try { const value = await callback(); if (value) return value; } catch (error) { if (error.code !== 'ENOENT') throw error; } await new Promise(done => setTimeout(done, 20)); } throw Error('Lifetime positive/cessation control timed out: ' + stderr); };
  try {
    const alive = JSON.parse(await waitFor(() => readFile(join(work, 'alive.json'), 'utf8'))); assert(Number.isInteger(alive.pid) && alive.pid > 0);
    const paths = JSON.parse(await readFile(ready, 'utf8'));
    const started = JSON.parse(await readFile(join(paths.records, '000001.started.json'), 'utf8')); assert.equal(started.jobAssignedBeforeResume, true);
    const watcher = spawn(join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-Command', '$p=[Diagnostics.Process]::GetProcessById(' + alive.pid + ');$null=$p.Handle;[Console]::WriteLine("watch-ready");[Console]::Out.Flush();if($p.WaitForExit(10000)){[Console]::WriteLine("confirmed-exit")}else{exit 2}'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let evidence = '', watchError = ''; watcher.stdout.on('data', bytes => { evidence += bytes; }); watcher.stderr.on('data', bytes => { watchError += bytes; });
    const watchClosed = new Promise(done => watcher.once('close', done));
    try {
      await waitFor(async () => evidence.includes('watch-ready'));
      assert.equal(owner.kill('SIGKILL'), true); await closed;
      assert.equal(await watchClosed, 0, watchError); assert.match(evidence, /confirmed-exit/u);
      const stopped = await readFile(join(work, 'alive.json'), 'utf8'); await new Promise(done => setTimeout(done, 250)); assert.equal(await readFile(join(work, 'alive.json'), 'utf8'), stopped);
    } finally { if (watcher.exitCode === null && watcher.signalCode === null) { watcher.kill('SIGKILL'); await watchClosed; } }
    console.log(JSON.stringify({ status: 'PASS', root, checks: ['junction/hardlink refusal before startup', 'no replay after failed controller', 'startup publication conflict prevents execution and overwrite', 'actual child startup positive', 'startup recorded before execution', 'SDK owner death stops active tool confirmed by pre-opened native process handle'], limits: 'Abrupt owner death may also kill controller; missing completion/profile cleanup is retained, not fabricated. No real SDK/provider or normal job recovery admission.' }));
  } finally { if (owner.exitCode === null && owner.signalCode === null) { owner.kill('SIGKILL'); await closed; } }
}
