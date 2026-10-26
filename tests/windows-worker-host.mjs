import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runWindowsWorkerTask } from '../tools/windows-worker-host.mjs';

if (process.platform !== 'win32') console.log('SKIP native Windows trusted task host: not Windows');
else {
  const root = await mkdtemp(join(tmpdir(), 'isswf trusted host ñ '));
  const execute = async (id, source, timeoutMs = 3000) => {
    const attemptDir = join(root, id), workspace = join(attemptDir, 'workspace'), taskCopy = join(attemptDir, 'task.mjs'); await mkdir(attemptDir); await mkdir(workspace); await writeFile(taskCopy, source);
    const dispatch = { attemptId: id, workspace, taskCopy, taskSha256: createHash('sha256').update(source).digest('hex'), outputBytes: 1024, timeoutMs };
    const environment = Object.fromEntries(['SystemRoot', 'LOCALAPPDATA', 'PATH'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
    const result = await runWindowsWorkerTask({ binary: process.execPath, dispatch, attemptDir, environment });
    const started = JSON.parse(await readFile(join(attemptDir, 'execution-job-started.json'))); assert.equal(started.dualJobLifetime, true); assert.equal(started.assignedBeforeResume, true); assert.equal(result.stopped, true);
    return { result, workspace, attemptDir };
  };
  const positive = await execute('positive', "import fs from 'node:fs';fs.writeFileSync('result.txt','trusted-positive');console.log('ready');\n");
  assert.equal(positive.result.exitCode, 0); assert.equal(await readFile(join(positive.workspace, 'result.txt'), 'utf8'), 'trusted-positive'); assert.match(Buffer.from(positive.result.stdout, 'base64').toString(), /ready/u);
  const timed = await execute('timeout', 'setInterval(()=>{},1000);\n', 300); assert.equal(timed.result.exitCode, 124); assert.equal(timed.result.timedOut, true);
  const flood = await execute('bounded', "process.stdout.write('x'.repeat(50000));process.stderr.write('y'.repeat(50000));\n"); assert.equal(flood.result.exitCode, 0); assert.equal(Buffer.from(flood.result.stdout, 'base64').length, 1024); assert.equal(Buffer.from(flood.result.stderr, 'base64').length, 1024); assert.equal(flood.result.stdoutTruncated, true); assert.equal(flood.result.stderrTruncated, true);
  console.log(JSON.stringify({ status: 'PASS', root, checks: ['trusted task positive', 'durable startup before resume', 'dual-owner nested Jobs', 'deadline and observed tree cessation', 'separate bounded stdout/stderr'], limits: 'Trusted SDK host only; not a model tool sandbox or normal job/recovery acceptance' }));
}
