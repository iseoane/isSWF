import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, isAbsolute } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [taskInput, mode, invocationMarker] = process.argv.slice(2);
assert(isAbsolute(taskInput), 'explicit absolute trusted task required');
assert(['control', 'real'].includes(mode), 'explicit control|real mode required');
assert(isAbsolute(invocationMarker), 'exclusive invocation marker required');
const root = await mkdtemp(join(tmpdir(), 'isswf-pi-worker44-teardown-'));
const cli = resolve('tools/worker-lifecycle.mjs');
const checker = resolve('.audit/verify-pi-worker-44-parent.mjs');
const fixture = JSON.parse(await readFile('.audit/pi-worker-44-fixture.json', 'utf8'));
const taskBytes = await readFile(taskInput);
const hash = b => createHash('sha256').update(b).digest('hex');
const runs = join(root, 'runs');
for (const name of ['home', 'agent', 'runs']) await mkdir(join(root, name));
await writeFile(join(root, 'agent/settings.json'), '{}\n');
const gatedTask = join(root, 'trusted-gated-task.mjs');
const gate = `const gateFs=await import('node:fs/promises'),gatePath=await import('node:path');let gateReady=false;for(let gateI=0;gateI<400;gateI++){try{await gateFs.access(gatePath.join(gatePath.dirname(process.argv[2]),'parent-release'));gateReady=true;break;}catch{}await new Promise(r=>setTimeout(r,20));}if(!gateReady)process.exit(9);\n`;
await writeFile(gatedTask, gate + taskBytes.toString().replace(/^#![^\n]*(?:\n|$)/, ''), { flag: 'wx', mode: 0o600 });
const syntax = spawnSync(process.execPath, ['--check', gatedTask], { encoding: 'utf8', timeout: 5000, maxBuffer: 16384 });
assert.equal(syntax.status, 0, 'gated trusted task must pass Node syntax checking before launch');
const args = [process.execPath, cli, 'launch', '--repo', fixture.root, '--input-sha', fixture.inputCheckpoint, '--brief', fixture.briefPath, '--target-base', fixture.targetBase, '--attempt-id', 'J602-pi-teardown', '--runs-store', runs, '--grant-ref', mode === 'real' ? 'operator-approved-one-LunaHigh-disposable-sandbox-task' : 'parent-owned-offline-control', '--task-script', gatedTask, '--timeout-ms', '120000', '--output-bytes', '16384'];
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
await writeFile(invocationMarker, JSON.stringify({ mode, root, taskSha256: hash(taskBytes), gatedTaskSha256: hash(await readFile(gatedTask)) }) + '\n', { flag: 'wx', mode: 0o600 });
const pi = spawn('pi', ['--mode', 'rpc', '--no-session', '--offline', '--no-mcp', '--no-approve', '--no-extensions', '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files'], { cwd: root, env: { PATH: process.env.PATH, HOME: join(root, 'home'), PI_CODING_AGENT_DIR: join(root, 'agent'), PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', LANG: 'C.UTF-8' }, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
let stdout = '';
pi.stdout.on('data', bytes => { stdout += bytes; if (Buffer.byteLength(stdout) > 128000) pi.kill('SIGKILL'); });
pi.stderr.resume();
const exited = new Promise((yes, no) => { pi.once('error', no); pi.once('exit', (code, signal) => yes({ code, signal })); });
const bound = setTimeout(() => { try { process.kill(-pi.pid, 'SIGKILL'); } catch {} }, 12000);
const run = args => {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000, maxBuffer: 16384 });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
try {
  pi.stdin.write(JSON.stringify({ id: 'launch', type: 'bash', command: args.map(quote).join(' '), excludeFromContext: true }) + '\n');
  let response;
  for (let i = 0; i < 400; i++) {
    response = stdout.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).find(row => row?.id === 'launch' && row.type === 'response');
    if (response) break;
    await delay(20);
  }
  assert.equal(response?.success, true, 'isolated Pi must accept the launch command');
  assert.equal(response.data.exitCode, 0);
  const launch = JSON.parse(response.data.output.trim());
  pi.stdin.end();
  assert.equal((await exited).code, 0);
  assert.throws(() => process.kill(pi.pid, 0), { code: 'ESRCH' });
  clearTimeout(bound);
  const observe = () => run([cli, 'read', '--runs-store', runs, '--attempt-id', launch.attemptId]);
  let before;
  for (let i = 0; i < 100; i++) { before = observe(); if (before.state === 'running') break; await delay(20); }
  assert.equal(before.state, 'running');
  const checkpoint = join(root, 'before.json');
  run([checker, 'before', join(launch.attemptDir, 'workspace'), checkpoint, JSON.stringify(fixture.writePaths)]);
  await writeFile(join(launch.attemptDir, 'parent-release'), 'Initiating Pi has exited; task may start.\n', { flag: 'wx' });
  let after;
  for (let i = 0; i < 480; i++) { after = observe(); if (after.state === 'terminal') break; await delay(250); }
  const evidence = { mode, root, taskSha256: hash(taskBytes), gatedTaskSha256: hash(await readFile(gatedTask)), piExitedBeforeRelease: true, beforeState: before.state, after };
  await writeFile(join(root, 'observation.json'), JSON.stringify(evidence, null, 2) + '\n');
  assert.equal(after.state, 'terminal', 'lifecycle must eventually publish terminal evidence');
  assert.equal(after.terminal.outcome, 'success', 'task must finish before the outer deadline');
  const outcome = run([checker, 'after', join(launch.attemptDir, 'workspace'), checkpoint]);
  console.log(JSON.stringify({ status: 'PASS', ...evidence, independentOutcome: outcome, scope: 'Actual isolated initiating Pi exit before release; project outcome verified separately inside bwrap. Provider attribution and adapter checks require the task result, not this launcher.' }));
} finally {
  clearTimeout(bound);
  if (pi.exitCode === null && pi.signalCode === null) pi.kill('SIGKILL');
}
