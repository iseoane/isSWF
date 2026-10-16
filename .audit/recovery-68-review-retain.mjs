#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir, lstat, copyFile } from 'node:fs/promises';
import { join, resolve, basename, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const proof=JSON.parse(await readFile(process.argv[2],'utf8')),destination=resolve(process.argv[3]);
if(proof.status!=='PASS'||proof.providerPromptStarted!==false||!basename(proof.root).startsWith('isswf-recovery68-native-')||!basename(destination).startsWith('recovery-68-review-portable-'))throw Error('owned successful fixture/new portable path required');
await mkdir(destination);
const root=proof.root,id='R68-host-task-loss';
const selected=['recovery-result.json','operator-review.json','runs/'+id+'.job.json',...['dispatch.json','owner.json','execution-child.json','native-recovery.json','task.mjs','recovery-review-receipt.json'].map(p=>'runs/'+id+'/'+p)];
for(const name of await readdir(join(root,'runs',id,'native-tools')))selected.push('runs/'+id+'/native-tools/'+name);
async function collect(dir,prefix){for(const name of await readdir(dir)){const p=join(dir,name),s=await lstat(p);if(s.isDirectory())await collect(p,prefix+'/'+name);else if(s.isFile())selected.push(prefix+'/'+name);else throw Error('unexpected portable fixture type');}}
await collect(join(root,'runs/admissions'),'runs/admissions');await collect(join(root,'runs',id,'workspace'),'runs/'+id+'/workspace');
for(const p of selected){const from=join(root,p);if(!(await lstat(from)).isFile())throw Error('regular fixture file required');const to=join(destination,'fixture',p);await mkdir(dirname(to),{recursive:true});await copyFile(from,to);}
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const runtime=join(root,'runtime'),project=join(root,'project');
if(git(runtime,'rev-parse','HEAD')!==proof.runtimeSha)throw Error('runtime pin mismatch');
const prerequisite=git(runtime,'rev-parse','HEAD^');
git(runtime,'bundle','create',join(destination,'runtime-increment.bundle'),'HEAD','^'+prerequisite);git(runtime,'bundle','verify',join(destination,'runtime-increment.bundle'));
git(project,'bundle','create',join(destination,'project-history.bundle'),'--all');git(project,'bundle','verify',join(destination,'project-history.bundle'));
const files={};async function walk(p){for(const n of await readdir(p)){const f=join(p,n);if((await lstat(f)).isDirectory())await walk(f);else files[relative(destination,f)]=createHash('sha256').update(await readFile(f)).digest('hex');}}await walk(destination);
await writeFile(join(destination,'manifest.json'),JSON.stringify({files,runtimeSha:proof.runtimeSha,runtimeBundlePrerequisite:prerequisite,input:proof.input,bundlesVerified:true,providerPromptStarted:false,scope:'historical absolute paths are evidence references, not portable launch arguments; operator-review intentionally retains final conflicting negative input, receipt records original successful approval digest'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',destination,files:Object.keys(files).length,bundlesVerified:true}));
