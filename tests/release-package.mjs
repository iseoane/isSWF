import assert from 'node:assert/strict';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readReleaseSource, verifyRelease } from '../tools/release-source.mjs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const temp = await mkdtemp(join(tmpdir(), 'isswf-release-'));
const fixture = join(temp, 'source'), store = join(temp, 'store'), project = join(temp, 'project');
const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), resolve(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(path => path && isAbsolute(path) && existsSync(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', npm_config_cache: join(temp, 'npm-cache') };
function run(binary, args, ok = true, cwd = temp) {
  if (binary === 'npm' && process.platform === 'win32') {
    assert.ok(npm, 'Node installation must provide npm CLI without a command shell');
    args = [npm, ...args];
    binary = process.execPath;
  }
  const result = spawnSync(binary, args, { cwd, encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024, env });
  assert.ifError(result.error);
  if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  else assert.notEqual(result.status, 0, 'Expected command refusal');
  return result;
}
const git = (...args) => run('git', ['-C', fixture, ...args]).stdout.trim();
const commit = message => { git('add', '-A'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', message); return git('rev-parse', 'HEAD'); };
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const writeJSON = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
async function inventory(root) {
  const entries = [];
  async function visit(path, prefix) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue;
      const relative = prefix + entry.name, full = join(path, entry.name);
      if (entry.isDirectory()) { entries.push(relative + '/'); await visit(full, relative + '/'); }
      else entries.push([relative, hash(await readFile(full))]);
    }
  }
  await visit(root, ''); return entries;
}
const cli = (root, command, args = [], ok = true) => run(process.execPath, [join(root, 'tools/isswf.mjs'), command, '--project', project, '--store', store, ...args], ok);
const checkpoint = () => { run('git', ['-C', project, 'add', '.']); run('git', ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'Checkpoint project setup']); };
let keep = false;
try {
  run('git', ['clone', '-q', '--shared', source, fixture]);
  for (const path of ['tools', '.agents', 'agents', 'skills', '.claude-plugin', 'package.json', 'docs', '.factory/templates']) await cp(join(source, path), join(fixture, path), { recursive: true, force: true });
  const revisionA = commit('Fixture installable release A');
  const releaseA = join(temp, 'release-a');
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', fixture, '--revision', revisionA, '--output', releaseA, '--runtime', 'node']);
  const receiptA = verifyRelease(releaseA);
  assert.equal(receiptA.revision, revisionA);
  assert.equal(receiptA.methodologySha, revisionA, 'New releases pin their current English methodology');
  const legacyMethodology = '37a56ebc902e94f21fc10666f33fceac44946af7';
  assert.match(readReleaseSource(releaseA, revisionA, '.agents/roles/references/design-principles.md').toString(), /^# Design principles/u);
  assert.match(readReleaseSource(releaseA, legacyMethodology, '.agents/roles/references/design-principles.md').toString(), /^# Principios de diseño/u);
  const markdownStore = join(temp, 'markdown-packages');
  run(process.execPath, [join(source, 'tools/factory-package.mjs'), 'materialize', '--source', fixture, '--revision', revisionA, '--store', markdownStore]);
  const { verifyPackage } = await import(pathToFileURL(join(source, 'tools/factory-package.mjs')));
  const markdownRoot = join(markdownStore, revisionA), workflowPath = '.agents/roles/references/feature-delivery.md';
  await verifyPackage(markdownRoot, revisionA);
  const workflow = await readFile(join(source, workflowPath));
  assert.deepEqual(await readFile(join(markdownRoot, workflowPath)), workflow, 'Materialized coordinator must receive its selected feature workflow');
  await rm(join(markdownRoot, workflowPath));
  await assert.rejects(verifyPackage(markdownRoot, revisionA), /ENOENT/u);
  await writeFile(join(markdownRoot, workflowPath), workflow, { mode: 0o444 });
  await verifyPackage(markdownRoot, revisionA);
  const rootManifest = await readJSON(join(releaseA, 'package.json'));
  const nativePiResources = ['.agents/hosts/pi.md', 'tools/git-evidence.mjs', 'tools/git-evidence-pi-extension.mjs', 'tools/git-evidence-invoke.mjs', 'tools/git-evidence-mcp.mjs', '.agents/roles/planner.md', '.agents/roles/researcher.md', '.agents/roles/references/planning.md', '.agents/roles/references/research.md', ...['worker', 'reviewer', 'planner', 'researcher'].map(role => `.agents/hosts/pi/agents/isswf-${role}.md`)];
  for (const path of nativePiResources) {
    assert.deepEqual(await readFile(join(releaseA, path)), await readFile(join(source, path)), 'Native Pi resources must survive committed-source construction');
    assert.deepEqual(await readFile(join(markdownRoot, path)), await readFile(join(source, path)), 'Native Pi resources must survive Markdown materialization');
  }
  // The Claude evidence server and everything it launches or imports ship with the release regardless of pi.subagents.
  const plugin = await readJSON(join(releaseA, '.claude-plugin/plugin.json'));
  const serverPath = plugin.mcpServers.isswf_git_evidence.args[0].replace('${CLAUDE_PLUGIN_ROOT}', releaseA);
  assert.equal(serverPath, join(releaseA, 'tools/git-evidence-mcp.mjs'));
  for (const name of ['git-evidence-mcp.mjs', 'git-evidence-invoke.mjs', 'git-evidence.mjs']) assert.deepEqual(await readFile(join(releaseA, 'tools', name)), await readFile(join(source, 'tools', name)), `${name} ships in the release`);
  assert.equal(rootManifest.version, plugin.version);
  assert.equal(await readdir(releaseA).then(entries => entries.includes('.git')), false);
  assert.equal(Object.keys(receiptA.files).some(path => /^(?:tests|tooling|\.audit)\//u.test(path)), false);
  assert.equal(Object.keys(receiptA.files).some(path => path.startsWith('.factory/initiatives')), false);
  assert.equal(Object.keys(receiptA.files).some(path => path.startsWith('docs/history/') || path.startsWith('docs/research/')), false, 'Release excludes retired documentation');
  for (const path of ['docs/issue-intake.md', 'docs/source-activation.md']) assert.ok(receiptA.files[path], `Missing current guide: ${path}`);
  for (const path of ['docs/s01-intake.md', 'docs/activacion-por-proyecto.md']) assert.equal(receiptA.files[path], undefined, `Retired guide path packaged: ${path}`);
  for (const [sha, entries] of Object.entries(receiptA.sources)) for (const path of Object.keys(entries)) assert.ok(readReleaseSource(releaseA, sha, path).length);
  assert.throws(() => readReleaseSource(releaseA, '0'.repeat(40), '.agents/roles/worker.md'), /missing/u);
  for (const module of ['planner-task', 'reviewer-task', 'diagnostic-task', 'researcher-task', 'pi-worker-task']) await import(pathToFileURL(join(releaseA, 'tools', module + '.mjs')));
  for (const name of ['job-brief', 'delivery']) {
    const path = '.factory/templates/' + name + '.md';
    assert.deepEqual(await readFile(join(releaseA, path)), await readFile(join(source, path)), 'Current working-tree templates must be packaged, not silently taken from earlier HEAD');
  }
  const packageFiles = await inventory(releaseA);
  const packed = JSON.parse(run('npm', ['pack', releaseA, '--ignore-scripts', '--json', '--pack-destination', temp]).stdout);
  const packedEntry = Array.isArray(packed) ? packed[0] : Object.values(packed)[0];
  const tarball = join(temp, packedEntry.filename), consumer = join(temp, 'consumer');
  run('npm', ['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', '--offline', tarball]);
  const installed = join(consumer, 'node_modules/isswf-pi-resources');
  assert.equal(verifyRelease(installed).runtimeId, receiptA.runtimeId, 'Packed npm package must retain exact inventory');
  for (const name of ['git-evidence-mcp.mjs', 'git-evidence-invoke.mjs', 'git-evidence.mjs']) assert.ok(existsSync(join(installed, 'tools', name)), `${name} ships in the installed npm package`);
  for (const path of [
    '.agents/skills/isswf-security/SKILL.md',
    'skills/isswf-security/SKILL.md',
    '.agents/skills/isswf-performance/SKILL.md',
    'skills/isswf-performance/SKILL.md',
    '.agents/skills/isswf-observability/SKILL.md',
    'skills/isswf-observability/SKILL.md',
    '.agents/skills/isswf-debug/SKILL.md',
    'skills/isswf-debug/SKILL.md',
    '.agents/skills/isswf-review/SKILL.md',
    'skills/isswf-review/SKILL.md',
    '.agents/skills/isswf-retrospective/SKILL.md',
    'skills/isswf-retrospective/SKILL.md',
    '.agents/skills/isswf-tdd/SKILL.md',
    'skills/isswf-tdd/SKILL.md',
    '.agents/roles/references/feature-delivery.md',
    '.agents/roles/references/retrospective.md',
    '.factory/templates/retrospective.md',
    '.agents/skills/isswf-e2e/SKILL.md',
    '.agents/skills/isswf-e2e/references/browser.md',
    '.agents/skills/isswf-e2e/references/cli-and-api.md',
    '.agents/skills/isswf-e2e/references/test-quality.md',
    'skills/isswf-e2e/SKILL.md',
    '.agents/skills/isswf-writing/SKILL.md',
    '.agents/skills/isswf-writing/references/human-documents.md',
    '.agents/skills/isswf-writing/references/agent-documents.md',
    'skills/isswf-writing/SKILL.md',
    '.agents/skills/isswf-understanding/SKILL.md',
    '.agents/skills/isswf-understanding/references/explanation.md',
    '.agents/skills/isswf-understanding/references/learning.md',
    'skills/isswf-understanding/SKILL.md',
    '.agents/skills/isswf-pr/SKILL.md',
    '.agents/skills/isswf-pr/references/risk-assessment.md',
    '.agents/skills/isswf-pr/references/pr-description.md',
    'skills/isswf-pr/SKILL.md',
    '.agents/skills/isswf-issue/SKILL.md',
    '.agents/skills/isswf-issue/references/routing-and-publication.md',
    '.agents/skills/isswf-issue/references/report-content.md',
    'skills/isswf-issue/SKILL.md',
  ]) {
    assert.ok(receiptA.files[path], `Utility resource missing from release: ${path}`);
    assert.equal(await readFile(join(installed, path), 'utf8'), await readFile(join(source, path), 'utf8'));
    assert.equal(readReleaseSource(installed, revisionA, path).toString(), await readFile(join(source, path), 'utf8'));
  }
  if (process.env.ISSWF_TEST_PI) {
    const managerAgent = join(temp, 'pi-agent'), managerProject = join(temp, 'pi-project');
    await mkdir(managerProject); run('git', ['init', '-q', managerProject]);
    const managerEnv = { ...env, PI_CODING_AGENT_DIR: managerAgent, PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0' };
    for (const scope of [[], ['--local']]) {
      const result = spawnSync(process.env.ISSWF_TEST_PI, ['install', installed, ...scope], { cwd: managerProject, env: managerEnv, encoding: 'utf8', timeout: 30000 });
      assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
      const settingsRoot = scope.length ? join(managerProject, '.pi') : managerAgent;
      const settings = await readJSON(join(settingsRoot, 'settings.json'));
      assert.equal(settings.packages.length, 1); assert.equal(resolve(settingsRoot, settings.packages[0]), installed);
    }
    await assert.rejects(readdir(join(managerProject, '.isswf')), { code: 'ENOENT' });
    await assert.rejects(readdir(join(managerProject, '.factory')), { code: 'ENOENT' });
    console.log('PASS real Pi manager global and project scopes in isolated temporary config; no project state initialized by package installation');
  }
  // Each suite owns a different temporary project/store and only reads this artifact.
  // Wait for ALL children before fixture teardown, including when one fails.
  const roleResults = await Promise.allSettled(['planner-task', 'reviewer-task', 'diagnostic-task'].map(test =>
    promisify(execFile)(process.execPath, [join(source, 'tests', test + '.mjs'), installed], { cwd: temp, env, timeout: 45000, maxBuffer: 4 * 1024 * 1024 })
  ));
  for (const result of roleResults) assert.equal(result.status, 'fulfilled', result.reason?.stack);
  assert.deepEqual(await inventory(releaseA), packageFiles, 'Packing does not modify release');
  await mkdir(project); run('git', ['init', '-q', project]);
  const beforeInspect = await inventory(project);
  assert.equal(JSON.parse(cli(installed, 'inspect').stdout).status, 'not-initialized');
  assert.deepEqual(await inventory(project), beforeInspect);
  await assert.rejects(readdir(store), { code: 'ENOENT' });
  const initialized = JSON.parse(cli(installed, 'init', ['--tracking', 'local']).stdout);
  assert.equal(initialized.status, 'initialized');
  const pinFile = join(project, '.isswf/install.json'), pinA = await readFile(pinFile);
  assert.equal((await readJSON(pinFile)).runtimeId, receiptA.runtimeId);
  await assert.rejects(readdir(join(project, '.factory')), { code: 'ENOENT' });
  const afterInit = await inventory(project);
  assert.equal(JSON.parse(cli(installed, 'init', ['--tracking', 'local']).stdout).status, 'unchanged');
  assert.deepEqual(await inventory(project), afterInit);
  const location = JSON.parse(cli(installed, 'locate').stdout);
  assert.equal(location.runtimeRoot, join(store, 'releases', receiptA.runtimeId));
  assert.equal(JSON.parse(cli(installed, 'exec', ['--', 'isswf-status', '--initiative', 'I0001']).stdout).status, 'absent');
  assert.match(cli(installed, 'exec', ['--', 'isswf-status', '--project', fixture], false).stderr, /supplied by the launcher/u);
  await rm(location.runtimeRoot, { recursive: true });
  assert.equal(JSON.parse(cli(installed, 'init').stdout).status, 'unchanged');
  assert.deepEqual(await readFile(pinFile), pinA);
  checkpoint();
  const sdk = join(temp, 'sdk'); await mkdir(sdk);
  await writeFile(join(project, 'brief.md'), 'Committed target brief, not package provenance.\n');
  checkpoint();
  const briefSha = run('git', ['-C', project, 'rev-parse', 'HEAD']).stdout.trim();
  await writeFile(join(project, 'brief.md'), 'DIRTY target brief must not be used.\n');
  const prepareConfig = join(temp, 'worker-prepare.json'), task = join(temp, 'prepared-worker.mjs');
  const config = { version: 1, mode: 'offline', sdkPath: sdk, nodeBinary: process.execPath, authPath: join(temp, 'not-read-auth.json'), profile: { repo: installed, sha: receiptA.methodologySha, files: ['.agents/roles/worker.md', ...['bug-diagnosis', 'tdd', 'design-principles', 'execution-principles', 'verification-principles', 'code-quality', 'comments'].map(name => '.agents/roles/references/' + name + '.md'), ...['debug', 'tdd', 'security', 'performance', 'observability'].map(name => '.agents/skills/isswf-' + name + '/SKILL.md'), ...['SKILL.md', 'references/browser.md', 'references/cli-and-api.md', 'references/test-quality.md'].map(name => '.agents/skills/isswf-e2e/' + name)] }, brief: { repo: project, inputSha: briefSha, path: 'brief.md' }, expectedMutablePaths: ['app.mjs'], protectedCheckCommand: 'node --check app.mjs', checks: [] };
  await writeJSON(prepareConfig, config);
  const prepared = JSON.parse(run(process.execPath, [join(installed, 'tools/pi-worker-task.mjs'), 'prepare', '--config', prepareConfig, '--output', task]).stdout);
  assert.equal(prepared.briefSha256, hash(Buffer.from('Committed target brief, not package provenance.\n')));
  const taskText = await readFile(task, 'utf8');
  assert.equal(taskText.includes('DIRTY target brief'), false);
  const preparedConfig = JSON.parse(taskText.split('\n').find(line => line.startsWith('const CONFIG=')).slice('const CONFIG='.length, -1));
  assert.match(preparedConfig.files['.agents/roles/references/design-principles.md'], /^# Design principles/u);
  await writeJSON(prepareConfig, { ...config, profile: { ...config.profile, sha: legacyMethodology } });
  assert.match(run(process.execPath, [join(installed, 'tools/pi-worker-task.mjs'), 'prepare', '--config', prepareConfig, '--output', task + '-wrong-pin'], false).stderr, /authorized baseline/u);
  await writeJSON(prepareConfig, { ...config, profile: { ...config.profile, files: ['.agents/roles/not-packaged.md'] } });
  assert.match(run(process.execPath, [join(installed, 'tools/pi-worker-task.mjs'), 'prepare', '--config', prepareConfig, '--output', task + '-missing'], false).stderr, /Pinned release source is missing/u);
  await writeFile(join(project, 'brief.md'), 'Committed target brief, not package provenance.\n');
  const admissionJob = { version: 1, logicalJobRef: 'release/native-admission', runtimeSha: receiptA.revision, targetBase: briefSha, methodologySha: receiptA.methodologySha, exclusiveAttempt: true, workerTotal: 1, models: { sha: briefSha, path: '.isswf/models.json', sha256: hash(await readFile(join(project, '.isswf/models.json'))) }, briefPath: 'brief.md', sdkPath: 'relative-sdk-path', expectedMutablePaths: ['app.mjs'], protectedCheckCommand: 'node --check app.mjs' };
  const admissionStore = join(temp, 'admission-runs');
  for (const [methodologySha, message] of [[legacyMethodology, 'job version/runtime/base/methodology pins invalid'], [receiptA.methodologySha, 'job.sdkPath must be absolute']]) {
    await writeJSON(join(project, 'native-job.json'), { ...admissionJob, methodologySha }); checkpoint();
    const inputSha = run('git', ['-C', project, 'rev-parse', 'HEAD']).stdout.trim();
    const admitted = run(process.execPath, [join(installed, 'tools/isswf-job.mjs'), 'run', '--project', project, '--input-sha', inputSha, '--job', 'native-job.json', '--runs-store', admissionStore, '--attempt-id', 'language-admission', '--grant-ref', 'Synthetic fixture only', '--mode', 'offline'], false);
    assert.ok(admitted.stderr.includes(message), admitted.stderr);
    await assert.rejects(readdir(admissionStore), { code: 'ENOENT' });
  }
  const setupBytes = await readFile(join(project, '.isswf/project-setup.md'));
  const models = await readJSON(join(project, '.isswf/models.json'));
  models.operatorField = 'preserve'; await writeJSON(join(project, '.isswf/models.json'), models); checkpoint();
  const modelBytes = await readFile(join(project, '.isswf/models.json'));
  await mkdir(join(project, '.isswf/initiatives/I0001/jobs/J001'), { recursive: true });
  const history = join(project, '.isswf/initiatives/I0001/jobs/J001/A001.md');
  await writeFile(history, 'Historical .factory/input.md remains pinned at its original Git SHA.\n');
  const historyBytes = await readFile(history);
  const manifestB = await readJSON(join(fixture, 'package.json')); manifestB.version = '1.1.1'; await writeJSON(join(fixture, 'package.json'), manifestB);
  const pluginB = await readJSON(join(fixture, '.claude-plugin/plugin.json')); pluginB.version = '1.1.1'; await writeJSON(join(fixture, '.claude-plugin/plugin.json'), pluginB);
  const revisionB = commit('Fixture release B');
  const releaseB = join(temp, 'release-b');
  run(process.execPath, [join(source, 'tools/build-release.mjs'), '--source', fixture, '--revision', revisionB, '--output', releaseB, '--runtime', 'node']);
  const receiptB = verifyRelease(releaseB);
  const beforeUpdate = await inventory(project), beforeStore = await inventory(store);
  const preview = JSON.parse(cli(releaseB, 'inspect').stdout);
  assert.equal(preview.status, 'update-available'); assert.deepEqual(preview.changed, ['.isswf/install.json']);
  assert.deepEqual(await inventory(project), beforeUpdate); assert.deepEqual(await inventory(store), beforeStore);
  assert.equal(JSON.parse(cli(releaseB, 'locate').stdout).pin.runtimeId, receiptA.runtimeId, 'Updating host package does not update project');
  const migration = ['--id', 'M0001', '--expected', preview.expected, '--quiescent-ref', 'Synthetic operator-confirmed fixture has no external writers'];
  assert.match(cli(releaseB, 'migrate', migration.map(value => value === preview.expected ? '0'.repeat(64) : value), false).stderr, /expected/u);
  await mkdir(join(project, '.isswf/local/leases'), { recursive: true });
  await writeJSON(join(project, '.isswf/local/leases/unknown.json'), { owner: 'unknown' });
  assert.match(cli(releaseB, 'migrate', migration, false).stderr, /uncertain execution/u);
  await rm(join(project, '.isswf/local/leases/unknown.json'));
  assert.equal(JSON.parse(cli(releaseB, 'migrate', migration).stdout).status, 'migrated');
  const pinB = await readFile(pinFile);
  assert.equal((await readJSON(pinFile)).runtimeId, receiptB.runtimeId);
  assert.deepEqual(await readFile(history), historyBytes); assert.deepEqual(await readFile(join(project, '.isswf/models.json')), modelBytes); assert.deepEqual(await readFile(join(project, '.isswf/project-setup.md')), setupBytes);
  assert.equal(JSON.parse(cli(releaseB, 'migrate', migration).stdout).status, 'unchanged');
  assert.equal(verifyRelease(location.runtimeRoot).runtimeId, receiptA.runtimeId, 'Previous runtime retained');
  assert.match(cli(releaseB, 'rollback', ['--id', 'M0001', '--quiescent-ref', 'Fixture'], false).stderr, /Checkpoint/u);
  checkpoint();
  assert.equal(JSON.parse(cli(releaseB, 'rollback', ['--id', 'M0001', '--quiescent-ref', 'Fixture']).stdout).status, 'migrated');
  assert.deepEqual(await readFile(pinFile), pinA);
  assert.equal(JSON.parse(cli(releaseB, 'rollback', ['--id', 'M0001', '--quiescent-ref', 'Fixture']).stdout).status, 'unchanged');
  checkpoint();
  const recoveryDir = join(project, '.isswf/local/transactions/interrupted');
  await mkdir(recoveryDir);
  const deadOwner = { pid: 2147483647, startTicks: '1', bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() };
  await writeJSON(join(recoveryDir, 'record.json'), { format: 1, id: 'interrupted', kind: 'migrate', owner: deadOwner, files: [{ path: '.isswf/install.json', before: pinA.toString('base64'), after: pinB.toString('base64') }] });
  await writeFile(pinFile, pinB);
  await mkdir(join(project, '.isswf/local/operation'));
  await writeJSON(join(project, '.isswf/local/operation/owner.json'), { id: 'interrupted', owner: deadOwner });
  assert.match(cli(releaseB, 'migrate', migration, false).stderr, /Interrupted/u);
  assert.equal(JSON.parse(cli(releaseB, 'recover', ['--id', 'interrupted']).stdout).status, 'recovered');
  assert.deepEqual(await readFile(pinFile), pinA);
  const bootstrap = { format: 1, id: 'bootstrap', kind: 'migrate', owner: deadOwner, reference: 'Fixture', files: [{ path: '.isswf/install.json', before: pinA.toString('base64'), after: pinB.toString('base64') }] };
  await mkdir(join(project, '.isswf/local/operation'));
  await writeJSON(join(project, '.isswf/local/operation/owner.json'), { id: 'bootstrap', owner: deadOwner, transaction: bootstrap });
  assert.equal(JSON.parse(cli(releaseB, 'recover', ['--id', 'bootstrap']).stdout).status, 'recovered', 'Claim bootstrap is recoverable before journal creation');
  assert.deepEqual(await readFile(pinFile), pinA);
  const selfStat = await readFile(`/proc/${process.pid}/stat`, 'utf8');
  const liveOwner = { pid: process.pid, startTicks: selfStat.slice(selfStat.lastIndexOf(')') + 2).split(/\s+/u)[19], bootId: deadOwner.bootId };
  await mkdir(join(project, '.isswf/local/operation'));
  await writeJSON(join(project, '.isswf/local/operation/owner.json'), { id: 'live-bootstrap', owner: liveOwner, transaction: { ...bootstrap, id: 'live-bootstrap', owner: liveOwner } });
  assert.match(cli(releaseB, 'recover', ['--id', 'live-bootstrap'], false).stderr, /live or uncertain/u);
  await rm(join(project, '.isswf/local/operation'), { recursive: true });
  const outsideJournal = join(temp, 'outside-journal'); await mkdir(outsideJournal);
  await symlink(outsideJournal, join(project, '.isswf/local/transactions/symlink-journal'));
  await mkdir(join(project, '.isswf/local/operation'));
  await writeJSON(join(project, '.isswf/local/operation/owner.json'), { id: 'symlink-journal', owner: deadOwner, transaction: { ...bootstrap, id: 'symlink-journal' } });
  assert.match(cli(releaseB, 'recover', ['--id', 'symlink-journal'], false).stderr, /Real directory/u);
  assert.deepEqual(await readdir(outsideJournal), []);
  await rm(join(project, '.isswf/local/operation'), { recursive: true });
  await rm(join(project, '.isswf/local/transactions/symlink-journal'));
  checkpoint();
  const ready = join(temp, 'race-ready'), proceed = join(temp, 'race-proceed'), preload = join(temp, 'pause-verify.mjs');
  await writeFile(preload, `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const original=fs.readdirSync;let paused=false;fs.readdirSync=function(path,...args){if(!paused&&path===${JSON.stringify(location.runtimeRoot)}){paused=true;fs.writeFileSync(${JSON.stringify(ready)},'ready');const end=Date.now()+15000;while(!fs.existsSync(${JSON.stringify(proceed)})){if(Date.now()>end)throw Error('race probe deadline');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}}return original.call(this,path,...args);};syncBuiltinESMExports();`);
  const raceChild = spawn(process.execPath, ['--import', preload, join(installed, 'tools/isswf.mjs'), 'exec', '--project', project, '--store', store, '--', 'isswf-status', '--initiative', 'I0001'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let raceError = ''; raceChild.stderr.on('data', bytes => { raceError += bytes; });
  const raceExit = new Promise((done, reject) => { raceChild.once('error', reject); raceChild.once('exit', code => done(code)); });
  try {
    let observed = false;
    for (let count = 0; count < 1000; count++) { try { await readFile(ready); observed = true; break; } catch (error) { if (error.code !== 'ENOENT') throw error; } await new Promise(done => setTimeout(done, 10)); }
    assert.equal(observed, true, 'Race probe must pause at runtime verification');
    const racePreview = JSON.parse(cli(releaseB, 'inspect').stdout);
    assert.equal(JSON.parse(cli(releaseB, 'migrate', ['--id', 'M0002', '--expected', racePreview.expected, '--quiescent-ref', 'Fixture only']).stdout).status, 'migrated');
  } finally { await writeFile(proceed, 'continue'); }
  assert.notEqual(await raceExit, 0);
  assert.match(raceError, /pin changed before execution registration/u, 'Execution must not launch a version chosen before the migration lock');
  checkpoint();
  cli(releaseB, 'rollback', ['--id', 'M0002', '--quiescent-ref', 'Fixture']);
  checkpoint();
  const driftPreview = JSON.parse(cli(releaseB, 'inspect').stdout);
  const driftReady = join(temp, 'drift-ready'), driftProceed = join(temp, 'drift-proceed'), driftPreload = join(temp, 'pause-retention.mjs');
  await writeFile(driftPreload, `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const original=fs.readdirSync;let calls=0;fs.readdirSync=function(path,...args){if(path===${JSON.stringify(releaseB)}&&++calls===2){fs.writeFileSync(${JSON.stringify(driftReady)},'ready');const end=Date.now()+15000;while(!fs.existsSync(${JSON.stringify(driftProceed)})){if(Date.now()>end)throw Error('drift probe deadline');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}}return original.call(this,path,...args);};syncBuiltinESMExports();`);
  const driftChild = spawn(process.execPath, ['--import', driftPreload, join(releaseB, 'tools/isswf.mjs'), 'migrate', '--project', project, '--store', store, '--id', 'M0003', '--expected', driftPreview.expected, '--quiescent-ref', 'Fixture'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let driftError = ''; driftChild.stderr.on('data', bytes => { driftError += bytes; });
  const driftExit = new Promise((done, reject) => { driftChild.once('error', reject); driftChild.once('exit', code => done(code)); });
  let editedPin;
  try {
    let observed = false;
    for (let count = 0; count < 1000; count++) { try { await readFile(driftReady); observed = true; break; } catch (error) { if (error.code !== 'ENOENT') throw error; } await new Promise(done => setTimeout(done, 10)); }
    assert.equal(observed, true, 'Drift probe must pause after expected-digest and cleanliness checks');
    editedPin = { ...await readJSON(pinFile), operatorDuringRetention: 'preserve this edit' };
    await writeJSON(pinFile, editedPin);
  } finally { await writeFile(driftProceed, 'continue'); }
  assert.notEqual(await driftExit, 0, 'Migration must reject intervening operator edits');
  assert.match(driftError, /changed since inspection/u);
  assert.deepEqual(await readJSON(pinFile), editedPin);
  const corrupt = join(temp, 'corrupt'); await cp(releaseA, corrupt, { recursive: true });
  await writeFile(join(corrupt, 'tools/isswf-status.mjs'), 'tampered');
  assert.throws(() => verifyRelease(corrupt), /hash mismatch/u);
  const linked = join(temp, 'linked'); await cp(releaseA, linked, { recursive: true });
  await symlink(join(temp, 'outside'), join(linked, 'unexpected-link'));
  assert.throws(() => verifyRelease(linked), /symbolic link/u);
  await rm(join(project, '.isswf'), { recursive: true });
  await mkdir(join(project, '.factory/initiatives/I0002/jobs/J001'), { recursive: true });
  await writeFile(join(project, '.factory/initiatives/I0002/jobs/J001/brief-r1.md'), 'Legacy .factory reference remains historical.\n');
  checkpoint();
  const legacyBytes = await readFile(join(project, '.factory/initiatives/I0002/jobs/J001/brief-r1.md'));
  const statePreview = JSON.parse(cli(releaseB, 'inspect').stdout);
  assert.equal(statePreview.status, 'legacy-state');
  assert.match(cli(releaseB, 'init', ['--tracking', 'local'], false).stderr, /migrate-state/u);
  const stateBootstrapPath = join(store, 'state-migrations', hash(project), 'Sbootstrap');
  const stateBootstrap = { format: 1, id: 'Sbootstrap', kind: 'move', project, expected: statePreview.stateMigration.expected, reference: 'Fixture', owner: deadOwner, files: statePreview.stateMigration.files };
  await mkdir(join(project, '.isswf-transition'));
  await writeJSON(join(project, '.isswf-transition/owner.json'), { format: 1, id: 'Sbootstrap', recordPath: stateBootstrapPath, owner: deadOwner, record: stateBootstrap });
  assert.equal(JSON.parse(cli(releaseB, 'recover-state', ['--id', 'Sbootstrap']).stdout).activeDirectory, '.factory', 'Directory-move bootstrap recovers without a preexisting journal');
  const stateArgs = ['--id', 'S0001', '--expected', statePreview.stateMigration.expected, '--quiescent-ref', 'Fixture has no legacy or external writers'];
  assert.equal(JSON.parse(cli(releaseB, 'migrate-state', stateArgs).stdout).status, 'state-migrated');
  await assert.rejects(readdir(join(project, '.factory')), { code: 'ENOENT' });
  assert.deepEqual(await readFile(join(project, '.isswf/initiatives/I0002/jobs/J001/brief-r1.md')), legacyBytes);
  assert.equal(JSON.parse(cli(releaseB, 'migrate-state', stateArgs).stdout).status, 'unchanged');
  const movedJournal = join(store, 'state-migrations', hash(project), 'S0001');
  const movedRecord = await readJSON(join(movedJournal, 'record.json'));
  await mkdir(join(project, '.isswf-transition'));
  await writeJSON(join(project, '.isswf-transition/owner.json'), { format: 1, id: 'S0001', recordPath: movedJournal, owner: deadOwner, record: movedRecord });
  assert.equal(JSON.parse(cli(releaseB, 'recover-state', ['--id', 'S0001']).stdout).activeDirectory, '.isswf', 'Recovery reconciles an already completed rename');
  assert.equal(JSON.parse(cli(releaseB, 'init', ['--tracking', 'local']).stdout).status, 'initialized');
  assert.deepEqual(await readFile(join(project, '.isswf/initiatives/I0002/jobs/J001/brief-r1.md')), legacyBytes);
  console.log('PASS actual committed release, offline npm tarball install, own-source pins, shared versions, .isswf init, retained runtime selection, preview no writes, explicit migration, active/dirty/tamper/symlink guards, rollback, interrupted recovery and byte-preserving .factory move; no Claude or provider invocation');
} catch (error) { keep = true; console.error('Retained failing fixture: ' + temp); throw error; }
finally { if (!keep) await rm(temp, { recursive: true, force: true }); }
