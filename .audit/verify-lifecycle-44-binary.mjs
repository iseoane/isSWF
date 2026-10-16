import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const cli = resolve(process.argv[2] || '.audit/lifecycle-44-snapshot-v2/payload/tools/worker-lifecycle.mjs');
const seed = JSON.parse(await readFile('.audit/lifecycle-44-fixture.json', 'utf8'));
const root = await mkdtemp(join(tmpdir(), 'isswf-lifecycle44-binary-control-'));
const repo = join(root, 'repo'), runs = join(root, 'runs'), task = join(root, 'binary.mjs');
await cp(seed.root, repo, { recursive: true });
await mkdir(runs);
await writeFile(task, 'process.stdout.write(Buffer.alloc(65536,255));\n');
const launched = spawnSync(process.execPath, [cli, 'launch', '--repo', repo, '--input-sha', seed.inputCheckpoint, '--brief', seed.briefPath, '--target-base', seed.targetBase, '--attempt-id', 'binary', '--runs-store', runs, '--grant-ref', 'parent-owned-binary-publication-control', '--task-script', task, '--timeout-ms', '1000', '--output-bytes', '65536'], { encoding: 'utf8', timeout: 3000 });
assert.equal(launched.status, 0, launched.stderr);
const launch = JSON.parse(launched.stdout);
const terminalPath = join(launch.attemptDir, 'terminal.json');
let terminal;
for (let i = 0; i < 125; i++) {
  try { terminal = JSON.parse(await readFile(terminalPath, 'utf8')); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await delay(20);
}
let fixtureHostTerminated = false;
if (!terminal) {
  const owner = JSON.parse(await readFile(join(launch.attemptDir, 'owner.json'), 'utf8'));
  assert.equal(owner.pid, launch.launchedPid);
  assert.match(owner.nonce, /^[0-9a-f]{48}$/u);
  const stat = fs.readFileSync(`/proc/${owner.pid}/stat`, 'utf8');
  assert.equal(stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/)[19], owner.startTicks);
  assert.equal(fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), owner.bootId);
  assert.equal(fs.realpathSync(`/proc/${owner.pid}/exe`), owner.exe);
  assert.ok(fs.readFileSync(`/proc/${owner.pid}/cmdline`, 'utf8').split('\0').includes(owner.nonce));
  process.kill(owner.pid, 'SIGKILL');
  fixtureHostTerminated = true;
}
let observation = null;
if (terminal) {
  const r = spawnSync(process.execPath, [cli, 'read', '--runs-store', runs, '--attempt-id', 'binary'], { encoding: 'utf8', timeout: 3000 });
  assert.equal(r.status, 0, r.stderr); observation = JSON.parse(r.stdout);
}
const passed = terminal?.outcome === 'success' && observation?.state === 'terminal' && Buffer.byteLength(terminal.stdout) <= 65536 && terminal.stdoutTruncated === true && terminal.stdout.startsWith('[...truncated...]');
console.log(JSON.stringify({ root, cli, passed, terminalPublished: Boolean(terminal), observationState: observation?.state ?? null, outputBytes: terminal ? Buffer.byteLength(terminal.stdout) : null, omissionMarked: terminal?.stdoutTruncated ?? null, fixtureHostTerminated, scope: 'Actual frozen CLI with supported binary stdout/cap. Parent-owned host terminated only on failed publication guard after matching launched PID, boot, start ticks, executable and exact nonce. Pure task has no descendants. Not production reader signaling, native model, performance benchmark or recovery proof.' }, null, 2));
if (!passed) process.exitCode = 1;
