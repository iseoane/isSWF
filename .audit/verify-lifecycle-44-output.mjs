import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const cli = resolve(process.argv[2] || '.audit/lifecycle-44-snapshot-v2/payload/tools/worker-lifecycle.mjs');
const source = await readFile(cli, 'utf8');
const start = source.indexOf('  const textOutput = ');
const end = source.indexOf('\n  };', start) + '\n  };'.length;
assert.ok(start >= 0 && end > start, 'the exact frozen text-output helper must be present');
const helper = source.slice(start, end);
const child = spawnSync(process.execPath, ['--input-type=module', '-e', `${helper}\nconst result=textOutput(Buffer.alloc(65536,255),true,65536);console.log(JSON.stringify({bytes:Buffer.byteLength(result),withinBound:Buffer.byteLength(result)<=65536}));`], { encoding: 'utf8', timeout: 2500, maxBuffer: 4096 });
const parsed = child.status === 0 ? JSON.parse(child.stdout) : null;
const passed = child.status === 0 && parsed.withinBound === true;
console.log(JSON.stringify({ cli, passed, status: child.status, signal: child.signal, errorCode: child.error?.code ?? null, result: parsed, inputBytes: 65536, outerSafetyBoundMs: 2500, scope: 'Exact frozen output-helper unit with valid binary task output and supported cap. Outer timeout is a safety/control failure, not a speed benchmark or full lifecycle execution. The owned pure helper subprocess has no descendants.' }, null, 2));
if (!passed) process.exitCode = 1;
