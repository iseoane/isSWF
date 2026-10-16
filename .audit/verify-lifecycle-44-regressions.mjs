import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const cli = resolve(process.argv[2] || '.audit/lifecycle-44-snapshot-v1/payload/tools/worker-lifecycle.mjs');
const seed = JSON.parse(await readFile('.audit/lifecycle-44-fixture.json', 'utf8'));
const root = await mkdtemp(join(tmpdir(), 'isswf-lifecycle44-parent-regression-'));
const repo = join(root, 'repo');
const runs = join(root, 'runs');
await cp(seed.root, repo, { recursive: true });
await mkdir(runs);
const invoke = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 5000, maxBuffer: 200000 });
const args = (id, script, timeout = 2000, output = 1024) => ['launch', '--repo', repo, '--input-sha', seed.inputCheckpoint, '--brief', seed.briefPath, '--target-base', seed.targetBase, '--attempt-id', id, '--runs-store', runs, '--grant-ref', 'parent-disposable-test-only', '--task-script', script, '--timeout-ms', String(timeout), '--output-bytes', String(output)];
const observe = id => {
  const result = invoke(['read', '--runs-store', runs, '--attempt-id', id]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const waitFile = async file => {
  for (let i = 0; i < 150; i++) {
    try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await delay(30);
  }
  throw new Error('owned fixture did not publish terminal within its independent bound');
};
const script = async (name, text) => { const p = join(root, name); await writeFile(p, text); return p; };
const noop = await script('noop.mjs', 'process.exitCode=0;\n');
const repeated = invoke([...args('duplicate-first', noop), '--attempt-id', 'duplicate-second']);
if (repeated.status === 0) await waitFile(join(runs, 'duplicate-second/terminal.json'));
const unicode = await script('unicode.mjs', "process.stdout.write('😀'.repeat(1000));\n");
const u = invoke(args('unicode', unicode, 2000, 257));
assert.equal(u.status, 0, u.stderr);
const uTerminal = await waitFile(join(runs, 'unicode/terminal.json'));
const uRead = observe('unicode');
const delayedDescendant = await script('descendant.mjs', `import{spawn}from'node:child_process';
const c=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});process.stdout.write('ready');setTimeout(()=>process.exit(0),2200)"],{stdio:['ignore','pipe','inherit']});
c.stdout.once('data',()=>{process.stdout.write('descendant-ready');process.exit(0)});
`);
const started = Date.now();
const d = invoke(args('deadline-descendant', delayedDescendant, 200));
assert.equal(d.status, 0, d.stderr);
const dTerminal = await waitFile(join(runs, 'deadline-descendant/terminal.json'));
const elapsedMs = Date.now() - started;
const forged = 'empty-nonce';
const dir = join(runs, forged);
await mkdir(dir);
const copiedDispatch = JSON.parse(await readFile(join(runs, 'unicode/dispatch.json'), 'utf8'));
await writeFile(join(dir, 'dispatch.json'), JSON.stringify({ ...copiedDispatch, attemptId: forged, workspace: join(dir, 'workspace') }));
const stat = fs.readFileSync('/proc/self/stat', 'utf8');
await writeFile(join(dir, 'owner.json'), JSON.stringify({ pid: process.pid, bootId: fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), startTicks: stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/)[19], exe: fs.realpathSync('/proc/self/exe'), nonce: '' }));
const ownerRead = observe(forged);
const checks = [
  { name: 'duplicate option refused', pass: repeated.status !== 0 && /invalid|repeated/u.test(repeated.stderr) && !fs.existsSync(join(runs, 'duplicate-first')) && !fs.existsSync(join(runs, 'duplicate-second')), actual: { exit: repeated.status, stderr: repeated.stderr, stdout: repeated.stdout }, expected: 'nonzero invalid/repeated option, no launch' },
  { name: 'UTF-8 output remains a valid terminal within encoded-byte bound', pass: uRead.state === 'terminal' && Buffer.byteLength(uTerminal.stdout) <= 257, actual: { read: uRead, terminalOutputBytes: Buffer.byteLength(uTerminal.stdout) }, expected: 'terminal; stdout <=257 encoded bytes' },
  { name: 'deadline bounds inherited pipes after leader exits', pass: elapsedMs < 1500 && dTerminal.outcome === 'timeout' && dTerminal.timedOut === true && dTerminal.stdout.includes('descendant-ready'), actual: { elapsedMs, outcome: dTerminal.outcome, exitCode: dTerminal.exitCode }, expected: 'bounded completion well before self-exiting descendant2200ms; 1500ms generous fixture guard, not performance claim' },
  { name: 'empty nonce cannot identify an unrelated live process', pass: ownerRead.state === 'unknown', actual: ownerRead, expected: 'unknown with invalid owner identity' },
];
console.log(JSON.stringify({ root, cli, checks, allPassed: checks.every(c => c.pass), scope: 'Parent-owned independent frozen-candidate regression controls, trusted deterministic Node tasks only. No provider, native model, client isolation or exactly-once proof. Descendant self-terminates at2200ms even if tested deadline fails.' }, null, 2));
if (!checks.every(c => c.pass)) process.exitCode = 1;
