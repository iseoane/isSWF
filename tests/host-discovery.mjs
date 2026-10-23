import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
assert.ok(process.env.ISSWF_PLATFORM_ROOT, 'Set ISSWF_PLATFORM_ROOT to the platform-package test output');
const root = resolve(process.env.ISSWF_PLATFORM_ROOT);
const expected = ['isswf-coordinator', 'isswf-issue', 'isswf-pr', 'isswf-setup', 'isswf-understanding', 'isswf-writing'];
const dependencies = join(source, 'tooling/host-tests/node_modules');
const piRoot = join(dependencies, '@earendil-works/pi-coding-agent');
const report = JSON.parse(await readFile(join(root, 'platform-report.json'), 'utf8'));
const installed = report.installed;

if (process.argv[3] === '--pi-loader') {
  globalThis.fetch = () => { throw Error('Network fetch forbidden during Pi resource discovery'); };
  const { DefaultResourceLoader } = await import(pathToFileURL(join(piRoot, 'dist/index.js')).href);
  const loader = new DefaultResourceLoader({ cwd: process.cwd(), agentDir: process.env.PI_CODING_AGENT_DIR, noExtensions: true, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await loader.reload({ resolveProjectTrust: async () => true });
  const { skills, diagnostics } = loader.getSkills();
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(skills.map(skill => skill.name).sort(), process.argv[4] === 'empty' ? [] : expected);
  for (const skill of skills) {
    const canonical = await realpath(skill.filePath);
    assert.ok(canonical.startsWith(await realpath(installed) + (process.platform === 'win32' ? '\\' : '/')), 'Discovered skills must come from the installed package');
    assert.equal(await readFile(canonical, 'utf8'), await readFile(join(installed, '.agents/skills', skill.name, 'SKILL.md'), 'utf8'));
  }
  console.log(JSON.stringify({ skills: skills.map(skill => skill.name).sort(), source: 'Pi DefaultResourceLoader from registered package settings; no additional skill paths or overrides' }));
} else {
  const hosts = join(root, 'hosts');
  await mkdir(hosts);
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432', 'CLAUDE_CODE_GIT_BASH_PATH'].includes(key.toUpperCase())));
  function environment(home) {
    return { ...inherited, HOME: home, USERPROFILE: home, APPDATA: join(home, 'AppData/Roaming'), LOCALAPPDATA: join(home, 'AppData/Local'), XDG_CONFIG_HOME: join(home, 'config'), XDG_DATA_HOME: join(home, 'data'), CLAUDE_CONFIG_DIR: join(home, 'claude'), PI_CODING_AGENT_DIR: join(home, 'pi'), PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', ISSWF_PLATFORM_ROOT: root, GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  }
  function run(binary, args, home) {
    const result = spawnSync(binary, args, { cwd: home, env: environment(home), encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
    return result.stdout.trim();
  }
  const piManifest = JSON.parse(await readFile(join(piRoot, 'package.json'), 'utf8'));
  assert.equal(piManifest.version, '1.4.0');
  const piCli = join(piRoot, piManifest.bin.pi);
  const piResults = [];
  for (const local of [false, true]) {
    const home = join(hosts, local ? 'pi-project' : 'pi-user');
    await mkdir(home);
    run('git', ['init', '-q', home], home);
    assert.equal(run(process.execPath, [piCli, '--version'], home), piManifest.version);
    const probe = [join(source, 'tests/host-discovery.mjs'), source, '--pi-loader'];
    assert.deepEqual(JSON.parse(run(process.execPath, [...probe, 'empty'], home)).skills, []);
    run(process.execPath, [piCli, 'install', installed, ...(local ? ['--local'] : [])], home);
    const settings = JSON.parse(await readFile(join(home, local ? '.pi' : 'pi', 'settings.json'), 'utf8'));
    assert.equal(settings.packages.length, 1);
    const discovered = JSON.parse(run(process.execPath, probe, home));
    assert.deepEqual(discovered.skills, expected);
    piResults.push({ scope: local ? 'project' : 'user', skills: discovered.skills });
  }
  const claudeVersion = '2.1.299';
  const claude = join(dependencies, `@anthropic-ai/claude-code-${process.platform}-${process.arch}`, process.platform === 'win32' ? 'claude.exe' : 'claude');
  const home = join(hosts, 'claude-user');
  await mkdir(home);
  assert.match(run(claude, ['--version'], home), new RegExp('^' + claudeVersion.replaceAll('.', '\\.') + ' '));
  const before = JSON.parse(run(claude, ['plugin', 'list', '--json'], home));
  assert.deepEqual(before, [], 'Isolated Claude configuration starts without installed plugins');
  const added = JSON.parse(run(claude, ['plugin', 'marketplace', 'add', installed, '--json'], home));
  assert.equal(added.outcome, 'ok');
  const installation = JSON.parse(run(claude, ['plugin', 'install', 'isswf@isswf', '--scope', 'user', '--json'], home));
  assert.equal(installation.outcome, 'ok');
  const plugins = JSON.parse(run(claude, ['plugin', 'list', '--json'], home));
  const plugin = plugins.find(entry => entry.id === 'isswf@isswf');
  assert.ok(plugin?.enabled);
  assert.equal(plugin.version, report.version);
  assert.equal(await realpath(plugin.readFromFolder), await realpath(installed), 'Claude inventory must bind to the installed artifact');
  const inventory = run(claude, ['plugin', 'details', 'isswf'], home);
  const skillLine = inventory.match(/^\s*Skills \((\d+)\)\s+(.+)$/mu);
  assert.ok(skillLine, 'Claude must report its actual skill component inventory');
  assert.equal(Number(skillLine[1]), expected.length);
  assert.deepEqual(skillLine[2].split(',').map(name => name.trim()).sort(), expected);
  await writeFile(join(root, 'claude-inventory.txt'), inventory + '\n');
  const result = { status: 'PASS', platform: process.platform, arch: process.arch, revision: report.revision, version: report.version, pi: { version: piManifest.version, scopes: piResults }, claude: { version: claudeVersion, plugin: plugin.id, skills: expected }, limits: 'Actual host package installation and discovery only. No model prompts, sessions, authentication or provider credentials supplied. Disabling telemetry is not proof of operating-system network isolation. No live task/delegation or Windows worker/sandbox equivalence claimed.' };
  await writeFile(join(root, 'host-report.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
