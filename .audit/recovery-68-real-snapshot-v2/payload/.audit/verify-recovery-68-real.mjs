#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {readFileSync,realpathSync} from 'node:fs';
import {join,resolve,basename,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const [fixturePath,action,mode,gatePath]=process.argv.slice(2),source=resolve(dirname(new URL(import.meta.url).pathname),'..');
assert(['interrupt','prepare-successor','successor','check-preservation'].includes(action));assert(['offline','real'].includes(mode));
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const fixture=await json(fixturePath),{root,project,runtime,cli,store,inputSha,jobPath}=fixture,id=fixture.originalAttemptId,dir=join(store,id),work=join(dir,'workspace');
assert(basename(root).startsWith('isswf-recovery68-real-'));assert.equal(project,join(root,'project'));assert.equal(store,join(root,'runs'));assert.equal(cli,join(root,'runtime/tools/isswf-job.mjs'));
assert.equal(fixture.operatorGrant.maximumRuntimeTasks,2);assert.equal(fixture.operatorGrant.taskDeadlineMs,120000);assert.equal(fixture.operatorGrant.maxToolCalls,12);
const execute=(exe,args,options={})=>{const r=spawnSync(exe,args,{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,...options});assert.equal(r.status,0,JSON.stringify({args,status:r.status,stderr:r.stderr}));return r.stdout.trim();};
const call=(...args)=>JSON.parse(execute(process.execPath,[cli,...args]));
const observe=(attempt=id,operation='reconcile')=>call(operation,'--runs-store',store,'--attempt-id',attempt);
const runtimeFiles=['isswf-job','factory-package','pi-worker-task','worker-lifecycle','native-recovery','external-effect-journal','recovery-review','job-successor'].map(n=>'tools/'+n+'.mjs');
async function gate(phase,extra={}){
 if(mode!=='real')return;
 assert.equal(fixture.committedRuntime,true);assert.equal(fixture.runtimeSha,fixture.sourceCommit);
 const g=await json(gatePath);assert.equal(g.verdict,'PASS','precall gate verdict');assert.equal(g.phase,phase,'precall gate phase');assert.equal(g.fixtureSha256,hash(await readFile(fixturePath)),'precall gate fixture identity');
 for(const p of ['.audit/prepare-recovery-68-real.mjs','.audit/verify-recovery-68-real.mjs',...runtimeFiles])assert.equal(g.files[p],hash(await readFile(join(source,p))),p+' precall identity');
 for(const[k,v]of Object.entries(extra))assert.equal(g[k],v);
}
async function marker(phase){const path=fixture.invocationMarkers[phase];assert.equal(path,join(root,phase+'-invocation.json'));await writeFile(path,JSON.stringify({version:1,phase,mode,fixtureSha256:hash(await readFile(fixturePath)),maximumTasks:2,taskDeadlineMs:120000,maxToolCalls:12,noRetry:true,chargeUnknownConsumesSlot:true})+'\n',{flag:'wx',mode:0o600});}
const wait=async(fn,label,ms=10000)=>{const until=Date.now()+ms;while(Date.now()<until){const value=await fn();if(value)return value;await delay(25);}throw Error('deadline '+label);};
const stat=pid=>{const t=readFileSync(`/proc/${pid}/stat`,'utf8'),f=t.slice(t.lastIndexOf(')')+2).trim().split(/\s+/);return{startTicks:f[19],state:f[0]};};
const absent=identity=>{try{const s=stat(identity.pid);assert.equal(s.startTicks,identity.startTicks,'PID reuse is not cessation proof');return s.state==='Z';}catch(e){if(e.code==='ENOENT'||e.code==='ESRCH')return true;throw e;}};
function killOwned(identity){assert.equal(stat(identity.pid).startTicks,identity.startTicks);assert.equal(readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),identity.bootId);assert.equal(realpathSync(`/proc/${identity.pid}/exe`),identity.exe);process.kill(identity.pid,'SIGKILL');}
const evidenceFiles=async()=>{const files=['dispatch.json','owner.json','execution-child.json','task.mjs','native-recovery.json',...(mode==='real'?['pi-model-invocation.json']:[]),...((await readdir(join(dir,'native-tools'))).map(n=>'native-tools/'+n))];const out={};for(const p of files)out[p]=hash(await readFile(join(dir,p)));out['../'+id+'.job.json']=hash(await readFile(join(store,id+'.job.json')));return out;};
async function preserve(files){for(const[p,h]of Object.entries(files))assert.equal(hash(await readFile(join(dir,p))),h,p+' predecessor evidence preserved');}
const output=async(name,value)=>{await writeFile(join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(value,null,2));};
if(action==='check-preservation'){
 const current=await evidenceFiles(),original=await json(join(root,'original-result.json'));await preserve(original.predecessorFiles);
 console.log(JSON.stringify({status:'PASS',mode,files:current,providerPrompts:0,readonly:true},null,2));
}else if(action==='interrupt'){
 await gate('original');await marker('original');
 const launched=call('run','--project',project,'--input-sha',inputSha,'--job',jobPath,'--runs-store',store,'--attempt-id',id,'--grant-ref',fixture.grantRef,'--mode',mode);
 assert.equal(launched.attemptDir,dir);
 let owner,child,active,invocation;
 try{
  await wait(async()=>{
   const state=observe(id,'read');if(state.state==='terminal')throw Error('original terminated before intentional interruption');
   try{
    if(await readFile(join(work,'src/counter.mjs'),'utf8')!=='export const counter=()=>1;\n')return false;
    owner=await json(join(dir,'owner.json'));child=(await json(join(dir,'execution-child.json'))).child;
    const names=await readdir(join(dir,'native-tools'));
    for(const n of names.filter(n=>n.endsWith('.started.json')).sort().reverse()){
     const started=await json(join(dir,'native-tools',n));if(absent(started.init))continue;
     if(mode==='real'){
      invocation=await json(join(dir,'pi-model-invocation.json'));
      assert.equal(invocation.version,1);assert.equal(invocation.attemptId,id);assert.equal(invocation.provider,'openai-codex');assert.equal(invocation.model,'gpt-6-luna');assert.equal(invocation.effort,'high');assert.deepEqual(invocation.callableTools,['sandbox_shell']);assert.equal(invocation.providerPromptStarted,true);assert.equal(invocation.taskSha256,launched.taskSha256);
      if(started.modelCall?.invocationSha256!==hash(await readFile(join(dir,'pi-model-invocation.json')))||started.modelCall.operation!=='shell'||!/^[0-9a-f]{64}$/.test(started.modelCall.sdkCallSha256||''))continue;
     }
     active=started;return true;
    }
   }catch(error){if(error.code!=='ENOENT')throw error;}
   return false;
  },'model tool writes partial and holds',90000);
  const files=await evidenceFiles();killOwned(owner);await wait(()=>absent(owner),'host cessation');
  const live=observe();assert.equal(live.state,'unknown');assert.equal(live.executionChild.state,'live');assert.equal(live.recovery.status,'blocked');assert.equal(absent(active.init),false);
  killOwned(child);await wait(()=>absent(child)&&absent(active.init),'task and held namespace cessation');
  const stopped=await wait(()=>{const o=observe();return o.recovery?.status==='stopped-review-required'?o:false;},'partial revalidation');
  assert.equal(await readFile(join(dir,'pi-result.json')).then(()=>true).catch(e=>{if(e.code==='ENOENT')return false;throw e;}),false);
  assert.equal(stopped.recovery.protectedHashesPreserved,true);assert.deepEqual(stopped.recovery.changedPaths,['src/counter.mjs']);await preserve(files);
  await output('original-result.json',{status:'PASS',mode,root,launched,hostLossWhileTaskLive:live,stopped,activeTool:active,modelInvocation:invocation,predecessorFiles:files,providerCharge:'unknown-consumed',successorNotLaunched:true,limits:['sameboot original interruption, not provider billing reconciliation','model-call metadata comes from validated SDK tool execution, never project output']});
 }catch(error){for(const identity of[owner,child])if(identity&&!absent(identity)){try{killOwned(identity);}catch{}}throw error;}
}else if(action==='prepare-successor'){
 const original=await json(join(root,'original-result.json'));assert.equal(original.status,'PASS');assert.equal(original.mode,mode);await preserve(original.predecessorFiles);
 const inspected=call('review','--runs-store',store,'--attempt-id',id,'--action','inspect');
 await gate('partial-review',{fingerprint:inspected.fingerprint});
 const reviewRef=mode==='real'?(await json(gatePath)).reviewRef:'offline-control-simulated-independent-review';assert.equal(typeof reviewRef,'string');assert(reviewRef.length>0);
 const approval={version:1,grantRef:fixture.grantRef+'-review',reviewRef,independentReview:true,verdict:'pass',allowProtectedCheck:true,fingerprint:inspected.fingerprint,protectedCheckCommandSha256:inspected.candidate.protectedCheckCommandSha256},approvalPath=join(root,'partial-review-approval.json');await writeFile(approvalPath,JSON.stringify(approval)+'\n',{flag:'wx'});
 const reviewed=call('review','--runs-store',store,'--attempt-id',id,'--action','record','--review-file',approvalPath);
 const git=(...args)=>execute('git',['-C',project,'-c','user.name=Recovery proof','-c','user.email=recovery@invalid',...args]);
 const object=bytes=>execute('git',['-C',project,'hash-object','-w','--stdin'],{input:bytes});
 async function tree(path){const rows=[];for(const name of(await readdir(path)).sort()){const p=join(path,name),s=await lstat(p);assert(s.isFile()||s.isDirectory());rows.push(s.isDirectory()?`040000 tree ${await tree(p)}\t${name}\0`:`${s.mode&0o111?'100755':'100644'} blob ${object(await readFile(p))}\t${name}\0`);}return execute('git',['-C',project,'mktree','-z'],{input:rows.join('')});}
 const targetBase=git('commit-tree',await tree(work),'-p',inputSha,'-m','Exact independently reviewed recovered candidate');
 const oldJob=JSON.parse(git('show',inputSha+':'+jobPath)),nextJobPath='.factory/jobs/R68-successor/job.json',briefPath='.factory/jobs/R68-successor/brief.md';
 const nextJob={...oldJob,targetBase,workerTotal:2,briefPath,offlineChecks:[{name:'successor-final-check',command:"printf 'export const counter=()=>1; // recovered\\n' > src/counter.mjs; node check.mjs",expectedExitCode:0}]};
 const env={...process.env,GIT_INDEX_FILE:join(root,'successor-index')};execute('git',['-C',project,'read-tree',targetBase],{env});
 for(const[p,b]of[[nextJobPath,JSON.stringify(nextJob)+'\n'],[briefPath,'An interrupted predecessor left src/counter.mjs correctly returning 1. This separately granted successor must preserve that behavior and add a short recovery comment to src/counter.mjs, then run node check.mjs and request boundary_check. Only src/counter.mjs may change. Do not execute trusted-hold.mjs. Preserve every protected file. No network.\n']])execute('git',['-C',project,'update-index','--add','--cacheinfo','100644,'+object(b)+','+p],{env});
 const nextInput=git('commit-tree',execute('git',['-C',project,'write-tree'],{env}),'-p',targetBase,'-m','Pin separately authorized recovery successor');
 const grant={version:1,grantRef:fixture.grantRef+'-successor',reviewRef,predecessorAttemptId:id,receiptSha256:reviewed.receiptSha256,fingerprint:inspected.fingerprint,newAttemptId:fixture.successorAttemptId,newInputSha:nextInput,newJobPath:nextJobPath,newJobSha256:hash(git('show',nextInput+':'+nextJobPath)+'\n'),newTargetBase:targetBase,mode,cumulativeWorkerTotal:2,priorInvocationUncertainAndConsumed:true,exclusiveSuccessorOwner:true};
 const grantPath=join(root,'successor-grant.json');await writeFile(grantPath,JSON.stringify(grant)+'\n',{flag:'wx'});
 await output('successor-prepared.json',{status:'PASS',mode,root,inputSha:nextInput,targetBase,jobPath:nextJobPath,grantPath,grant,reviewed,providerPromptStarted:false});
}else{
 const prepared=await json(join(root,'successor-prepared.json'));assert.equal(prepared.mode,mode);await gate('successor',{successorPreparedSha256:hash(await readFile(join(root,'successor-prepared.json')))});
 const original=await json(join(root,'original-result.json'));await preserve(original.predecessorFiles);await marker('successor');
 const launched=call('run','--project',project,'--input-sha',prepared.inputSha,'--job',prepared.jobPath,'--runs-store',store,'--attempt-id',fixture.successorAttemptId,'--grant-ref',prepared.grant.grantRef,'--mode',mode,'--successor-grant',prepared.grantPath);
 const final=await wait(()=>{const o=observe(fixture.successorAttemptId);return o.state==='terminal'?o:false;},'successor terminal',130000);assert.equal(final.terminal.outcome,'success');
 const result=await json(join(launched.attemptDir,'pi-result.json'));assert.equal(result.providerPromptStarted,mode==='real');if(mode==='real'){assert.equal(result.boundaryCallAttributed,true);assert(result.toolCalls>0&&result.toolCalls<=12);}assert.equal(final.job.successor.cumulativeWorkerTotal,2);await preserve(original.predecessorFiles);
 const check=execute('/usr/bin/bwrap',['--unshare-user','--unshare-pid','--unshare-net','--unshare-ipc','--unshare-uts','--new-session','--die-with-parent','--cap-drop','ALL','--clearenv','--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib','/lib64','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--ro-bind',process.execPath,'/runtime/node','--ro-bind',join(launched.attemptDir,'workspace'),'/work','--chdir','/work','--setenv','PATH','/runtime:/usr/bin:/bin','--remount-ro','/','--','node','check.mjs']);assert.equal(typeof check,'string');
 await output('successor-result.json',{status:'PASS',mode,root,launched,final,taskResult:result,originalEvidencePreserved:true,parentProtectedCheckExitCode:0,workerSlotsConsumed:2,limits:['two explicit original/successor slots, no retry or billing reconciliation','sameboot disposable project, no GitHub effects or machine reboot claim']});
}
