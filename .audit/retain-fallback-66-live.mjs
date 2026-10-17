#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat,chmod} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const json=async p=>JSON.parse(await readFile(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const dispatch=await json('.audit/fallback-66-live-authorized.json'),fixture=await json(dispatch.fixtureFile),grant=await json(dispatch.request.grantFile),destination=resolve('.audit/fallback-66-live-portable');await mkdir(destination);
const key=hash(dispatch.request.project+'\0'+grant.logicalJobRef),records=[];
for(const name of['fixture.json','operator-grant-approved.json','operator-grant-pending.json','real-invocation.json','driver-result.json',...['binding.json','0001.claim.json','0001.outcome.json','result.json'].map(n=>'research-store/'+key+'/'+n)]){
 const original=join(fixture.root,name),target=join(destination,name),s=await lstat(original);assert(s.isFile()&&!s.isSymbolicLink());const bytes=await readFile(original);await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,bytes,{flag:'wx',mode:s.mode&0o7777});await chmod(target,s.mode&0o7777);records.push({path:name,sha256:hash(bytes),mode:s.mode&0o7777});
}
const bundle=join(destination,'project.bundle');for(const args of[['bundle','create',bundle,'--all'],['bundle','verify',bundle]]){const r=spawnSync('git',['-C',dispatch.request.project,...args],{encoding:'utf8',timeout:20000});assert.equal(r.status,0,r.stderr);}
records.push({path:'project.bundle',sha256:hash(await readFile(bundle)),mode:(await lstat(bundle)).mode&0o7777});
for(const item of records){const path=join(destination,item.path);assert.equal(hash(await readFile(path)),item.sha256);assert.equal((await lstat(path)).mode&0o7777,item.mode);}
await writeFile(join(destination,'manifest.json'),JSON.stringify({status:'PASS',observation:'PARTIAL_HTTP400',inputSha:dispatch.request.inputSha,records,gitBundleVerified:true,authValuesCopied:false,additionalRuntimeCalls:0,limits:['Opaque host auth path is preserved only as configuration, not credential contents','No real provider error body was retained; cause unknown','No successful research or fallback integration claim']},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',destination,retainedFiles:records.length,hashesAndModesVerified:true,gitBundleVerified:true,authValuesCopied:false,additionalRuntimeCalls:0},null,2));
