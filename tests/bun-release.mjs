import assert from 'node:assert/strict';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { verifyRelease, releaseInvocation } from '../tools/release-source.mjs';

const compiler = process.env.ISSWF_TEST_BUN || 'bun';
const available = spawnSync(compiler, ['--version'], { encoding: 'utf8' });
if (available.error || available.status !== 0) {
  if (process.env.ISSWF_TEST_BUN) throw Error('Requested Bun compiler is unavailable');
  console.log('SKIP Bun artifact checks: compiler unavailable');
} else {
  const temporaryBase = resolve(process.env.ISSWF_TEST_BUN_TMPDIR || tmpdir());
  const source = resolve(process.argv[2] || '.'), temp = await mkdtemp(join(temporaryBase, 'isswf-bun-release-'));
  const fixture = join(temp, 'source'), project = join(temp, 'project spaces ñ'), store = join(temp, 'store');
  const env = { ...process.env, TMPDIR: temporaryBase, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', npm_config_cache: join(temp, 'npm-cache') };
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  function run(binary, args, ok = true, environment = env) {
    const result = spawnSync(binary, args, { cwd: temp, env: environment, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    assert.ifError(result.error);
    if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
    else assert.notEqual(result.status, 0);
    return result;
  }
  const exec = promisify(execFile);
  async function runAsync(binary, args, ok = true, environment = env) {
    let result;
    try { result = await exec(binary, args, { cwd: temp, env: environment, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }); }
    catch (error) {
      if (ok || error.killed || error.signal || typeof error.code !== 'number') throw error;
      return error;
    }
    assert(ok, `Unexpected success: ${binary} ${args.join(' ')}`);
    return result;
  }
  const npmAsync = args => runAsync(process.platform === 'win32' ? process.execPath : 'npm', process.platform === 'win32' ? [join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...args] : args);
  const git = (...args) => run('git', ['-C', fixture, ...args]).stdout.trim();
  const commit = message => { git('add', '-A'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', message); return git('rev-parse', 'HEAD'); };
  async function verifyLegacy(builder, revisionA, executable, noRuntime) {
    // Independent project/store; never shares mutable state with modern migration or worker checks.
    const legacy = join(temp, 'legacy-release'), legacyProject = join(temp, 'legacy-project'), legacyStore = join(temp, 'legacy-store');
    await runAsync(process.execPath, [builder, '--source', fixture, '--revision', revisionA, '--output', legacy, '--runtime', 'node']);
    await mkdir(legacyProject); await runAsync('git', ['init', '-q', legacyProject]);
    await runAsync(process.execPath, [join(legacy, 'tools/isswf.mjs'), 'init', '--project', legacyProject, '--store', legacyStore, '--tracking', 'local']);
    const legacyArgs = ['exec', '--project', legacyProject, '--store', legacyStore, '--', 'isswf-status', '--initiative', 'I0001'];
    assert.equal(JSON.parse((await runAsync(executable, legacyArgs)).stdout).status, 'absent');
    const legacyCli = (command, args = []) => runAsync(executable, [command, '--project', legacyProject, '--store', legacyStore, ...args], true, noRuntime);
    const checkpointLegacy = async () => {
      await runAsync('git', ['-C', legacyProject, 'add', '.']);
      await runAsync('git', ['-C', legacyProject, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'Checkpoint engine migration']);
    };
    const oldLegacyPin = await readFile(join(legacyProject, '.isswf/install.json'));
    await checkpointLegacy();
    const legacyPreview = JSON.parse((await legacyCli('inspect')).stdout);
    await legacyCli('migrate', ['--id', 'ENGINE1', '--expected', legacyPreview.expected, '--quiescent-ref', 'synthetic-engine-transition-only']);
    assert.equal(JSON.parse((await runAsync(executable, legacyArgs, true, noRuntime)).stdout).status, 'absent');
    assert.equal(JSON.parse(await readFile(join(legacyProject, '.isswf/install.json'), 'utf8')).runtimeFormat, 2);
    await checkpointLegacy(); await legacyCli('rollback', ['--id', 'ENGINE1', '--quiescent-ref', 'synthetic-engine-transition-only']);
    assert((await readFile(join(legacyProject, '.isswf/install.json'))).equals(oldLegacyPin));
    assert.match((await runAsync(executable, legacyArgs, false, noRuntime)).stderr, /node/u, 'Legacy Node pins require Node rather than silently changing their engine');
  }
  let passed = false, installation, newerBuild, legacyCheck;
  try {
    run('git', ['clone', '-q', '--shared', source, fixture]);
    for (const path of ['tools', '.agents', 'agents', 'skills', 'hooks', 'types', '.claude-plugin', 'package.json', 'docs', '.factory/templates']) await cp(join(source, path), join(fixture, path), { recursive: true, force: true });
    const revisionA = commit('Bun release candidate A'), releaseA = join(temp, 'release-a');
    const builder = join(source, 'tools/build-release.mjs');
    run(process.execPath, [builder, '--source', fixture, '--revision', revisionA, '--output', releaseA, '--runtime', 'bun', '--bun', compiler]);
    const receiptA = verifyRelease(releaseA), manifest = JSON.parse(await readFile(join(releaseA, 'package.json'), 'utf8'));
    assert.equal(manifest.isswfRuntime.engine, 'bun');
    assert.equal(manifest.version, JSON.parse(await readFile(join(releaseA, '.claude-plugin/plugin.json'), 'utf8')).version);
    assert(receiptA.files[manifest.bin.isswf]);
    assert.equal(receiptA.format, 2);
    const marker = join(fixture, 'tools/isswf-status.mjs');
    const original = await readFile(marker, 'utf8');
    await writeFile(marker, original.replace('Reported plan progress and artifact snapshots only.', 'BINARY REVISION B. Reported plan progress and artifact snapshots only.'));
    const revisionB = commit('Bun release candidate B'), releaseB = join(temp, 'release-b');
    // Explicit immutable revision pins and exclusive output roots permit concurrent compilation.
    newerBuild = Promise.allSettled([runAsync(process.execPath, [builder, '--source', fixture, '--revision', revisionB, '--output', releaseB, '--runtime', 'bun', '--bun', compiler])]);
    const consumer = join(temp, 'consumer');
    // Only the immutable release is shared; installation owns a separate consumer.
    installation = Promise.allSettled([(async () => {
      const packing = JSON.parse((await npmAsync(['pack', releaseA, '--ignore-scripts', '--json', '--pack-destination', temp])).stdout);
      const packed = Array.isArray(packing) ? packing[0] : Object.values(packing)[0];
      await npmAsync(['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', '--offline', join(temp, packed.filename)]);
    })()]);
    const variant = join(temp, 'synthetic-other-arch-metadata'); await cp(releaseA, variant, { recursive: true });
    const variantReceipt = JSON.parse(await readFile(join(variant, '.isswf-release.json'), 'utf8'));
    const variantManifest = structuredClone(manifest);
    variantReceipt.runtime.arch = process.arch === 'x64' ? 'arm64' : 'x64';
    variantReceipt.runtime.target = variantReceipt.runtime.target.replace(/(?:x64|arm64)$/u, variantReceipt.runtime.arch);
    variantManifest.cpu = [variantReceipt.runtime.arch]; variantManifest.isswfRuntime.target = variantReceipt.runtime.target;
    const variantBytes = Buffer.from(JSON.stringify(variantManifest, null, 2) + '\n');
    await writeFile(join(variant, 'package.json'), variantBytes); variantReceipt.files['package.json'] = hash(variantBytes);
    await chmod(join(variant, '.isswf-release.json'), 0o644); await writeFile(join(variant, '.isswf-release.json'), JSON.stringify(variantReceipt, null, 2) + '\n');
    const variantIdentity = verifyRelease(variant);
    assert.equal(variantIdentity.runtimeId, receiptA.runtimeId, 'Injected target metadata must not change portable source/engine identity');
    assert.notEqual(variantIdentity.artifactId, receiptA.artifactId, 'Target receipt identities must stay distinct');
    assert.throws(() => releaseInvocation(variant, 'isswf-status', []), /target/u, 'Injected foreign-arch metadata is not native execution evidence');
    assert(!Object.keys(receiptA.files).some(path => /^(tests|tooling|\.audit)\//u.test(path)));
    const executableA = join(releaseA, manifest.bin.isswf);
    assert.equal(run(executableA, ['--version']).stdout.trim(), manifest.version);
    const externalSdk = join(temp, 'external-sdk'), externalDependency = join(externalSdk, 'node_modules/exported-dependency');
    await mkdir(externalDependency, { recursive: true });
    await writeFile(join(externalSdk, 'package.json'), JSON.stringify({ name: 'external-sdk', type: 'module', main: './entry.mjs', exports: { import: './entry.mjs', default: './entry.mjs' } }));
    await writeFile(join(externalDependency, 'package.json'), JSON.stringify({ name: 'exported-dependency', type: 'module', exports: { default: './value.mjs' } }));
    await writeFile(join(externalDependency, 'value.mjs'), 'export const value = 42;\n');
    await writeFile(join(externalSdk, 'entry.mjs'), "export { value } from 'exported-dependency';\n");
    const sdkProbe = join(temp, 'external-sdk-probe.mjs');
    await writeFile(sdkProbe, `import {createRequire} from 'node:module';
const require = createRequire(${JSON.stringify(join(externalSdk, 'package.json'))});
const sdk = require(${JSON.stringify(externalSdk)});
const imported = await import(${JSON.stringify(pathToFileURL(join(externalSdk, 'entry.mjs')).href)});
if (sdk.value !== 42 || imported.value !== 42) throw Error('External SDK exports differ');
console.log('PASS external SDK exports and transitive dependency');\n`);
    assert.equal(run(executableA, [sdkProbe]).stdout.trim(), 'PASS external SDK exports and transitive dependency');
    assert.equal(run(executableA, ['external-sdk-probe.mjs']).stdout.trim(), 'PASS external SDK exports and transitive dependency');
    const [installedResult] = await installation;
    if (installedResult.status === 'rejected') throw installedResult.reason;
    const installed = join(consumer, 'node_modules/isswf-pi-resources');
    assert.equal(verifyRelease(installed).runtimeId, receiptA.runtimeId);
    const executable = join(installed, manifest.bin.isswf);
    const restricted = join(temp, 'path'); await mkdir(restricted);
    await symlink(run('which', ['git']).stdout.trim(), join(restricted, 'git'));
    const noRuntime = { ...env, PATH: restricted };
    legacyCheck = Promise.allSettled([verifyLegacy(builder, revisionA, executable, noRuntime)]);
    await mkdir(project); run('git', ['init', '-q', project]);
    const cli = (command, args = [], ok = true, binary = executable) => run(binary, [command, '--project', project, '--store', store, ...args], ok, noRuntime);
    assert.equal(JSON.parse(cli('inspect').stdout).status, 'not-initialized');
    assert.deepEqual(await readdir(project), ['.git']);
    assert.equal(JSON.parse(cli('init', ['--tracking', 'local']).stdout).status, 'initialized');
    const located = JSON.parse(cli('locate').stdout);
    assert.equal(located.pin.revision, revisionA);
    assert.equal(located.pin.runtimeFormat, 2);
    assert.equal(located.runtimeRoot, join(store, 'releases', receiptA.runtimeId, `${process.platform}-${process.arch}`));
    assert.equal((await readFile(located.runtimeRoot + '.sha256', 'utf8')).trim(), receiptA.artifactId);
    assert.equal(JSON.parse(cli('exec', ['--', 'isswf-status', '--initiative', 'I0001']).stdout).status, 'absent');
    const plan = join(project, '.isswf/initiatives/I0001'); await mkdir(plan, { recursive: true });
    await writeFile(join(plan, 'plan.md'), '# I0001: Binary fixture\n\nType: research\n\n## J001\n\n- Status: pending\n- Objective: A fixture\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None\n- Next step: Read\n\n### Acceptance\n\n- One job\n\n### Evidence\n\n- Fixture\n');
    const observed = JSON.parse(cli('exec', ['--', 'isswf-status', '--initiative', 'I0001']).stdout);
    assert.equal(observed.status, 'observed'); assert.equal(observed.jobs.length, 1);
    run(executable, ['__tool', 'not-a-tool'], false, noRuntime);
    cli('inspect', ['--wrong', 'option'], false);
    const child = spawn(executable, ['__tool', 'isswf-panel', '--project', project, '--port', '0'], { env: noRuntime, stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      const origin = await new Promise((done, reject) => {
        const timer = setTimeout(() => { child.kill('SIGKILL'); reject(Error('Panel startup timed out')); }, 15000);
        let text = ''; child.stdout.on('data', chunk => { text += chunk; if (text.includes('\n')) { clearTimeout(timer); done(new URL(text.trim()).origin); } });
        child.once('error', reject); child.once('exit', code => { clearTimeout(timer); reject(Error('Panel exited ' + code)); });
      });
      const response = await fetch(origin + '/api/status/I0001'); assert.equal(response.status, 200); assert.equal((await response.json()).jobs.length, 1);
      assert.equal((await fetch(origin + '/api/status', { headers: { Origin: 'https://invalid.example' } })).status, 403);
    } finally {
      child.kill('SIGTERM'); await new Promise(done => { if (child.exitCode !== null) return done(); const timer = setTimeout(() => child.kill('SIGKILL'), 5000); child.once('exit', () => { clearTimeout(timer); done(); }); });
    }
    const [newerResult] = await newerBuild;
    if (newerResult.status === 'rejected') throw newerResult.reason;
    const executableB = join(releaseB, manifest.bin.isswf);
    const oldFromNew = JSON.parse(cli('exec', ['--', 'isswf-status', '--initiative', 'I0001'], true, executableB).stdout);
    assert(!oldFromNew.limits.includes('BINARY REVISION B'), 'New launcher must execute the pinned older executable');
    assert.equal(JSON.parse(cli('locate', [], true, executableB).stdout).pin.revision, revisionA);
    const selected = releaseInvocation(located.runtimeRoot, 'isswf-status', []); assert.equal(selected.command, join(located.runtimeRoot, manifest.bin.isswf));
    const originalPin = await readFile(join(project, '.isswf/install.json'));
    const checkpointProject = () => { run('git', ['-C', project, 'add', '.']); run('git', ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'Checkpoint binary migration fixture']); };
    checkpointProject();
    const preview = JSON.parse(cli('inspect', [], true, executableB).stdout);
    cli('migrate', ['--id', 'M0001', '--expected', preview.expected, '--quiescent-ref', 'synthetic-fixture-no-external-writers'], true, executableB);
    const newFromOld = JSON.parse(cli('exec', ['--', 'isswf-status', '--initiative', 'I0001']).stdout);
    assert(newFromOld.limits.includes('BINARY REVISION B'), 'Older launcher must execute the explicitly migrated newer pin');
    checkpointProject();
    cli('rollback', ['--id', 'M0001', '--quiescent-ref', 'synthetic-fixture-no-external-writers'], true, executableB);
    assert((await readFile(join(project, '.isswf/install.json'))).equals(originalPin));
    const pin = await readFile(join(project, '.isswf/install.json'));
    const retainedTool = join(located.runtimeRoot, 'tools/isswf-status.mjs');
    const saved = await readFile(retainedTool); await writeFile(retainedTool, Buffer.concat([saved, Buffer.from('\n')]));
    cli('exec', ['--', 'isswf-status', '--initiative', 'I0001'], false);
    await writeFile(retainedTool, saved); assert((await readFile(join(project, '.isswf/install.json'))).equals(pin));
    const retainedBinary = join(located.runtimeRoot, manifest.bin.isswf), retainedReceipt = join(located.runtimeRoot, '.isswf-release.json');
    const binaryBytes = await readFile(retainedBinary), receiptBytes = await readFile(retainedReceipt);
    const alteredBinary = Buffer.concat([binaryBytes, Buffer.from('injected-artifact-drift')]);
    const alteredReceipt = JSON.parse(receiptBytes); alteredReceipt.files[manifest.bin.isswf] = hash(alteredBinary);
    await writeFile(retainedBinary, alteredBinary); await chmod(retainedReceipt, 0o644); await writeFile(retainedReceipt, JSON.stringify(alteredReceipt, null, 2) + '\n');
    assert.equal(verifyRelease(located.runtimeRoot).runtimeId, receiptA.runtimeId);
    assert.match(cli('locate', [], false).stderr, /immutable local anchor/u, 'A self-consistent changed binary and receipt must not bypass the local artifact binding');
    await writeFile(retainedBinary, binaryBytes); await writeFile(retainedReceipt, receiptBytes); await chmod(retainedReceipt, 0o444);
    const [legacyResult] = await legacyCheck;
    if (legacyResult.status === 'rejected') throw legacyResult.reason;
    passed = true;
    if (process.env.ISSWF_KEEP_BUN_RELEASE === '1') console.log(JSON.stringify({ fixture: temp, revisionA, revisionB, runtimeId: receiptA.runtimeId, artifactId: receiptA.artifactId, executableSha256: receiptA.files[manifest.bin.isswf], target: manifest.isswfRuntime.target }));
    console.log('PASS Bun packed executable: standalone CLI/panel, exact pinned binary selection, migration/rollback, legacy Node refusal and integrity; no live provider or host execution');
  } finally {
    await Promise.all([installation, newerBuild, legacyCheck].filter(Boolean));
    if (passed && process.env.ISSWF_KEEP_BUN_RELEASE !== '1') await rm(temp, { recursive: true, force: true });
    else console.error((passed ? 'Retained verified Bun fixture: ' : 'Retained failing Bun fixture: ') + temp);
  }
}
