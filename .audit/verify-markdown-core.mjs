import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const candidate = resolve(process.argv[2] || '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-markdown-proof-'));
const project = join(root, 'project');
const home = join(root, 'home');
const agentDir = join(root, 'agent');
const files = [];
const checkedLinks = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${path}`);
    if (entry.isDirectory()) await scan(path);
    else if (entry.name.endsWith('.md')) files.push(path);
  }
}

try {
  await Promise.all([mkdir(project), mkdir(home), mkdir(agentDir)]);
  await cp(join(candidate, '.agents'), join(project, '.agents'), { recursive: true });
  await writeFile(join(agentDir, 'settings.json'), '{}\n');
  await scan(join(project, '.agents'));
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.equal(/[\t ]+$/mu.test(text), false, `trailing whitespace: ${file}`);
    if (basename(file) === 'SKILL.md') {
      assert.match(text, /^---\nname: [a-z0-9-]+\ndescription: .+\n---\n/u, file);
      assert.equal(text.match(/^name: (.+)$/mu)?.[1], basename(dirname(file)));
    }
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const link = match[1];
      if (/^[a-z]+:/iu.test(link) || link.startsWith('#')) continue;
      const target = resolve(dirname(file), link.split('#')[0]);
      await readFile(target);
      checkedLinks.push({ file: file.slice(project.length + 1), link });
    }
  }
  const env = {
    PATH: process.env.PATH,
    HOME: home,
    PI_CODING_AGENT_DIR: agentDir,
    PI_OFFLINE: '1',
    PI_SKIP_VERSION_CHECK: '1',
    PI_TELEMETRY: '0',
    LANG: process.env.LANG || 'C.UTF-8',
  };
  const catalogs = [];
  for (const approved of [true, false]) {
    const result = spawnSync('pi', ['--mode', 'rpc', '--no-session', '--offline', '--no-mcp', approved ? '--approve' : '--no-approve'], {
      cwd: project, env, input: '{"id":"catalog","type":"get_commands"}\n', encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const records = result.stdout.split(/\r?\n/u).filter(Boolean).map(line => JSON.parse(line));
    const response = records.find(record => record.id === 'catalog' && record.type === 'response');
    assert.equal(response?.success, true, result.stdout);
    const coordinator = response.data.commands.filter(command => command.name === 'skill:isswf-coordinator');
    assert.equal(coordinator.length, approved ? 1 : 0);
    if (approved) assert.equal(coordinator[0].sourceInfo.path, join(project, '.agents/skills/isswf-coordinator/SKILL.md'));
    assert.equal(response.data.commands.some(command => command.name === 'skill:worker'), false);
    catalogs.push({ approved, coordinatorCount: coordinator.length });
  }
  console.log(JSON.stringify({ candidate, files: files.map(file => file.slice(project.length + 1)), checkedLinks, catalogs, scope: 'Native Pi skill discovery and Markdown links only; no LLM, dispatch, Python, host config, or operational store.', cleanup: 'Temporary directory removed in finally.' }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
