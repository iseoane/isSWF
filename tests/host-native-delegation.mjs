import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const source=resolve(process.argv[2]??'.'),dependencies=resolve(process.env.ISSWF_HOST_DEPS??join(source,'tooling/host-tests/node_modules'));
if(process.argv[3]!=='--child'){
 const root=await realpath(await mkdtemp(join(tmpdir(),'isswf native roles ñ ')));await mkdir(join(root,'temp'));
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>['SYSTEMROOT','SYSTEMDRIVE','WINDIR','COMSPEC','PATH','PATHEXT'].includes(k.toUpperCase())));
 Object.assign(env,{ISSWF_HOST_DEPS:dependencies,HOME:join(root,'home'),USERPROFILE:join(root,'home'),APPDATA:join(root,'appdata'),LOCALAPPDATA:join(root,'localappdata'),TEMP:join(root,'temp'),TMP:join(root,'temp'),PI_CODING_AGENT_DIR:join(root,'profile'),PI_OFFLINE:'1',PI_SKIP_VERSION_CHECK:'1',PI_TELEMETRY:'0'});
 Object.assign(env, {CLAUDE_CONFIG_DIR:join(root,'claude-profile'),DISABLE_AUTOUPDATER:'1',DISABLE_TELEMETRY:'1',DISABLE_ERROR_REPORTING:'1',CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:'1'});
 const claude=join(dependencies,'@anthropic-ai',`claude-code-${process.platform}-${process.arch}`,process.platform==='win32'?'claude.exe':'claude');
 const inventory=spawnSync(claude,['--plugin-dir',source,'plugin','details','isswf'],{env,cwd:root,encoding:'utf8',timeout:30000,maxBuffer:200000});
 await writeFile(join(root,'claude-inventory.txt'),inventory.stdout+'\n'+inventory.stderr);
 assert.ifError(inventory.error);
 assert.equal(inventory.status,0,inventory.stdout+'\n'+inventory.stderr);
 const agentLine=inventory.stdout.match(/^\s*Agents \((\d+)\)\s+(.+)$/mu);
 assert.ok(agentLine,'Claude must discover actual plugin agents, not just validate manifest syntax');
 assert.equal(Number(agentLine[1]),4);
 assert.deepEqual(agentLine[2].split(',').map(name=>name.trim()).sort(),['isswf-planner','isswf-researcher','isswf-reviewer','isswf-worker']);
 const result=spawnSync(process.execPath,[fileURLToPath(import.meta.url),source,'--child',root],{env,cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
 await writeFile(join(root,'host-output.log'),result.stdout+'\n'+result.stderr);assert.ifError(result.error);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 console.log(JSON.stringify({status:'PASS',platform:process.platform,root,limits:'Packaged roles: actual Pi SDK with loopback synthetic provider and actual Claude plugin inventory; no real models, Claude delegation or OS sandbox claim'}));
}else{
 const root=process.argv[4],sdkRoot=join(dependencies,'@earendil-works/pi-coding-agent'),profile=join(root,'profile'),work=join(root,'work'),provider='isswf-offline',modelId='trial-model',factoryRoot=source;
const report={platform:process.platform,package:'pi-subagents@0.83.0',realProviderRequests:0,blockedExternalRequests:0,cases:[]},calls=[];
let phase='success',session,activeAbort;const openResponses=new Set();
const server=createServer(async(req,res)=>{
 openResponses.add(res);res.on('close',()=>openResponses.delete(res));
 let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);calls.push({phase,body});activeAbort?.();
 if(phase==='error'){res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:'SYNTHETIC_PROVIDER_FAILURE',type:'invalid_request_error'}}));return;}
 res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache'});res.flushHeaders();if(phase==='cancel')return;
 const toolResult=body.messages.find(m=>m.role==='tool');
 const delta=toolResult?{content:phase==='worker'?'OFFLINE_WORKER_OK':'OFFLINE_OK'}:{tool_calls:[{index:0,id:'read-canary',type:'function',function:{name:phase==='worker'?'write':'read',arguments:JSON.stringify(phase==='worker'?{path:'result.txt',content:'after\n'}:{path:'result.txt'})}}]};
 const chunk={id:'trial-response',object:'chat.completion.chunk',created:1,model:modelId,choices:[{index:0,delta,finish_reason:null}]};
 res.write('data: '+JSON.stringify(chunk)+'\n\n');res.write('data: '+JSON.stringify({...chunk,choices:[{index:0,delta:{},finish_reason:toolResult?'stop':'tool_calls'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})+'\n\n');res.end('data: [DONE]\n\n');
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port,realFetch=globalThis.fetch;
globalThis.fetch=(url,...args)=>{if(String(url).startsWith(base+'/'))return realFetch(url,...args);report.blockedExternalRequests++;throw Error('EXTERNAL_NETWORK_DISABLED');};
try{
 for(const p of [work,join(profile,'agents'),join(profile,'extensions/subagent')])await mkdir(p,{recursive:true});
 await writeFile(join(work,'cwd-canary.txt'),'CWD_SENTINEL\n');await writeFile(join(work,'result.txt'),'before\n');
 const models={providers:{[provider]:{baseUrl:base+'/v1',api:'openai-completions',apiKey:'synthetic-not-a-secret',models:[{id:modelId,name:'Offline synthetic model',reasoning:true,input:['text'],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:32000,maxTokens:1024,compat:{supportsReasoningEffort:true}}]}}};
 await writeFile(join(profile,'models.json'),JSON.stringify(models));
 await writeFile(join(profile,'agents/isswf-trial-reviewer.md'),'---\nname: isswf-trial-reviewer\ndescription: Offline trial only\ntools: read\ninheritSkills: false\n---\nRead only the synthetic workspace. No delegation.\n');
 const config={packages:[{source:factoryRoot,extensions:[],skills:[],prompts:[]}],compaction:{enabled:false},retry:{enabled:false,maxRetries:0},subagents:{defaultExtensions:[],defaultThinking:'low',agentOverrides:{'isswf-reviewer':{model:provider+'/'+modelId,thinking:'medium',tools:['read']},'isswf-worker':{model:provider+'/'+modelId,thinking:'high',tools:['write']}},modelScope:{enforce:true,strict:true,allow:[provider+'/'+modelId]}}};
 await writeFile(join(profile,'settings.json'),JSON.stringify(config));
 await writeFile(join(profile,'extensions/subagent/config.json'),JSON.stringify({asyncByDefault:false,forceTopLevelAsync:false,enableSlashCommands:false,scheduledRuns:{enabled:false},missions:{enabled:false}}));
 const require=createRequire(join(sdkRoot,'package.json')),sdk=require(sdkRoot);
 const settings=sdk.SettingsManager.create(work,profile),runtime=await sdk.ModelRuntime.create({authPath:join(profile,'auth.json'),modelsPath:join(profile,'models.json'),modelsStorePath:join(profile,'model-cache.json'),allowModelNetwork:false});
 const model=runtime.getModel(provider,modelId);assert(model,'synthetic model must be registered');report.piVersion=JSON.parse(await readFile(join(sdkRoot,'package.json'))).version;
 const loader=new sdk.DefaultResourceLoader({cwd:work,agentDir:profile,settingsManager:settings,noExtensions:true,noSkills:true,noPromptTemplates:true,noThemes:true,additionalExtensionPaths:[join(dependencies,'pi-subagents/bundle/index.js')],agentsFilesOverride:()=>({agentsFiles:[]})});
 await loader.reload();assert.equal(loader.getExtensions().errors.length,0);
 ({session}=await sdk.createAgentSession({cwd:work,agentDir:profile,modelRuntime:runtime,model,thinkingLevel:'low',settingsManager:settings,sessionManager:sdk.SessionManager.inMemory(work),resourceLoader:loader,tools:['read','subagent','subagents_enable','bg_wait','contact_supervisor']}));
 const bindErrors=[];await session.bindExtensions({mode:'sdk',onError:e=>bindErrors.push(e)});assert.equal(bindErrors.length,0,JSON.stringify(bindErrors));
 const sub=loader.getExtensions().extensions[0].tools.get('subagent').definition;
 const listing=await sub.execute('package-list',{action:'list',options:{capabilities:true}},new AbortController().signal,()=>{},session.extensionRunner.createToolContext('package-list',undefined));await writeFile(join(root,'package-roles.json'),JSON.stringify(listing,null,2));assert.match(JSON.stringify(listing),/isswf-worker/);for(const role of ['worker','reviewer','planner','researcher'])assert.match(JSON.stringify(listing),new RegExp('isswf-'+role));assert.match(JSON.stringify(listing),/Package agents/);
 const invoke=async(label,controller)=>sub.execute(label,{agent:label.includes('worker')?'isswf-worker':'isswf-reviewer',task:label.includes('worker')?'Write after\\n to result.txt.':'Read result.txt and return OFFLINE_OK.',async:false,options:{mission:false,timeoutMs:5000}},controller.signal,()=>{},session.extensionRunner.createToolContext(label,controller.signal));
 phase='worker';const worker=await invoke('synthetic-worker',new AbortController());assert.match(JSON.stringify(worker),/OFFLINE_WORKER_OK/);assert.equal(await readFile(join(work,'result.txt'),'utf8'),'after\n');for(const c of calls.filter(c=>c.phase==='worker')){assert.equal(c.body.reasoning_effort,'high');assert.deepEqual(c.body.tools.map(t=>t.function.name).sort(),['contact_supervisor','write']);}report.cases.push({name:'packaged worker writes assigned result with configured high effort',status:'PASS'});phase='success';
 const success=await invoke('synthetic-success',new AbortController());await writeFile(join(root,'success-result.json'),JSON.stringify(success,null,2));
 assert.notEqual(success.isError,true,JSON.stringify(success));assert.match(JSON.stringify(success),/OFFLINE_OK/);
 const successCalls=calls.filter(c=>c.phase==='success');assert(successCalls.length>=2);for(const c of successCalls){assert.equal(c.body.model,modelId);assert.equal(c.body.reasoning_effort,'medium');assert.deepEqual(c.body.tools.map(t=>t.function.name).sort(),['contact_supervisor','read']);}
 assert.match(JSON.stringify(successCalls.at(-1).body.messages),/after/);assert.equal(await readFile(join(work,'cwd-canary.txt'),'utf8'),'CWD_SENTINEL\n');
 report.cases.push({name:'configured model/medium overrides parent low, cwd read and result',status:'PASS',tools:['read','contact_supervisor'],note:'Package adds its supervisor communication tool; this is not a filesystem sandbox',requests:successCalls.length});
 phase='error';let failure;try{failure=await invoke('synthetic-error',new AbortController());}catch(e){failure={isError:true,message:e.message};}await writeFile(join(root,'error-result.json'),JSON.stringify(failure,null,2));assert.equal(failure.isError,true,JSON.stringify(failure));assert.match(JSON.stringify(failure),/SYNTHETIC_PROVIDER_FAILURE/);
 assert.equal(calls.filter(c=>c.phase==='error').length,1,'Disabled retry must preserve a single visible provider failure');
 for(const call of calls)assert.equal(call.body.model,modelId,'Never substitute another model');
 report.cases.push({name:'provider failure visible, no other model selected',status:'PASS',requests:calls.filter(c=>c.phase==='error').length});
 phase='cancel';const controller=new AbortController();activeAbort=()=>setTimeout(()=>controller.abort(),50);const started=Date.now();let cancelled;try{cancelled=await invoke('synthetic-cancel',controller);}catch(e){cancelled={isError:true,message:e.message};}activeAbort=undefined;assert(controller.signal.aborted);
 await writeFile(join(root,'cancel-result.json'),JSON.stringify(cancelled,null,2));assert.match(JSON.stringify(cancelled),/abort|cancel|stopped/i);report.cases.push({name:'foreground cancellation returns partial/aborted result',status:'PASS',elapsedMs:Date.now()-started});
 assert.equal(report.blockedExternalRequests,0);report.status='PASS_OFFLINE_BEHAVIOR';

}catch(e){report.status='FAIL';report.error={name:e.name,message:e.message,stack:e.stack};process.exitCode=1;}
finally{if(session){await session.extensionRunner.emit({type:'session_shutdown',reason:'quit'});session.dispose();}for(const res of openResponses)res.destroy();await new Promise(done=>server.close(done));report.syntheticRequests=calls.length;await writeFile(join(root,'synthetic-requests.json'),JSON.stringify(calls,null,2));await writeFile(join(root,'behavior-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}

}
