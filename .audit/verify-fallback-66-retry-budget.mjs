#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const [callerFile,seedFile]=process.argv.slice(2),caller=resolve(callerFile),seed=JSON.parse(await readFile(seedFile));assert(basename(seed.root).startsWith('isswf-fallback66-'));
const grant=JSON.parse(await readFile(join(seed.root,'grant-1.json'))),root=await mkdtemp(join(tmpdir(),'isswf-fallback66-retry-')),store=join(root,'store'),grantFile=join(root,'fixture-grant.json');await mkdir(store);
Object.assign(grant,{store,totalAttempts:4,retryBudget:1,callerSha256:createHash('sha256').update(await readFile(caller)).digest('hex')});await writeFile(grantFile,JSON.stringify(grant));
const attempts=[];let fetches=0;const backend={async preflight(tuple){const i=tuple.model.indexOf('/');return{model:{provider:tuple.model.slice(0,i),id:tuple.model.slice(i+1)},billingEvidence:{source:'fixture-only'}};},async fetch(){return{status:++fetches<=3?503:200};},stream(model,context,options){attempts.push(model.provider+'/'+model.id);return{result:async()=>{const response=await options.fetch('https://fixture.invalid');return{provider:model.provider,model:model.id,stopReason:response.status===503?'error':'stop',content:[{type:'text',text:'fixture output'}]};}};}};
const {runResearch}=await import(pathToFileURL(caller)),actual=await runResearch({project:grant.project,inputSha:grant.inputSha,jobPath:grant.jobPath,grantFile,store},{backend,mode:'fixture'}),pass=actual.status==='blocked'&&actual.reason==='approved-route-exhausted'&&actual.attemptsConsumed===3&&fetches===3;
console.log(JSON.stringify({status:pass?'PASS':'FAIL',caller,root,expected:{status:'blocked',reason:'approved-route-exhausted',attemptsConsumed:3,maximumRetriesAcrossRoute:1},actual:{status:actual.status,reason:actual.reason,attemptsConsumed:actual.attemptsConsumed,fetches,attempts},realRuntimeCalls:0},null,2));if(!pass)process.exitCode=1;
