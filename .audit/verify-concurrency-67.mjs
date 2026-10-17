import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, lstat } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-concurrency67-'));
const project = join(root, 'project'), store = join(root, 'runs'), packages = join(root, 'packages');
const hash = value => createHash('sha256').update(value).digest('hex');
const env = { PATH: process.env.PATH || '/usr/bin:/bin', HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
function run(exe, args, cwd = project, expected = 0) {
  const r = spawnSync(exe, args, { cwd, env, encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(r.status, expected, JSON.stringify({ args, status: r.status, error: r.error?.code, stderr: r.stderr })); return r;
}
const git = (...args) => run('git', args).stdout.trim();
const sourceGit = (...args) => run('git', ['-C', source, ...args], source).stdout.trim();
const commit = message => { git('add', '.'); git('-c', 'user.name=Concurrency fixture', '-c', 'user.email=fixture@local.invalid', 'commit', '-qm', message); return git('rev-parse', 'HEAD'); };
const runtimeSha = sourceGit('rev-parse', 'HEAD');
const managed = process.env.PI_MANAGED_INSTALL_ROOT;
assert.ok(managed, 'existing managed SDK required for this offline native-entry regression');
const version = (await readFile(join(managed, 'current-version'), 'utf8')).trim();
assert.match(version, /^[A-Za-z0-9][A-Za-z0-9._+-]*$/);
const sdkPath = join(managed, 'releases', version, 'node_modules/@earendil-works/pi-coding-agent');
const authPath = join(process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi/agent'), 'auth.json');
const cli = join(source, 'tools/isswf-job.mjs');
const packageCli = join(source, 'tools/factory-package.mjs');
await mkdir(join(project, '.factory/jobs'), { recursive: true });
await mkdir(join(project, '.pi')); await mkdir(join(project, 'src'));
const models = run('git', ['-C', source, 'show', runtimeSha + ':.factory/models.json'], source).stdout;
await writeFile(join(project, '.factory/models.json'), models);
await writeFile(join(project, '.pi/settings.json'), '{"packages":[]}\n');
for (const name of ['a', 'b', 'c']) await writeFile(join(project, 'src', name + '.txt'), name + '0');
await writeFile(join(project, 'check.mjs'), "import assert from 'node:assert/strict';import fs from 'node:fs';const id=process.argv[2];assert.equal(fs.readFileSync('src/'+id.toLowerCase()+'.txt','utf8'),id==='C'?'A:C':id);\n");
for (const id of ['A', 'B', 'C']) {
  await mkdir(join(project, '.factory/jobs', id));
  await writeFile(join(project, '.factory/jobs', id, 'brief.md'), 'Disposable offline concurrency control ' + id + '. No provider prompt authorized.\n');
}
git('init', '-q');
const targetBase = commit('Pin three isolated offline job contracts');
function job(id, base, command) {
  return { version: 1, logicalJobRef: 'concurrency67-' + id, runtimeSha, targetBase: base, methodologySha: '37a56ebc902e94f21fc10666f33fceac44946af7', exclusiveAttempt: true, workerTotal: 1, models: { sha: targetBase, path: '.factory/models.json', sha256: hash(models) }, briefPath: '.factory/jobs/' + id + '/brief.md', referencedInputs: id === 'C' ? ['check.mjs', 'src/a.txt'] : ['check.mjs'], expectedMutablePaths: ['src/' + id.toLowerCase() + '.txt'], protectedCheckCommand: 'node check.mjs ' + id, sdkPath, authPath, offlineChecks: [{ name: 'bounded-owned-write', command, expectedExitCode: 0 }] };
}
const timedWrite = (id, delay) => `node -e ${JSON.stringify("const fs=require('node:fs');fs.writeFileSync('src/" + id.toLowerCase() + ".txt','ready-" + id + "');setTimeout(()=>fs.writeFileSync('src/" + id.toLowerCase() + ".txt','" + id + "')," + delay + ")")}`;
for (const [id, delay] of [['A', 3000], ['B', 7500]]) await writeFile(join(project, '.factory/jobs', id, 'job.json'), JSON.stringify(job(id, targetBase, timedWrite(id, delay))));
const inputSha = commit('Pin two authorized offline jobs, explicit concurrent test capacity two');
run(process.execPath, [packageCli, 'materialize', '--source', source, '--revision', runtimeSha, '--store', packages], source);
run(process.execPath, [packageCli, 'activate', '--package', join(packages, runtimeSha), '--project', project], source);
const workspace = id => join(store, id, 'workspace');
const args = (id, input = inputSha, jobId = id) => [cli, 'run', '--project', project, '--input-sha', input, '--job', '.factory/jobs/' + jobId + '/job.json', '--runs-store', store, '--attempt-id', id, '--grant-ref', 'offline-concurrency67-owned-fixture', '--mode', 'offline'];
const launch = (id, input) => JSON.parse(run(process.execPath, args(id, input), source).stdout);
const read = id => JSON.parse(run(process.execPath, [cli, 'read', '--runs-store', store, '--attempt-id', id], source).stdout);
async function until(probe, label, timeout = 18000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const value = await probe(); if (value) return value; await new Promise(resolveWait => setTimeout(resolveWait, 80)); }
  throw Error('bounded wait failed: ' + label);
}
const text = path => readFile(path, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
const launchedA = launch('A'), launchedB = launch('B');
assert.notEqual(launchedA.attemptDir, launchedB.attemptDir);
await until(async () => (await text(join(workspace('A'), 'src/a.txt'))) === 'ready-A' && (await text(join(workspace('B'), 'src/b.txt'))) === 'ready-B', 'both owned writes overlap');
const overlap = { A: read('A').state, B: read('B').state };
assert.deepEqual(overlap, { A: 'running', B: 'running' });
assert.equal(await text(join(workspace('A'), 'src/b.txt')), 'b0');
assert.equal(await text(join(workspace('B'), 'src/a.txt')), 'a0');
const before = (await readdir(store)).sort();
assert.match(run(process.execPath, args('A'), source, 1).stderr, /attempt already exists/);
assert.match(run(process.execPath, args('A-replacement', inputSha, 'A'), source, 1).stderr, /prior logical job binding blocks admission/);
assert.deepEqual((await readdir(store)).sort(), before, 'refusals cannot prepare or create another workspace');
const a = await until(() => { const value = read('A'); return value.state === 'terminal' && value; }, 'A completes');
assert.equal(a.terminal.outcome, 'success'); assert.equal(a.reviewRequired, true);
assert.equal(read('B').state, 'running', 'B continues while A is awaiting product review');
const child = JSON.parse(await readFile(join(launchedA.attemptDir, 'execution-child.json'), 'utf8')).child;
async function confirmCeased(identity, label) {
  assert.ok(Number.isSafeInteger(identity.pid) && identity.pid > 0 && typeof identity.startTicks === 'string');
  await until(async () => {
    assert.equal((await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim(), identity.bootId);
    try {
      const stat = await readFile('/proc/' + identity.pid + '/stat', 'utf8');
      const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
      assert.equal(fields[19], identity.startTicks, 'PID reuse does not release capacity');
      return fields[0] === 'Z';
    } catch (error) { if (error.code === 'ENOENT') return true; throw error; }
  }, label, 3000);
}
await confirmCeased(child, 'exact A execution child ceased');
const nativeNames = await readdir(join(launchedA.attemptDir, 'native-tools'));
const intentNames = nativeNames.filter(name => name.endsWith('.intent.json')).sort();
const startedNames = nativeNames.filter(name => name.endsWith('.started.json')).sort();
assert.ok(intentNames.length > 0);
assert.deepEqual(startedNames.map(name => name.replace('.started.json', '')), intentNames.map(name => name.replace('.intent.json', '')), 'incomplete native startup cannot free capacity');
for (const name of startedNames) {
  const started = JSON.parse(await readFile(join(launchedA.attemptDir, 'native-tools', name), 'utf8'));
  await confirmCeased(started.init, 'recorded A namespace init ceased: ' + name);
}
await assert.rejects(lstat(join(store, 'C')), { code: 'ENOENT' });
const artifact = await readFile(join(workspace('A'), 'src/a.txt'));
assert.equal(artifact.toString(), 'A');
assert.notEqual(hash(run('git', ['show', targetBase + ':src/a.txt']).stdout), hash(artifact), 'terminal/review-ready is not integration');
const decisions = [{ job: 'C', reason: 'dependency', activeWriters: 1, concurrentLimit: 2, exitCondition: 'A artifact integrated into the named C target base', dispatched: false }];
const bindingPath = join(store, 'A.job.json'), bindingBytes = await readFile(bindingPath);
const binding = JSON.parse(bindingBytes);
await writeFile(bindingPath, JSON.stringify({ ...binding, taskSha256: '0'.repeat(64) }));
assert.equal(read('A').state, 'unknown');
assert.match(run(process.execPath, args('A-unknown-replacement', inputSha, 'A'), source, 1).stderr, /prior logical job binding blocks admission/);
const b = await until(() => { const value = read('B'); return value.state === 'terminal' && value; }, 'B completes independently despite unknown A binding');
assert.equal(b.terminal.outcome, 'success');
await writeFile(bindingPath, bindingBytes);
assert.equal(hash(await readFile(bindingPath)), hash(bindingBytes), 'restore only the explicit fault-injection control');
await assert.rejects(lstat(join(store, 'C')), { code: 'ENOENT' });
await writeFile(join(project, 'src/a.txt'), artifact);
const integratedBase = commit('Integrate exact A artifact in this disposable fixture only');
assert.equal(hash(run('git', ['show', integratedBase + ':src/a.txt']).stdout), hash(artifact));
await writeFile(join(project, '.factory/jobs/C/job.json'), JSON.stringify(job('C', integratedBase, "node -e \"const fs=require('node:fs');fs.writeFileSync('src/c.txt',fs.readFileSync('src/a.txt','utf8')+':C')\"")));
const cInput = commit('Pin dependent C to the actual integrated artifact');
const launchedC = launch('C', cInput);
const c = await until(() => { const value = read('C'); return value.state === 'terminal' && value; }, 'dependent C completes');
assert.equal(c.terminal.outcome, 'success');
assert.equal(await text(join(workspace('C'), 'src/c.txt')), 'A:C');
assert.equal(c.job.targetBase, integratedBase);
for (const id of ['A', 'B', 'C']) {
  const result = JSON.parse(await readFile(join(store, id, 'pi-result.json'), 'utf8'));
  assert.equal(result.providerPromptStarted, false); assert.equal(result.boundaryCheckPassed, true);
}
assert.equal(new Set([launchedA.attemptDir, launchedB.attemptDir, launchedC.attemptDir]).size, 3);
console.log(JSON.stringify({ status: 'PASS', root, runtimeSha, inputSha, targetBase, integratedBase, dependentInputSha: cInput, overlap, concurrentLimit: 2, ceasedANamespaces: startedNames.length, decisions, terminals: { A: a.terminal.outcome, B: b.terminal.outcome, C: c.terminal.outcome }, checks: ['two normal-entry offline jobs overlap in distinct derived workspaces', 'same-attempt and same-logical-job replacement refused without new preparation', 'A task and every recorded namespace init ceased; awaiting review does not satisfy integration dependency', 'unknown A binding does not cancel already-running independent B', 'C absent until exact A artifact is committed into its pinned target base', 'dependent C consumes integrated artifact successfully'], providerPrompts: 0, limits: 'Controlled cooperative caller with a test capacity of two, not a native dependency scheduler or global multiwriter lock. Fixture fault restoration is not production recovery. Normal read reports terminal success, not product acceptance or general descendant cessation.' }, null, 2));
