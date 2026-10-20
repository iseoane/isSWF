import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer, connect } from 'node:net';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { runDiagnosticProbes, validateProbes, evidenceDigest } = await import(pathToFileURL(join(source, 'tools/diagnostic-probes.mjs')));
assert.throws(() => validateProbes([]));
assert.throws(() => validateProbes([{ name: 'bad', command: 'echo\nunsafe', expectedExitCode: 0 }]));
assert.throws(() => validateProbes(Array.from({ length: 4 }, (_, i) => ({ name: 'p' + i, command: 'true', expectedExitCode: 0 }))));
const deadlineRoot = await mkdtemp(join(tmpdir(), 'isswf-probe-deadline-'));
const priorPath = process.env.PATH;
try {
  const evidence = join(deadlineRoot, 'evidence'); await mkdir(evidence); await writeFile(join(evidence, 'original'), 'retained');
  const pin = await evidenceDigest(evidence);
  await writeFile(join(evidence, 'original'), 'changed'); assert.notEqual(await evidenceDigest(evidence), pin);
  await symlink(join(evidence, 'original'), join(evidence, 'alias')); await assert.rejects(evidenceDigest(evidence), /regular-evidence/u);
  await rm(join(evidence, 'alias')); await link(join(evidence, 'original'), join(evidence, 'hard-alias'));
  await assert.rejects(evidenceDigest(evidence), /single-link-evidence/u);
  await assert.rejects(evidenceDigest('/tmp'), /canonical-temporary/u);
  const project = join(deadlineRoot, 'project'); await mkdir(project); await mkdir(join(project, '.git'));
  await writeFile(join(deadlineRoot, 'git'), '#!' + process.execPath + '\nAtomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1000);\n', { mode: 0o755 });
  process.env.PATH = deadlineRoot + ':' + priorPath;
  const started = Date.now();
  await assert.rejects(runDiagnosticProbes({ targetRepo: project, targetBase: '1'.repeat(40), probes: [{ name: 'unused', command: 'true', expectedExitCode: 0 }], deadlineAt: started + 80 }));
  assert(Date.now() - started < 800, 'Git preflight exceeded the whole-probe deadline');
} finally { process.env.PATH = priorPath; await rm(deadlineRoot, { recursive: true, force: true }); }
if (!process.argv.includes('--sandbox')) console.log('PASS diagnostic probe input boundaries; actual Linux/bwrap isolation requires the explicit --sandbox test');
else {
  const root = await mkdtemp(join(tmpdir(), 'isswf-diagnostic-probes-')), project = join(root, 'project'), outside = join(root, 'outside.txt');
  const listener = createServer(socket => socket.end('host-positive'));
  const git = (...args) => { const run = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr); return run.stdout.trim(); };
  try {
    await mkdir(project); await writeFile(outside, 'outside-canary-unchanged'); git('init', '-q');
    await new Promise(done => listener.listen(0, '127.0.0.1', done)); const port = listener.address().port;
    const positive = await new Promise((done, reject) => { const socket = connect(port, '127.0.0.1'); let text = ''; socket.on('data', bytes => text += bytes); socket.on('end', () => done(text)); socket.on('error', reject); });
    assert.equal(positive, 'host-positive');
    await writeFile(join(project, 'probe.mjs'), `import fs from 'node:fs';import net from 'node:net';const r={environmentAbsent:process.env.ISSWF_DIAGNOSTIC_SECRET===undefined};for(const[k,fn]of Object.entries({outside:()=>fs.readFileSync(${JSON.stringify(outside)}),workspaceWrite:()=>fs.writeFileSync('/work/changed','bad'),gitHidden:()=>fs.readFileSync('/work/.git/config')})){try{fn();r[k]='unexpected'}catch(e){r[k]=e.code}}const socket=net.connect(${port},'127.0.0.1');socket.setTimeout(500);socket.on('connect',()=>{r.network='unexpected';socket.destroy()});socket.on('error',e=>{r.network=e.code});setTimeout(()=>{socket.destroy();console.log(JSON.stringify(r))},600);\n`);
    git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'probe fixture'); const targetBase = git('rev-parse', 'HEAD');
    process.env.ISSWF_DIAGNOSTIC_SECRET = 'synthetic-never-mounted';
    const request = { targetRepo: project, targetBase, probes: [{ name: 'boundary', command: 'node probe.mjs', expectedExitCode: 0 }], deadlineAt: Date.now() + 20000 };
    const fsmonitorMarker=join(root,'fsmonitor-must-not-run'); git('config','core.fsmonitor','touch '+fsmonitorMarker);
    const actual = await runDiagnosticProbes(request);
    await assert.rejects(readFile(fsmonitorMarker), {code:'ENOENT'}); git('config','--unset','core.fsmonitor');
    assert.equal(actual[0].expectationMatched, true);
    assert.deepEqual(JSON.parse(actual[0].stdout), { environmentAbsent: true, outside: 'ENOENT', workspaceWrite: 'EROFS', gitHidden: 'ENOENT', network: 'ECONNREFUSED' });
    assert.equal(await readFile(outside, 'utf8'), 'outside-canary-unchanged'); assert.equal(git('status', '--porcelain'), '');
    const evidence = { path: outside, sha256: await evidenceDigest(outside) };
    const observed = await runDiagnosticProbes({ ...request, evidence, deadlineAt: Date.now() + 20000, probes: [{ name: 'original-evidence', command: `node -e 'const f=require("node:fs");console.log(f.readFileSync(${JSON.stringify(outside)},"utf8"));try{f.writeFileSync(${JSON.stringify(outside)},"bad");process.exitCode=1}catch(e){console.log(e.code)}'`, expectedExitCode: 0 }] });
    assert.equal(observed[0].stdout, 'outside-canary-unchanged\nEROFS\n');
    await assert.rejects(runDiagnosticProbes({ ...request, evidence: { ...evidence, sha256: '0'.repeat(64) }, deadlineAt: Date.now() + 20000 }), /evidence-pin-mismatch/u);
    await assert.rejects(runDiagnosticProbes({ ...request, deadlineAt: Date.now() + 80, probes: [{ name: 'hang', command: 'node -e "setInterval(()=>{},1000)"', expectedExitCode: 0 }] }));
    await assert.rejects(runDiagnosticProbes({ ...request, probes: [{ name: 'overflow', command: 'node -e "console.log(\'x\'.repeat(9000))"', expectedExitCode: 0 }] }));
    await writeFile(join(project, 'dirty'), 'untracked'); await assert.rejects(runDiagnosticProbes(request), /clean-pinned/u);
    console.log('PASS actual diagnostic bwrap: real host positive control, isolated network/home/env/Git, readonly project, unchanged canary and Git tree, timeout/output/dirty-target refusal; no model calls');
  } finally { delete process.env.ISSWF_DIAGNOSTIC_SECRET; await new Promise(done => listener.close(done)); await rm(root, { recursive: true, force: true }); }
}
