import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const cli = resolve(process.argv[2] || '.audit/lifecycle-44-snapshot-v1/payload/tools/worker-lifecycle.mjs');
const seed = JSON.parse(await readFile('.audit/lifecycle-44-fixture.json', 'utf8'));
const root = await mkdtemp(join(tmpdir(), 'isswf-lifecycle44-candidate-pi-'));
const repo = join(root, 'repo'), runs = join(root, 'runs');
await cp(seed.root, repo, { recursive: true });
for (const p of ['home', 'agent', 'runs']) await mkdir(join(root, p));
await writeFile(join(root, 'agent/settings.json'), '{}\n');
const task = join(root, 'trusted-task.mjs');
await writeFile(task, `import{readFile,writeFile,access}from'node:fs/promises';import{dirname,join}from'node:path';import{spawnSync}from'node:child_process';
const workspace=process.argv[2],release=join(dirname(workspace),'parent-release');let ready=false;
for(let i=0;i<400;i++){try{await access(release);ready=true;break;}catch{}await new Promise(r=>setTimeout(r,20));}
if(!ready)process.exit(9);
const file=join(workspace,'src/math.mjs');const old=await readFile(file,'utf8');await writeFile(file,old.replace('total + value, 1','total * value, 1'));
const check=spawnSync(process.execPath,[join(workspace,'check.mjs')],{cwd:workspace,encoding:'utf8',timeout:2000});process.stdout.write(check.stdout);if(check.status!==0)process.exit(check.status??1);
await writeFile(join(workspace,'.factory/jobs/J601/A001.md'),'Technical checks passed. Operator acceptance remains pending.\\n');
`);
const args = [process.execPath, cli, 'launch', '--repo', repo, '--input-sha', seed.inputCheckpoint, '--brief', seed.briefPath, '--target-base', seed.targetBase, '--attempt-id', 'J601-pi-exit', '--runs-store', runs, '--grant-ref', 'parent-owned-offline-pi-fixture', '--task-script', task, '--timeout-ms', '10000', '--output-bytes', '4096'];
const quote = s => `'${s.replaceAll("'", "'\\''")}'`;
const pi = spawn('pi', ['--mode', 'rpc', '--no-session', '--offline', '--no-mcp', '--no-approve', '--no-extensions', '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files'], { cwd: root, env: { PATH: process.env.PATH, HOME: join(root, 'home'), PI_CODING_AGENT_DIR: join(root, 'agent'), PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', LANG: 'C.UTF-8' }, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
pi.stdout.on('data', b => { stdout += b; if (stdout.length > 128000) pi.kill('SIGKILL'); });
pi.stderr.on('data', b => { stderr = (stderr + b).slice(0, 8000); });
const exited = new Promise((yes, no) => { pi.once('error', no); pi.once('exit', (code, signal) => yes({ code, signal })); });
const bound = setTimeout(() => { try { process.kill(-pi.pid, 'SIGKILL'); } catch {} }, 12000);
try {
  pi.stdin.write(JSON.stringify({ id: 'launch', type: 'bash', command: args.map(quote).join(' '), excludeFromContext: true }) + '\n');
  let response;
  for (let i = 0; i < 400; i++) {
    response = stdout.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).find(r => r?.id === 'launch' && r.type === 'response');
    if (response) break;
    await delay(20);
  }
  assert.equal(response?.success, true);
  assert.equal(response.data.exitCode, 0);
  const launch = JSON.parse(response.data.output.trim());
  pi.stdin.end();
  assert.equal((await exited).code, 0, stderr);
  let gone = false;
  try { process.kill(pi.pid, 0); } catch (error) { assert.equal(error.code, 'ESRCH'); gone = true; }
  assert.equal(gone, true);
  const read = () => {
    const r = spawnSync(process.execPath, [cli, 'read', '--runs-store', runs, '--attempt-id', 'J601-pi-exit'], { encoding: 'utf8', timeout: 3000 });
    assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout);
  };
  let before;
  for (let i = 0; i < 100; i++) { before = read(); if (before.state === 'running') break; await delay(20); }
  assert.equal(before.state, 'running');
  await writeFile(join(launch.attemptDir, 'parent-release'), 'Pi has exited; completion is now permitted.\n');
  let after;
  for (let i = 0; i < 150; i++) { after = read(); if (after.state === 'terminal') break; await delay(20); }
  assert.equal(after.state, 'terminal');
  assert.equal(after.terminal.outcome, 'success');
  const workspace = after.terminal.workspace;
  const hash = b => createHash('sha256').update(b).digest('hex');
  assert.equal(hash(await readFile(join(workspace, 'check.mjs'))), seed.checksSha256);
  const checks = spawnSync(process.execPath, ['check.mjs'], { cwd: workspace, encoding: 'utf8', timeout: 3000 });
  assert.equal(checks.status, 0, checks.stderr);
  assert.match(checks.stdout, /PASS two sum and three product assertions/u);
  console.log(JSON.stringify({ result: 'PASS', root, cli, executableSha256: hash(await readFile(cli)), piExitedBeforeRelease: true, before: { state: before.state }, after: { state: after.state, outcome: after.terminal.outcome, exitCode: after.terminal.exitCode }, checkExit: checks.status, checksUnchanged: true, providerPromptStarted: false, scope: 'Actual candidate launch via isolated offline Pi RPC bash, Pi exits before task release, fresh CLI observes completion and parent independently runs protected arithmetic checks. Not native model integration, interactive main chat shutdown, hostile-task isolation, crash recovery or exactly-once proof.' }, null, 2));
} finally { clearTimeout(bound); if (pi.exitCode === null && pi.signalCode === null) pi.kill('SIGKILL'); }
