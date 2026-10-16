import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function processEvidence(pid) {
  const fs = await import('node:fs/promises');
  if (!Number.isInteger(pid) || pid <= 0) throw Error('invalid PID');
  const stat = await fs.readFile(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
  return {
    pid, startTicks: fields[19], state: fields[0],
    bootId: (await fs.readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim(),
    exe: await fs.realpath(`/proc/${pid}/exe`),
    namespace: await fs.readlink(`/proc/${pid}/ns/pid`),
  };
}

async function createNativeToolRunner({ work, factoryRoot }) {
  const fs = await import('node:fs/promises');
  const { join, dirname, basename } = await import('node:path');
  const { spawn } = await import('node:child_process');
  const { createHash, randomBytes } = await import('node:crypto');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  const directory = dirname(work), records = join(directory, 'native-tools');
  const taskSha256 = digest(await fs.readFile(process.argv[1]));
  const attemptId = basename(directory);
  const atomic = async (path, value) => {
    const temp = path + '.' + randomBytes(8).toString('hex') + '.tmp';
    const handle = await fs.open(temp, 'wx', 0o600);
    try { await handle.writeFile(JSON.stringify(value) + '\n'); await handle.sync(); } finally { await handle.close(); }
    await fs.link(temp, path);
    await fs.unlink(temp);
    const parent = await fs.open(dirname(path), 'r');
    try { await parent.sync(); } finally { await parent.close(); }
  };
  await fs.mkdir(records);
  await atomic(join(directory, 'native-recovery.json'), {
    version: 1, policy: 'native-tools-pidns-v1', attemptId, taskSha256,
    task: await processEvidence(process.pid),
    bwrapSha256: digest(await fs.readFile('/usr/bin/bwrap')),
  });
  const gatePath = join(factoryRoot, 'native-tool-gate.mjs');
  await fs.writeFile(gatePath, `import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
let released=false;
for(let n=0;n<1000;n++){try{await access(process.argv[2]);released=true;break;}catch{}await delay(10);}
if(!released)process.exit(125);
const child=spawn('/bin/sh',['-lc',process.argv[3]],{stdio:'inherit'});
child.once('error',()=>{process.exitCode=125;});
child.once('exit',(code,signal)=>{process.exitCode=signal?128:code??125;});
`, { flag:'wx', mode:0o444 });
  let sequence = 0;
  return async (args, command, timeout = 10000) => {
    const seq = ++sequence;
    if (seq > 64) throw Error('native tool record budget exceeded');
    const prefix = String(seq).padStart(6, '0');
    const binding = { version:1, attemptId, taskSha256, seq };
    await atomic(join(records, prefix + '.intent.json'), binding);
    const release = join(factoryRoot, 'release-' + prefix);
    return new Promise(resolveRun => {
      const child = spawn('/usr/bin/bwrap', [...args, '--json-status-fd', '3', '--', '/runtime/node', '/factory/native-tool-gate.mjs', '/factory/release-' + prefix, command], {
        cwd:'/', env:{ PATH:'/usr/bin:/bin', PI_WORKER_ENV_CANARY:'fake-offline-only' },
        detached:true, stdio:['ignore','pipe','pipe','pipe'],
      });
      let out = Buffer.alloc(0), err = Buffer.alloc(0), used = 0, truncated = false;
      let settled = false, statusBuffer = '', startupSeen = false, timer, closeTimer;
      const kill = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
      const finish = code => {
        if (settled) return;
        settled = true;
        clearTimeout(timer); clearTimeout(closeTimer);
        for (const stream of [child.stdout, child.stderr, child.stdio[3]]) stream.destroy();
        resolveRun({ code:code??1, output:(out.toString()+err.toString()).slice(-8000), truncated });
      };
      const fail = () => { kill(); closeTimer ??= setTimeout(() => finish(1), 250); };
      timer = setTimeout(fail, timeout);
      const add = (previous, chunk) => {
        const size = Math.min(chunk.length, Math.max(0, 8000-used));
        used += size; truncated ||= size < chunk.length;
        return size ? Buffer.concat([previous, chunk.subarray(0,size)]) : previous;
      };
      child.stdout.on('data', chunk => { out=add(out,chunk); });
      child.stderr.on('data', chunk => { err=add(err,chunk); });
      child.once('error', () => finish(1));
      child.once('close', code => finish(code));
      child.stdio[3].on('data', chunk => {
        statusBuffer += chunk.toString();
        if (statusBuffer.length > 8192) { fail(); return; }
        let newline;
        while ((newline=statusBuffer.indexOf('\n'))>=0) {
          const line=statusBuffer.slice(0,newline); statusBuffer=statusBuffer.slice(newline+1);
          let status;
          try { status=JSON.parse(line); } catch { fail(); return; }
          if (!Number.isInteger(status['child-pid']) || startupSeen) continue;
          startupSeen=true;
          void (async () => {
            const init=await processEvidence(status['child-pid']);
            if (init.namespace !== 'pid:[' + status['pid-namespace'] + ']') throw Error('namespace identity mismatch');
            await atomic(join(records, prefix + '.started.json'), { ...binding, init });
            if (!settled) await fs.writeFile(release, 'release\n', {flag:'wx',mode:0o444});
          })().catch(fail);
        }
      });
    });
  };
}

async function workspaceTree(directory) {
  const fs=await import('node:fs/promises');
  const {join}=await import('node:path');
  const {createHash}=await import('node:crypto');
  const entries=Object.create(null);
  const walk=async (parent,prefix='') => {
    for(const name of await fs.readdir(parent)) {
      const path=join(parent,name),relative=prefix+name,entry=await fs.lstat(path);
      if(entry.isDirectory()) { entries[relative]={kind:'directory'};await walk(path,relative+'/'); }
      else if(entry.isFile()) entries[relative]={kind:'file',sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex'),executable:Boolean(entry.mode & 0o111)};
      else if(entry.isSymbolicLink()) entries[relative]={kind:'symlink',target:await fs.readlink(path)};
      else throw Error('unsupported workspace entry');
    }
  };
  await walk(directory);
  return entries;
}

export { workspaceTree };

export function nativeRecorderSource() {
  return [processEvidence,createNativeToolRunner,workspaceTree].map(fn=>fn.toString()).join('\n');
}

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const blocked = reason => ({ status:'blocked', reason, reviewRequired:true, retry:'never' });
async function ceased(identity) {
  if (!identity || !Number.isSafeInteger(identity.pid) || identity.pid<=0 || typeof identity.startTicks!=='string' || !/^\d+$/.test(identity.startTicks) || typeof identity.bootId!=='string' || !/^[0-9a-f-]{36}$/.test(identity.bootId) || typeof identity.namespace!=='string' || !/^pid:\[\d+\]$/.test(identity.namespace) || typeof identity.exe!=='string' || !identity.exe.startsWith('/')) return false;
  if ((await readFile('/proc/sys/kernel/random/boot_id','utf8')).trim()!==identity.bootId) return false;
  let stat;
  try { stat=await readFile(`/proc/${identity.pid}/stat`,'utf8'); }
  catch(error) { return error.code==='ENOENT'||error.code==='ESRCH'; }
  const fields=stat.slice(stat.lastIndexOf(')')+2).trim().split(/\s+/);
  return fields[19]===identity.startTicks && fields[0]==='Z';
}

export async function inspectNativeRecovery({ attemptDir, dispatch, observation, job, baseline }) {
  try {
    if (observation.state!=='unknown' || observation.executionChild?.state!=='not-live') return blocked('execution task cessation not confirmed');
    if (digest(await readFile(join(attemptDir,'task.mjs')))!==dispatch.taskSha256) return blocked('task snapshot changed');
    const policy=await load(join(attemptDir,'native-recovery.json'));
    const child=observation.executionChild.identity;
    if (policy.version!==1 || policy.policy!=='native-tools-pidns-v1' || policy.attemptId!==dispatch.attemptId || policy.taskSha256!==dispatch.taskSha256 || !child || ['pid','startTicks','bootId','exe'].some(key=>policy.task?.[key]!==child[key])) return blocked('native task policy identity mismatch');
    if (!await ceased(policy.task)) return blocked('native task cessation not confirmed');
    if (digest(await readFile('/usr/bin/bwrap'))!==policy.bwrapSha256) return blocked('native namespace runtime changed');
    const records=join(attemptDir,'native-tools');
    const names=(await readdir(records)).sort();
    const intents=names.filter(name=>/^\d{6}\.intent\.json$/.test(name));
    if (names.length!==intents.length*2 || intents.length>64) return blocked('incomplete tool startup records');
    for(let index=0;index<intents.length;index++) {
      const prefix=String(index+1).padStart(6,'0');
      if(intents[index]!==prefix+'.intent.json' || !names.includes(prefix+'.started.json')) return blocked('tool sequence gap');
      const intent=await load(join(records,prefix+'.intent.json'));
      const started=await load(join(records,prefix+'.started.json'));
      for(const record of [intent,started]) if(record.version!==1 || record.attemptId!==dispatch.attemptId || record.taskSha256!==dispatch.taskSha256 || record.seq!==index+1) return blocked('tool binding mismatch');
      if (!await ceased(started.init)) return blocked('tool namespace cessation not confirmed');
    }
    const current=await workspaceTree(dispatch.workspace);
    const changed=Object.keys({...baseline,...current}).filter(path=>JSON.stringify(baseline[path])!==JSON.stringify(current[path])).sort();
    if(!Array.isArray(job.expectedMutablePaths) || changed.some(path=>!job.expectedMutablePaths.includes(path)) || Object.keys(baseline).some(path=>current[path]===undefined) || changed.some(path=>current[path]?.kind!=='file' || !/^[0-9a-f]{64}$/.test(current[path].sha256) || (baseline[path]?.kind==='file' && baseline[path].executable!==current[path].executable))) return blocked('partial tree exceeds committed mutable scope');
    return { status:'stopped-review-required', reviewRequired:true, retry:'never', taskSha256:dispatch.taskSha256, targetBase:dispatch.targetBase, changedPaths:changed, candidateHashes:Object.fromEntries(changed.map(path=>[path,current[path].sha256])), namespacesCeased:intents.length, protectedHashesPreserved:true, remoteEffects:'not-reconciled' };
  } catch { return blocked('missing, corrupt or unreadable native recovery evidence'); }
}
