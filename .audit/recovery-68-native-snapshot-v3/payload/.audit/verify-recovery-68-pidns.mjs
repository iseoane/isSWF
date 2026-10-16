#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { readFileSync, realpathSync, readlinkSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const nested = process.argv.includes('--nested');
const root = await mkdtemp(join(tmpdir(), 'isswf-recovery68-pidns-'));
const nonce = 'recovery68-' + root.split('/').at(-1);
const writer = join(root, 'writer.mjs');
const task = join(root, 'task.mjs');
const launcher = join(root, 'launcher.mjs');
await writeFile(writer, `import { writeFileSync } from 'node:fs';
const end=Date.now()+10000;
while(Date.now()<end){writeFileSync('${root}/heartbeat',String(Date.now()));Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30);}
`);
await writeFile(task, `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const child=spawn(${nested ? "'/usr/bin/unshare'" : 'process.execPath'},${JSON.stringify(nested ? ['--user','--map-root-user','--pid','--fork','--mount-proc',process.execPath,writer,nonce] : [writer,nonce])},{detached:true,stdio:'ignore'});
child.unref();
writeFileSync('${root}/task-ready',JSON.stringify({pid:process.pid,child:child.pid}));
setTimeout(()=>{},10000);
`);
const bwrapArgs = ['--unshare-user', '--unshare-pid', '--unshare-net', '--die-with-parent', '--new-session', '--cap-drop', 'ALL', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--ro-bind', process.execPath, process.execPath, '--proc', '/proc', '--dev', '/dev', '--bind', root, root, '--clearenv', '--setenv', 'HOME', '/nonexistent', '--chdir', root, '--json-status-fd', '3', process.execPath, task, nonce];
await writeFile(launcher, `import { spawn } from 'node:child_process';
import { appendFileSync,writeFileSync } from 'node:fs';
const child=spawn('/usr/bin/bwrap',${JSON.stringify(bwrapArgs)},{stdio:['ignore','ignore','pipe','pipe']});
child.stdio[3].on('data',b=>appendFileSync('${root}/status.jsonl',b));
child.stderr.on('data',b=>appendFileSync('${root}/stderr',b));
writeFileSync('${root}/launcher-ready',String(child.pid));
setTimeout(()=>{},15000);
`);
const owner = spawn(process.execPath, [launcher, nonce], { stdio: 'ignore' });
const proc = pid => {
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
  const f = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { pid:Number(pid), state:f[0], startTicks:f[19], exe:realpathSync(`/proc/${pid}/exe`), bootId:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim() };
};
const wait = async (fn, message) => { for(let i=0;i<150;i++){if(await fn())return;await delay(30);}throw Error(message); };
await wait(async()=>{try{return (await readFile(join(root,'heartbeat'),'utf8')).length>0;}catch{return false;}},'sandbox writer failed to start');
const ownerIdentity = proc(owner.pid);
assert.ok(readFileSync(`/proc/${owner.pid}/cmdline`,'utf8').split('\0').includes(nonce));
const status = (await readFile(join(root,'status.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
const started = status.find(x=>Number.isInteger(x['child-pid']));
assert.ok(started, 'bwrap did not confirm namespace startup');
const matching = [];
for (const pid of readdirSync('/proc').filter(x=>/^\d+$/.test(x))) {
  try {
    const args=readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0');
    if(args.includes(nonce) && (args[1]===task||args[1]===writer)) matching.push({ ...proc(pid), namespace:readlinkSync(`/proc/${pid}/ns/pid`) });
  } catch {}
}
assert.ok(matching.length>=2, 'task and setsid writer must both be live');
if (nested) assert.ok(matching.some(record=>record.namespace!=='pid:['+started['pid-namespace']+']'), 'writer must actually occupy a nested PID namespace');
const distinctNamespace = readFileSync(`/proc/${owner.pid}/status`,'utf8');
assert.ok(distinctNamespace.includes('Pid:'));
for(const record of matching) assert.notEqual(record.namespace,readlinkSync(`/proc/${owner.pid}/ns/pid`));
assert.equal(proc(owner.pid).startTicks,ownerIdentity.startTicks);
owner.kill('SIGKILL');
await wait(async()=>matching.every(record=>{try {const now=proc(record.pid);return now.startTicks!==record.startTicks||now.state==='Z';} catch(error){return error.code==='ENOENT'||error.code==='ESRCH';}}),'namespace task or setsid writer survived owner death');
const stoppedHeartbeat = await readFile(join(root,'heartbeat'),'utf8');
await delay(300);
assert.equal(await readFile(join(root,'heartbeat'),'utf8'),stoppedHeartbeat);
console.log(JSON.stringify({scope:'technical feasibility only; not production recovery authorization',nested,root,ownerIdentity,status,matching,ownerSignal:'SIGKILL',namespaceDescendantsNoLongerLive:true,heartbeatStable:true,credentialsMounted:false,providerPromptStarted:false},null,2));
