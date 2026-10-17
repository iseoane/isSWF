#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {prepareResearch} from '../tools/researcher-task.mjs';
const [mode,dispatchFile,gateFile]=process.argv.slice(2);assert(['--check','--run-model'].includes(mode));
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p));
const dispatchBytes=await readFile(dispatchFile),dispatch=JSON.parse(dispatchBytes),fixtureBytes=await readFile(dispatch.fixtureFile),fixture=JSON.parse(fixtureBytes),root=fixture.root;
assert(basename(root).startsWith('isswf-fallback66-live-'));assert.equal(fixture.request.project,join(root,'project'));assert.equal(fixture.request.store,join(root,'research-store'));assert.equal(dispatch.invocationMarker,join(root,'real-invocation.json'));
assert.equal(hash(fixtureBytes),dispatch.fixtureSha256);assert.equal(hash(await readFile(dispatch.request.grantFile)),dispatch.grantSha256);assert.deepEqual({...dispatch.request,grantFile:fixture.request.grantFile},fixture.request);
const prepared=await prepareResearch(dispatch.request),grant=prepared.grant;
assert.equal(grant.allowProviderCalls,true);assert.equal(grant.apiCostsAllowed,false);assert.equal(grant.allowResultArtifact,true);assert.equal(grant.totalAttempts,2);assert.equal(grant.retryBudget,0);assert.equal(grant.deadlineMs,120000);assert.equal(grant.maxOutputTokens,512);assert.equal(grant.outputBytes,8192);assert.equal(grant.authoritativeQuotaEvidence,undefined);assert.deepEqual(prepared.route,fixture.route);
assert.deepEqual(grant.subscriptionAttestations,[{provider:'opencode-go',coversCallsWithoutAdditionalApiCost:true,reference:dispatch.operatorReference}]);
for(const [p,h]of Object.entries(dispatch.files))assert.equal(hash(await readFile(p)),h,p);
assert(!existsSync(dispatch.invocationMarker),'invocation already consumed');assert.deepEqual(await readdir(dispatch.request.store),[],'research store must be untouched');
const git=(...args)=>{const r=spawnSync('git',['-C',dispatch.request.project,...args],{encoding:'utf8',timeout:10000});assert.equal(r.status,0,'fixture Git observation failed');return r.stdout;};
assert.equal(git('rev-parse','HEAD').trim(),dispatch.request.inputSha);assert.equal(git('status','--porcelain'),'');
const before={};for(const name of git('ls-tree','-r','--name-only',dispatch.request.inputSha).trim().split('\n')){const path=join(dispatch.request.project,name),s=await lstat(path);assert(s.isFile());before[name]={sha256:hash(await readFile(path)),mode:s.mode&0o7777};}
const driverSha256=hash(await readFile(fileURLToPath(import.meta.url))),dispatchSha256=hash(dispatchBytes);
if(mode==='--check')console.log(JSON.stringify({status:'OFFLINE_CHECK_PASS',driverSha256,dispatchSha256,fixtureSha256:dispatch.fixtureSha256,grantSha256:dispatch.grantSha256,files:dispatch.files,protectedProjectFiles:before,invocationMarkerAbsent:true,storeEmpty:true,providerCalls:0,precallVerdict:'not supplied; check does not permit invocation'},null,2));
else{
 const gate=await json(gateFile);assert.equal(gate.verdict,'PASS');assert.equal(gate.dispatchSha256,dispatchSha256);assert.equal(gate.driverSha256,driverSha256);assert.deepEqual(gate.files,dispatch.files);assert(typeof gate.independentReviewRef==='string'&&gate.independentReviewRef.trim());
 await writeFile(dispatch.invocationMarker,JSON.stringify({version:1,dispatchSha256,driverSha256,independentReviewRef:gate.independentReviewRef,operatorReference:dispatch.operatorReference,maximumCalls:2,retries:0,totalDeadlineMs:120000,noSecondInvocation:true})+'\n',{flag:'wx',mode:0o600});
 const a=dispatch.request,child=spawnSync(process.execPath,[resolve('tools/researcher-task.mjs'),'--project',a.project,'--input-sha',a.inputSha,'--job',a.jobPath,'--grant-file',a.grantFile,'--store',a.store,'--mode','real'],{encoding:'utf8',timeout:140000,killSignal:'SIGKILL',maxBuffer:32768,stdio:['ignore','pipe','ignore']});
 let result;try{result=JSON.parse(child.stdout);}catch{}
 let projectUnchanged=git('status','--porcelain')==='';for(const [p,expected]of Object.entries(before)){const path=join(a.project,p),s=await lstat(path);projectUnchanged&&=s.isFile()&&hash(await readFile(path))===expected.sha256&&(s.mode&0o7777)===expected.mode;}
 const expectedFindings=typeof result?.text==='string'&&/(?:\b21\b|twenty[- ]one)/i.test(result.text)&&result.text.includes('facts.md');
 const pass=child.status===0&&result?.mode==='real'&&result.status==='complete'&&result.attemptsConsumed>=1&&result.attemptsConsumed<=2&&projectUnchanged&&expectedFindings;
 const value={status:pass?'PASS':'PARTIAL',exitCode:child.status,signal:child.signal,outerFailure:child.error?'bounded child failure; no retry':null,dispatchSha256,driverSha256,projectUnchanged,expectedFindings,result:result??null,nonJSONStdoutSha256:result?null:hash(child.stdout??''),limits:['one authorized driver invocation, no retry or new logical job','at most two actual attempts; unknown charges remain consumed','effort is requested and runtime-supported, not a provider receipt','no real quota-exhaustion classifier proof or deliberate exhaustion']};
 await writeFile(join(root,'driver-result.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(value,null,2));if(!pass)process.exitCode=2;
}
