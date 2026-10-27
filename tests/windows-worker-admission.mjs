import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile , realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyRelease } from '../tools/release-source.mjs';

if (process.platform !== 'win32') console.log('SKIP Windows installed public worker admission: not Windows');
else {
  const report = JSON.parse(await readFile(join(process.env.ISSWF_PLATFORM_ROOT, 'platform-report.json'))), release = report.installed, receipt = verifyRelease(release), binary = join(release, 'bin/isswf.exe');
  const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf admission ñ '))), project = join(root, 'project'), store = join(root, 'runs'), runtimeStore = join(root, 'runtimes'), pool = join(root, 'pool'), sdk = join(root, 'sdk');
  for (const path of [project, pool, join(pool, 'completed'), sdk]) await mkdir(path);
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const save = (path, value) => writeFile(path, JSON.stringify(value) + '\n');
  const run = (exe, args, ok = true) => { const value = spawnSync(exe, args, { encoding: 'utf8', timeout: 30000 }); assert.ifError(value.error); if (ok) assert.equal(value.status, 0, value.stderr + value.stdout); else assert.notEqual(value.status, 0); return value; };
  const git = (...args) => run('git', ['-C', project, ...args]).stdout.trim();
  const commit = () => { git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Pinned offline admission fixture'); return git('rev-parse', 'HEAD'); };
  git('init', '-q'); git('config', 'core.autocrlf', 'false');
  run(binary, ['init', '--project', project, '--store', runtimeStore, '--tracking', 'local']);
  const modelsPath = '.isswf/models.json', models = JSON.parse(await readFile(join(project, modelsPath))); models.roles.worker = [{ model: 'openai/gpt-6-luna', effort: 'high' }]; await save(join(project, modelsPath), models);
  await writeFile(join(project, 'result.txt'), 'before\n'); await writeFile(join(project, 'mutate.mjs'), "import fs from 'node:fs';fs.writeFileSync('result.txt','after\\n');\n"); await writeFile(join(project, 'check.mjs'), "import fs from 'node:fs';if(fs.readFileSync('result.txt','utf8')!=='after\\n')process.exit(2);\n");
  await writeFile(join(project, 'brief.md'), 'Synthetic offline admission only. No provider calls. Only result.txt may change.\n'); const targetBase = commit();
  await save(join(sdk, 'package.json'), { name: '@earendil-works/pi-coding-agent', main: 'index.cjs' });
  await writeFile(join(sdk, 'index.cjs'), "module.exports={ModelRuntime:{create:async()=>({hasConfiguredAuth:()=>true,getModel:(provider,id)=>({provider,id})})},SettingsManager:{inMemory:v=>v},SessionManager:{inMemory:()=>({})},createExtensionRuntime:()=>({}),createAgentSession:async o=>({session:{model:o.model,thinkingLevel:o.thinkingLevel,getCallableToolNames:()=>['sandbox_shell'],dispose:async()=>{}}})};\n");
  await mkdir(join(sdk, 'node_modules/typebox'), { recursive: true }); await save(join(sdk, 'node_modules/typebox/package.json'), { main: 'index.cjs' }); await writeFile(join(sdk, 'node_modules/typebox/index.cjs'), 'exports.Type=new Proxy({},{get:()=>()=>({})});\n');
  const job = { version: 1, logicalJobRef: 'synthetic-native-public-admission', runtimeSha: receipt.revision, methodologySha: receipt.methodologySha, targetBase, exclusiveAttempt: true, workerTotal: 1, sdkPath: sdk, models: { sha: targetBase, path: modelsPath, sha256: hash(await readFile(join(project, modelsPath))) }, briefPath: 'brief.md', expectedMutablePaths: ['result.txt'], protectedCheckCommand: 'node check.mjs', offlineChecks: [{ name: 'mutation', command: 'node mutate.mjs', expectedExitCode: 0 }] }; await save(join(project, 'job.json'), job); const inputSha = commit();
  const policy = { version: 1, limit: 1, reference: 'Synthetic public admission' }; await save(join(pool, 'policy.json'), policy);
  const grantFile = join(root, 'grant.json'); await save(grantFile, { version: 1, role: 'worker', mode: 'offline', project, runsStore: store, inputSha, jobPath: 'job.json', jobSha256: hash(await readFile(join(project, 'job.json'))), runtimeSha: receipt.revision, attemptId: 'offline-a001', logicalJobRef: job.logicalJobRef, grantRef: 'synthetic-public-admission', allowCapacity: true, capacity: { pool, policySha256: hash(JSON.stringify(policy) + '\n') }, capacityRunnerSha256: hash(await readFile(join(release, 'tools/execution-capacity.mjs'))) });
  const args = ['exec', '--project', project, '--store', runtimeStore, '--', 'isswf-job', 'run', '--input-sha', inputSha, '--job', 'job.json', '--runs-store', store, '--attempt-id', 'offline-a001', '--grant-ref', 'synthetic-public-admission', '--mode', 'offline', '--capacity-grant', grantFile];
  const launched = JSON.parse(run(binary, args).stdout); assert.equal(launched.reviewRequired, true);
  const attempt = join(store, 'offline-a001'); let terminal;
  for (let n = 0; n < 1200; n++) {
    try { terminal = JSON.parse(await readFile(join(attempt, 'capacity-completion.json'))); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { const observed = JSON.parse(await readFile(join(attempt, 'terminal.json'))); if (observed.outcome === 'failure') break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await readFile(join(attempt, 'capacity-retained.json')); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise(done => setTimeout(done, 100));
  }
  const failureEvidence = async () => {
    const evidence = { root };
    for (const name of ['terminal.json', 'pi-result.json', 'capacity-retained.json', 'execution-job-finished.json']) {
      try { evidence[name] = JSON.parse((await readFile(join(attempt, name), 'utf8')).slice(0, 24000)); } catch (error) { evidence[name] = error.code || error.message; }
    }
    const retained = JSON.stringify(evidence);
    await writeFile(join(process.env.ISSWF_PLATFORM_ROOT, 'worker-admission-evidence.json'), retained + '\n');
    return retained;
  };
  assert.equal(terminal?.status, 'released', terminal?.status === 'released' ? root : await failureEvidence());
  const result = JSON.parse(await readFile(join(attempt, 'pi-result.json'))); assert.equal(result.status, 'completed'); assert.equal(result.providerPromptStarted, false); assert.equal(result.provider, 'openai'); assert.equal(result.protectedHashesPreserved, true);
  const observation = JSON.parse(run(binary, ['exec', '--project', project, '--store', runtimeStore, '--', 'isswf-job', 'read', '--runs-store', store, '--attempt-id', 'offline-a001']).stdout); assert.equal(observation.state, 'terminal');
  run(binary, args, false); assert.equal(git('status', '--porcelain'), '');
  console.log(JSON.stringify({ status: 'PASS', root, revision: receipt.revision, checks: ['installed pinned launcher', 'public worker caller and native external store/grant', 'durable exclusive admission and same-ID refusal', 'synthetic SDK offline LPAC task', 'bound automatic shared-capacity completion', 'original project unchanged'], limits: 'No model provider or independent verdict' }));
}
