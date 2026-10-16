#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile, link, unlink, open, mkdir, mkdtemp, rm, realpath, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nativeRecorderSource } from './native-recovery.mjs';

const BASELINE = '37a56ebc902e94f21fc10666f33fceac44946af7';
const sha = value => createHash('sha256').update(value).digest('hex');
export function matchesBoundaryControls(control) {
  const expected = { fakeEnvAbsent: true, outsideRead: 'ENOENT', outsideWrite: 'ENOENT', factoryWrite: 'EROFS', sdkWrite: 'EROFS', network: 'ECONNREFUSED' };
  return control !== null && typeof control === 'object' && !Array.isArray(control)
    && Object.keys(control).length === Object.keys(expected).length
    && Object.entries(expected).every(([key, value]) => Object.hasOwn(control, key) && control[key] === value);
}
const safePath = (value, label) => {
  if (typeof value !== 'string' || !isAbsolute(value) || value.includes('\0')) throw new Error(`${label} must be absolute`);
  return value;
};
const git = (repo, args) => {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: '/nonexistent' } });
  if (result.status !== 0) throw new Error(`pinned Git read failed (${args[0]})`);
  return result.stdout;
};
const parseArgs = values => {
  const result = {};
  for (let i = 0; i < values.length; i += 1) {
    const key = values[i];
    if (!key.startsWith('--') || !values[i + 1] || Object.hasOwn(result, key)) throw new Error(`invalid option ${key}`);
    result[key] = values[++i];
  }
  return result;
};
async function prepare(args) {
  if (Object.keys(args).some(key => !['--config', '--output'].includes(key))) throw new Error('usage: prepare --config <absolute.json> --output <absolute-nonexistent-task.mjs>');
  const configPath = safePath(args['--config'], '--config');
  const output = safePath(args['--output'], '--output');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (config.version !== 1 || !['offline', 'real'].includes(config.mode)) throw new Error('config version/mode invalid');
  const sdkPath = await realpath(safePath(config.sdkPath, 'sdkPath'));
  const nodeBinary = await realpath(safePath(config.nodeBinary, 'nodeBinary'));
  if (!(await stat(nodeBinary)).isFile()) throw new Error('nodeBinary is not a file');
  const authPath = safePath(config.authPath, 'authPath');
  if (config.mode === 'real' && !(await stat(authPath).then(result => result.isFile()).catch(() => false))) throw new Error('real mode authPath must name a host auth file');
  const profile = config.profile;
  if (!profile || profile.sha !== BASELINE || !Array.isArray(profile.files) || !profile.files.length) throw new Error('profile must pin methodology files at the authorized baseline');
  const repo = await realpath(safePath(profile.repo, 'profile.repo'));
  if (!/^[0-9a-f]{40}$/.test(profile.sha)) throw new Error('invalid pinned source SHA');
  git(repo, ['cat-file', '-e', `${profile.sha}^{commit}`]);
  const files = {};
  for (const path of profile.files) {
    if (typeof path !== 'string' || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('unsafe profile file path');
    const entry = git(repo, ['ls-tree', '-z', profile.sha, '--', path]).toString().split('\0').find(Boolean);
    if (!entry || !/^100644 blob /.test(entry)) throw new Error(`profile reference is not a committed regular file: ${path}`);
    const object = entry.slice(0, entry.indexOf('\t')).split(' ')[2];
    files[path] = git(repo, ['cat-file', 'blob', object]).toString('utf8');
  }
  if (Object.hasOwn(config, 'briefText')) throw new Error('legacy briefText is not accepted');
  const brief = config.brief;
  if (!brief || typeof brief !== 'object' || Array.isArray(brief) || Object.keys(brief).sort().join(',') !== 'inputSha,path,repo') throw new Error('brief must contain exactly repo, inputSha, and path');
  if (typeof brief.inputSha !== 'string' || !/^[0-9a-f]{40}$/.test(brief.inputSha)) throw new Error('brief.inputSha must be a full lowercase commit SHA');
  if (typeof brief.path !== 'string' || brief.path.startsWith('/') || brief.path.includes('\\') || brief.path.includes('\0') || brief.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('brief.path must be a safe relative path');
  const briefRepo = await realpath(safePath(brief.repo, 'brief.repo'));
  git(briefRepo, ['cat-file', '-e', `${brief.inputSha}^{commit}`]);
  const briefEntry = git(briefRepo, ['ls-tree', '-z', brief.inputSha, '--', brief.path]).toString().split('\0').find(entry => entry.slice(entry.indexOf('\t') + 1) === brief.path);
  if (!briefEntry || !/^100(?:644|755) blob [0-9a-f]{40}\t/.test(briefEntry)) throw new Error('brief.path must name a committed regular-file blob');
  const briefOid = briefEntry.slice(0, briefEntry.indexOf('\t')).split(' ')[2];
  const briefBytes = git(briefRepo, ['cat-file', 'blob', briefOid]);
  const briefText = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(briefBytes);
  if (!briefBytes.length || briefBytes.length > 32000 || !briefText.trim()) throw new Error('brief must be non-empty and <=32KB');
  const briefSha256 = sha(briefBytes);
  if (!Array.isArray(config.expectedMutablePaths) || !config.expectedMutablePaths.length || config.expectedMutablePaths.some(path => typeof path !== 'string' || path.startsWith('/') || path.split('/').some(part => !part || part === '..' || part === '.'))) throw new Error('expectedMutablePaths invalid');
  if (typeof config.protectedCheckCommand !== 'string' || !config.protectedCheckCommand || config.protectedCheckCommand.length > 1000) throw new Error('protectedCheckCommand invalid');
  const checks = config.checks ?? [];
  if (!Array.isArray(checks) || checks.length > 10 || checks.some(check => !check || typeof check.name !== 'string' || !check.name || typeof check.command !== 'string' || !check.command || check.command.length > 8000 || !Number.isInteger(check.expectedExitCode) || check.expectedExitCode < 0 || check.expectedExitCode > 255)) throw new Error('checks invalid');
  const body = { version: 1, mode: config.mode, sdkPath, nodeBinary, authPath, files, briefText, briefPath: brief.path, inputSha: brief.inputSha, briefSha256, expectedMutablePaths: config.expectedMutablePaths, protectedCheckCommand: config.protectedCheckCommand, checks };
  const generated = `#!/usr/bin/env node\nconst CONFIG=${JSON.stringify(body)};\n${runtimeSource()}`;
  const temp = `${output}.${process.pid}.tmp`;
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(generated); await handle.sync(); } finally { await handle.close(); }
  try { await link(temp, output); await unlink(temp); } catch (error) { await rm(temp, { force: true }); throw error; }
  process.stdout.write(`${JSON.stringify({ prepared: true, mode: config.mode, taskSha256: sha(generated), briefPath: brief.path, inputSha: brief.inputSha, briefSha256, providerPromptStarted: false })}\n`);
}
function runtimeSource() {
  return String.raw`
import { createRequire } from 'node:module';
import { createHash as hashFn } from 'node:crypto';
import { readFile as read, writeFile as write, mkdir as makeDir, mkdtemp as tempDir, rm as remove } from 'node:fs/promises';
import { join as pathJoin, dirname as pathDirname, resolve as pathResolve } from 'node:path';
import net from 'node:net';
const hash = value => hashFn('sha256').update(value).digest('hex');
${matchesBoundaryControls.toString()}
${nativeRecorderSource()}
const processStartedAt = Date.now();
const remainingBudget = () => Math.max(0, 110000 - (Date.now() - processStartedAt));
const work = process.argv[2];
const resultPath = pathJoin(pathDirname(pathResolve(work)), 'pi-result.json');
let factoryRoot = '';
const safeResult = { version: 1, mode: CONFIG.mode, briefPath: CONFIG.briefPath, inputSha: CONFIG.inputSha, briefSha256: CONFIG.briefSha256, provider: 'openai-codex', model: 'gpt-6-luna', effort: 'high', providerPromptStarted: false, sdkInitialized: false, toolCalls: 0, acceptance: false, protectedHashesPreserved: false };
const finish = async (ok, extra = {}) => {
  const result = { ...safeResult, ...extra, status: ok ? 'completed' : 'partial' };
  if (resultPath) { const temp = resultPath + '.' + process.pid + '.tmp'; await write(temp, JSON.stringify(result) + '\n', { mode: 0o600, flag: 'wx' }); await (await import('node:fs/promises')).rename(temp, resultPath); }
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!ok) process.exitCode = 2;
};
let nativeRun;
const bounded = async (command, timeout = 10000) => {
  const args = ['--unshare-user','--unshare-pid','--unshare-net','--unshare-ipc','--unshare-uts','--new-session','--die-with-parent','--cap-drop','ALL','--clearenv','--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib','/lib64','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--dir','/tmp/home','--ro-bind',CONFIG.nodeBinary,'/runtime/node','--ro-bind',CONFIG.sdkPath,'/runtime/sdk','--bind',work,'/work'];
  args.push('--dir','/factory','--ro-bind',factoryRoot,'/factory');
  args.push('--chdir','/work','--remount-ro','/','--setenv','PATH','/runtime:/usr/bin:/bin','--setenv','HOME','/tmp/home','--setenv','LANG','C.UTF-8');
  return nativeRun(args, command, timeout);
};
const tree = workspaceTree;
let session, runtime, listener, runtimeRoot, trustedRoot, tools=0, failure='setup', boundaryAttributed=false;
try {
  const requireSdk = createRequire(pathJoin(CONFIG.sdkPath,'package.json'));
  const sdk = requireSdk(CONFIG.sdkPath), Type = requireSdk('typebox').Type;
  runtimeRoot = await tempDir('/tmp/pi-worker-runtime-');
  runtime = await sdk.ModelRuntime.create({ authPath: CONFIG.authPath, modelsPath: pathJoin(runtimeRoot,'models.json'), allowModelNetwork: false, refreshOnCreate: true });
  if (runtime.hasConfiguredAuth('openai-codex') !== true) throw Error('standard host auth is not configured for openai-codex');
  safeResult.sdkInitialized = true;
  const model = runtime.getModel('openai-codex','gpt-6-luna');
  if (!model || model.provider !== 'openai-codex' || model.id !== 'gpt-6-luna') throw Error('explicit model unavailable');
  const schema = Type.Union([Type.Object({operation:Type.Literal('shell'),command:Type.String({minLength:1,maxLength:8000})}),Type.Object({operation:Type.Literal('boundary_check')})]);
  trustedRoot = await tempDir('/tmp/pi-worker-factory-');
  factoryRoot = trustedRoot;
  for (const [name, text] of Object.entries(CONFIG.files)) { const target=pathJoin(trustedRoot,name); await makeDir(pathDirname(target),{recursive:true}); await write(target,text,{mode:0o444,flag:'wx'}); }
  const outside=pathJoin(pathDirname(work),'outside-canary.txt'); await write(outside,'protected-canary-'+hash(String(Date.now()))+'\\n',{flag:'wx',mode:0o600});
  listener=net.createServer(socket=>socket.end('host-positive')); await new Promise((resolveListen,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolveListen);});
  const port=listener.address().port;
  const boundarySource='import fs from \'node:fs\';import net from \'node:net\';const outside='+JSON.stringify(outside)+',port='+port+';const r={fakeEnvAbsent:process.env.PI_WORKER_ENV_CANARY===undefined};for(const [k,f] of Object.entries({outsideRead:()=>fs.readFileSync(outside),outsideWrite:()=>fs.writeFileSync(outside,\'changed\'),factoryWrite:()=>fs.writeFileSync(\'/factory/.agents/roles/worker.md\',\'changed\'),sdkWrite:()=>fs.writeFileSync(\'/runtime/sdk/package.json\',\'changed\')})){try{f();r[k]=\'unexpected-success\'}catch(e){r[k]=e.code||e.name}}const s=net.connect(port,\'127.0.0.1\');s.setTimeout(800);s.on(\'connect\',()=>{r.network=\'connected\';s.destroy()});s.on(\'error\',e=>{r.network=e.code});setTimeout(()=>console.log(JSON.stringify(r)),900);';
  const boundaryPath=pathJoin(trustedRoot,'boundary-check.mjs');
  await write(boundaryPath,boundarySource,{mode:0o444,flag:'wx'});
  const boundaryHash=hash(boundarySource), outsideHash=hash(await read(outside));
  const hostPositive=await new Promise((resolveHost,rejectHost)=>{const socket=net.connect(port,'127.0.0.1');let text='';socket.setEncoding('utf8');socket.on('data',part=>text+=part);socket.once('end',()=>resolveHost(text));socket.once('error',rejectHost);});
  if(hostPositive!=='host-positive') throw Error('host TCP positive control failed');
  nativeRun=await createNativeToolRunner({work,factoryRoot});
  const tool = { name:'sandbox_shell', label:'Sandbox shell', description:'Run a bounded command in isolated /work or request the host-selected boundary checks.', parameters:schema, execute:async (_id,args,signal)=>{
    if(signal?.aborted) return {content:[{type:'text',text:'aborted'}],isError:true};
    if(tools>=12) { void session?.abort(); return {content:[{type:'text',text:'tool-call limit reached'}],isError:true}; }
    const isBoundary=args.operation==='boundary_check';
    const canaryIntactBefore=!isBoundary||hash(await read(boundaryPath))===boundaryHash;
    if(!canaryIntactBefore) return {content:[{type:'text',text:'boundary check unavailable'}],details:{exitCode:1,canaryHashPreserved:false},isError:true};
    const command=isBoundary ? 'node /factory/boundary-check.mjs' : args.command;
    const result=await bounded(command,10000); tools++;
    const canaryHashPreserved=!isBoundary||hash(await read(boundaryPath))===boundaryHash;
    return {content:[{type:'text',text:result.output}],details:{exitCode:canaryHashPreserved?result.code:1,truncated:result.truncated,...(isBoundary?{canaryHashPreserved}:{})},isError:result.code!==0||!canaryHashPreserved};
  }};
  const loader={getExtensions:()=>({extensions:[],errors:[],runtime:sdk.createExtensionRuntime()}),getSkills:()=>({skills:[],diagnostics:[]}),getPrompts:()=>({prompts:[],diagnostics:[]}),getThemes:()=>({themes:[],diagnostics:[]}),getAgentsFiles:()=>({agentsFiles:[]}),getSystemPrompt:()=>CONFIG.briefText+'\n\n'+Object.entries(CONFIG.files).map(([p,t])=>'\n## '+p+'\n'+t).join(''),getSystemPromptSource:()=>undefined,getAppendSystemPrompt:()=>[],getAppendSystemPromptSources:()=>[],extendResources:()=>{},reload:async()=>{}};
  const settings=sdk.SettingsManager.inMemory({retry:{enabled:false,maxRetries:0},compaction:{enabled:false}});
  const {session: created}=await sdk.createAgentSession({cwd:work,agentDir:runtimeRoot,modelRuntime:runtime,model,thinkingLevel:'high',settingsManager:settings,sessionManager:sdk.SessionManager.inMemory(work),resourceLoader:loader,noTools:'all',tools:['sandbox_shell'],excludeTools:['mcp__*'],customTools:[tool]});
  session=created;
  if(session.model?.provider!=='openai-codex'||session.model?.id!=='gpt-6-luna'||session.thinkingLevel!=='high'||JSON.stringify(session.getCallableToolNames())!==JSON.stringify(['sandbox_shell'])) throw Error('runtime route/tool validation failed');
  if(CONFIG.mode==='offline') { const probe=await tool.execute('offline-boundary-call',{operation:'boundary_check'}); let controls={}; try{controls=JSON.parse(probe.content?.[0]?.text?.trim().split('\\n').at(-1)||'{}');}catch{} if(probe.isError||probe.details?.exitCode!==0||probe.details?.canaryHashPreserved!==true||!matchesBoundaryControls(controls)||hash(await read(outside))!==outsideHash) throw Error('offline boundary bridge failed'); const beforeOffline=await tree(work), checks=[]; for(const item of CONFIG.checks){const run=await bounded(item.command,10000);checks.push({name:item.name,exitCode:run.code});if(run.code!==item.expectedExitCode)throw Error('offline control mismatch');} const check=await bounded(CONFIG.protectedCheckCommand,10000),afterOffline=await tree(work),changed=Object.keys({...beforeOffline,...afterOffline}).filter(name=>JSON.stringify(beforeOffline[name])!==JSON.stringify(afterOffline[name])),mutable=changed.filter(name=>CONFIG.expectedMutablePaths.includes(name)); const protectedHashesPreserved=changed.every(name=>CONFIG.expectedMutablePaths.includes(name))&&Object.keys(beforeOffline).every(name=>afterOffline[name]!==undefined); if(check.code!==0||mutable.length===0||changed.length!==mutable.length||!mutable.every(name=>afterOffline[name]?.kind==='file'&&/^[0-9a-f]{64}$/.test(afterOffline[name].sha256)&&(beforeOffline[name]?.kind!=='file'||beforeOffline[name].executable===afterOffline[name].executable))||!protectedHashesPreserved) throw Error('offline final-tree acceptance gate failed'); await finish(true,{sdkInitialized:true,providerPromptStarted:false,callableTools:['sandbox_shell'],toolBridgeReady:true,boundaryCheckPassed:true,boundaryControls:controls,hostTcpPositive:true,outsideHashPreserved:true,protectedHashesPreserved,fixtureCheckExitCode:check.code,offlineChecks:checks,mode:'offline'}); }
  else {
    failure='provider prompt';
    const before=await tree(work); let deadlineHit=false;
    const promptBudget=remainingBudget();
    if(promptBudget===0) throw Error('real-mode budget exhausted during setup');
    const timer=setTimeout(()=>{deadlineHit=true;void session.abort();},promptBudget), pending=new Map();
    session.subscribe(event=>{
      if(event.type==='tool_execution_start'&&event.toolName==='sandbox_shell'&&typeof event.toolCallId==='string') {
        pending.set(event.toolCallId,event.args?.operation);
        if(pending.size+tools>12) { deadlineHit=true; void session.abort(); }
      }
      if(event.type==='tool_execution_end'&&event.toolName==='sandbox_shell'&&typeof event.toolCallId==='string') {
        const operation=pending.get(event.toolCallId); pending.delete(event.toolCallId);
        if(operation==='boundary_check'&&event.result?.isError!==true&&event.result?.details?.exitCode===0&&event.result?.details?.canaryHashPreserved===true) { try { const control=JSON.parse(event.result.content.filter(part=>part.type==='text').map(part=>part.text).join('\\n').trim().split('\\n').at(-1)); boundaryAttributed=matchesBoundaryControls(control); } catch {} }
      }
    });
    safeResult.providerPromptStarted=true;
    try { await session.prompt(CONFIG.briefText+'\nUse sandbox_shell to inspect, fix, and verify. Request boundary_check and rely only on its result.',{expandPromptTemplates:false,source:'extension'}); } finally { clearTimeout(timer); }
    failure='acceptance checks';
    const check=await bounded(CONFIG.protectedCheckCommand,10000), after=await tree(work);
    const changed=Object.keys({...before,...after}).filter(name=>JSON.stringify(before[name])!==JSON.stringify(after[name]));
    const mutable=changed.filter(name=>CONFIG.expectedMutablePaths.includes(name));
    const protectedHashesPreserved=changed.every(name=>CONFIG.expectedMutablePaths.includes(name))&&Object.keys(before).every(name=>after[name]!==undefined)&&hash(await read(outside))===outsideHash&&hash(await read(boundaryPath))===boundaryHash;
    const accepted=!deadlineHit&&check.code===0&&mutable.length>0&&mutable.every(name=>after[name]?.kind==='file'&&/^[0-9a-f]{64}$/.test(after[name].sha256)&&(before[name]?.kind!=='file'||before[name].executable===after[name].executable))&&changed.length===mutable.length&&protectedHashesPreserved&&boundaryAttributed;
    await finish(accepted,{providerPromptStarted:true,toolCalls:tools,acceptance:accepted,protectedHashesPreserved,boundaryCallAttributed:boundaryAttributed,hostTcpPositive:true,checkExitCode:check.code,mutablePaths:mutable});
  }
} catch (error) {
  await finish(false,{toolCalls:tools,stage:failure,errorName:error?.name||'Error'});
} finally {
  if(session) { try { await session.dispose(); } catch {} }
  if(listener?.listening) await new Promise(resolveClose=>listener.close(resolveClose));
  await Promise.all([trustedRoot,runtimeRoot].filter(Boolean).map(path=>remove(path,{recursive:true,force:true}).catch(()=>{})));
}
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(3));
  if (process.argv[2] !== 'prepare') throw new Error('usage: node tools/pi-worker-task.mjs prepare --config <absolute.json> --output <absolute-nonexistent-task.mjs>');
  await prepare(args);
}
