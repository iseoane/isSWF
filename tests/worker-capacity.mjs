import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const root = await mkdtemp(join(tmpdir(), 'isswf-worker-capacity-'));
const project = join(root, 'project'), store = join(root, 'runs'), pool = join(root, 'capacity');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const command = (binary, args) => spawnSync(binary, args, { cwd: project, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024, env: { PATH: process.env.PATH, HOME: root } });
const git = (...args) => { const r = command('git', args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const json = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
let retainFixture=false;
const waitFor=async(fn,label)=>{for(let n=0;n<300;n++){const value=await fn();if(value)return value;await new Promise(done=>setTimeout(done,50));}throw Error('timed out: '+label);};
try {
  await mkdir(project); await mkdir(pool); await mkdir(join(pool, 'completed'));
  const policy = JSON.stringify({ version: 1, limit: 2, reference: 'Synthetic operator-owned worker pool' });
  await writeFile(join(pool, 'policy.json'), policy);
  for (const slot of [0, 1]) await mkdir(join(pool, 'slot-' + slot));
  for (const path of ['.agents/skills/isswf-coordinator', '.agents/skills/isswf-setup', '.agents/roles', '.factory/templates', '.factory/models.json', 'docs/model-routing.md', 'docs/durable-work.md', 'package.json']) {
    await mkdir(dirname(join(project, path)), { recursive: true }); await cp(join(source, path), join(project, path), { recursive: true });
  }
  await mkdir(join(project, 'tools'));
  for (const name of ['isswf-job', 'factory-package', 'pi-worker-task', 'worker-lifecycle', 'native-recovery', 'external-effect-journal', 'recovery-review', 'job-successor', 'execution-capacity']) await cp(join(source, 'tools', name + '.mjs'), join(project, 'tools', name + '.mjs'));
  await writeFile(join(project, 'result.txt'), 'unchanged\n');
  git('init', '-q'); git('config', 'user.name', 'Capacity fixture'); git('config', 'user.email', 'fixture@invalid');
  git('add', '.'); git('commit', '-qm', 'Pin fixture runtime'); const runtimeSha = git('rev-parse', 'HEAD');
  const sdkPath = join(root, 'unused-sdk'); await mkdir(sdkPath); await json(join(sdkPath, 'package.json'), { name: '@earendil-works/pi-coding-agent' });
  const materialized = command(process.execPath, ['tools/factory-package.mjs', 'materialize', '--source', project, '--revision', runtimeSha, '--store', join(root, 'packages')]); assert.equal(materialized.status, 0, materialized.stderr);
  await mkdir(join(project, '.pi')); await json(join(project, '.pi/settings.json'), { packages: [] });
  git('add', '.pi'); git('commit', '-qm', 'Pin clean project settings before activation');
  const activated = command(process.execPath, ['tools/factory-package.mjs', 'activate', '--package', join(root, 'packages', runtimeSha), '--project', project]); assert.equal(activated.status, 0, activated.stderr);
  await writeFile(join(project, 'brief.md'), 'Synthetic offline worker; no provider invocation.\n');
  const job = { version: 1, runtimeSha, targetBase: runtimeSha, methodologySha: '37a56ebc902e94f21fc10666f33fceac44946af7', exclusiveAttempt: true, workerTotal: 1, logicalJobRef: 'I0001/J005/offline-worker', models: { sha: runtimeSha, path: '.factory/models.json', sha256: hash(await readFile(join(project, '.factory/models.json'))) }, briefPath: 'brief.md', sdkPath, expectedMutablePaths: ['result.txt'], protectedCheckCommand: 'test -f package.json', offlineChecks: [] };
  await json(join(project, 'job.json'), job); git('add', '.'); git('commit', '-qm', 'Pin job input'); const inputSha = git('rev-parse', 'HEAD');
  const grantFile = join(root, 'capacity-grant.json');
  const grant = { version: 1, role: 'worker', mode: 'offline', project, runsStore: store, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), runtimeSha, attemptId: 'capacity-worker', logicalJobRef: job.logicalJobRef, grantRef: 'synthetic-worker-only', allowCapacity: true, capacity: { pool, policySha256: hash(policy) }, capacityRunnerSha256: hash(await readFile(join(project, 'tools/execution-capacity.mjs'))) };
  await json(grantFile, grant);
  const args = ['tools/isswf-job.mjs', 'run', '--project', project, '--input-sha', inputSha, '--job', 'job.json', '--runs-store', store, '--attempt-id', grant.attemptId, '--grant-ref', grant.grantRef, '--mode', 'offline', '--capacity-grant', grantFile];
  const refused = command(process.execPath, args);
  assert.equal(refused.status, 2, refused.stderr);
  const result = JSON.parse(refused.stdout);
  assert.equal(result.status, 'blocked'); assert.equal(result.reason, 'capacity'); assert.equal(result.attemptsConsumed, 0);
  assert.deepEqual(await readdir(store), []);
  assert.equal(await readFile(join(project, 'result.txt'), 'utf8'), 'unchanged\n');
  for (const change of [{ mode: 'real' }, { attemptId: 'different' }, { jobSha256: '0'.repeat(64) }, { capacityRunnerSha256: '0'.repeat(64) }]) {
    await json(grantFile, { ...grant, ...change }); const denied = command(process.execPath, args); assert.equal(denied.status, 1); assert.deepEqual(await readdir(store), []);
  }
  if(process.argv[3]) {
    const actualSDK=resolve(process.argv[3]);
    git('fetch','--quiet',source,job.methodologySha);
    const authPath=join(root,'synthetic-offline-auth.json');
    const token=['synthetic',Buffer.from(JSON.stringify({'https://api.openai.com/auth':{chatgpt_account_id:'synthetic-offline-account'}})).toString('base64url'),'signature'].join('.');
    await json(authPath,{'openai-codex':{type:'oauth',access:token,refresh:'synthetic-not-usable',expires:4102444800000}});
    for(const slot of [0,1])await rm(join(pool,'slot-'+slot),{recursive:true});
    const inputs=[];
    for(const [id,check]of [['worker-a','while ! test -f gate; do sleep 0.02; done; printf done > result.txt'],['worker-b','while ! test -f gate; do sleep 0.02; done; printf done > result.txt'],['worker-third','printf third > result.txt'],['worker-failed','exit 7'],['worker-unrelated','printf unrelated > result.txt']]) {
      const selected={...job,logicalJobRef:'I0001/J005/'+id,sdkPath:actualSDK,authPath,expectedMutablePaths:['result.txt','gate'],offlineChecks:[{name:'owned-offline-control',command:check,expectedExitCode:0}]};
      await json(join(project,id+'.json'),selected);git('add','.');git('commit','-qm','Pin '+id);const selectedInput=git('rev-parse','HEAD');
      const selectedGrant={...grant,inputSha:selectedInput,jobPath:id+'.json',jobSha256:hash(await readFile(join(project,id+'.json'))),attemptId:id,logicalJobRef:selected.logicalJobRef};
      const selectedFile=join(root,id+'-grant.json');await json(selectedFile,selectedGrant);
      inputs.push({id,grant:selectedGrant,args:['tools/isswf-job.mjs','run','--project',project,'--input-sha',selectedInput,'--job',id+'.json','--runs-store',store,'--attempt-id',id,'--grant-ref',grant.grantRef,'--mode','offline','--capacity-grant',selectedFile]});
    }
    retainFixture=true;
    for(const selected of inputs.slice(0,2)){const launched=command(process.execPath,selected.args);assert.equal(launched.status,0,launched.stderr);assert.equal(JSON.parse(launched.stdout).attemptId,selected.id);}
    for(const selected of inputs.slice(0,2))await waitFor(async()=>{try{await readFile(join(store,selected.id,'native-tools/000002.started.json'));return true;}catch{try{const terminal=JSON.parse(await readFile(join(store,selected.id,'terminal.json')));throw Error(JSON.stringify(terminal));}catch(error){if(error.code!=='ENOENT')throw error;}return false;}},selected.id+' waiting gate');
    const third=command(process.execPath,inputs[2].args);assert.equal(third.status,2,third.stderr);assert.equal(JSON.parse(third.stdout).reason,'capacity');
    await assert.rejects(readFile(join(store,'worker-third.job.json')),error=>error.code==='ENOENT');
    const {completeWorkerCapacity}=await import(new URL('../tools/execution-capacity.mjs',import.meta.url));
    const scope={...grant.capacity,limit:2,runnerSha256:grant.capacityRunnerSha256};
    const firstBinding=JSON.parse(await readFile(join(store,'worker-a.job.json')));
    await assert.rejects(completeWorkerCapacity({scope,info:firstBinding.capacity}));
    assert.equal((await readdir(pool)).filter(name=>name.startsWith('slot-')).length,2);
    for(const selected of inputs.slice(0,2))await writeFile(join(store,selected.id,'workspace/gate'),'owned synthetic release\n');
    const observed=async id=>{const read=command(process.execPath,['tools/isswf-job.mjs','read','--runs-store',store,'--attempt-id',id]);assert.equal(read.status,0,read.stderr);return JSON.parse(read.stdout);};
    for(const selected of inputs.slice(0,2)) {
      const done=await waitFor(async()=>{const value=await observed(selected.id);if(value.state==='terminal'&&value.terminal.outcome!=='success')throw Error(JSON.stringify(value));return value.capacity?.status==='released'?value:null;},selected.id+' released');
      assert.equal(done.state,'terminal');assert.equal(done.terminal.outcome,'success');assert.match(done.terminal.stdout,/"providerPromptStarted":false/);
      const receipt=JSON.parse(await readFile(join(pool,'completed',done.job.capacity.id,'completion.json')));
      assert.equal(receipt.evidence.kind,'verified-worker-task-and-tool-namespace-cessation');assert(receipt.evidence.namespacesCeased>=3);
    }
    const thirdRetry=command(process.execPath,inputs[2].args);assert.equal(thirdRetry.status,0,thirdRetry.stderr);
    await waitFor(async()=>(await observed('worker-third')).capacity?.status==='released','later admission');
    const repeated=command(process.execPath,inputs[0].args);assert.equal(repeated.status,1);assert.match(repeated.stderr,/attempt already exists/);
    const failed=command(process.execPath,inputs[3].args);assert.equal(failed.status,0,failed.stderr);
    const retained=await waitFor(async()=>{const value=await observed('worker-failed');return value.capacity?.status==='retained'?value:null;},'failed execution retains');
    assert.equal(retained.terminal.outcome,'failure');assert.equal((await readdir(pool)).filter(name=>name.startsWith('slot-')).length,1);
    const other=command(process.execPath,inputs[4].args);assert.equal(other.status,0,other.stderr);
    await waitFor(async()=>(await observed('worker-unrelated')).capacity?.status==='released','unrelated job uses free slot');
    assert.equal((await readdir(pool)).filter(name=>name.startsWith('slot-')).length,1);
    assert.equal((await readdir(join(store,'admissions'))).filter(name=>name.endsWith('.json')).length,5);
    retainFixture=false;
    console.log('PASS actual normal offline worker CLI: two concurrent namespace-bound workers, third blocked before permanent admission, live-task release refused, verified cessation releases, later admission, permanent replay refusal and failed-worker retention with unrelated progress; no provider prompts');
  }
  console.log('PASS normal worker CLI capacity refusal before permanent admission, preparation or execution; bound grant mismatches fail closed; no provider calls');
} finally { if(retainFixture)console.error('Preserved owned failing worker fixture: '+root);else await rm(root, { recursive: true, force: true }); }
