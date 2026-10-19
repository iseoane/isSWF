import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source=resolve(process.argv[2]??'.');
const {prepareCapacity,acquireCapacity,completeWorkerCapacity}=await import(pathToFileURL(join(source,'tools/execution-capacity.mjs')));
const {nativeRecorderSource}=await import(pathToFileURL(join(source,'tools/native-recovery.mjs')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const root=await mkdtemp(join(tmpdir(),'isswf-worker-api-')),pool=join(root,'pool'),store=join(root,'runs'),directory=join(store,'worker'),work=join(directory,'workspace'),factory=join(root,'factory');
const json=(path,value)=>writeFile(path,JSON.stringify(value)+'\n');
let child;
try {
  for(const path of [pool,join(pool,'completed'),store,directory,work,factory])await mkdir(path);
  const policy=JSON.stringify({version:1,limit:2,reference:'Synthetic worker API contract'});await writeFile(join(pool,'policy.json'),policy);
  const scope=await prepareCapacity({pool,policySha256:hash(policy)},[source,store],hash(await readFile(join(source,'tools/execution-capacity.mjs'))));
  const owner={attemptDir:directory,attemptId:'worker',inputSha:'1'.repeat(40),jobSha256:'2'.repeat(64),runtimeSha:'3'.repeat(40),targetBase:'4'.repeat(40)};
  const reservation=await acquireCapacity(scope,{role:'worker',logicalJobRef:'I0001/J005/worker-api',mode:'fixture',worker:owner});
  assert(reservation);await assert.rejects(reservation.complete(),/bound-cessation/);
  await assert.rejects(reservation.cancelBeforeDispatch(),/dispatch-may-have-started/);
  const cancelledOwner={...owner,attemptId:'not-dispatched',attemptDir:join(store,'not-dispatched')};
  const cancelled=await acquireCapacity(scope,{role:'worker',logicalJobRef:'I0001/J005/losing-admission',mode:'fixture',worker:cancelledOwner});
  await cancelled.cancelBeforeDispatch();
  const cancellation=JSON.parse(await readFile(join(pool,'completed',cancelled.info.id,'completion.json')));
  assert.equal(cancellation.evidence.kind,'worker-admission-refused-before-dispatch');
  await rm(join(pool,'completed',cancelled.info.id),{recursive:true});
  const info=reservation.info;
  await assert.rejects(completeWorkerCapacity({scope,info:{...info,role:'planner'}}));
  await assert.rejects(completeWorkerCapacity({scope,info}));
  const body=nativeRecorderSource()+"\nconst run=await createNativeToolRunner({work:process.argv[2],factoryRoot:process.argv[3]});const result=await run(['--unshare-all','--new-session','--die-with-parent','--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib','/lib64','--ro-bind',process.execPath,'/runtime/node','--bind',process.argv[2],'/work','--ro-bind',process.argv[3],'/factory','--proc','/proc','--dev','/dev','--tmpfs','/tmp'],'while ! test -f /work/release; do sleep 0.02; done');if(result.code)process.exitCode=1;\n";
  await writeFile(join(directory,'task.mjs'),body);const taskSha256=hash(body);
  const binding={version:1,...owner,mode:'offline',logicalJobRef:info.logicalJobRef,capacity:info,taskSha256};
  const dispatch={version:1,attemptId:owner.attemptId,inputSha:owner.inputSha,targetBase:owner.targetBase,taskSha256,workspace:work};
  await json(join(store,'worker.job.json'),{...binding,jobSha256:'0'.repeat(64)});
  await json(join(directory,'dispatch.json'),dispatch);
  await assert.rejects(completeWorkerCapacity({scope,info}));
  await json(join(store,'worker.job.json'),binding);
  await json(join(directory,'dispatch.json'),{...dispatch,taskSha256:'0'.repeat(64)});
  await assert.rejects(completeWorkerCapacity({scope,info}));
  await json(join(directory,'dispatch.json'),dispatch);
  await assert.rejects(completeWorkerCapacity({scope,info}));
  assert.equal((await readdir(join(pool,'completed'))).length,0);
  if(process.argv.includes('--sandbox')) {
    child=spawn(process.execPath,[join(directory,'task.mjs'),work,factory],{stdio:['ignore','ignore','pipe']});
    const closed=new Promise((done,reject)=>{child.once('error',reject);child.once('close',code=>done(code));});
    let ready=false;
    for(let n=0;n<200;n++){try{await readFile(join(directory,'native-tools/000001.started.json'));ready=true;break;}catch{}await new Promise(done=>setTimeout(done,20));}
    assert(ready,'actual namespace producer started');
    const policyRecord=JSON.parse(await readFile(join(directory,'native-recovery.json')));
    await json(join(directory,'execution-child.json'),{version:1,attemptId:owner.attemptId,taskSha256,child:policyRecord.task});
    const terminal={version:1,attemptId:owner.attemptId,workspace:work,outcome:'success',exitCode:0,signal:null,error:null,timedOut:false,captureIncomplete:false};
    await json(join(directory,'terminal.json'),terminal);
    await assert.rejects(completeWorkerCapacity({scope,info}));
    assert.equal((await readdir(join(pool,'completed'))).length,0);
    await writeFile(join(work,'release'),'owned fixture release\n');assert.equal(await closed,0);
    await json(join(directory,'terminal.json'),{...terminal,outcome:'failure',exitCode:2});
    await assert.rejects(completeWorkerCapacity({scope,info}));
    await json(join(directory,'terminal.json'),terminal);
    const startedPath=join(directory,'native-tools/000001.started.json'),original=await readFile(startedPath);
    await json(startedPath,{...JSON.parse(original),taskSha256:'0'.repeat(64)});
    await assert.rejects(completeWorkerCapacity({scope,info}));await writeFile(startedPath,original);
    const result=await completeWorkerCapacity({scope,info});assert.equal(result.status,'released');assert.equal(result.cessation.namespacesCeased,1);
    assert.equal((await readdir(pool)).includes('slot-0'),false);
    assert.equal((await readdir(join(pool,'completed'))).length,1);
    const receipt=JSON.parse(await readFile(join(pool,'completed',info.id,'completion.json')));
    assert.equal(receipt.evidence.kind,'verified-worker-task-and-tool-namespace-cessation');assert.equal(receipt.evidence.taskSha256,taskSha256);
    await assert.rejects(completeWorkerCapacity({scope,info}));
    console.log('PASS worker completion API: actual native task and PID namespace cessation, live-task/success-JSON-only/failure/mismatched-tool refusal, exact archival and replay refusal; no provider calls');
  } else console.log('PASS worker completion API: missing and mismatched private ownership/binding/dispatch evidence never releases capacity; no sandbox or provider calls');
} finally {
  if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await new Promise(done=>child.once('close',done));}
  await rm(root,{recursive:true,force:true});
}
