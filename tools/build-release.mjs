#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseReceiptName, verifyRelease } from './release-source.mjs';
import { canonicalPath, nativePiResources } from './factory-package.mjs';
import { compileBunRelease, bunTargets } from './bun-release.mjs';

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
  '.agents/skills/isswf-writing/SKILL.md',
  '.agents/skills/isswf-writing/references/human-documents.md',
  '.agents/skills/isswf-writing/references/agent-documents.md',
  'skills/isswf-issue/SKILL.md',
  '.agents/skills/isswf-issue/SKILL.md',
  '.agents/skills/isswf-issue/references/routing-and-publication.md',
  '.agents/skills/isswf-issue/references/report-content.md',
  'skills/isswf-pr/SKILL.md',
  '.agents/skills/isswf-pr/SKILL.md',
  '.agents/skills/isswf-pr/references/risk-assessment.md',
  '.agents/skills/isswf-pr/references/pr-description.md',
  'skills/isswf-understanding/SKILL.md',
  '.agents/skills/isswf-understanding/SKILL.md',
  '.agents/skills/isswf-understanding/references/explanation.md',
  '.agents/skills/isswf-understanding/references/learning.md',
  'skills/isswf-writing/SKILL.md',
  'skills/isswf-debug/SKILL.md',
  '.agents/skills/isswf-debug/SKILL.md',
  'skills/isswf-review/SKILL.md',
  '.agents/skills/isswf-review/SKILL.md',
  'skills/isswf-retrospective/SKILL.md',
  '.agents/skills/isswf-retrospective/SKILL.md',
  'skills/isswf-tdd/SKILL.md',
  '.agents/skills/isswf-tdd/SKILL.md',
  'skills/isswf-security/SKILL.md',
  '.agents/skills/isswf-security/SKILL.md',
  'skills/isswf-performance/SKILL.md',
  '.agents/skills/isswf-performance/SKILL.md',
  'skills/isswf-observability/SKILL.md',
  '.agents/skills/isswf-observability/SKILL.md',
  'skills/isswf-e2e/SKILL.md',
  '.agents/skills/isswf-e2e/SKILL.md',
  '.agents/skills/isswf-e2e/references/browser.md',
  '.agents/skills/isswf-e2e/references/cli-and-api.md',
  '.agents/skills/isswf-e2e/references/test-quality.md',
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
  if (fixedInventoryPaths.includes(path) || nativePiResources.includes(path)) return true;
  if (path === 'tools/check-quality.mjs') return false;
  if (path.startsWith('tools/') && path.endsWith('.mjs') && !path.slice('tools/'.length).includes('/')) return true;
  if (path.startsWith('agents/') && path.endsWith('.md')) return true;
  if (path.startsWith('skills/') || path.startsWith('.agents/skills/isswf-writing/') || path.startsWith('.agents/skills/isswf-understanding/') || path.startsWith('.agents/skills/isswf-pr/') || path.startsWith('.agents/skills/isswf-issue/') || path.startsWith('.agents/skills/isswf-e2e/') || path.startsWith('.agents/skills/isswf-debug/') || path.startsWith('.agents/skills/isswf-review/') || path.startsWith('.agents/skills/isswf-retrospective/') || path.startsWith('.agents/skills/isswf-tdd/') || path.startsWith('.agents/skills/isswf-security/') || path.startsWith('.agents/skills/isswf-performance/') || path.startsWith('.agents/skills/isswf-observability/')) return true;
  if (path.startsWith('.agents/roles/')) return true;
  if (path.startsWith('.factory/templates/') && path.endsWith('.md')) return true;
  return false;
}
function isSourcePath(path) {
  if (path === '.factory/templates/retrospective.md' || nativePiResources.includes(path)) return true;
  if (path.startsWith('tools/') && path.endsWith('.mjs') && !path.slice('tools/'.length).includes('/')) return true;
  if (path.startsWith('.agents/roles/') || path.startsWith('agents/')) return true;
  if (path.startsWith('skills/') || path.startsWith('.agents/skills/isswf-writing/') || path.startsWith('.agents/skills/isswf-understanding/') || path.startsWith('.agents/skills/isswf-pr/') || path.startsWith('.agents/skills/isswf-issue/') || path.startsWith('.agents/skills/isswf-e2e/') || path.startsWith('.agents/skills/isswf-debug/') || path.startsWith('.agents/skills/isswf-review/') || path.startsWith('.agents/skills/isswf-retrospective/') || path.startsWith('.agents/skills/isswf-tdd/') || path.startsWith('.agents/skills/isswf-security/') || path.startsWith('.agents/skills/isswf-performance/') || path.startsWith('.agents/skills/isswf-observability/')) return true;
  if (['.agents/hosts/claude-code.md', '.agents/skills/isswf-coordinator/SKILL.md', '.agents/skills/isswf-setup/SKILL.md', 'docs/durable-work.md', 'docs/model-routing.md', 'docs/host-portability.md'].includes(path)) return true;
  return false;
}
function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!['--source', '--revision', '--output', '--runtime', '--target', '--bun'].includes(key) || !argv[index + 1] || argv[index + 1].startsWith('--') || Object.hasOwn(options, key)) fail(`Invalid or duplicate option: ${key ?? ''}`);
    options[key] = argv[index + 1];
  }
  for (const key of ['--source', '--revision', '--output']) if (!options[key]) fail(`Missing required option: ${key}`);
  const runtime = options['--runtime'] || 'bun';
  if (!['node', 'bun'].includes(runtime)) fail('--runtime must be node or bun');
  if (runtime === 'node' && (options['--target'] || options['--bun'])) fail('--target and --bun require --runtime bun');
  if (runtime === 'bun' && !bunTargets.includes(options['--target'] || `bun-${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`)) fail('Unsupported Bun target');
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
  const nativeProfiles = Object.hasOwn(manifest?.pi ?? {}, 'subagents') ? { subagents: { agents: ['./.agents/hosts/pi/agents'] } } : {};
  if (
    !plainObject(manifest) ||
    Object.keys(manifest).sort().join(',') !== 'bin,description,files,keywords,name,pi,version' ||
    manifest.name !== 'isswf-pi-resources' ||
    !/^\d+\.\d+\.\d+$/u.test(manifest.version ?? '') ||
    typeof manifest.description !== 'string' ||
    JSON.stringify(manifest.bin) !== JSON.stringify({ isswf: 'tools/isswf.mjs' }) ||
    JSON.stringify(manifest.keywords) !== JSON.stringify(['pi-package']) ||
    JSON.stringify(manifest.pi) !== JSON.stringify({ ...nativeProfiles, skills: ['./.agents/skills/isswf-coordinator', './.agents/skills/isswf-setup', './.agents/skills/isswf-writing', './.agents/skills/isswf-understanding', './.agents/skills/isswf-pr', './.agents/skills/isswf-issue', './.agents/skills/isswf-e2e', './.agents/skills/isswf-debug', './.agents/skills/isswf-review', './.agents/skills/isswf-retrospective', './.agents/skills/isswf-tdd', './.agents/skills/isswf-security', './.agents/skills/isswf-performance', './.agents/skills/isswf-observability'] }) ||
    Object.hasOwn(manifest, 'dependencies') ||
    Object.hasOwn(manifest, 'devDependencies') ||
    Object.hasOwn(manifest, 'scripts')
  ) fail('The committed package.json does not match the release package contract');
  return manifest;
}
async function build({ '--source': source, '--revision': revision, '--output': output, '--runtime': runtime = 'bun', '--target': target = `bun-${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`, '--bun': compiler = 'bun' }) {
  if (!isAbsolute(source) || !isAbsolute(output)) fail('--source and --output must be absolute paths');
  if (!shaPattern.test(revision)) fail('--revision must be a full lowercase Git SHA');
  const sourceRoot = await realpath(source);
  if (await realpath(runGit(sourceRoot, ['rev-parse', '--show-toplevel']).toString().trim()) !== sourceRoot) fail('Source must be a Git root');
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
  for (const path of [...fixedInventoryPaths, ...(manifest.pi.subagents ? nativePiResources : [])]) if (!inventory.has(path)) fail(`Required release path is missing: ${path}`);
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
  let receipt, binaryRuntime;
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
    if (runtime === 'bun') {
      const compiled = await compileBunRelease({ inventory, staging, target, compiler });
      const originalManifest = inventory.get('package.json');
      const manifestSource = `.isswf-sources/${revision}/package.json`;
      sources[revision]['package.json'] = { file: manifestSource, sha256: sha256(originalManifest.bytes), oid: originalManifest.oid };
      await mkdir(dirname(join(staging, manifestSource)), { recursive: true });
      await writeFile(join(staging, manifestSource), originalManifest.bytes, { flag: 'wx', mode: 0o444 });
      binaryRuntime = { engine: 'bun', version: compiled.version, target: compiled.target, executable: compiled.binary, os: compiled.os, arch: compiled.arch };
      inventory.set(compiled.binary, { bytes: compiled.bytes, mode: '100755' });
      const binaryManifest = { ...manifest, bin: { isswf: compiled.binary }, files: [...manifest.files, 'bin'], os: [compiled.os], cpu: [compiled.arch], isswfRuntime: { engine: 'bun', version: compiled.version, target: compiled.target } };
      const bytes = Buffer.from(JSON.stringify(binaryManifest, null, 2) + '\n');
      inventory.set('package.json', { bytes, mode: '100644' });
      await writeFile(join(staging, 'package.json'), bytes);
    }
    receipt = `${JSON.stringify({ format: runtime === 'bun' ? 2 : 1, version: manifest.version, revision, methodologySha, ...(binaryRuntime ? { runtime: binaryRuntime } : {}), files: Object.fromEntries([...inventory].map(([path, entry]) => [path, sha256(entry.bytes)])), sources }, null, 2)}\n`;
    await writeFile(join(staging, releaseReceiptName), receipt, { flag: 'wx', mode: 0o444 });
    const verified = verifyRelease(staging);
    if (verified.revision !== revision || verified.version !== manifest.version) fail('Staged release does not match the requested revision');
    await rename(staging, outputRoot);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  const { runtimeId, artifactId } = verifyRelease(outputRoot);
  console.log(JSON.stringify({ built: outputRoot, revision, version: manifest.version, runtimeId, artifactId, runtime, ...(runtime === 'bun' ? { target } : {}), files: inventory.size, embeddedSources: historical.size + (runtime === 'bun' ? 1 : 0) }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await build(parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
