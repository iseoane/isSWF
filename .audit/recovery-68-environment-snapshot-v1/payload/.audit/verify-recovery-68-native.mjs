#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rename, unlink, symlink, chmod, readdir } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const source=resolve(process.argv[2]||'.');
const run=(exe,args,expected=0)=>{
  const result=spawnSync(exe,args,{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
  assert.equal(result.status,expected,JSON.stringify({args,status:result.status,stderr:result.stderr}));
  return result.stdout;
};
const seed=JSON.parse(run(process.execPath,[join(source,'.audit/verify-operational-44.mjs'),source]));
const root=await mkdtemp(join(tmpdir(),'isswf-recovery68-native-'));
const project=join(root,'project'), runs=join(root,'runs'), runtimeSource=join(root,'runtime');
run('git',['clone','--quiet','--local','--no-hardlinks',join(seed.root,'source'),runtimeSource]);
await mkdir(join(project,'.pi'),{recursive:true});
await mkdir(join(project,'.factory/jobs/R68'),{recursive:true});
await mkdir(join(project,'src'));
const git=(...args)=>run('git',['-C',project,...args]).trim();
await writeFile(join(project,'.pi/settings.json'),'{}\n');
await writeFile(join(project,'AGENTS.md'),'Preserve original project rules.\n');
await writeFile(join(project,'src/counter.mjs'),'export const counter=()=>0;\n');
await writeFile(join(project,'check.mjs'), process.argv.includes('--review-controls') ? `import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {counter} from './src/counter.mjs';
assert.throws(()=>writeFileSync('/work/review-write-canary','forbidden'),{code:'EROFS'});
if(counter()===4)process.stdout.write('x'.repeat(20000));
else if(counter()===5)await new Promise(resolve=>setTimeout(resolve,15000));
else {assert.equal(counter(),1);console.log('READONLY_REVIEW_CHECK');}
` : "import assert from 'node:assert/strict';import {counter} from './src/counter.mjs';assert.equal(counter(),1);\n");
const models=await readFile(join(source,'.factory/models.json'));
await writeFile(join(project,'.factory/models.json'),models);
await writeFile(join(project,'trusted-hold.mjs'),`import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const child=spawn('/runtime/node',['-e',"const fs=require('fs');const timer=setInterval(()=>fs.writeFileSync('/work/heartbeat.txt',String(Date.now())),25);setTimeout(()=>{clearInterval(timer);},15000);"],{detached:true,stdio:'ignore'});
child.unref();
writeFileSync('/work/tool-ready.json',JSON.stringify({pid:process.pid,child:child.pid}));
setTimeout(()=>{},15000);
`);
const hash=b=>createHash('sha256').update(b).digest('hex');
git('init','-q');git('config','user.name','Disposable recovery test');git('config','user.email','recovery@invalid');git('add','.');git('commit','-qm','baseline');
const base=git('rev-parse','HEAD');
const packageRoot=join(seed.root,'packages',seed.runtimeSha);
run(process.execPath,[join(seed.root,'source/tools/factory-package.mjs'),'activate','--package',packageRoot,'--project',project]);
const job={version:1,logicalJobRef:'R68-host-task-loss',runtimeSha:seed.runtimeSha,targetBase:base,methodologySha:'37a56ebc902e94f21fc10666f33fceac44946af7',exclusiveAttempt:true,workerTotal:1,models:{sha:base,path:'.factory/models.json',sha256:hash(models)},briefPath:'.factory/jobs/R68/brief.md',referencedInputs:['src/counter.mjs','check.mjs','trusted-hold.mjs'],expectedMutablePaths:['src/counter.mjs','heartbeat.txt','tool-ready.json'],protectedCheckCommand:'node check.mjs',offlineChecks:[{name:'hold-after-partial',command:"printf 'export const counter=()=>1;\\n' > src/counter.mjs; node trusted-hold.mjs",expectedExitCode:0}]};
if(process.argv.includes('--launch-via-pi')) {
  const paths=[];
  for(const name of await readdir(join(seed.root,'runs')))if(name.startsWith('.prepare-')) {
    const config=JSON.parse(await readFile(join(seed.root,'runs',name,'config.json'),'utf8'));
    if(config.mode==='offline'&&config.brief.inputSha===seed.inputSha)paths.push({sdkPath:config.sdkPath,authPath:config.authPath});
  }
  assert.equal(paths.length,1,'one original offline SDK configuration supplies opaque paths');
  Object.assign(job,paths[0]);
}
await writeFile(join(project,job.briefPath),'Disposable offline recovery fixture; no provider call.\n');
const jobPath='.factory/jobs/R68/job.json';
await writeFile(join(project,jobPath),JSON.stringify(job)+'\n');git('add','.');git('commit','-qm','recovery inputs');
const input=git('rev-parse','HEAD'), cli=join(runtimeSource,'tools/isswf-job.mjs');
const wait=async(fn,label)=>{for(let n=0;n<200;n++){if(await fn())return;await delay(30);}throw Error('timeout '+label);};
const read=async(id,operation='reconcile')=>JSON.parse(run(process.execPath,[cli,operation,'--runs-store',runs,'--attempt-id',id]));
const launch=id=>JSON.parse(run(process.execPath,[cli,'run','--project',project,'--input-sha',input,'--job',jobPath,'--runs-store',runs,'--attempt-id',id,'--grant-ref','explicit-offline-recovery-fixture','--mode','offline']));
const stat=pid=>{const text=readFileSync(`/proc/${pid}/stat`,'utf8'),f=text.slice(text.lastIndexOf(')')+2).trim().split(/\s+/);return {startTicks:f[19],state:f[0]};};
const absent=pid=>{try{return stat(pid).state==='Z';}catch(error){return error.code==='ENOENT'||error.code==='ESRCH';}};
const signalOwned=(identity,signal)=>{
  assert.equal(stat(identity.pid).startTicks,identity.startTicks);
  assert.equal(readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),identity.bootId);
  assert.equal(realpathSync(`/proc/${identity.pid}/exe`),identity.exe);
  process.kill(identity.pid,signal);
};
const id='R68-host-task-loss';
const launched=process.argv.includes('--launch-via-pi')
  ? JSON.parse(run(process.execPath,[join(source,'.audit/launch-normal-job-offline-pi.mjs'),cli,project,input,jobPath,runs,id,'explicit-offline-recovery-fixture']))
  : launch(id);
const dir=launched.attemptDir, work=join(dir,'workspace');
await wait(async()=>{try{await readFile(join(work,'heartbeat.txt'));return true;}catch{return false;}},'tool descendant actively writes');
const owner=JSON.parse(await readFile(join(dir,'owner.json'),'utf8'));
const childRecord=JSON.parse(await readFile(join(dir,'execution-child.json'),'utf8'));
const init=JSON.parse(await readFile(join(dir,'native-tools/000002.started.json'),'utf8')).init;
assert.equal(absent(init.pid),false);
const beforeHashes={};
for(const path of ['dispatch.json','owner.json','execution-child.json','task.mjs','native-recovery.json'])beforeHashes[path]=hash(await readFile(join(dir,path)));
signalOwned(owner,'SIGKILL');await wait(()=>absent(owner.pid),'host ceased');
const live=await read(id);
assert.equal(live.state,'unknown');assert.equal(live.executionChild.state,'live');assert.equal(live.recovery.status,'blocked');
assert.equal(absent(init.pid),false);
signalOwned(childRecord.child,'SIGKILL');
await wait(()=>absent(childRecord.child.pid)&&absent(init.pid),'task and namespace init ceased');
let stopped;
await wait(async()=>{stopped=await read(id);return stopped.recovery?.status==='stopped-review-required';},'safe partial review');
assert.equal(stopped.state,'unknown');assert.equal(stopped.recovery.reviewRequired,true);assert.equal(stopped.recovery.retry,'never');assert.equal(stopped.recovery.remoteEffects,'not-reconciled');
assert.equal(stopped.recovery.protectedHashesPreserved,true);assert.ok(stopped.recovery.changedPaths.includes('src/counter.mjs'));
const heartbeat=await readFile(join(work,'heartbeat.txt'),'utf8');await delay(200);assert.equal(await readFile(join(work,'heartbeat.txt'),'utf8'),heartbeat);
for(const[path,digest]of Object.entries(beforeHashes))assert.equal(hash(await readFile(join(dir,path))),digest);
const negatives=[];
for(const [name,kind] of [['mode:payload','file'],['mode:link','symlink'],['dir:payload','file'],['__proto__','file']]) {
  const path=join(work,name);
  try {
    if(kind==='file')await writeFile(path,'unauthorized bytes\\n',{flag:'wx'});else await symlink('src/counter.mjs',path);
    assert.equal((await read(id)).recovery.status,'blocked',name+' must not bypass mutable scope');
    negatives.push('reserved-looking name: '+name);
  } finally { await unlink(path); }
}
await chmod(join(work,'src/counter.mjs'),0o755);assert.equal((await read(id)).recovery.status,'blocked');await chmod(join(work,'src/counter.mjs'),0o644);negatives.push('unexpected executable-mode change');
const protectedFile=join(work,'AGENTS.md'), original=await readFile(protectedFile);await writeFile(protectedFile,'changed\n');assert.equal((await read(id)).recovery.status,'blocked');await writeFile(protectedFile,original);negatives.push('protected partial mutation');
const startedPath=join(dir,'native-tools/000002.started.json'), startedBytes=await readFile(startedPath), started=JSON.parse(startedBytes);
for(const[name,record]of [['boot mismatch',{...started,init:{...started.init,bootId:'different'}}],['PID reuse mismatch',{...started,init:{...started.init,pid:process.pid,startTicks:'0'}}],['invalid namespace',{...started,init:{...started.init,namespace:'not-a-namespace'}}],['corrupt started',null]]){
  await writeFile(startedPath,record===null?'{':JSON.stringify(record));assert.equal((await read(id)).recovery.status,'blocked');negatives.push(name);
}
await writeFile(startedPath,startedBytes);
await rename(startedPath,join(root,'saved-started.json'));assert.equal((await read(id)).recovery.status,'blocked');await rename(join(root,'saved-started.json'),startedPath);negatives.push('missing startup record');
const duplicate=spawnSync(process.execPath,[cli,'run','--project',project,'--input-sha',input,'--job',jobPath,'--runs-store',runs,'--attempt-id',id,'--grant-ref','not-a-retry','--mode','offline'],{encoding:'utf8',timeout:10000});assert.equal(duplicate.status,1);negatives.push('same ID retry refused');
const gateId='R68-unpublished-tool';
await writeFile(join(project,jobPath),JSON.stringify({...job,logicalJobRef:gateId})+'\n');git('add',jobPath);git('commit','-qm','Independent startup publication fixture');
const gateInput=git('rev-parse','HEAD');
const gated=JSON.parse(run(process.execPath,[cli,'run','--project',project,'--input-sha',gateInput,'--job',jobPath,'--runs-store',runs,'--attempt-id',gateId,'--grant-ref','explicit-offline-recovery-fixture','--mode','offline'])), gateDir=gated.attemptDir, gateWork=join(gateDir,'workspace');
await wait(async()=>{try{await readFile(join(gateDir,'native-recovery.json'));return true;}catch{return false;}},'native recorder starts');
await writeFile(join(gateDir,'native-tools/000002.started.json'),'deliberately preclaimed startup record\n',{flag:'wx'});
let gatedResult;
await wait(async()=>{gatedResult=await read(gateId,'read');return gatedResult.state==='terminal';},'unpublished tool fails');
assert.equal(gatedResult.terminal.outcome,'failure');
assert.equal(await readFile(join(gateWork,'src/counter.mjs'),'utf8'),'export const counter=()=>0;\n','command cannot run before startup evidence publication');
assert.equal(await readFile(join(gateWork,'tool-ready.json')).then(()=>true).catch(()=>false),false);
const result={status:'PASS',root,runtimeSha:seed.runtimeSha,input,targetBase:base,environmentRestart:launched.environmentRestart,providerPromptStarted:false,hostLossWhileTaskLive:live,stopped,namespaceInit:init,heartbeatStable:true,immutableRecordsPreserved:true,negatives,publicationFailureGate:{terminal:gatedResult.terminal.outcome,commandNeverStarted:true},limits:['stopped means review, not successor authorization','remote effects not reconciled','no real provider recovery run']};
const proofPath=join(root,'recovery-result.json');
await writeFile(proofPath,JSON.stringify(result)+'\n');
const acceptanceControl=JSON.parse(run(process.execPath,[join(source,'.audit/verify-recovery-68-acceptance.mjs'),proofPath]));
result.normalAcceptanceScopeControl={root:acceptanceControl.root,terminal:acceptanceControl.result.terminal.outcome,unauthorizedFilePresent:acceptanceControl.unauthorized==='unauthorized'};
console.log(JSON.stringify(result,null,2));
