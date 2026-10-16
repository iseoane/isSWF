#!/usr/bin/env node
import { readFile, writeFile, readdir, mkdir, cp, lstat } from 'node:fs/promises';
import { join, resolve, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const proof = JSON.parse(await readFile(process.argv[2], 'utf8'));
const destination = resolve(process.argv[3]);
if (proof.status !== 'PASS' || proof.offlineWorkerProviderPromptStarted !== false || !/^isswf-effects68-/.test(basename(proof.root)) || !/^isswf-operational44-/.test(basename(proof.operationalRoot)) || !basename(destination).startsWith('recovery-68-effects-portable-')) throw Error('owned successful fixture and new portable destination required');
await mkdir(destination);
const excluded = new Set(['runtime']);
for (const name of await readdir(proof.root)) {
  if (excluded.has(name)) continue;
  const path = join(proof.root, name), stat = await lstat(path);
  if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw Error('unexpected fixture entry');
  await cp(path, join(destination, 'fixture', name), { recursive: true });
}
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const project = join(proof.operationalRoot, 'project');
git(project, 'bundle', 'create', join(destination, 'project-history.bundle'), '--all');
git(project, 'bundle', 'verify', join(destination, 'project-history.bundle'));
const binding = JSON.parse(await readFile(join(proof.operationalRoot, 'runs/effects-A001.job.json'), 'utf8'));
const runtime = join(proof.operationalRoot, 'source');
if (git(runtime, 'rev-parse', 'HEAD') !== binding.runtimeSha) throw Error('synthetic runtime HEAD mismatch');
const prerequisite = git(runtime, 'rev-parse', 'HEAD^');
git(runtime, 'bundle', 'create', join(destination, 'runtime-increment.bundle'), 'HEAD', '^' + prerequisite);
git(runtime, 'bundle', 'verify', join(destination, 'runtime-increment.bundle'));
await cp(join(proof.operationalRoot, 'runs/effects'), join(destination, 'public-cli-effects'), { recursive: true });
for (const name of ['effects-A001.job.json', 'effects-A001/dispatch.json', 'effects-A001/terminal.json', 'effects-A001/pi-result.json']) await cp(join(proof.operationalRoot, 'runs', name), join(destination, 'binding', name), { recursive: true });
await writeFile(join(destination, 'git-pins.json'), JSON.stringify({ runtimeSha: binding.runtimeSha, inputSha: binding.inputSha, targetBase: binding.targetBase, runtimeBundlePrerequisite: prerequisite, bundlesVerified: true, scope: 'fake transport fixture; historical absolute paths are references, not portable launch arguments' }, null, 2) + '\n');
const files = {};
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files[relative(destination, path)] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
}
await walk(destination);
await writeFile(join(destination, 'manifest.json'), JSON.stringify({ files, transport: 'fake-gh fixture', offlineWorkerProviderPromptStarted: false, kernelNetworkExclusionClaimed: false }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', destination, files: Object.keys(files).length, bundlesVerified: true }));
