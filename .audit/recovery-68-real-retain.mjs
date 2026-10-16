#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,lstat,copyFile,chmod} from 'node:fs/promises';
import {join,resolve,basename,dirname,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(await readFile(process.argv[2])),destination=resolve(process.argv[3]),{root,store,project,runtime}=fixture;
assert(basename(root).startsWith('isswf-recovery68-real-'));assert(basename(destination).startsWith('recovery-68-real-portable-'));assert.equal(store,join(root,'runs'));assert.equal(project,join(root,'project'));assert.equal(runtime,join(root,'runtime'));
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
await mkdir(destination);
async function copy(from,to){const s=await lstat(from);if(s.isDirectory()){await mkdir(to,{recursive:true});for(const name of await readdir(from))await copy(join(from,name),join(to,name));}else{assert(s.isFile());await mkdir(dirname(to),{recursive:true});await copyFile(from,to);}await chmod(to,s.mode&0o7777);}
for(const name of await readdir(store))if(!name.startsWith('.prepare-'))await copy(join(store,name),join(destination,'runs',name));
for(const name of ['fixture.json','original-invocation.json','original-result.json','precall-original.json','partial-review-gate.json','partial-review-approval.json','successor-grant-v1.json','successor-prepared-v1.json','successor-grant.json','successor-prepared.json','precall-successor.json','successor-invocation.json','successor-result.json']){try{await copy(join(root,name),join(destination,name));}catch(e){if(e.code!=='ENOENT')throw e;}}
const runtimeSha=git(runtime,'rev-parse','HEAD'),prerequisite=git(runtime,'rev-parse','HEAD^');git(runtime,'bundle','create',join(destination,'runtime-increment.bundle'),'HEAD','^'+prerequisite);git(runtime,'bundle','verify',join(destination,'runtime-increment.bundle'));
const inputs=new Set([git(project,'rev-parse','HEAD')]);
for(const name of await readdir(store))if(name.endsWith('.job.json')){const b=JSON.parse(await readFile(join(store,name)));inputs.add(b.inputSha);inputs.add(b.targetBase);}
for(const name of await readdir(join(store,'successors')).catch(e=>{if(e.code==='ENOENT')return[];throw e;})){const e=JSON.parse(await readFile(join(store,'successors',name)));inputs.add(e.request.inputSha);inputs.add(e.request.targetBase);}
for(const name of ['successor-prepared-v1.json','successor-prepared.json']){try{const p=JSON.parse(await readFile(join(root,name)));inputs.add(p.inputSha);inputs.add(p.targetBase);}catch(e){if(e.code!=='ENOENT')throw e;}}
const objects=execFileSync('git',['-C',project,'rev-list','--objects',...inputs],{encoding:'utf8'}).split('\n').filter(Boolean).map(line=>line.split(' ')[0]).join('\n')+'\n';
const pack=execFileSync('git',['-C',project,'pack-objects','--stdout'],{input:objects,maxBuffer:16*1024*1024});await writeFile(join(destination,'project-objects.pack'),pack);const verified=execFileSync('git',['-C',project,'index-pack','--stdin','--fix-thin'],{input:pack,encoding:'utf8'}).trim();
const files={},permissionModes={};async function walk(path){for(const name of await readdir(path)){const p=join(path,name),s=await lstat(p);if(s.isDirectory())await walk(p);else{const key=relative(destination,p);files[key]=createHash('sha256').update(await readFile(p)).digest('hex');permissionModes[key]=s.mode&0o7777;}}}await walk(destination);
await writeFile(join(destination,'manifest.json'),JSON.stringify({files,permissionModes,runtimeSha,runtimeBundlePrerequisite:prerequisite,projectInputs:[...inputs],projectPackVerified:verified,scope:'owned disposable recovery records only; no auth contents or SDK runtime temporary directories; historical absolute paths are evidence references'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',destination,files:Object.keys(files).length,runtimeBundleVerified:true,projectPackVerified:true}));
