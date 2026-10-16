#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const proof=JSON.parse(await readFile(resolve(process.argv[2]||'.audit/recovery-68-native-parent-v5.json'),'utf8'));
const root=await mkdtemp(join(tmpdir(),'isswf-recovery68-acceptance-'));
const project=join(root,'project'),runs=join(root,'runs');
const run=(exe,args)=>{const r=spawnSync(exe,args,{encoding:'utf8',timeout:15000,maxBuffer:1024*1024});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
run('git',['clone','--quiet','--local','--no-hardlinks',join(proof.root,'project'),project]);
const jobPath='.factory/jobs/R68/job.json',job=JSON.parse(await readFile(join(project,jobPath),'utf8'));
job.offlineChecks=[{name:'repair-plus-unauthorized-prototype-file',command:"printf 'export const counter=()=>1;\\n' > src/counter.mjs; printf 'unauthorized' > __proto__",expectedExitCode:0}];
await writeFile(join(project,jobPath),JSON.stringify(job)+'\n');
run('git',['-C',project,'add',jobPath]);run('git',['-C',project,'-c','user.name=Local test','-c','user.email=test@invalid','commit','-qm','adversarial acceptance fixture']);
const input=run('git',['-C',project,'rev-parse','HEAD']);
const cli=join(proof.root,'runtime/tools/isswf-job.mjs');
run(process.execPath,[cli,'run','--project',project,'--input-sha',input,'--job',jobPath,'--runs-store',runs,'--attempt-id','R68-acceptance','--grant-ref','disposable-no-provider-negative','--mode','offline']);
let result;
for(let n=0;n<150;n++){result=JSON.parse(run(process.execPath,[cli,'read','--runs-store',runs,'--attempt-id','R68-acceptance']));if(result.state==='terminal')break;await delay(40);}
assert.equal(result.state,'terminal');
const unauthorized=await readFile(join(runs,'R68-acceptance/workspace/__proto__'),'utf8');
console.log(JSON.stringify({root,providerPromptStarted:false,unauthorized,result},null,2));
assert.equal(result.terminal.outcome,'failure','normal native acceptance must reject unlisted __proto__ file');
