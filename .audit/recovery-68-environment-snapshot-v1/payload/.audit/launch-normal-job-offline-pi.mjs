#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, isAbsolute } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const [cli,project,input,job,store,attempt,grant]=process.argv.slice(2);
const owned=dirname(project);
assert(basename(owned).startsWith('isswf-recovery68-native-'));
assert.equal(project,join(owned,'project'));assert.equal(store,join(owned,'runs'));assert.equal(cli,join(owned,'runtime/tools/isswf-job.mjs'));
assert([cli,project,store].every(isAbsolute));assert(/^[0-9a-f]{40}$/.test(input));assert(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(attempt));
const root=await mkdtemp(join(tmpdir(),'isswf-recovery68-env-'));
for(const name of ['home','agent'])await mkdir(join(root,name));
await writeFile(join(root,'agent/settings.json'),'{}\n');
const env={PATH:process.env.PATH,HOME:join(root,'home'),PI_CODING_AGENT_DIR:join(root,'agent'),PI_OFFLINE:'1',PI_SKIP_VERSION_CHECK:'1',PI_TELEMETRY:'0',LANG:'C.UTF-8'};
const pi=spawn('pi',['--mode','rpc','--no-session','--offline','--no-mcp','--no-approve','--no-extensions','--no-skills','--no-prompt-templates','--no-themes','--no-context-files'],{cwd:root,env,detached:true,stdio:['pipe','pipe','pipe']});
let stdout='',identity;const exited=new Promise((yes,no)=>{pi.once('error',no);pi.once('exit',(code,signal)=>yes({code,signal}));});
pi.stdout.on('data',bytes=>{stdout+=bytes;if(Buffer.byteLength(stdout)>128000)pi.kill('SIGKILL');});pi.stderr.resume();
const bound=setTimeout(()=>{try{process.kill(-pi.pid,'SIGKILL');}catch(error){if(error.code!=='ESRCH')throw error;}},15000);
try{
 for(let n=0;n<100;n++){try{const text=await readFile(`/proc/${pi.pid}/stat`,'utf8'),fields=text.slice(text.lastIndexOf(')')+2).trim().split(/\s+/);identity={pid:pi.pid,startTicks:fields[19],bootId:(await readFile('/proc/sys/kernel/random/boot_id','utf8')).trim()};break;}catch(error){if(error.code!=='ENOENT')throw error;await delay(10);}}
 assert(identity);
 const quote=value=>`'${value.replaceAll("'","'\\''")}'`;
 const command=[process.execPath,cli,'run','--project',project,'--input-sha',input,'--job',job,'--runs-store',store,'--attempt-id',attempt,'--grant-ref',grant,'--mode','offline'].map(quote).join(' ');
 pi.stdin.write(JSON.stringify({id:'launch',type:'bash',command,excludeFromContext:true})+'\n');
 let response;for(let n=0;n<500;n++){response=stdout.split('\n').map(line=>{try{return JSON.parse(line);}catch{return null;}}).find(row=>row?.id==='launch'&&row.type==='response');if(response)break;await delay(20);}
 assert.equal(response?.success,true,'isolated offline Pi accepts explicit normal job launch');assert.equal(response.data.exitCode,0,response.data.output);
 const launch=JSON.parse(response.data.output.trim());pi.stdin.end();const exit=await exited;assert.equal(exit.code,0);assert.throws(()=>process.kill(pi.pid,0),{code:'ESRCH'});clearTimeout(bound);
 const observed=spawnSync(process.execPath,[cli,'read','--runs-store',store,'--attempt-id',attempt],{cwd:root,env,encoding:'utf8',timeout:10000,maxBuffer:64000});assert.equal(observed.status,0,observed.stderr);const state=JSON.parse(observed.stdout);assert.equal(state.state,'running','fresh process observes worker after initiating Pi exits');
 const evidence={root,initiatingPi:identity,exit,esrchBeforeFreshReader:true,freshReaderState:state.state,isolatedHome:true,coordinatorProviderPromptStarted:false,workerMode:'offline',limits:'isolated Pi/runtime-process restart on same boot, not main-chat or machine reboot; SDK host auth remains opaque'};
 await writeFile(join(root,'result.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({...launch,environmentRestart:evidence}));
}finally{clearTimeout(bound);if(pi.exitCode===null&&pi.signalCode===null)pi.kill('SIGKILL');}
