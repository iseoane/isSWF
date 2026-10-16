#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { effectIntent } from '../tools/external-effect-journal.mjs';

const source = resolve(process.argv[2] || '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-effects68-'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function run(binary, args, expected = 0, env = process.env) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024, env });
  assert.equal(result.status, expected, JSON.stringify({ args, status: result.status, signal: result.signal, stderr: result.stderr }));
  return result;
}
const bin = join(root, 'bin'); await mkdir(bin);
await writeFile(join(bin, 'gh'), `#!${process.execPath}
import fs from 'node:fs';
const directory=process.env.FAKE_REMOTE, mode=process.env.FAKE_MODE || '', args=process.argv.slice(2);
if(args[0]!=='api'||args[1]!=='--hostname'||args[2]!=='github.com'||args[3]!=='--method')process.exit(11);
const method=args[4], path=args[5], file=directory+'/remote.json', calls=directory+'/calls.jsonl';
fs.appendFileSync(calls,JSON.stringify({method,path})+'\\n');
const remote=JSON.parse(fs.readFileSync(file));
if(method==='POST') {
 const body=JSON.parse(fs.readFileSync(0,'utf8'));
 if(mode==='submitted-zero') {process.kill(process.ppid,'SIGKILL');process.exit(0);}
 const pull={number:remote.length+1,state:'open',merged_at:null,head:{repo:{full_name:'fixture/repository'},ref:body.head,sha:'a'.repeat(40)},base:{repo:{full_name:'fixture/repository'},ref:body.base,sha:'b'.repeat(40)},body:body.body,title:body.title,draft:body.draft};
 remote.push(pull);fs.writeFileSync(file,JSON.stringify(remote));
 if(mode==='lost-response') {process.kill(process.ppid,'SIGKILL');process.exit(0);}
 console.log(JSON.stringify(mode==='created-closed'?{...pull,state:'closed'}:pull));
} else if(path.includes('/pulls?')) {
 if(mode==='query-error')process.exit(7);
 if(mode==='malformed') {console.log('{');process.exit(0);}
 const value=mode==='zero'?[]:mode==='multiple'?[...remote,...remote.map(p=>({...p,number:p.number+100}))]:mode==='full-page'?Array.from({length:100},()=>remote[0]):mode==='closed'?remote.map(p=>({...p,state:'closed'})):mode==='merged'?remote.map(p=>({...p,state:'closed',merged_at:'2026-10-16T00:00:00Z'})):mode==='missing-state'?remote.map(({state,merged_at,...p})=>p):remote;
 console.log(JSON.stringify(value));
} else {
 if(mode==='before-submission'){process.kill(process.ppid,'SIGKILL');process.exit(0);}
 console.log(JSON.stringify({object:{sha:(mode==='bad-head'&&!path.endsWith('/main'))||(mode==='bad-base'&&path.endsWith('/main'))?'f'.repeat(40):path.endsWith('/main')?'b'.repeat(40):'a'.repeat(40)}}));
}
`, { mode: 0o700 });
const driver = join(root, 'driver.mjs');
await writeFile(driver, `import{readFile}from'node:fs/promises';import{externalEffect}from ${JSON.stringify(pathToFileURL(join(source, 'tools/external-effect-journal.mjs')).href)};const config=JSON.parse(await readFile(process.argv[2],'utf8'));try{console.log(JSON.stringify(await externalEffect({...config,action:process.argv[3]})));}catch(error){console.error(error.message);process.exitCode=1;}`);
const baseJob = { logicalJobRef: 'J900', externalEffect: { operation: 'pr-open', repository: 'fixture/repository', head: 'jobs/J900', base: 'main', candidateSha: 'a'.repeat(40), baseSha: 'b'.repeat(40), title: 'Reviewed fixture change', body: 'Disposable offline fixture.', draft: true } };
const binding = { inputSha: 'c'.repeat(40), targetBase: 'd'.repeat(40) };
const results = [];
async function fixture(name) {
  const directory = join(root, name); await mkdir(directory);
  await writeFile(join(directory, 'remote.json'), '[]');
  const intent = effectIntent(binding, { ...baseJob, logicalJobRef: name });
  const grant = { version: 1, grantRef: 'fixture-only-grant', host: 'github.com', key: intent.key, intentSha256: hash(JSON.stringify(intent)), maxInvocations: 1, maxQueries: 20, exclusiveEffectOwner: true, priorWritersCeased: true, reviewRef: 'fixture-independent-review', actions: ['prepare', 'publish', 'reconcile'] };
  const config = { store: directory, intent, grant }, file = join(directory, 'config.json');
  await writeFile(file, JSON.stringify(config));
  const env = { ...process.env, PATH: bin + ':' + process.env.PATH, FAKE_REMOTE: directory };
  const call = (action, expected = 0, mode = '') => run(process.execPath, [driver, file, action], expected, { ...env, FAKE_MODE: mode });
  const state = async () => JSON.parse(await readFile(join(directory, 'remote.json'), 'utf8'));
  const postCount = async () => { try { return (await readFile(join(directory, 'calls.jsonl'), 'utf8')).trim().split('\n').filter(line => JSON.parse(line).method === 'POST').length; } catch(error) { if(error.code==='ENOENT')return 0;throw error; } };
  return { directory, config, file, env, call, state, postCount };
}
const before = await fixture('before-submission');
before.call('prepare');
const interruptedBefore = before.call('publish', null, 'before-submission');
assert.equal(interruptedBefore.signal, 'SIGKILL');
await assert.rejects(readFile(join(before.directory, 'effects', before.config.intent.key, 'submitted.json')), { code: 'ENOENT' });
assert.equal(JSON.parse(before.call('publish').stdout).state, 'confirmed');
assert.equal(await before.postCount(), 1); results.push('actual-client-SIGKILL-before-submission-then-single-publish');

const lost = await fixture('lost-response'); lost.call('prepare');
assert.equal(lost.call('publish', null, 'lost-response').signal, 'SIGKILL');
assert.equal((await lost.state()).length, 1);
assert.match(lost.call('publish', 1).stderr, /already claimed/);
assert.equal(JSON.parse(lost.call('inspect').stdout).state, 'submitted-unknown');
assert.equal(JSON.parse(lost.call('reconcile').stdout).outcome.number, 1);
assert.equal(await lost.postCount(), 1); results.push('actual-client-SIGKILL-after-persistent-remote-before-local-outcome-no-second-post');

for (const mode of ['zero', 'multiple', 'query-error', 'malformed', 'full-page', 'closed', 'merged', 'missing-state']) {
  const f = await fixture('uncertain-' + mode); f.call('prepare'); f.call('publish', null, 'lost-response');
  const claimPath = join(f.directory, 'effects', f.config.intent.key, 'submitted.json'), original = hash(await readFile(claimPath));
  f.call('reconcile', 1, mode);
  f.call('publish', 1);
  assert.equal(hash(await readFile(claimPath)), original);
  assert.equal(await f.postCount(), 1);
  results.push('uncertain-' + mode + '-blocks-without-retry');
}
for (const mode of ['bad-head', 'bad-base']) {
  const f = await fixture(mode); f.call('prepare');
  assert.match(f.call('publish', 1, mode).stderr, /remote refs differ/);
  assert.equal(await f.postCount(), 0);
  await assert.rejects(readFile(join(f.directory, 'effects', f.config.intent.key, 'submitted.json')), { code: 'ENOENT' });
  results.push(mode + '-blocks-before-submission');
}
const preexisting = await fixture('preexisting-unclaimed'); preexisting.call('prepare');
const seededPull = { number: 7, state: 'open', merged_at: null, head: { repo: { full_name: 'fixture/repository' }, ref: baseJob.externalEffect.head, sha: 'a'.repeat(40) }, base: { repo: { full_name: 'fixture/repository' }, ref: 'main', sha: 'b'.repeat(40) }, title: baseJob.externalEffect.title, body: preexisting.config.intent.body + '\n' + preexisting.config.intent.marker, draft: true };
await writeFile(join(preexisting.directory, 'remote.json'), JSON.stringify([seededPull]));
assert.match(preexisting.call('publish', 1).stderr, /preexisting/);
assert.match(preexisting.call('reconcile', 1).stderr, /no submitted/);
assert.equal(await preexisting.postCount(), 0);
results.push('preexisting-PR-without-local-claim-blocks-no-automatic-adoption');
const invalidCreated = await fixture('created-closed'); invalidCreated.call('prepare');
assert.match(invalidCreated.call('publish', 1, 'created-closed').stderr, /does not match/);
invalidCreated.call('publish', 1); assert.equal(await invalidCreated.postCount(), 1);
results.push('invalid-create-response-retains-submission-no-retry');
const limited = await fixture('durable-query-budget');
limited.config.grant.maxQueries = 1; await writeFile(limited.file, JSON.stringify(limited.config)); limited.call('prepare');
for (let count=0; count<2; count++) assert.match(limited.call('publish', 1).stderr, /query budget exhausted/);
assert.equal(await limited.postCount(), 0); results.push('durable-numeric-query-budget-no-reset-on-new-process');
const corrupt = await fixture('corrupt-facts'); corrupt.call('prepare');
await writeFile(join(corrupt.directory, 'effects', corrupt.config.intent.key, 'submitted.json'), '{');
assert.match(corrupt.call('publish', 1).stderr, /corrupt/); assert.equal(await corrupt.postCount(), 0);
results.push('corrupt-submission-blocks-without-repair');
const zero = await fixture('submitted-before-request'); zero.call('prepare');
assert.equal(zero.call('publish', null, 'submitted-zero').signal, 'SIGKILL');
assert.equal((await zero.state()).length, 0); zero.call('reconcile', 1); zero.call('publish', 1);
assert.equal(await zero.postCount(), 1); results.push('submitted-before-request-zero-is-not-retry-permission');

const conflict = await fixture('stable-logical-identity'); conflict.call('prepare');
const intentPath = join(conflict.directory, 'effects', conflict.config.intent.key, 'intent.json'), originalIntent = hash(await readFile(intentPath));
for (const patch of [{ inputSha: 'e'.repeat(40) }, { candidateSha: 'f'.repeat(40) }]) {
  const changed = { ...conflict.config, intent: { ...conflict.config.intent, ...patch } };
  changed.grant = { ...changed.grant, intentSha256: hash(JSON.stringify(changed.intent)) };
  await writeFile(conflict.file, JSON.stringify(changed));
  assert.match(conflict.call('prepare', 1).stderr, /conflicting/);
  assert.equal(hash(await readFile(intentPath)), originalIntent);
}
assert.equal(effectIntent({ ...binding, attemptId: 'new-attempt' }, { ...baseJob, logicalJobRef: 'stable-logical-identity' }).key, conflict.config.intent.key);
results.push('attempt-independent-key-input-and-candidate-conflicts-preserve-intent');
for (const patch of [{ maxInvocations: undefined }, { maxInvocations: 0 }, { maxInvocations: 2 }, { maxQueries: undefined }, { priorWritersCeased: false }, { exclusiveEffectOwner: false }, { reviewRef: '' }, { actions: ['prepare'] }]) {
  await writeFile(conflict.file, JSON.stringify({ ...conflict.config, grant: { ...conflict.config.grant, ...patch } }));
  conflict.call('publish', 1);
}
assert.equal(await conflict.postCount(), 0); results.push('missing-budget-review-cessation-owner-or-action-blocks');
assert.throws(() => effectIntent(binding, { ...baseJob, logicalJobRef: undefined }), /logical job/);

const concurrent = await fixture('concurrent-invocations'); concurrent.call('prepare');
const launch = () => new Promise(resolveDone => {
  const child = spawn(process.execPath, [driver, concurrent.file, 'publish'], { env: concurrent.env, stdio: ['ignore','ignore','ignore'] });
  child.on('exit', (code, signal) => resolveDone({ code, signal }));
});
const competing = await Promise.all([launch(), launch()]);
assert(competing.some(result => result.code === 0));
assert.equal(await concurrent.postCount(), 1); results.push('competing-clients-one-submission-claim-one-post');

const operational = JSON.parse(run(process.execPath, [join(source, '.audit/verify-operational-44.mjs'), source]).stdout);
assert.equal(operational.status, 'PASS');
const runtime = join(root, 'runtime');
run('git', ['clone', '--quiet', '--local', '--no-hardlinks', join(operational.root, 'source'), runtime]);
const project = join(operational.root, 'project'), store = join(operational.root, 'runs');
const jobPath = '.factory/jobs/J801/job.json';
const git = (...args) => run('git', ['-C', project, ...args]).stdout.trim();
const job = JSON.parse(run('git', ['-C', project, 'show', operational.inputSha + ':' + jobPath]).stdout);
await writeFile(join(project, jobPath), JSON.stringify({ ...job, ...baseJob }));
git('add', jobPath); git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Explicit PR fixture intent');
const inputSha = git('rev-parse', 'HEAD'), cli = join(runtime, 'tools/isswf-job.mjs');
run(process.execPath, [cli, 'run', '--project', project, '--input-sha', inputSha, '--job', jobPath, '--runs-store', store, '--attempt-id', 'effects-A001', '--grant-ref', 'offline-fixture-only', '--mode', 'offline']);
let observed;
for (let count=0; count<200; count++) {
  observed=JSON.parse(run(process.execPath,[cli,'read','--runs-store',store,'--attempt-id','effects-A001']).stdout);
  if(observed.state==='terminal')break;
  await new Promise(resolveWait=>setTimeout(resolveWait,100));
}
assert.equal(observed.terminal?.outcome, 'success');
const cliRemote = await fixture('public-cli');
const args = [cli,'effect','--runs-store',store,'--attempt-id','effects-A001','--action'];
const descriptor=JSON.parse(run(process.execPath,[...args,'inspect'],0,cliRemote.env).stdout);
assert.equal(descriptor.state,'unprepared');
const grantFile=join(root,'operator-grant.json');
const grant={...cliRemote.config.grant,key:descriptor.key,intentSha256:descriptor.intentSha256};
await writeFile(grantFile,JSON.stringify(grant));
const invalidGrants = [
  { path: 'relative-grant.json', reason: /absolute operator-owned/ },
  { path: join(project, 'grant.json'), content: JSON.stringify(grant), reason: /outside untrusted project/ },
  { path: join(runtime, 'grant.json'), content: JSON.stringify(grant), reason: /outside untrusted project/ },
  { path: join(store, 'grant.json'), content: JSON.stringify(grant), reason: /outside untrusted project/ },
  { path: join(store, 'effects-A001/workspace/worker-grant.json'), content: JSON.stringify(grant), reason: /outside untrusted project/ },
  { path: join(root, 'large-grant.json'), content: ' '.repeat(16001), reason: /bounded regular/ },
  { path: join(root, 'malformed-grant.json'), content: '{', reason: /JSON/ }
];
for (const negative of invalidGrants) {
  if (negative.content !== undefined) await writeFile(negative.path, negative.content);
  assert.match(run(process.execPath,[...args,'prepare','--grant-file',negative.path],1,cliRemote.env).stderr,negative.reason);
}
const unknownArgs=[cli,'effect','--runs-store',store,'--attempt-id','unknown-attempt','--action','prepare','--grant-file',grantFile];
assert.match(run(process.execPath,unknownArgs,1,cliRemote.env).stderr,/validated successful bound attempt/);
const originalTerminal=await readFile(join(store,'effects-A001/terminal.json'));
await writeFile(join(store,'effects-A001/terminal.json'),'{');
assert.match(run(process.execPath,[...args,'prepare','--grant-file',grantFile],1,cliRemote.env).stderr,/validated successful bound attempt/);
await writeFile(join(store,'effects-A001/terminal.json'),originalTerminal);
assert.equal(await cliRemote.postCount(),0);
results.push('public-cli-relative-project-source-runs-store-worker-workspace-oversized-malformed-grants-and-unknown-corrupt-attempts-block');
for(const action of ['prepare','publish','reconcile']) {
  const result=JSON.parse(run(process.execPath,[...args,action,'--grant-file',grantFile],0,cliRemote.env).stdout);
  assert.equal(result.state,action==='prepare'?'prepared':'confirmed');
}
assert.equal(await cliRemote.postCount(),1);
const facts = async () => {
  const directory=join(store,'effects',descriptor.key), names=(await readdir(directory)).sort();
  return Object.fromEntries(await Promise.all(names.map(async name=>[name,hash(await readFile(join(directory,name)))])));
};
const readonlyBefore=await facts(), callsBefore=await readFile(join(cliRemote.directory,'calls.jsonl'),'utf8');
for(const command of ['read','reconcile']) run(process.execPath,[cli,command,'--runs-store',store,'--attempt-id','effects-A001'],0,cliRemote.env);
run(process.execPath,[...args,'inspect'],0,cliRemote.env);
assert.deepEqual(await facts(),readonlyBefore);
assert.equal(await readFile(join(cliRemote.directory,'calls.jsonl'),'utf8'),callsBefore);
results.push('public-job-cli-bound-pinned-intent-real-offline-SDK-worker-fake-remote-publish-and-readonly-observation');
const piResult=JSON.parse(await readFile(join(store,'effects-A001/pi-result.json'),'utf8'));
assert.equal(piResult.providerPromptStarted,false);
console.log(JSON.stringify({status:'PASS',root,offlineWorkerProviderPromptStarted:piResult.providerPromptStarted,transport:{kind:'fixture-gh-on-exclusive-PATH',executableSha256:hash(await readFile(join(bin,'gh'))),kernelNetworkExclusionClaimed:false},scope:'PR journal logic with fake gh process, not GitHub integration or full recovery',results,operationalRoot:operational.root,productionHashes:Object.fromEntries(await Promise.all(['tools/external-effect-journal.mjs','tools/isswf-job.mjs'].map(async path=>[path,hash(await readFile(join(source,path)))])))},null,2));
