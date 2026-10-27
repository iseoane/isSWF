import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile , realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { windowsWorkerProcess, windowsWorkerState } from '../tools/windows-worker-identity.mjs';

if (process.platform !== 'win32') console.log('SKIP native Windows worker identity: not Windows');
else {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf identity ñ '))), script = join(root, 'owned child.mjs');
  await writeFile(script, 'console.log("ready");setInterval(()=>{},1000);\n');
  const nonce = randomBytes(24).toString('hex');
  const child = spawn(process.execPath, [script, '--nonce', nonce], { stdio: ['ignore', 'pipe', 'pipe'] });
  const closed = new Promise((done, reject) => { child.once('error', reject); child.once('close', done); });
  try {
    await new Promise((done, reject) => { child.stdout.once('data', done); child.once('error', reject); });
    const observed = windowsWorkerProcess(child.pid, nonce).process;
    assert(observed); assert.equal(observed.pid, child.pid); assert(observed.argv.includes(script)); assert(observed.argv.includes(nonce));
    assert.equal(windowsWorkerState(observed), 'live');
    assert.throws(() => windowsWorkerProcess(child.pid, '0'.repeat(48)), /mismatch/u);
    for (const changed of [{ creationFileTime: '1'.repeat(18) }, { bootId: '2000-01-01T00:00:00.0000000Z' }, { exe: join(root, 'not-the-executable.exe') }, { argv: [...observed.argv, 'foreign-argument'] }, { pid: -1 }]) assert.equal(windowsWorkerState({ ...observed, ...changed }), 'unknown');
    child.kill('SIGKILL'); await closed;
    assert.equal(windowsWorkerState(observed), 'not-live');
    console.log(JSON.stringify({ status: 'PASS', root, checks: ['actual live identity', 'native argv spaces and Unicode', 'exact nonce element', 'boot/creation/executable/argv mismatch stays unknown', 'owned child cessation'], limits: 'Process identity only, not descendant or recovery proof' }));
  } finally { if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await closed; } }
}
