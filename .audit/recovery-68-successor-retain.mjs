#!/usr/bin/env node
import { readFile, writeFile, readdir, mkdir, lstat, copyFile, chmod } from 'node:fs/promises';
import { join, resolve, basename, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const proof=JSON.parse(await readFile(process.argv[2],'utf8')),destination=resolve(process.argv[3]);
if(proof.status!=='PASS'||proof.providerPromptStarted!==false||!basename(destination).startsWith('recovery-68-successor-portable-'))throw Error('successful owned fixture and new portable destination required');
await mkdir(destination);
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const positiveOnly=process.argv.includes('--positive-only');
const roots=positiveOnly?{positive:proof.root}:{positive:proof.root,...proof.fixtures},pins={};
async function copyTree(from,to){const s=await lstat(from);if(s.isDirectory()){await mkdir(to,{recursive:true});for(const n of await readdir(from))await copyTree(join(from,n),join(to,n));}else if(s.isFile()){await mkdir(dirname(to),{recursive:true});await copyFile(from,to);await chmod(to,s.mode&0o7777);}else throw Error('unexpected fixture file type');}
for(const[name,root]of Object.entries(roots)){
 if(!basename(root).startsWith('isswf-recovery68-native-'))throw Error('owned native fixture required');
 const target=join(destination,name);await mkdir(target);
 const runs=join(root,'runs');for(const n of await readdir(runs)){if(n.startsWith('.prepare-')||(positiveOnly&&!['admissions','successors','R68-host-task-loss','R68-host-task-loss.job.json',proof.successor.attemptId,proof.successor.attemptId+'.job.json'].includes(n)))continue;await copyTree(join(runs,n),join(target,'runs',n));}
 for(const n of ['operator-review.json','operator-successor.json','recovery-result.json']){try{await copyTree(join(root,n),join(target,n));}catch(e){if(e.code!=='ENOENT')throw e;}}
 const runtime=join(root,'runtime'),revision=git(runtime,'rev-parse','HEAD'),prerequisite=git(runtime,'rev-parse','HEAD^');
 git(runtime,'bundle','create',join(target,'runtime-increment.bundle'),'HEAD','^'+prerequisite);git(runtime,'bundle','verify',join(target,'runtime-increment.bundle'));
 const project=join(root,'project');
 const inputs=new Set([git(project,'rev-parse','HEAD')]);for(const n of await readdir(runs)){if(!n.endsWith('.job.json'))continue;const b=JSON.parse(await readFile(join(runs,n)));inputs.add(b.inputSha);inputs.add(b.targetBase);}
 for(const n of await readdir(join(runs,'successors')).catch(e=>{if(e.code==='ENOENT')return[];throw e;})){const edge=JSON.parse(await readFile(join(runs,'successors',n)));inputs.add(edge.request.inputSha);inputs.add(edge.request.targetBase);}
 const operatorGrant=JSON.parse(await readFile(join(root,'operator-successor.json')).catch(e=>{if(e.code==='ENOENT')return'{}';throw e;}));if(operatorGrant.newInputSha)inputs.add(operatorGrant.newInputSha);if(operatorGrant.newTargetBase)inputs.add(operatorGrant.newTargetBase);
 // Successor commits are intentionally detached Git objects, not branch mutations.
 const pack=join(target,'project-objects.pack');
 const objects=execFileSync('git',['-C',project,'rev-list','--objects',...inputs],{encoding:'utf8'}).split('\n').filter(Boolean).map(line=>line.split(' ')[0]).join('\n')+'\n';
 const bytes=execFileSync('git',['-C',project,'pack-objects','--stdout'],{input:objects,maxBuffer:16*1024*1024});await writeFile(pack,bytes);
 const verified=execFileSync('git',['-C',project,'index-pack','--stdin','--fix-thin'],{input:bytes,encoding:'utf8'}).trim();
 pins[name]={runtimeSha:revision,runtimeBundlePrerequisite:prerequisite,projectInputs:[...inputs],projectPackVerification:verified};
}
const files={},permissionModes={};async function walk(path){for(const n of await readdir(path)){const f=join(path,n);if((await lstat(f)).isDirectory())await walk(f);else {const p=relative(destination,f);files[p]=createHash('sha256').update(await readFile(f)).digest('hex');permissionModes[p]=(await lstat(f)).mode&0o7777;}}}await walk(destination);
await writeFile(join(destination,'manifest.json'),JSON.stringify({files,permissionModes,pins,positiveOnly,providerPromptStarted:false,githubCalls:false,scope:'own disposable offline fixtures; historical absolute paths are evidence references, not launch arguments; operator-successor.json may retain final rejected negative grant'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',destination,files:Object.keys(files).length,runtimeBundlesVerified:true,projectPacksVerified:true}));
