import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

if (process.platform !== 'win32') console.log('SKIP native Windows worker lifecycle: not Windows');
else {
  const root = await mkdtemp(join(tmpdir(), 'isswf lifecycle ñ ')), repo = join(root, 'project'), store = join(root, 'runs'); await mkdir(repo);
  const invoke = (binary, args, ok = true) => { const r = spawnSync(binary, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 }); assert.ifError(r.error); if (ok) assert.equal(r.status, 0, r.stderr); else assert.notEqual(r.status, 0); return r; };
  const git = (...args) => invoke('git', ['-C', repo, ...args]).stdout.trim();
  git('init', '-q'); await writeFile(join(repo, 'brief.md'), 'Synthetic trusted task only, no provider.\n'); await writeFile(join(repo, 'result.txt'), 'before'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Pin fixture'); const sha = git('rev-parse', 'HEAD');
  const lifecycle = resolve('tools/worker-lifecycle.mjs'), task = join(root, 'task.mjs'); await writeFile(task, "import fs from 'node:fs';fs.writeFileSync('result.txt','after');console.log('lifecycle-positive');\n");
  const launch = id => ['launch', '--repo', repo, '--input-sha', sha, '--brief', 'brief.md', '--target-base', sha, '--attempt-id', id, '--runs-store', store, '--grant-ref', 'synthetic-local-fixture', '--task-script', task, '--timeout-ms', '3000', '--output-bytes', '1024'];
  const started = JSON.parse(invoke(process.execPath, [lifecycle, ...launch('positive')]).stdout); assert.equal(started.attemptId, 'positive');
  const directory = join(store, 'positive'); let terminal;
  for (let n = 0; n < 300; n++) { try { terminal = JSON.parse(await readFile(join(directory, 'terminal.json'), 'utf8')); break; } catch (error) { if (error.code !== 'ENOENT') throw error; } await new Promise(done => setTimeout(done, 100)); }
  assert(terminal, 'Native lifecycle terminal published'); assert.equal(terminal.outcome, 'success', JSON.stringify(terminal)); assert.equal(terminal.windowsJobCessation, true); assert.equal(terminal.captureIncomplete, false); assert.match(terminal.stdout, /lifecycle-positive/u);
  assert.equal(await readFile(join(directory, 'workspace/result.txt'), 'utf8'), 'after'); assert.equal(await readFile(join(repo, 'result.txt'), 'utf8'), 'before');
  const observed = JSON.parse(invoke(process.execPath, [lifecycle, 'read', '--runs-store', store, '--attempt-id', 'positive']).stdout); assert.equal(observed.state, 'terminal');
  const original = await readFile(join(directory, 'dispatch.json')); invoke(process.execPath, [lifecycle, ...launch('positive')], false); assert.deepEqual(await readFile(join(directory, 'dispatch.json')), original);
  console.log(JSON.stringify({ status: 'PASS', root, checks: ['actual detached lifecycle launch', 'pinned task and dependencies', 'native child startup and complete Job cessation', 'materialized workspace only', 'read-only observation', 'same-ID refusal preserves dispatch'], limits: 'Generic trusted task, not normal Pi job, tool recovery or capacity acceptance' }));
}
