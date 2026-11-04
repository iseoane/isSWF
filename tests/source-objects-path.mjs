import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// diagnostic-probes resolves its own checkout's object store: a normal clone, a linked worktree
// (.git file -> gitdir -> commondir) and a checkout without .git each resolve without searching parents.
const source = resolve(process.argv[2] ?? '.');
const root = await mkdtemp(join(tmpdir(), 'isswf-source-objects-'));
try {
  const layout = async (name, dotGit) => {
    const checkout = join(root, name);
    await mkdir(join(checkout, 'tools'), { recursive: true });
    await copyFile(join(source, 'tools/diagnostic-probes.mjs'), join(checkout, 'tools/diagnostic-probes.mjs'));
    await dotGit?.(checkout);
    return (await import(pathToFileURL(join(checkout, 'tools/diagnostic-probes.mjs')).href)).sourceObjectsPath;
  };
  assert.equal(await layout('clone', checkout => mkdir(join(checkout, '.git/objects'), { recursive: true })), join(root, 'clone/.git/objects'));
  const common = join(root, 'main/.git');
  await mkdir(join(common, 'worktrees/linked'), { recursive: true });
  await writeFile(join(common, 'worktrees/linked/commondir'), '../..\n');
  assert.equal(await layout('linked', checkout => writeFile(join(checkout, '.git'), `gitdir: ${join(common, 'worktrees/linked')}\n`)), join(common, 'objects'));
  assert.equal(await layout('plain'), join(root, 'plain/.git/objects'), 'a checkout without .git keeps the unavailable default path');
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log('source objects path: ok');
