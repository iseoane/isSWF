import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = await mkdtemp(join(tmpdir(), 'isswf-activation44-'));
const project = join(root, 'project');
const store = join(root, 'shared');
await mkdir(join(project, '.pi'), { recursive: true });
await mkdir(join(project, '.factory', 'jobs', 'J501'), { recursive: true });
await mkdir(store);
const files = {
  'AGENTS.md': '# Existing project instructions\n\nKeep this file unchanged.\n',
  '.pi/settings.json': JSON.stringify({ theme: 'existing-theme', packages: [], retry: { enabled: false }, customProjectChoice: { retain: true } }, null, 2) + '\n',
  '.factory/models.json': JSON.stringify({ schemaVersion: 1, roles: { researcher: [{ model: 'openai-codex/gpt-6-luna', effort: 'medium' }] } }, null, 2) + '\n',
  '.factory/jobs/J501/A001.md': '# Historical attempt\n\nPinned input remains unchanged. This fixture record is not process-liveness evidence.\n',
};
for (const [path, bytes] of Object.entries(files)) await writeFile(join(project, path), bytes);
const baseline = Object.fromEntries(await Promise.all(Object.keys(files).map(async path => [path, createHash('sha256').update(await readFile(join(project, path))).digest('hex')])));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const git = args => execFileSync('git', args, { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
git(['init', '-q']);
git(['add', '--', ...Object.keys(files)]);
git(['-c', 'user.name=Factory fixture', '-c', 'user.email=fixture@invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Seed preservation fixture']);
const targetCommit = git(['rev-parse', 'HEAD']).trim();
console.log(JSON.stringify({ root, project, store, sourceCommit, targetCommit, baseline, scope: 'Owned disposable preservation fixture only. Local seed checkpoint; no installation, activation, process state or provider call performed.' }, null, 2));
