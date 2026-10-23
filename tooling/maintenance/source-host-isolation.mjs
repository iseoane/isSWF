import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, realpath, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const factory = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let project = factory, apply = false;
for (let index = 2; index < process.argv.length; index++) {
  if (process.argv[index] === '--apply') apply = true;
  else if (process.argv[index] === '--project' && process.argv[index + 1]) project = resolve(process.argv[++index]);
  else throw Error('Usage: node tooling/maintenance/source-host-isolation.mjs [--project ABS_SOURCE_CHECKOUT] [--apply]');
}
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
async function optional(path, directory = false) {
  try {
    const info = await lstat(path);
    assert.ok(!info.isSymbolicLink() && (directory ? info.isDirectory() : info.isFile() && info.size <= 1024 * 1024), 'Regular bounded configuration path required: ' + path);
    return directory ? info : { bytes: await readFile(path), mode: info.mode & 0o777 };
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
project = await realpath(project);
const git = spawnSync('git', ['-C', project, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10000 });
assert.ifError(git.error);
assert.equal(git.status, 0, git.stderr);
assert.equal(await realpath(git.stdout.trim()), project, 'A source Git root is required');
assert.equal(await optional(join(project, '.isswf-release.json')), null, 'Do not configure an installed runtime as a source checkout');
const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
assert.equal(manifest.name, 'isswf-pi-resources', 'This helper is only for the factory source repository');
await optional(join(project, '.pi'), true);
const path = join(project, '.pi/settings.json');
const original = await optional(path);
const settings = original ? JSON.parse(original.bytes.toString('utf8')) : {};
assert.ok(plain(settings) && (settings.packages === undefined || Array.isArray(settings.packages)), 'Malformed project settings; reconcile manually');
const sdkPath = join(factory, 'tooling/host-tests/node_modules/@earendil-works/pi-coding-agent');
const sdkManifest = JSON.parse(await readFile(join(sdkPath, 'package.json'), 'utf8'));
assert.equal(sdkManifest.version, '1.4.0', 'Install the locked tooling/host-tests dependencies first');
const { DefaultPackageManager, SettingsManager } = await import(pathToFileURL(join(sdkPath, 'dist/index.js')).href);
const agentDir = resolve(process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi/agent'));
const managerSettings = SettingsManager.create(project, agentDir);
assert.deepEqual(managerSettings.drainErrors(), [], 'Invalid host settings; no automatic repair');
const npmCommand = managerSettings.getNpmCommand();
assert.ok(npmCommand === undefined || JSON.stringify(npmCommand) === '["npm"]', 'Custom package-manager commands require manual review; no configuration-supplied command will be executed');
const manager = new DefaultPackageManager({ cwd: project, agentDir, settingsManager: managerSettings });
const packages = [...(settings.packages || [])];
const configured = manager.listConfiguredPackages();
const added = [];
for (const pkg of configured.filter(entry => entry.scope === 'user' && entry.installedPath)) {
  const installed = pkg.installedPath;
  if (await realpath(installed) === project) continue;
  const packageManifest = await optional(join(installed, 'package.json'));
  if (!packageManifest || JSON.parse(packageManifest.bytes.toString('utf8')).name !== manifest.name) continue;
  const aliases = [];
  for (const entry of configured.filter(entry => entry.scope === 'project' && entry.installedPath)) {
    if (await realpath(entry.installedPath) === await realpath(installed)) aliases.push(entry.source);
  }
  const existing = packages.filter(entry => aliases.includes(typeof entry === 'string' ? entry : entry?.source) || (typeof entry === 'string' ? entry : entry?.source) === installed);
  if (existing.length) {
    for (const entry of existing) assert.ok(plain(entry) && Object.keys(entry).sort().join(',') === 'autoload,skills,source' && entry.autoload === false && JSON.stringify(entry.skills) === '["!**"]', 'Conflicting project package choice; reconcile manually');
    continue;
  }
  packages.push({ source: installed, autoload: false, skills: ['!**'] });
  added.push(installed);
}
if (added.length && apply) {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });
  await optional(directory, true);
  const lock = join(directory, '.isswf-source-isolation.lock');
  await mkdir(lock);
  const temporary = join(directory, '.isswf-source-isolation-' + randomUUID() + '.json');
  try {
    const current = await optional(path);
    assert.equal(current?.bytes.toString('base64'), original?.bytes.toString('base64'), 'Project settings changed during inspection');
    await writeFile(temporary, JSON.stringify({ ...settings, packages }, null, 2) + '\n', { flag: 'wx', mode: original?.mode ?? 0o600 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true });
  }
}
console.log(JSON.stringify({ status: added.length ? apply ? 'configured' : 'preview' : 'unchanged', addedFilters: added.length, writes: apply && added.length > 0, scope: 'source checkout only; no global settings, providers or package installation changed', limits: 'Re-run after installing a new release location. Project trust is required. Explicit local overrides can supersede policy; this is resource selection, not a sandbox.' }));
