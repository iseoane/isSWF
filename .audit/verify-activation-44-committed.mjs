import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const revision = process.argv[2];
assert.match(revision ?? '', /^[0-9a-f]{40}$/u);
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 2000000, ...options });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const source = run('git', ['rev-parse', '--show-toplevel']).trim();
const cli = join(source, 'tools/factory-package.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(fs.readFileSync(cli)), sha(run('git', ['show', `${revision}:tools/factory-package.mjs`])));
const fixture = JSON.parse(run(process.execPath, ['.audit/prepare-activation-44-fixture.mjs']));
const packageRoot = join(fixture.store, revision);
run(process.execPath, [cli, 'materialize', '--source', source, '--revision', revision, '--store', fixture.store]);
const receipt = JSON.parse(fs.readFileSync(join(packageRoot, '.isswf-package-receipt.json')));
assert.equal(receipt.revision, revision);
for (const [path, digest] of Object.entries(receipt.files)) {
  assert.equal(sha(fs.readFileSync(join(packageRoot, path))), digest);
  assert.equal(sha(run('git', ['show', `${revision}:${path}`])), digest);
}
const protectedPaths = ['AGENTS.md', '.factory/models.json', '.factory/jobs/J501/A001.md'];
run(process.execPath, [cli, 'activate', '--package', packageRoot, '--project', fixture.project]);
const settingsPath = join(fixture.project, '.pi/settings.json');
const bytes = fs.readFileSync(settingsPath);
assert.deepEqual(JSON.parse(bytes), { theme: 'existing-theme', packages: [packageRoot], retry: { enabled: false }, customProjectChoice: { retain: true } });
run(process.execPath, [cli, 'activate', '--package', packageRoot, '--project', fixture.project]);
assert.deepEqual(fs.readFileSync(settingsPath), bytes);
const home = join(fixture.root, 'pi-home'), agentDir = join(fixture.root, 'pi-agent');
fs.mkdirSync(home); fs.mkdirSync(agentDir);
fs.writeFileSync(join(agentDir, 'settings.json'), '{}\n');
const env = { PATH: process.env.PATH, HOME: home, PI_CODING_AGENT_DIR: agentDir, PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0', LANG: 'C.UTF-8' };
const catalogs = [];
for (const approved of [true, false]) {
  const output = run('pi', ['--mode', 'rpc', '--no-session', '--offline', '--no-mcp', approved ? '--approve' : '--no-approve'], { cwd: fixture.project, env, input: '{"id":"catalog","type":"get_commands"}\n' });
  const response = output.trim().split('\n').map(JSON.parse).find(item => item.id === 'catalog' && item.type === 'response');
  assert.equal(response?.success, true);
  const selected = response.data.commands.filter(item => ['skill:isswf-coordinator', 'skill:isswf-setup'].includes(item.name));
  assert.equal(selected.length, approved ? 2 : 0);
  for (const item of selected) assert.equal(item.sourceInfo.path, join(packageRoot, '.agents/skills', item.name.slice(6), 'SKILL.md'));
  catalogs.push({ approved, skills: selected.map(item => ({ name: item.name, path: item.sourceInfo.path })) });
}
for (const path of protectedPaths) assert.equal(sha(fs.readFileSync(join(fixture.project, path))), fixture.baseline[path]);
console.log(JSON.stringify({ result: 'PASS', source, revision, cliSha256: sha(fs.readFileSync(cli)), fixture, packageRoot: resolve(packageRoot), payloadVerifiedAgainstActualCommit: Object.keys(receipt.files).length, settingsRepeatBytesUnchanged: true, protectedFilesUnchanged: protectedPaths, catalogs, scope: 'Actual committed source installation and isolated offline Pi discovery only; no provider, runtime role execution or client readiness.' }, null, 2));
