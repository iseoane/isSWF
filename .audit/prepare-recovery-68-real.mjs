#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const source=resolve(process.argv[2]||'.'),hash=b=>createHash('sha256').update(b).digest('hex'),committed=process.argv.includes('--committed-runtime');
const run=(exe,args)=>{const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const seed=JSON.parse(run(process.execPath,[join(source,'.audit/verify-operational-44.mjs'),source]));
const paths=[];
for(const name of await readdir(join(seed.root,'runs')))if(name.startsWith('.prepare-')){const c=JSON.parse(await readFile(join(seed.root,'runs',name,'config.json'),'utf8'));if(c.mode==='offline'&&c.brief.inputSha===seed.inputSha){for(const key of ['sdkPath','authPath'])assert(typeof c[key]==='string'&&isAbsolute(c[key]));paths.push({sdkPath:c.sdkPath,authPath:c.authPath});}}
assert.equal(paths.length,1);
const root=await mkdtemp(join(tmpdir(),'isswf-recovery68-real-')),project=join(root,'project'),runtime=join(root,'runtime'),store=join(root,'runs');
const sourceCommit=run('git',['-C',source,'rev-parse','HEAD']);
if(committed)for(const name of ['isswf-job','factory-package','pi-worker-task','worker-lifecycle','native-recovery','external-effect-journal','recovery-review','job-successor']){
  const path='tools/'+name+'.mjs';
  assert.equal(hash(await readFile(join(source,path))),hash(spawnSync('git',['-C',source,'show',sourceCommit+':'+path]).stdout),'real fixture requires committed runtime bytes');
}
run('git',['clone','--quiet','--local','--no-hardlinks',committed?source:join(seed.root,'source'),runtime]);
const runtimeSha=run('git',['-C',runtime,'rev-parse','HEAD']);
for(const name of ['src','.pi','.factory/jobs/R68-real'])await mkdir(join(project,name),{recursive:true});
const models=await readFile(join(source,'.factory/models.json'));
await writeFile(join(project,'.factory/models.json'),models);
await writeFile(join(project,'AGENTS.md'),'Disposable recovery proof. Preserve all protected files. Only src/counter.mjs is mutable.\n');
await writeFile(join(project,'.pi/settings.json'),'{}\n');
await writeFile(join(project,'src/counter.mjs'),'export const counter=()=>0;\n');
await writeFile(join(project,'check.mjs'),"import assert from 'node:assert/strict';import {counter} from './src/counter.mjs';assert.equal(counter(),1);\n");
await writeFile(join(project,'trusted-hold.mjs'),"import {writeFileSync} from 'node:fs';writeFileSync('src/counter.mjs','export const counter=()=>1;\\n');setTimeout(()=>{},20000);\n");
const git=(...args)=>run('git',['-C',project,...args]);
git('init','-q');git('config','user.name','Disposable recovery proof');git('config','user.email','recovery@invalid');git('add','.');git('commit','-qm','Protected recovery baseline');
const targetBase=git('rev-parse','HEAD'),jobPath='.factory/jobs/R68-real/job.json',briefPath='.factory/jobs/R68-real/brief.md';
const job={version:1,logicalJobRef:'R68-real-model-recovery',runtimeSha,targetBase,methodologySha:'37a56ebc902e94f21fc10666f33fceac44946af7',exclusiveAttempt:true,workerTotal:1,...paths[0],models:{sha:targetBase,path:'.factory/models.json',sha256:hash(models)},briefPath,referencedInputs:['src/counter.mjs','check.mjs','trusted-hold.mjs'],expectedMutablePaths:['src/counter.mjs'],protectedCheckCommand:'node check.mjs',offlineChecks:[{name:'trusted-interruption-hold',command:'node trusted-hold.mjs',expectedExitCode:0}]};
await writeFile(join(project,briefPath),'This is an authorized disposable interruption test. Use sandbox_shell boundary_check first. Then use sandbox_shell shell to execute exactly node trusted-hold.mjs. That trusted helper repairs src/counter.mjs and intentionally waits while the external supervisor interrupts this attempt. Do not replace or edit the helper, check, models, rules, or any other file. Do not use network. The supervisor reviews the preserved partial before separately authorizing one successor.\n');
await writeFile(join(project,jobPath),JSON.stringify(job)+'\n');git('add','.');git('commit','-qm','Pin authorized real recovery job');const inputSha=git('rev-parse','HEAD');
const packageRoot=committed?join(root,'packages',runtimeSha):join(seed.root,'packages',runtimeSha),cli=join(runtime,'tools/isswf-job.mjs');
if(committed)run(process.execPath,[join(runtime,'tools/factory-package.mjs'),'materialize','--source',runtime,'--revision',runtimeSha,'--store',join(root,'packages')]);
run(process.execPath,[join(runtime,'tools/factory-package.mjs'),'activate','--package',packageRoot,'--project',project]);
const fixture={version:1,root,project,runtime,cli,store,runtimeSha,sourceCommit,committedRuntime:committed,packageRoot,inputSha,targetBase,jobPath,jobSha256:hash(await readFile(join(project,jobPath))),originalAttemptId:'R68-real-A001',successorAttemptId:'R68-real-A002',grantRef:'operator-68-two-LunaHigh-tasks',operatorGrant:{owner:'operator',reference:'explicit-user-Si-after-two-task-budget',provider:'openai-codex',model:'gpt-6-luna',effort:'high',maximumRuntimeTasks:2,taskDeadlineMs:120000,maxToolCalls:12,retry:false,fallback:false,githubEffects:false,interruptedSlotConsumedEvenIfChargeUnknown:true,successorRequiresCessationAndIndependentPartialReview:true},invocationMarkers:{original:join(root,'original-invocation.json'),successor:join(root,'successor-invocation.json')},limits:['disposable sameboot fixture only','prepare makes offline SDK controls only; no real model prompt','actual real original and successor require independent code/precall gates']};
await writeFile(join(root,'fixture.json'),JSON.stringify(fixture,null,2)+'\n');console.log(JSON.stringify(fixture,null,2));
