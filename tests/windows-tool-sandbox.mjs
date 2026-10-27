import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir , realpath } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import net from 'node:net';
import { createWindowsToolRunner } from '../tools/windows-tool-sandbox.mjs';

if (process.platform !== 'win32') {
  console.log('SKIP native Windows LPAC/Job controls: not Windows');
} else {
  let binary = process.env.ISSWF_TEST_WINDOWS_BINARY;
  if (!binary && process.env.ISSWF_PLATFORM_ROOT) {
    const report = JSON.parse(await readFile(join(process.env.ISSWF_PLATFORM_ROOT, 'platform-report.json'), 'utf8'));
    binary = join(report.installed, 'bin/isswf.exe');
  }
  assert(binary, 'Supply the exact compiled Windows artifact via ISSWF_TEST_WINDOWS_BINARY or ISSWF_PLATFORM_ROOT');
  binary = resolve(binary);
  const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf sandbox spaces ñ ')));
  const attempt = join(root, 'attempt'), work = join(attempt, 'work'), factory = join(root, 'factory');
  await mkdir(attempt); await mkdir(work); await mkdir(factory);
  const secret = join(root, 'host-secret.json'); await writeFile(secret, 'synthetic-private-only');
  await writeFile(join(factory, 'readonly.txt'), 'pinned-readonly');
  const server = net.createServer(socket => socket.end('positive'));
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  const registry = 'HKCU\\Software\\isSWF-sandbox-test-' + randomUUID();
  const registrySecret = 'synthetic-registry-only-' + randomUUID();
  const reg = join(process.env.SystemRoot, 'System32/reg.exe'); let registryCreated = false;
  try {
    const absent = spawnSync(reg, ['query', registry], { encoding: 'utf8', timeout: 10000 }); assert.ifError(absent.error); assert.equal(absent.status, 1);
    const created = spawnSync(reg, ['add', registry, '/v', 'canary', '/t', 'REG_SZ', '/d', registrySecret], { encoding: 'utf8', timeout: 10000 }); assert.ifError(created.error); assert.equal(created.status, 0, created.stderr); registryCreated = true;
    const hostRead = spawnSync(reg, ['query', registry, '/v', 'canary'], { encoding: 'utf8', timeout: 10000 }); assert.ifError(hostRead.error); assert.equal(hostRead.status, 0); assert(hostRead.stdout.includes(registrySecret));
    const positive = await new Promise((done, reject) => { const socket = net.connect(port, '127.0.0.1'); let bytes = ''; socket.on('data', chunk => { bytes += chunk; }); socket.once('end', () => done(bytes)); socket.once('error', reject); });
    assert.equal(positive, 'positive');
    await writeFile(join(factory, 'probe.mjs'), `import fs from 'node:fs';import net from 'node:net';import {spawnSync} from 'node:child_process';
const out={secretAbsent:process.env.ISSWF_TEST_SECRET===undefined,readonlyRead:fs.readFileSync(${JSON.stringify(join(factory, 'readonly.txt'))},'utf8')};
fs.writeFileSync('allowed.txt','changed');out.allowedWrite=true;
for(const [key,fn] of Object.entries({outsideRead:()=>fs.readFileSync(${JSON.stringify(secret)}),outsideWrite:()=>fs.writeFileSync(${JSON.stringify(secret)},'bad'),factoryWrite:()=>fs.writeFileSync(${JSON.stringify(join(factory, 'readonly.txt'))},'bad'),runtimeWrite:()=>fs.writeFileSync(process.execPath,'bad')})){try{fn();out[key]='unexpected-success'}catch(e){out[key]=e.code}}
out.pathControls={};for(const [key,fn]of Object.entries({systemExecutableRealpath:()=>fs.realpathSync.native(process.env.SystemRoot+'\\\\System32\\\\cmd.exe'),systemExecutableStat:()=>fs.statSync(process.env.SystemRoot+'\\\\System32\\\\cmd.exe'),workRealpath:()=>fs.realpathSync.native(process.cwd())})){try{fn();out.pathControls[key]='allowed'}catch(e){out.pathControls[key]={code:e.code,syscall:e.syscall}}}
const child=spawnSync(process.env.SystemRoot+'\\\\System32\\\\cmd.exe',['/d','/s','/c','echo subprocess-positive'],{encoding:'utf8',timeout:2000});out.subprocess={status:child.status,output:child.stdout?.trim(),error:child.error?.code,syscall:child.error?.syscall,message:child.error?.message?.slice(0,1000)};
const reg=spawnSync(process.env.SystemRoot+'\\\\System32\\\\reg.exe',['query',${JSON.stringify(registry)},'/v','canary'],{encoding:'utf8',timeout:2000});out.registry={status:reg.status,secretAbsent:!reg.stdout?.includes(${JSON.stringify(registrySecret)}),error:reg.error?.code};
const publicReg=spawnSync(process.env.SystemRoot+'\\\\System32\\\\reg.exe',['query','HKLM\\\\SOFTWARE\\\\Microsoft\\\\Windows NT\\\\CurrentVersion','/v','ProductName'],{encoding:'utf8',timeout:2000});out.registryPublicPositive=publicReg.status;out.registryPublicDetails={error:publicReg.error?.code,syscall:publicReg.error?.syscall,message:publicReg.error?.message?.slice(0,1000),signal:publicReg.signal,stderr:publicReg.stderr?.slice(0,1000)};
out.network=await new Promise(done=>{const s=net.connect(${port},'127.0.0.1');s.setTimeout(1000);s.once('connect',()=>{s.destroy();done('connected')});s.once('error',e=>done(e.code));s.once('timeout',()=>{s.destroy();done('timeout')})});console.log(JSON.stringify(out));
`);
    await writeFile(join(factory, 'timeout.mjs'), "setInterval(()=>{},1000);\n");
    await writeFile(join(factory, 'flood.mjs'), "for(let n=0;n<10000;n++)console.log('x'.repeat(200));\n");
    const runner = await createWindowsToolRunner({ work, factoryRoot: factory, nodeBinary: binary, binarySha256: createHash('sha256').update(await readFile(binary)).digest('hex') });
    process.env.ISSWF_TEST_SECRET = 'synthetic-parent-secret';
    const command = script => `"${runner.paths.executable}" "${join(factory, script)}"`;
    const probe = await runner(command('probe.mjs'));
    assert.equal(probe.code, 0, probe.output);
    const control = JSON.parse(probe.output.trim());
    assert.equal(control.secretAbsent, true); assert.equal(control.readonlyRead, 'pinned-readonly'); assert.equal(control.allowedWrite, true);
    for (const key of ['outsideRead', 'outsideWrite', 'factoryWrite', 'runtimeWrite']) assert(['EPERM', 'EACCES'].includes(control[key]), key + ': ' + control[key]);
    assert.equal(control.registryPublicPositive, 0, JSON.stringify(control)); assert.equal(control.registry.status, 1, JSON.stringify(control.registry)); assert.equal(control.registry.secretAbsent, true); assert.equal(control.registry.error, undefined);
    assert.equal(control.network, 'EACCES'); assert.equal(control.subprocess.status, 0, JSON.stringify(control.subprocess)); assert.equal(control.subprocess.output, 'subprocess-positive');
    assert.equal(await readFile(secret, 'utf8'), 'synthetic-private-only'); assert.equal(await readFile(join(factory, 'readonly.txt'), 'utf8'), 'pinned-readonly');
    const inlineCode = "const fs=require('node:fs');fs.writeFileSync('inline.txt','inline-positive');try{fs.readFileSync(Buffer.from('" + Buffer.from(secret).toString('base64') + "','base64').toString());console.log('unexpected-success')}catch(e){console.log(e.code)}";
    const inline = await runner('node -e "' + inlineCode + '"'); assert.equal(inline.code, 0, inline.output); assert(['EPERM', 'EACCES'].includes(inline.output.trim()), inline.output);
    assert.equal(await readFile(join(work, 'inline.txt'), 'utf8'), 'inline-positive');
    assert.equal((await runner(command('timeout.mjs'), 300)).code, 124);
    const flood = await runner(command('flood.mjs')); assert.equal(flood.truncated, true); assert(Buffer.byteLength(flood.output) <= 8000);
    await writeFile(join(factory, 'malformed.mjs'), "import fs from 'node:fs';fs.writeSync(1,Buffer.alloc(8000,255));\n");
    const malformed = await runner(command('malformed.mjs')); assert.equal(malformed.truncated, true); assert.equal(malformed.code, 125); assert(Buffer.byteLength(malformed.output) <= 8000);
    await writeFile(join(factory, 'ticker.mjs'), "import fs from 'node:fs';let n=0;const tick=()=>fs.writeFileSync('descendant.json',JSON.stringify({pid:process.pid,n:++n}));tick();setInterval(tick,20);\n");
    await writeFile(join(factory, 'descendant.mjs'), `import fs from 'node:fs';import {spawn} from 'node:child_process';const c=spawn(process.execPath,[${JSON.stringify(join(factory, 'ticker.mjs'))}],{stdio:'ignore',detached:true});c.unref();let ready=false;for(let n=0;n<100;n++){if(fs.existsSync('descendant.json')){ready=true;break;}await new Promise(d=>setTimeout(d,20));}if(!ready)throw Error('Descendant positive control failed');console.log('descendant-started');\n`);
    const descendant = await runner(command('descendant.mjs')); assert.equal(descendant.code, 0, descendant.output); assert.match(descendant.output, /descendant-started/u);
    const tick = await readFile(join(work, 'descendant.json'), 'utf8'); assert(JSON.parse(tick).pid > 0);
    await new Promise(done => setTimeout(done, 250)); assert.equal(await readFile(join(work, 'descendant.json'), 'utf8'), tick, 'Detached descendant must stop with command');
    await writeFile(join(work, 'check.mjs'), "import fs from 'node:fs';if(fs.readFileSync('inline.txt','utf8')!=='inline-positive')process.exit(2);\n");
    const checkCommand = 'node check.mjs';
    const modelCall = { operation: 'shell', sdkCallSha256: 'a'.repeat(64), invocationSha256: 'b'.repeat(64) };
    const checked = await runner(checkCommand, 5000, modelCall); assert.equal(checked.code, 0, checked.output);
    const checkIntent = JSON.parse(await readFile(join(runner.paths.records, '000007.intent.json'), 'utf8'));
    assert.equal(checkIntent.commandSha256, createHash('sha256').update(checkCommand, 'utf8').digest('hex'));
    assert.equal(checkIntent.timeoutMs, 5000); assert.deepEqual(checkIntent.modelCall, modelCall);
    assert(!JSON.stringify(checkIntent).includes(checkCommand), 'Do not retain raw command bodies');
    const finished = (await readdir(runner.paths.records)).filter(name => name.endsWith('.finished.json'));
    assert.equal(finished.length, 7);
    for (const name of finished) {
      const receipt = JSON.parse(await readFile(join(runner.paths.records, name), 'utf8'));
      const { binding, ...intent } = JSON.parse(await readFile(join(runner.paths.records, name.replace('.finished.json', '.intent.json')), 'utf8'));
      assert.match(intent.commandSha256, /^[0-9a-f]{64}$/u); assert(Number.isInteger(intent.timeoutMs));
      assert.equal(binding, createHash('sha256').update(JSON.stringify(intent)).digest('hex'));
      assert.equal(receipt.binding, binding); assert.equal(receipt.stopped, true); assert.equal(receipt.profileDeleted, true);
    }
    console.log(JSON.stringify({ status: 'PASS', root, controls: control, checks: ['native compiled runtime', 'allowed work and readonly read', 'outside/readonly/env/network refusal', 'real piped subprocess', 'deadline and bounded-memory output including malformed UTF-8', 'public registry positive and private registry canary refusal', 'detached descendant cessation', 'Job cessation and profile cleanup'], limits: 'No SDK/provider, normal job lifecycle/recovery or parent-death test in this suite yet' }));
  } finally {
    delete process.env.ISSWF_TEST_SECRET; await new Promise(done => server.close(done));
    if (registryCreated) { const removed = spawnSync(reg, ['delete', registry, '/f'], { encoding: 'utf8', timeout: 10000 }); assert.ifError(removed.error); assert.equal(removed.status, 0, 'Synthetic registry cleanup failed: ' + registry); }
  }
}
