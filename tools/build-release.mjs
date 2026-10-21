#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseReceiptName, verifyRelease } from './release-source.mjs';
import { canonicalPath } from './factory-package.mjs';

const legacyMethodologySha = '37a56ebc902e94f21fc10666f33fceac44946af7';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const blobOid = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const shaPattern = /^[a-f0-9]{40}$/u;
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isWithin = (parent, child) => { const part = relative(parent, child); return part === '' || (!part.startsWith(`..${sep}`) && part !== '..'); };
function fail(message) { throw new Error(message); }
function runGit(source, args) {
  const result = spawnSync('git', ['-C', source, ...args], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024, timeout: 30_000 });
  if (result.error || result.status !== 0) fail(`git ${args.join(' ')} failed: ${result.error?.message ?? result.stderr?.toString().slice(0, 1200) ?? result.status}`);
  return result.stdout;
}
const historicalMethodProfiles = [
  '.agents/roles/worker.md',
  '.agents/roles/planner.md',
  '.agents/roles/reviewer.md',
  '.agents/roles/diagnostician.md',
  '.agents/roles/references/bug-diagnosis.md',
  '.agents/roles/references/tdd.md',
  '.agents/roles/references/design-principles.md',
  '.agents/roles/references/execution-principles.md',
  '.agents/roles/references/verification-principles.md',
  '.agents/roles/references/code-quality.md',
  '.agents/roles/references/comments.md',
  '.agents/roles/references/planning.md',
  '.agents/roles/references/review.md',
  'docs/durable-work.md',
];
const fixedInventoryPaths = [
  'package.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.agents/hosts/claude-code.md',
  '.agents/skills/isswf-coordinator/SKILL.md',
  '.agents/skills/isswf-setup/SKILL.md',
  'skills/isswf-setup/SKILL.md',
  'skills/isswf-coordinator/SKILL.md',
  'docs/durable-work.md',
  'docs/model-routing.md',
  'docs/host-portability.md',
  'docs/installation.md',
  'docs/source-activation.md',
  'docs/local-worker-lifecycle.md',
  'docs/issue-intake.md',
  '.factory/models.json',
];
function isInventoryPath(path) {
  if (fixedInventoryPaths.includes(path)) return true;
  if (path === 'tools/check-quality.mjs') return false;
  if (path.startsWith('tools/') && path.endsWith('.mjs') && !path.slice('tools/'.length).includes('/')) return true;
  if (path.startsWith('agents/') && path.endsWith('.md')) return true;
  if (path.startsWith('skills/')) return true;
  if (path.startsWith('.agents/roles/')) return true;
  if (path.startsWith('.factory/templates/') && path.endsWith('.md')) return true;
  return false;
}
function isSourcePath(path) {
  if (path.startsWith('tools/') && path.endsWith('.mjs') && !path.slice('tools/'.length).includes('/')) return true;
  if (path.startsWith('.agents/roles/') || path.startsWith('agents/')) return true;
  if (path.startsWith('skills/')) return true;
  if (['.agents/hosts/claude-code.md', '.agents/skills/isswf-coordinator/SKILL.md', '.agents/skills/isswf-setup/SKILL.md', 'docs/durable-work.md', 'docs/model-routing.md', 'docs/host-portability.md'].includes(path)) return true;
  return false;
}
function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!['--source', '--revision', '--output'].includes(key) || !argv[index + 1] || argv[index + 1].startsWith('--') || Object.hasOwn(options, key)) fail(`Invalid or duplicate option: ${key ?? ''}`);
    options[key] = argv[index + 1];
  }
  for (const key of ['--source', '--revision', '--output']) if (!options[key]) fail(`Missing required option: ${key}`);
  return options;
}
function treeEntries(source, revision) {
  const tree = runGit(source, ['ls-tree', '-rz', '--full-tree', revision]).toString().split('\0').filter(Boolean);
  const entries = new Map();
  for (const entry of tree) {
    const tab = entry.indexOf('\t');
    const [mode, type, object] = entry.slice(0, tab).split(' ');
    entries.set(entry.slice(tab + 1), { mode, type, object });
  }
  return entries;
}
function committedBlob(source, entries, revision, path) {
  const entry = entries.get(path);
  if (!entry || entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) fail(`Required path is missing or is not a regular committed file: ${path} @ ${revision}`);
  return runGit(source, ['cat-file', 'blob', entry.object]);
}
function validateManifest(bytes) {
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); }
  catch { fail('The committed package.json is not valid JSON'); }
  if (
    !plainObject(manifest) ||
    Object.keys(manifest).sort().join(',') !== 'bin,description,files,keywords,name,pi,version' ||
    manifest.name !== 'isswf-pi-resources' ||
    !/^\d+\.\d+\.\d+$/u.test(manifest.version ?? '') ||
    typeof manifest.description !== 'string' ||
    JSON.stringify(manifest.bin) !== JSON.stringify({ isswf: 'tools/isswf.mjs' }) ||
    JSON.stringify(manifest.keywords) !== JSON.stringify(['pi-package']) ||
    JSON.stringify(manifest.pi) !== JSON.stringify({ skills: ['./.agents/skills/isswf-coordinator', './.agents/skills/isswf-setup'] }) ||
    Object.hasOwn(manifest, 'dependencies') ||
    Object.hasOwn(manifest, 'devDependencies') ||
    Object.hasOwn(manifest, 'scripts')
  ) fail('The committed package.json does not match the release package contract');
  return manifest;
}
async function build({ '--source': source, '--revision': revision, '--output': output }) {
  if (!isAbsolute(source) || !isAbsolute(output)) fail('--source and --output must be absolute paths');
  if (!shaPattern.test(revision)) fail('--revision must be a full lowercase Git SHA');
  const sourceRoot = await realpath(source);
  if (runGit(sourceRoot, ['rev-parse', '--show-toplevel']).toString().trim() !== sourceRoot) fail('Source must be a Git root');
  if (runGit(sourceRoot, ['rev-parse', '--verify', `${revision}^{commit}`]).toString().trim() !== revision) fail('Git did not resolve the exact requested full revision');
  const outputRoot = await canonicalPath(output);
  try { await lstat(outputRoot); fail(`--output must be absent: ${outputRoot}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (isWithin(sourceRoot, outputRoot) || isWithin(outputRoot, sourceRoot)) fail('The source repository and release output must be separate trees');
  const entries = treeEntries(sourceRoot, revision);
  const inventory = new Map();
  for (const [path, entry] of entries) {
    if (!isInventoryPath(path)) continue;
    if (entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) fail(`Release path is not a regular committed blob: ${path}`);
    inventory.set(path, { bytes: committedBlob(sourceRoot, entries, revision, path), oid: entry.object, mode: entry.mode });
  }
  const manifest = validateManifest(inventory.get('package.json')?.bytes ?? fail('Required path is missing or is not a regular committed file: package.json'));
  if (!inventory.has('tools/isswf.mjs')) fail('The release bin target tools/isswf.mjs must be committed');
  const plugin = JSON.parse(inventory.get('.claude-plugin/plugin.json').bytes.toString('utf8'));
  if (plugin.version !== manifest.version) fail('Pi package, core and plugin must share one release version');
  for (const path of fixedInventoryPaths) if (!inventory.has(path)) fail(`Required release path is missing: ${path}`);
  runGit(sourceRoot, ['rev-parse', '--verify', `${legacyMethodologySha}^{commit}`]);
  const historicalEntries = treeEntries(sourceRoot, legacyMethodologySha);
  const historical = new Map();
  for (const path of historicalMethodProfiles) {
    const bytes = committedBlob(sourceRoot, historicalEntries, legacyMethodologySha, path);
    historical.set(path, { bytes, oid: blobOid(bytes) });
  }
  const methodologySha = revision;
  const sources = { [revision]: {}, [legacyMethodologySha]: {} };
  for (const [path, entry] of inventory) {
    if (!isSourcePath(path)) continue;
    sources[revision][path] = { file: path, sha256: sha256(entry.bytes), oid: entry.oid };
  }
  for (const [path, entry] of historical) {
    sources[legacyMethodologySha][path] = { file: `.isswf-sources/${legacyMethodologySha}/${path}`, sha256: sha256(entry.bytes), oid: entry.oid };
  }
  const receipt = `${JSON.stringify({ format: 1, version: manifest.version, revision, methodologySha, files: Object.fromEntries([...inventory].map(([path, entry]) => [path, sha256(entry.bytes)])), sources }, null, 2)}\n`;
  await mkdir(dirname(outputRoot), { recursive: true });
  const staging = join(dirname(outputRoot), `.${basename(outputRoot)}.stage-${process.pid}-${Date.now()}`);
  try {
    await mkdir(staging);
    for (const [path, entry] of inventory) {
      const target = join(staging, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, entry.bytes, { flag: 'wx', mode: entry.mode === '100755' ? 0o755 : 0o644 });
    }
    for (const [path, entry] of historical) {
      const target = join(staging, `.isswf-sources/${legacyMethodologySha}`, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, entry.bytes, { flag: 'wx', mode: 0o444 });
    }
    await writeFile(join(staging, releaseReceiptName), receipt, { flag: 'wx', mode: 0o444 });
    const verified = verifyRelease(staging);
    if (verified.revision !== revision || verified.version !== manifest.version) fail('Staged release does not match the requested revision');
    await rename(staging, outputRoot);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  const runtimeId = sha256(Buffer.from(receipt));
  console.log(JSON.stringify({ built: outputRoot, revision, version: manifest.version, runtimeId, files: inventory.size, embeddedSources: historical.size }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await build(parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
