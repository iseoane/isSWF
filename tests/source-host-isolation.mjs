import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile, realpath, access } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
assert.ok(process.env.ISSWF_PLATFORM_ROOT, 'Run after platform-package in an isolated output directory');
const root = resolve(process.env.ISSWF_PLATFORM_ROOT);
const dependencies = join(source, 'tooling/host-tests/node_modules');
if (process.argv[3] === '--probe') {
  globalThis.fetch = () => { throw Error('Network fetch forbidden during discovery'); };
  const { DefaultResourceLoader } = await import(pathToFileURL(join(dependencies, '@earendil-works/pi-coding-agent/dist/index.js')).href);
  const loader = new DefaultResourceLoader({ cwd: process.cwd(), agentDir: process.env.PI_CODING_AGENT_DIR, noExtensions: true, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await loader.reload({ resolveProjectTrust: async () => process.argv[4] !== 'untrusted' });
  const { skills, diagnostics } = loader.getSkills();
  console.log(JSON.stringify({ skills: await Promise.all(skills.map(async skill => ({ name: skill.name, path: await realpath(skill.filePath) }))), diagnostics }));
} else {
  const report = JSON.parse(await readFile(join(root, 'platform-report.json'), 'utf8'));
  const base = join(root, 'source-isolation'), home = join(base, 'home'), project = join(base, 'source'), neighbour = join(base, 'neighbour'), unrelated = join(base, 'unrelated');
  await mkdir(base);
  for (const path of [home, project, neighbour, unrelated]) await mkdir(path);
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432', 'CLAUDE_CODE_GIT_BASH_PATH'].includes(key.toUpperCase())));
  const env = { ...inherited, HOME: home, USERPROFILE: home, APPDATA: join(home, 'AppData/Roaming'), LOCALAPPDATA: join(home, 'AppData/Local'), XDG_CONFIG_HOME: join(home, 'config'), XDG_DATA_HOME: join(home, 'data'), PI_CODING_AGENT_DIR: join(home, 'pi'), PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', CLAUDE_CONFIG_DIR: join(home, 'claude'), DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', ISSWF_PLATFORM_ROOT: root, GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  function run(binary, args, cwd = project, ok = true) {
    const result = spawnSync(binary, args, { cwd, env, encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
    assert.ifError(result.error);
    if (ok) assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
    else assert.notEqual(result.status, 0, 'Expected fail-closed configuration refusal');
    return result.stdout.trim();
  }
  const json = async path => JSON.parse(await readFile(path, 'utf8'));
  const writeJSON = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
  for (const target of [project, neighbour]) run('git', ['init', '-q', target]);
  for (const path of ['package.json', '.agents/skills', '.claude-plugin', 'skills', '.claude/settings.json']) {
    await cp(join(source, path), join(project, path), { recursive: true });
  }
  const pluginManifest = await json(join(project, '.claude-plugin/plugin.json'));
  pluginManifest.description = 'isolated-source-fixture';
  await writeJSON(join(project, '.claude-plugin/plugin.json'), pluginManifest);
  await mkdir(join(unrelated, 'skills/unrelated-fixture'), { recursive: true });
  await writeFile(join(unrelated, 'skills/unrelated-fixture/SKILL.md'), '---\nname: unrelated-fixture\ndescription: A controlled unrelated resource.\n---\n# Fixture\n');
  await writeJSON(join(unrelated, 'package.json'), { name: 'unrelated-fixture', pi: { skills: ['./skills/unrelated-fixture'] } });
  await mkdir(join(unrelated, '.claude-plugin'));
  await writeJSON(join(unrelated, '.claude-plugin/plugin.json'), { name: 'unrelated-fixture', description: 'Unrelated fixture', version: '0.0.0', skills: ['./skills/unrelated-fixture'] });
  await writeJSON(join(unrelated, '.claude-plugin/marketplace.json'), { name: 'isolation-test', owner: { name: 'Fixture' }, plugins: [{ name: 'unrelated-fixture', source: './', description: 'Unrelated fixture', version: '0.0.0' }] });
  const piRoot = join(dependencies, '@earendil-works/pi-coding-agent');
  const piCli = join(piRoot, (await json(join(piRoot, 'package.json'))).bin.pi);
  for (const path of [report.installed, unrelated]) run(process.execPath, [piCli, 'install', path], neighbour);
  const globalPi = await readFile(join(home, 'pi/settings.json'));
  const probe = (cwd, untrusted = false) => JSON.parse(run(process.execPath, [join(source, 'tests/source-host-isolation.mjs'), source, '--probe', ...(untrusted ? ['untrusted'] : [])], cwd));
  const baseline = probe(project);
  assert.ok(baseline.diagnostics.length > 0, 'Without filtering, source and installed skills must collide');
  await mkdir(join(project, '.pi'));
  const settingsPath = join(project, '.pi/settings.json');
  await writeJSON(settingsPath, { defaultThinkingLevel: 'low', packages: [] });
  const original = await readFile(settingsPath);
  const helper = [join(source, 'tooling/maintenance/source-host-isolation.mjs'), '--project', project];
  assert.equal(JSON.parse(run(process.execPath, helper)).status, 'preview');
  assert.deepEqual(await readFile(settingsPath), original, 'Preview must not write');
  assert.equal(JSON.parse(run(process.execPath, [...helper, '--apply'])).status, 'configured');
  assert.equal((await json(settingsPath)).defaultThinkingLevel, 'low');
  const configured = await readFile(settingsPath);
  assert.equal(JSON.parse(run(process.execPath, [...helper, '--apply'])).status, 'unchanged');
  assert.deepEqual(await readFile(settingsPath), configured, 'Repeat must be byte-identical');
  const isolated = probe(project);
  assert.deepEqual(isolated.diagnostics, []);
  assert.equal(isolated.skills.filter(skill => skill.name.startsWith('isswf-')).length, 15, 'All fifteen source skills, including source-only triage, remain available');
  const sourcePrefix = await realpath(join(project, '.agents/skills'));
  for (const skill of isolated.skills.filter(skill => skill.name.startsWith('isswf-'))) assert.ok(skill.path.startsWith(sourcePrefix));
  assert.ok(isolated.skills.some(skill => skill.name === 'unrelated-fixture'));
  for (const observed of [probe(neighbour), probe(project, true)]) {
    assert.deepEqual(observed.diagnostics, []);
    assert.equal(observed.skills.filter(skill => skill.name.startsWith('isswf-')).length, 14);
    assert.ok(observed.skills.some(skill => skill.name === 'unrelated-fixture'));
  }
  assert.deepEqual(await readFile(join(home, 'pi/settings.json')), globalPi, 'User settings remain unchanged');
  await writeFile(settingsPath, '{"packages":');
  run(process.execPath, [...helper, '--apply'], project, false);
  assert.equal(await readFile(settingsPath, 'utf8'), '{"packages":');
  await writeFile(settingsPath, configured);
  await writeJSON(settingsPath, { packages: [relative(join(project, '.pi'), report.installed)] });
  const conflicting = await readFile(settingsPath);
  run(process.execPath, [...helper, '--apply'], project, false);
  assert.deepEqual(await readFile(settingsPath), conflicting, 'Explicit project package choices must not be overwritten');
  await writeFile(settingsPath, configured);
  const canary = join(base, 'unexpected-command');
  await writeJSON(join(home, 'pi/settings.json'), { ...JSON.parse(globalPi.toString('utf8')), npmCommand: [process.execPath, '-e', `require('node:fs').writeFileSync(${JSON.stringify(canary)}, 'unexpected')`] });
  run(process.execPath, [...helper, '--apply'], project, false);
  await assert.rejects(access(canary), { code: 'ENOENT' });
  await writeFile(join(home, 'pi/settings.json'), globalPi);
  run(process.execPath, [join(source, 'tooling/maintenance/source-host-isolation.mjs'), '--project', neighbour, '--apply'], neighbour, false);
  await assert.rejects(access(join(neighbour, '.pi/settings.json')), { code: 'ENOENT' });
  const claude = join(dependencies, `@anthropic-ai/claude-code-${process.platform}-${process.arch}`, process.platform === 'win32' ? 'claude.exe' : 'claude');
  for (const [path, id] of [[report.installed, 'isswf@isswf'], [unrelated, 'unrelated-fixture@isolation-test']]) {
    run(claude, ['plugin', 'marketplace', 'add', path, '--json'], neighbour);
    run(claude, ['plugin', 'install', id, '--scope', 'user', '--json'], neighbour);
  }
  const globalClaude = await readFile(join(home, 'claude/settings.json'));
  const pluginState = cwd => JSON.parse(run(claude, ['plugin', 'list', '--json'], cwd));
  assert.equal(pluginState(project).find(plugin => plugin.id === 'isswf@isswf').enabled, false);
  assert.equal(pluginState(neighbour).find(plugin => plugin.id === 'isswf@isswf').enabled, true);
  for (const cwd of [project, neighbour]) assert.equal(pluginState(cwd).find(plugin => plugin.id === 'unrelated-fixture@isolation-test').enabled, true);
  const inline = run(claude, ['--plugin-dir', project, 'plugin', 'details', 'isswf']);
  assert.match(inline, /Source: isswf@inline/u);
  assert.match(inline, /Description: isolated-source-fixture/u);
  assert.match(inline, /Skills \(14\)/u);
  assert.deepEqual(await readFile(join(home, 'claude/settings.json')), globalClaude);
  const result = { status: 'PASS', platform: process.platform, revision: report.revision, checks: ['Pi collision positive control', 'Pi preview and byte-idempotent local filtering', 'fifteen source skills and unrelated skills preserved', 'neighbour and untrusted scopes unchanged', 'malformed, conflicting and non-source target refusal', 'custom package-manager command never executed', 'Claude shared project disable', 'Claude explicit inline source discovery', 'unrelated plugin and user settings preserved'], limits: 'Native resource selection only, no model prompts or delegation. Project trust and explicit overrides remain host-controlled; not a sandbox.' };
  await writeJSON(join(root, 'source-isolation-report.json'), result);
  console.log(JSON.stringify(result, null, 2));
}
