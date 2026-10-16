#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, readdir, lstat, unlink, chmod, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { effectIntent } from '../tools/external-effect-journal.mjs';

const source=resolve(process.argv[2]||'.');
const hash=b=>createHash('sha256').update(b).digest('hex');
function run(args,expected=0,timeout=150000){const r=spawnSync(process.execPath,args,{encoding:'utf8',timeout,maxBuffer:8*1024*1024});assert.equal(r.status,expected,JSON.stringify({args,status:r.status,signal:r.signal,stderr:r.stderr}));return r;}
const native=JSON.parse(run([join(source,'.audit/verify-recovery-68-native.mjs'),source,'--review-controls']).stdout);
assert.equal(native.status,'PASS');
const root=native.root,store=join(root,'runs'),project=join(root,'project'),runtime=join(root,'runtime'),id='R68-host-task-loss',dir=join(store,id),work=join(dir,'workspace'),cli=join(runtime,'tools/isswf-job.mjs');
const receiptPath=join(dir,'recovery-review-receipt.json'), approvalPath=join(root,'operator-review.json');
const args=[cli,'review','--runs-store',store,'--attempt-id',id,'--action'];
const call=(action,expected=0,extra=[])=>run([...args,action,...extra],expected);
const inspect=()=>JSON.parse(call('inspect').stdout);
const absent=async path=>assert.rejects(readFile(path),{code:'ENOENT'});
const record=(expected=0,path=approvalPath)=>call('record',expected,['--review-file',path]);
const approval=c=>({version:1,grantRef:'operator-local-check-only',reviewRef:'independent-disposable-review',independentReview:true,verdict:'pass',allowProtectedCheck:true,fingerprint:c.fingerprint,protectedCheckCommandSha256:c.candidate.protectedCheckCommandSha256});
async function tree(path){const out={};async function visit(p,prefix=''){for(const name of(await readdir(p)).sort()){const file=join(p,name),key=prefix+name,stat=await lstat(file);if(stat.isDirectory())await visit(file,key+'/');else out[key]=hash(await readFile(file));}}await visit(path);return out;}
const results=[];
const before=await tree(store), descriptor=inspect();
assert.equal(descriptor.successorAuthorized,false);assert.equal(descriptor.providerCharge,'not-reconciled');
assert.match(call('check',1).stderr,/missing, stale/);await absent(receiptPath);
for(const command of ['read','reconcile'])run([cli,command,'--runs-store',store,'--attempt-id',id]);
assert.deepEqual(await tree(store),before);results.push('inspect-check-read-reconcile-readonly-no-receipt');
await writeFile(approvalPath,JSON.stringify(approval(descriptor)));
for(const [path,reason] of [['relative.json',/absolute operator-owned/],[join(project,'review.json'),/outside untrusted/],[join(runtime,'review.json'),/outside untrusted/],[join(store,'review.json'),/outside untrusted/],[join(work,'heartbeat.txt'),/outside untrusted/]]){
 const saved=path===join(work,'heartbeat.txt')?await readFile(path):null;
 if(path.startsWith('/'))await writeFile(path,JSON.stringify(approval(descriptor)));
 assert.match(record(1,path).stderr,reason);
 if(saved)await writeFile(path,saved);else if(path.startsWith('/'))await unlink(path);
 await absent(receiptPath);
}
for(const [name,bytes,reason] of [['oversized',' '.repeat(16001),/bounded regular/],['malformed','{',/JSON/]]){const path=join(root,name+'.json');await writeFile(path,bytes);assert.match(record(1,path).stderr,reason);}
results.push('approval-relative-project-runtime-store-workspace-oversized-malformed-refused');
for(const patch of [{version:2},{grantRef:''},{reviewRef:''},{independentReview:false},{verdict:'fail'},{allowProtectedCheck:false},{fingerprint:'0'.repeat(64)},{protectedCheckCommandSha256:'0'.repeat(64)}]){await writeFile(approvalPath,JSON.stringify({...approval(descriptor),...patch}));assert.match(record(1).stderr,/matching trusted/);await absent(receiptPath);}
results.push('missing-or-mismatched-trusted-review-and-check-authority-refused');
const counter=join(work,'src/counter.mjs'),original=await readFile(counter);
for(const value of [2,4,5]){
 await writeFile(counter,`export const counter=()=>${value};\n`);
 const changed=inspect();assert.notEqual(changed.fingerprint,descriptor.fingerprint);
 await writeFile(approvalPath,JSON.stringify(approval(changed)));
 assert.match(record(1).stderr,/protected check failed, timed out or exceeded/);await absent(receiptPath);
}
await writeFile(counter,original);results.push('actual-original-check-failure-output-overflow-and-timeout-no-receipt');
// Inject exact local PR facts only; never invoke a transport or fabricate remote confirmation.
const intent=effectIntent({inputSha:native.input,targetBase:native.targetBase},{logicalJobRef:descriptor.candidate.logicalJobRef,externalEffect:{operation:'pr-open',repository:'fixture/repository',head:'jobs/review-fixture',base:'main',candidateSha:'a'.repeat(40),baseSha:'b'.repeat(40),title:'Offline review fixture',body:'No remote action.',draft:true}});
const effectDir=join(store,'effects',intent.key);await mkdir(effectDir,{recursive:true});
const prepared={intent,authority:{grantRef:'offline-fixture-only',maxInvocations:1,maxQueries:1,reviewRef:'fixture-review',actions:['prepare']}};await writeFile(join(effectDir,'intent.json'),JSON.stringify(prepared));
assert.notEqual(inspect().fingerprint,descriptor.fingerprint,'known prepared PR facts bind candidate');
await writeFile(join(effectDir,'submitted.json'),JSON.stringify({version:1,key:intent.key,intentSha256:hash(JSON.stringify(prepared))}));
assert.match(call('inspect',1).stderr,/uncertain submitted PR/);
await writeFile(join(effectDir,'outcome.json'),JSON.stringify({version:1,key:intent.key,observedState:'open',number:1,url:'https://github.com/fixture/repository/pull/1',candidateSha:intent.candidateSha,baseSha:intent.baseSha}));
assert.notEqual(inspect().fingerprint,descriptor.fingerprint,'known confirmed PR facts bind candidate');
await unlink(join(effectDir,'outcome.json'));await unlink(join(effectDir,'submitted.json'));await unlink(join(effectDir,'intent.json'));
// An empty journal directory is ambiguous, not silently ignored.
assert.match(call('inspect',1).stderr,/ENOENT/);
const {rmdir}=await import('node:fs/promises');await rmdir(effectDir);await rmdir(join(store,'effects'));
results.push('matching-submitted-unknown-PR-blocks-without-query');
assert.equal(inspect().fingerprint,descriptor.fingerprint);
await writeFile(approvalPath,JSON.stringify(approval(descriptor)));
const recorded=JSON.parse(record().stdout);assert.equal(recorded.status,'valid');
const receipt=await readFile(receiptPath),value=JSON.parse(receipt);
assert.equal(value.protectedCheck.stdoutSha256,hash('READONLY_REVIEW_CHECK\n'));
await absent(join(work,'review-write-canary'));
assert.equal(JSON.parse(call('check').stdout).receiptSha256,hash(receipt));
record();assert.deepEqual(await readFile(receiptPath),receipt);
const stable=await tree(store);inspect();call('check');for(const command of ['read','reconcile'])run([cli,command,'--runs-store',store,'--attempt-id',id]);assert.deepEqual(await tree(store),stable);
results.push('actual-readonly-protected-check-valid-write-once-receipt-idempotent-and-readonly-observation');
await writeFile(approvalPath,JSON.stringify({...approval(descriptor),reviewRef:'conflicting-review'}));assert.match(record(1).stderr,/conflicting review/);assert.deepEqual(await readFile(receiptPath),receipt);
await writeFile(counter,'export const counter=()=>2;\n');assert.match(call('check',1).stderr,/stale or mismatched/);await writeFile(counter,original);
await chmod(counter,0o755);assert.match(call('check',1).stderr,/known stopped/);await chmod(counter,0o644);
await writeFile(join(work,'outside-scope'),'untrusted');assert.match(call('check',1).stderr,/known stopped/);await unlink(join(work,'outside-scope'));
await writeFile(receiptPath,'{');assert.match(call('check',1).stderr,/corrupt review receipt/);await writeFile(receiptPath,receipt);
assert.equal(JSON.parse(call('check').stdout).status,'valid');results.push('conflicting-approval-stale-bytes-mode-path-and-corrupt-receipt-block');
const binding=JSON.parse(await readFile(join(store,id+'.job.json')));
const denied=run([cli,'run','--project',project,'--input-sha',binding.inputSha,'--job',binding.jobPath,'--runs-store',store,'--attempt-id','review-does-not-release','--grant-ref','not-a-successor-grant','--mode','offline'],1);
assert.match(denied.stderr,/prior logical job binding|logical job already admitted/);await absent(join(store,'review-does-not-release.job.json'));
assert.deepEqual(await readFile(receiptPath),receipt);results.push('valid-review-never-releases-admission-or-authorizes-successor');
console.log(JSON.stringify({status:'PASS',root,runtimeSha:native.runtimeSha,input:native.input,providerPromptStarted:false,nativeStopped:native.stopped.recovery.status,receiptSha256:hash(receipt),fingerprint:descriptor.fingerprint,results,limits:['approval provenance and review quality remain trusted caller preconditions','local fake PR phase facts only, no GitHub queries','receipt is exact observed candidate, not a successor lease','provider charge and whole recovery not reconciled']},null,2));
