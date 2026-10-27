import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export const bunTargets = ['bun-linux-x64', 'bun-linux-arm64', 'bun-darwin-x64', 'bun-darwin-arm64', 'bun-windows-x64', 'bun-windows-arm64'];
const toolNames = ['isswf', 'isswf-plan', 'isswf-status', 'isswf-panel', 'isswf-response', 'isswf-intake', 'project-quality', 'isswf-job', 'researcher-task', 'reviewer-task', 'planner-task', 'diagnostic-task', 'pi-worker-task', 'worker-lifecycle'];
const mainGuard = /if\s*\(process\.argv\[1\]\s*&&\s*resolve\(process\.argv\[1\]\)\s*===\s*fileURLToPath\(import\.meta\.url\)\)\s*\{/gu;
function command(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw Error(`Bun release compilation failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
}

export async function compileBunRelease({ inventory, staging, target, compiler = 'bun' }) {
  if (!bunTargets.includes(target)) throw Error('Unsupported Bun target: ' + target);
  const version = command(compiler, ['--version']);
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(version)) throw Error('Bun compiler returned an invalid version');
  const generated = await mkdtemp(join(dirname(staging), '.isswf-compile-'));
  try {
    await mkdir(join(generated, 'tools'));
    for (const [path, entry] of inventory) {
      if (!/^tools\/[^/]+\.mjs$/u.test(path)) continue;
      const name = path.slice(6, -4);
      let source = entry.bytes.toString('utf8').replace(/^#![^\n]*\n/u, '');
      source = source.replace(mainGuard, `if (__isswfMain(${JSON.stringify(name)})) {`);
      source = source.replaceAll('fileURLToPath(import.meta.url)', `__isswfPath(${JSON.stringify(path)})`);
      source = `import { main as __isswfMain, path as __isswfPath } from './isswf-binary-context.mjs';\n` + source;
      await writeFile(join(generated, path), source);
    }
    await writeFile(join(generated, 'tools/isswf-binary-context.mjs'), `import { join } from 'node:path';
const context = () => globalThis[Symbol.for('isswf.binary.context')];
export const main = name => context()?.tool === name;
export const path = name => join(context().root, name);
`);
    const imports = toolNames.map(name => `${JSON.stringify(name)}: () => import(${JSON.stringify('./tools/' + name + '.mjs')})`).join(',\n');
    await writeFile(join(generated, 'entry.mjs'), `import { dirname, join, resolve, basename } from 'node:path';
import { realpathSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { verifyRelease } from './tools/release-source.mjs';
import { createRequire } from 'node:module';
const tools = {${imports}};
try {
  // Standalone engine entries need no release lookup. In LPAC the executable
  // can run even when canonicalizing its ancestor path is denied.
  let executable = process.execPath, root;
  const locateRelease = () => {
    executable = process.platform === 'win32' ? realpathSync.native(process.execPath) : realpathSync(process.execPath);
    root = dirname(dirname(executable));
  };
  let [first, ...args] = process.argv.slice(2), tool = 'isswf';
  if (first === '__tool') {
    tool = args.shift();
  } else if (first === '-e' || first === '--eval') {
    if (args.length === 0) throw Error('Inline evaluation requires JavaScript source');
    const [code, ...forwarded] = args;
    process.argv = [executable, ...forwarded];
    globalThis.require = createRequire(join(process.cwd(), '__isswf_inline__.cjs'));
    await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
    tool = null;
    first = null;
  } else if (first?.endsWith('.mjs')) {
    const script = resolve(first), name = basename(script, '.mjs');
    if (basename(dirname(script)) === 'tools' && Object.hasOwn(tools, name)) locateRelease();
    if (root && dirname(script) === join(root, 'tools') && Object.hasOwn(tools, name)) {
      tool = name;
    } else {
      process.argv = [executable, script, ...args];
      await import(pathToFileURL(script).href);
      first = null;
      tool = null;
    }
  } else args = process.argv.slice(2);
  if (tool !== null) {
    if (!root) locateRelease();
    const receipt = verifyRelease(root);
    if (!receipt || !existsSync(join(root, 'bin', ${JSON.stringify(target.includes('windows') ? 'isswf.exe' : 'isswf')}))) throw Error('Executable requires its complete verified release resources');
    if (first === '--version') console.log(receipt.version);
    else {
      if (!Object.hasOwn(tools, tool)) throw Error('Unknown executable tool: ' + tool);
      Object.defineProperty(globalThis, Symbol.for('isswf.binary.context'), { value: Object.freeze({ root, tool }) });
      process.argv = [executable, join(root, 'tools', tool + '.mjs'), ...args];
      await tools[tool]();
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
`);
    const binary = 'bin/' + (target.includes('windows') ? 'isswf.exe' : 'isswf');
    await mkdir(join(staging, 'bin'));
    command(compiler, ['build', '--compile', '--compile-autoload-package-json', '--target=' + target, join(generated, 'entry.mjs'), '--outfile', join(staging, binary)]);
    const bytes = await readFile(join(staging, binary));
    return { binary, bytes, version, target, os: target.split('-')[1] === 'windows' ? 'win32' : target.split('-')[1], arch: target.split('-')[2] };
  } finally { await rm(generated, { recursive: true, force: true }); }
}
