import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = await mkdtemp(join(tmpdir(), 'isswf-lifecycle44-pi-exit-'));
for (const name of ['home', 'agent']) await mkdir(join(root, name));
await writeFile(join(root, 'agent/settings.json'), '{}\n');
await writeFile(join(root, 'worker.mjs'), `import fs from'node:fs';
const root=process.argv[2];let ticks=0;
fs.writeFileSync(root+'/started.json',JSON.stringify({pid:process.pid}));
const timer=setInterval(()=>{if(fs.existsSync(root+'/release')){clearInterval(timer);fs.writeFileSync(root+'/result.json',JSON.stringify({value:21,pid:process.pid}));}else if(++ticks>500){clearInterval(timer);process.exitCode=2;}},20);
`);
await writeFile(join(root, 'launcher.mjs'), `import{spawn}from'node:child_process';
const c=spawn(process.execPath,[process.argv[2],process.argv[3]],{detached:true,stdio:'ignore'});c.unref();console.log(JSON.stringify({workerPid:c.pid}));
`);
const child = spawn('pi', ['--mode', 'rpc', '--no-session', '--offline', '--no-mcp', '--no-approve', '--no-extensions', '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files'], { cwd: root, env: { PATH: process.env.PATH, HOME: join(root, 'home'), PI_CODING_AGENT_DIR: join(root, 'agent'), PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', LANG: 'C.UTF-8' }, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
child.stdout.on('data', b => { stdout += b; if (stdout.length > 128000) child.kill('SIGKILL'); });
child.stderr.on('data', b => { stderr = (stderr + b).slice(0, 8000); });
const exit = new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (code, signal) => resolve({ code, signal })); });
const bound = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 12000);
const shellQuote = s => `'${s.replaceAll("'", "'\\''")}'`;
const command = [process.execPath, join(root, 'launcher.mjs'), join(root, 'worker.mjs'), root].map(shellQuote).join(' ');
try {
  child.stdin.write(JSON.stringify({ id: 'launch', type: 'bash', command, excludeFromContext: true }) + '\n');
  let response;
  for (let i = 0; i < 400; i++) {
    response = stdout.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).find(r => r?.id === 'launch' && r.type === 'response');
    if (response) break;
    await delay(20);
  }
  assert.equal(response?.success, true, 'Pi must execute the explicit offline bash request');
  assert.equal(response.data.exitCode, 0);
  const ids = JSON.parse(response.data.output.trim());
  child.stdin.end();
  const ended = await exit;
  assert.equal(ended.code, 0, stderr);
  let piGone = false;
  try { process.kill(child.pid, 0); } catch (error) { assert.equal(error.code, 'ESRCH'); piGone = true; }
  assert.equal(piGone, true);
  let resultBeforeRelease = false;
  try { await readFile(join(root, 'result.json')); resultBeforeRelease = true; } catch (error) { assert.equal(error.code, 'ENOENT'); }
  assert.equal(resultBeforeRelease, false);
  process.kill(ids.workerPid, 0);
  await writeFile(join(root, 'release'), 'Parent observed Pi process gone.\n');
  let result;
  for (let i = 0; i < 100; i++) {
    try { result = JSON.parse(await readFile(join(root, 'result.json'), 'utf8')); break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await delay(20);
  }
  assert.equal(result?.value, 21);
  assert.equal(result.pid, ids.workerPid);
  console.log(JSON.stringify({ root, passed: true, piExitedBeforeRelease: true, resultBeforeRelease, workerPid: ids.workerPid, result, providerPromptStarted: false, scope: 'Actual isolated offline Pi RPC bash request launches a detached deterministic Node child; Pi shuts down before parent releases child completion. Not the production lifecycle candidate, model integration, supervisor crash recovery, interactive main-chat termination or exactly-once proof.' }, null, 2));
} finally {
  clearTimeout(bound);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}
