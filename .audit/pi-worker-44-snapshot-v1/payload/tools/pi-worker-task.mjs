#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile, link, unlink, open, mkdir, mkdtemp, rm, realpath } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { isAbsolute } from 'node:path';

const BASELINE = '37a56ebc902e94f21fc10666f33fceac44946af7';
const sha = value => createHash('sha256').update(value).digest('hex');
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
  if (!(await import('node:fs/promises')).stat(nodeBinary).then(stat => stat.isFile())) throw new Error('nodeBinary is not a file');
  const authPath = safePath(config.authPath, 'authPath');
  if (config.mode === 'real' && !(await import('node:fs/promises')).stat(authPath).then(stat => stat.isFile()).catch(() => false)) throw new Error('real mode authPath must name a host auth file');
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
  if (typeof config.briefText !== 'string' || !config.briefText.trim() || Buffer.byteLength(config.briefText) > 32000) throw new Error('briefText must be non-empty and <=32KB');
  if (!Array.isArray(config.expectedMutablePaths) || !config.expectedMutablePaths.length || config.expectedMutablePaths.some(path => typeof path !== 'string' || path.startsWith('/') || path.split('/').some(part => !part || part === '..' || part === '.'))) throw new Error('expectedMutablePaths invalid');
  if (typeof config.protectedCheckCommand !== 'string' || !config.protectedCheckCommand || config.protectedCheckCommand.length > 1000) throw new Error('protectedCheckCommand invalid');
  const checks = config.checks ?? [];
  if (!Array.isArray(checks) || checks.length > 10 || checks.some(check => !check || typeof check.name !== 'string' || !check.name || typeof check.command !== 'string' || !check.command || check.command.length > 8000 || !Number.isInteger(check.expectedExitCode) || check.expectedExitCode < 0 || check.expectedExitCode > 255)) throw new Error('checks invalid');
  const body = { version: 1, mode: config.mode, sdkPath, nodeBinary, authPath, files, briefText: config.briefText, expectedMutablePaths: config.expectedMutablePaths, protectedCheckCommand: config.protectedCheckCommand, checks };
  const generated = `#!/usr/bin/env node\nconst CONFIG=${JSON.stringify(body)};\n${runtimeSource()}`;
  const temp = `${output}.${process.pid}.tmp`;
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(generated); await handle.sync(); } finally { await handle.close(); }
  try { await link(temp, output); await unlink(temp); } catch (error) { await rm(temp, { force: true }); throw error; }
  process.stdout.write(`${JSON.stringify({ prepared: true, mode: config.mode, taskSha256: sha(generated), providerPromptStarted: false })}\n`);
}
function runtimeSource() {
  return String.raw`
import { createRequire } from 'node:module';
import { createHash as hashFn } from 'node:crypto';
import { readFile as read, writeFile as write, mkdir as makeDir, mkdtemp as tempDir, rm as remove, readdir, readlink } from 'node:fs/promises';
import { spawn as spawnChild } from 'node:child_process';
import { join as pathJoin, dirname as pathDirname, resolve as pathResolve } from 'node:path';
import net from 'node:net';
const hash = value => hashFn('sha256').update(value).digest('hex');
const work = process.argv[2];
const resultPath = pathJoin(pathDirname(pathResolve(work)), 'pi-result.json');
let factoryRoot = ''; 
const safeResult = { version: 1, mode: CONFIG.mode, provider: 'openai-codex', model: 'gpt-6-luna', effort: 'high', providerPromptStarted: false, sdkInitialized: false, toolCalls: 0, acceptance: false, protectedHashesPreserved: false };
const finish = async (ok, extra = {}) => {
  const result = { ...safeResult, ...extra, status: ok ? 'completed' : 'partial' };
  if (resultPath) { const temp = resultPath + '.' + process.pid + '.tmp'; await write(temp, JSON.stringify(result) + '\n', { mode: 0o600, flag: 'wx' }); await (await import('node:fs/promises')).rename(temp, resultPath); }
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!ok) process.exitCode = 2;
};
const bounded = async (command, timeout = 10000) => new Promise(resolveRun => {
  const args = ['--unshare-user','--unshare-pid','--unshare-net','--unshare-ipc','--unshare-uts','--new-session','--die-with-parent','--cap-drop','ALL','--clearenv','--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib','/lib64','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--dir','/tmp/home','--ro-bind',CONFIG.nodeBinary,'/runtime/node','--ro-bind',CONFIG.sdkPath,'/runtime/sdk','--bind',work,'/work'];
  args.push('--dir','/factory','--ro-bind',factoryRoot,'/factory');
  args.push('--chdir','/work','--remount-ro','/','--setenv','PATH','/runtime:/usr/bin:/bin','--setenv','HOME','/tmp/home','--setenv','LANG','C.UTF-8','--','/bin/sh','-lc',command);
  const child = spawnChild('/usr/bin/bwrap', args, { cwd: '/', env: { PATH: '/usr/bin:/bin', PI_WORKER_ENV_CANARY: 'fake-offline-only' }, detached: true, stdio: ['ignore','pipe','pipe'] });
  let out = Buffer.alloc(0), err = Buffer.alloc(0), used = 0, truncated = false;
  const add = (prev, chunk) => { const n = Math.min(chunk.length, Math.max(0, 8000-used)); used += n; truncated ||= n < chunk.length; return n ? Buffer.concat([prev,chunk.subarray(0,n)]) : prev; };
  const timer = setTimeout(() => { try { process.kill(-child.pid,'SIGKILL'); } catch {} }, timeout);
  child.stdout.on('data', chunk => { out = add(out,chunk); }); child.stderr.on('data', chunk => { err = add(err,chunk); });
  child.once('error', () => { clearTimeout(timer); resolveRun({ code: 1, output: '', truncated: false }); });
  child.once('close', code => { clearTimeout(timer); resolveRun({ code: code ?? 1, output: (out.toString()+err.toString()).slice(-8000), truncated }); });
});
const tree = async dir => { const out={}; const walk=async p=>{ for(const e of await readdir(p,{withFileTypes:true})){const f=pathJoin(p,e.name),name=f.slice(dir.length+1); if(e.isDirectory()){out['dir:'+name]='directory';await walk(f);} else if(e.isFile()) out[name]=hash(await read(f)); else if(e.isSymbolicLink()) out[name]='link:'+await readlink(f); else throw Error('unsupported workspace entry');} }; await walk(dir); return out; };
let session, runtime, tools=0, failure='setup', boundaryAttributed=false;
try {
  const requireSdk = createRequire(pathJoin(CONFIG.sdkPath,'package.json'));
  const sdk = requireSdk(CONFIG.sdkPath), Type = requireSdk('typebox').Type;
  const runtimeRoot = await tempDir('/tmp/pi-worker-runtime-');
  runtime = await sdk.ModelRuntime.create({ authPath: CONFIG.authPath, modelsPath: pathJoin(runtimeRoot,'models.json'), allowModelNetwork: false, refreshOnCreate: false });
  safeResult.sdkInitialized = true;
  const model = runtime.getModel('openai-codex','gpt-6-luna');
  if (!model || model.provider !== 'openai-codex' || model.id !== 'gpt-6-luna') throw Error('explicit model unavailable');
  const schema = Type.Union([Type.Object({operation:Type.Literal('shell'),command:Type.String({minLength:1,maxLength:8000})}),Type.Object({operation:Type.Literal('boundary_check')})]);
  const trustedRoot = await tempDir('/tmp/pi-worker-factory-');
  factoryRoot = trustedRoot;
  for (const [name, text] of Object.entries(CONFIG.files)) { const target=pathJoin(trustedRoot,name); await makeDir(pathDirname(target),{recursive:true}); await write(target,text,{mode:0o444,flag:'wx'}); }
  const outside=pathJoin(pathDirname(work),'outside-canary.txt'); await write(outside,'protected-canary-'+hash(String(Date.now()))+'\\n',{flag:'wx',mode:0o600});
  const listener=net.createServer(socket=>socket.end('host-positive')); await new Promise((resolveListen,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolveListen);});
  const port=listener.address().port;
  const boundarySource='import fs from \'node:fs\';import net from \'node:net\';const outside='+JSON.stringify(outside)+',port='+port+';const r={fakeEnvAbsent:process.env.PI_WORKER_ENV_CANARY===undefined};for(const [k,f] of Object.entries({outsideRead:()=>fs.readFileSync(outside),outsideWrite:()=>fs.writeFileSync(outside,\'changed\'),factoryWrite:()=>fs.writeFileSync(\'/factory/.agents/roles/worker.md\',\'changed\'),sdkWrite:()=>fs.writeFileSync(\'/runtime/sdk/package.json\',\'changed\')})){try{f();r[k]=\'unexpected-success\'}catch(e){r[k]=e.code||e.name}}const s=net.connect(port,\'127.0.0.1\');s.setTimeout(800);s.on(\'connect\',()=>{r.network=\'connected\';s.destroy()});s.on(\'error\',e=>{r.network=e.code});setTimeout(()=>console.log(JSON.stringify(r)),900);';
  const boundaryPath=pathJoin(trustedRoot,'boundary-check.mjs');
  await write(boundaryPath,boundarySource,{mode:0o444,flag:'wx'});
  const boundaryHash=hash(boundarySource), outsideHash=hash(await read(outside));
  const hostPositive=await new Promise((resolveHost,rejectHost)=>{const socket=net.connect(port,'127.0.0.1');let text='';socket.setEncoding('utf8');socket.on('data',part=>text+=part);socket.once('end',()=>resolveHost(text));socket.once('error',rejectHost);});
  if(hostPositive!=='host-positive') throw Error('host TCP positive control failed');
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
  if(CONFIG.mode==='offline') { const probe=await tool.execute('offline-boundary-call',{operation:'boundary_check'}); let controls={}; try{controls=JSON.parse(probe.content?.[0]?.text?.trim().split('\\n').at(-1)||'{}');}catch{} const expected={fakeEnvAbsent:true,outsideRead:'ENOENT',outsideWrite:'ENOENT',factoryWrite:'EROFS',sdkWrite:'EROFS',network:'ECONNREFUSED'}; if(probe.isError||probe.details?.exitCode!==0||probe.details?.canaryHashPreserved!==true||JSON.stringify(controls)!==JSON.stringify(expected)||hash(await read(outside))!==outsideHash) throw Error('offline boundary bridge failed'); const beforeOffline=await tree(work), checks=[]; for(const item of CONFIG.checks){const run=await bounded(item.command,10000);checks.push({name:item.name,exitCode:run.code});if(run.code!==item.expectedExitCode)throw Error('offline control mismatch');} const check=await bounded(CONFIG.protectedCheckCommand,10000),afterOffline=await tree(work),changed=Object.keys({...beforeOffline,...afterOffline}).filter(name=>beforeOffline[name]!==afterOffline[name]),mutable=changed.filter(name=>CONFIG.expectedMutablePaths.includes(name)); const protectedHashesPreserved=changed.every(name=>CONFIG.expectedMutablePaths.includes(name))&&Object.keys(beforeOffline).every(name=>afterOffline[name]!==undefined); if(check.code!==0||mutable.length===0||changed.length!==mutable.length||!mutable.every(name=>typeof afterOffline[name]==='string'&&/^[0-9a-f]{64}$/.test(afterOffline[name]))||!protectedHashesPreserved) throw Error('offline final-tree acceptance gate failed'); await new Promise(resolveClose=>listener.close(resolveClose)); await session.dispose(); session=undefined; await remove(trustedRoot,{recursive:true,force:true}); await remove(runtimeRoot,{recursive:true,force:true}); await finish(true,{sdkInitialized:true,providerPromptStarted:false,callableTools:['sandbox_shell'],toolBridgeReady:true,boundaryCheckPassed:true,boundaryControls:controls,hostTcpPositive:true,outsideHashPreserved:true,protectedHashesPreserved,fixtureCheckExitCode:check.code,offlineChecks:checks,mode:'offline'}); }
  else {
    failure='provider prompt';
    const before=await tree(work); let deadlineHit=false;
    const timer=setTimeout(()=>{deadlineHit=true;void session.abort();},110000), pending=new Map();
    session.subscribe(event=>{
      if(event.type==='tool_execution_start'&&event.toolName==='sandbox_shell'&&typeof event.toolCallId==='string') {
        pending.set(event.toolCallId,event.args?.operation);
        if(pending.size+tools>12) { deadlineHit=true; void session.abort(); }
      }
      if(event.type==='tool_execution_end'&&event.toolName==='sandbox_shell'&&typeof event.toolCallId==='string') {
        const operation=pending.get(event.toolCallId); pending.delete(event.toolCallId);
        if(operation==='boundary_check'&&event.result?.isError!==true&&event.result?.details?.exitCode===0&&event.result?.details?.canaryHashPreserved===true) { try { const control=JSON.parse(event.result.content.filter(part=>part.type==='text').map(part=>part.text).join('\\n').trim().split('\\n').at(-1)); boundaryAttributed=control.fakeEnvAbsent===true&&control.outsideRead==='ENOENT'&&control.outsideWrite==='ENOENT'&&control.factoryWrite==='EROFS'&&control.sdkWrite==='EROFS'&&control.network==='ECONNREFUSED'&&Object.keys(control).length===5; } catch {} }
      }
    });
    safeResult.providerPromptStarted=true;
    try { await session.prompt(CONFIG.briefText+'\nUse sandbox_shell to inspect, fix, and verify. Request boundary_check and rely only on its result.',{expandPromptTemplates:false,source:'extension'}); } finally { clearTimeout(timer); }
    failure='acceptance checks';
    const check=await bounded(CONFIG.protectedCheckCommand,10000), after=await tree(work);
    const changed=Object.keys({...before,...after}).filter(name=>before[name]!==after[name]);
    const mutable=changed.filter(name=>CONFIG.expectedMutablePaths.includes(name));
    const protectedHashesPreserved=changed.every(name=>CONFIG.expectedMutablePaths.includes(name))&&Object.keys(before).every(name=>after[name]!==undefined)&&hash(await read(outside))===outsideHash&&hash(await read(boundaryPath))===boundaryHash;
    const accepted=!deadlineHit&&check.code===0&&mutable.length>0&&mutable.every(name=>typeof after[name]==='string'&&/^[0-9a-f]{64}$/.test(after[name]))&&changed.length===mutable.length&&protectedHashesPreserved&&boundaryAttributed;
    await session.dispose(); session=undefined; await remove(trustedRoot,{recursive:true,force:true}); await remove(runtimeRoot,{recursive:true,force:true});
    await finish(accepted,{providerPromptStarted:true,toolCalls:tools,acceptance:accepted,protectedHashesPreserved,boundaryCallAttributed:boundaryAttributed,hostTcpPositive:true,checkExitCode:check.code,mutablePaths:mutable});
  }
} catch (error) {
  if(session) await session.dispose().catch(()=>{});
  await finish(false,{toolCalls:tools,stage:failure,errorName:error?.name||'Error'});
}
`;
}

const args = parseArgs(process.argv.slice(3));
if (process.argv[2] !== 'prepare') throw new Error('usage: node tools/pi-worker-task.mjs prepare --config <absolute.json> --output <absolute-nonexistent-task.mjs>');
await prepare(args);
