#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source=resolve(process.argv[2]||'.'),root=await mkdtemp(join(tmpdir(),'isswf-recovery68-mock-sdk-')),sdk=join(root,'sdk'),repo=join(root,'project');
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=(exe,args,expected=0)=>{const r=spawnSync(exe,args,{encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024});assert.equal(r.status,expected,JSON.stringify({args,status:r.status,stderr:r.stderr}));return r.stdout.trim();};
await mkdir(join(sdk,'node_modules/typebox'),{recursive:true});await mkdir(repo);await writeFile(join(sdk,'package.json'),JSON.stringify({name:'explicit-local-mock-sdk',main:'index.cjs'}));
await writeFile(join(sdk,'node_modules/typebox/index.js'),"exports.Type=new Proxy({}, {get:()=>()=>({})});\n");
await writeFile(join(sdk,'index.cjs'),`const fs=require('node:fs'),path=require('node:path');
exports.ModelRuntime={create:async()=>({hasConfiguredAuth:()=>true,getModel:(provider,id)=>({provider,id})})};
exports.createExtensionRuntime=()=>({});exports.SettingsManager={inMemory:x=>x};exports.SessionManager={inMemory:()=>({})};
exports.createAgentSession=async options=>{let callback;const tool=options.customTools[0];const session={model:options.model,thinkingLevel:options.thinkingLevel,getCallableToolNames:()=>['sandbox_shell'],subscribe:fn=>callback=fn,abort:async()=>{},dispose:async()=>{},prompt:async()=>{
const directory=path.dirname(options.cwd);if(!fs.existsSync(path.join(directory,'pi-model-invocation.json')))throw Error('prompt entered before invocation publication');
fs.writeFileSync(path.join(directory,'mock-prompt-entered.json'),'{"mockOnly":true}');
for(const [id,args]of [['mock-boundary',{operation:'boundary_check'}],['mock-shell',{operation:'shell',command:"printf 'export const counter=()=>1;\\n' > src/counter.mjs"}]]){callback({type:'tool_execution_start',toolName:'sandbox_shell',toolCallId:id,args});const result=await tool.execute(id,args);callback({type:'tool_execution_end',toolName:'sandbox_shell',toolCallId:id,result});if(result.isError)throw Error('mock tool failed');}
}};return{session};};\n`);
await writeFile(join(root,'opaque-mock-auth-file'),'');
await mkdir(join(repo,'src'));await writeFile(join(repo,'src/counter.mjs'),'export const counter=()=>0;\n');await writeFile(join(repo,'check.mjs'),"import assert from 'node:assert/strict';import {counter} from './src/counter.mjs';assert.equal(counter(),1);\n");await writeFile(join(repo,'brief.md'),'Explicit local mock SDK execution, no provider.\n');
const git=(...args)=>run('git',['-C',repo,...args]);git('init','-q');git('add','.');git('-c','user.name=Mock test','-c','user.email=mock@invalid','commit','-qm','Mock input');const input=git('rev-parse','HEAD');
const config={version:1,mode:'real',sdkPath:sdk,nodeBinary:process.execPath,authPath:join(root,'opaque-mock-auth-file'),profile:{repo:source,sha:'37a56ebc902e94f21fc10666f33fceac44946af7',files:['.agents/roles/worker.md']},brief:{repo,inputSha:input,path:'brief.md'},expectedMutablePaths:['src/counter.mjs'],protectedCheckCommand:'node check.mjs',checks:[{name:'offline-repair',command:"printf 'export const counter=()=>1;\\n' > src/counter.mjs",expectedExitCode:0}]};
const cases=[];
for(const name of ['real-mock','preclaimed-invocation','offline-mock']){
 const attempt=join(root,name),work=join(attempt,'workspace');await mkdir(join(work,'src'),{recursive:true});for(const p of ['src/counter.mjs','check.mjs','brief.md'])await copyFile(join(repo,p),join(work,p));
 const configPath=join(attempt,'config.json'),task=join(attempt,'task.mjs');await writeFile(configPath,JSON.stringify({...config,mode:name==='offline-mock'?'offline':'real'}));run(process.execPath,[join(source,'tools/pi-worker-task.mjs'),'prepare','--config',configPath,'--output',task]);
 if(name==='preclaimed-invocation')await writeFile(join(attempt,'pi-model-invocation.json'),'preclaimed immutable bytes\n');
 run(process.execPath,[task,work],name==='preclaimed-invocation'?2:0);const result=JSON.parse(await readFile(join(attempt,'pi-result.json')));
 if(name==='preclaimed-invocation'){
  assert.equal(await readFile(join(attempt,'pi-model-invocation.json'),'utf8'),'preclaimed immutable bytes\n');assert.equal(result.providerPromptStarted,false);await assert.rejects(readFile(join(attempt,'mock-prompt-entered.json')),{code:'ENOENT'});assert.deepEqual(await readdir(join(attempt,'native-tools')),[]);
 }else{
  const names=(await readdir(join(attempt,'native-tools'))).sort();assert.equal(result.status,'completed');
  if(name==='real-mock'){
   const bytes=await readFile(join(attempt,'pi-model-invocation.json')),invocation=JSON.parse(bytes);assert.equal(invocation.taskSha256,hash(await readFile(task)));assert.deepEqual(invocation.callableTools,['sandbox_shell']);assert.equal(result.boundaryCallAttributed,true);
   for(const [index,id,operation]of [[1,'mock-boundary','boundary_check'],[2,'mock-shell','shell']])for(const suffix of ['intent','started']){const row=JSON.parse(await readFile(join(attempt,'native-tools',String(index).padStart(6,'0')+'.'+suffix+'.json')));assert.deepEqual(row.modelCall,{sdkCallSha256:hash(id),operation,invocationSha256:hash(bytes)});}
   for(const suffix of ['intent','started'])assert.equal(JSON.parse(await readFile(join(attempt,'native-tools/000003.'+suffix+'.json'))).modelCall,undefined);
  }else{
   assert.equal(result.providerPromptStarted,false);await assert.rejects(readFile(join(attempt,'pi-model-invocation.json')),{code:'ENOENT'});for(const n of names)assert.equal(JSON.parse(await readFile(join(attempt,'native-tools',n))).modelCall,undefined);
  }
 }
 cases.push(name);
}
console.log(JSON.stringify({status:'PASS',root,cases,mockedSDK:true,actualProviderPrompts:0,realBranchExecutedWithMock:true,invocationBeforeMockPrompt:true,SDKCallHashesBoundToNativeRecords:true,hostCallsUnlabelled:true,preclaimBlocksBeforePrompt:true,offlineNoAttribution:true},null,2));
