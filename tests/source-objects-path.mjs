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
  // Relative gitdir and a CRLF .git file resolve like git does, against the checkout.
  assert.equal(await layout('relative', checkout => writeFile(join(checkout, '.git'), 'gitdir: ../main/.git/worktrees/linked\r\n')), join(common, 'objects'));
  // Missing commondir: the gitdir itself holds the objects (submodule-style gitfile).
  await mkdir(join(root, 'modules/sub'), { recursive: true });
  assert.equal(await layout('submodule', checkout => writeFile(join(checkout, '.git'), `gitdir: ${join(root, 'modules/sub')}\n`)), join(root, 'modules/sub/objects'));
  // A gitdir that names a file (ENOTDIR) falls back to the unavailable default path instead of throwing at import.
  await writeFile(join(root, 'not-a-directory'), 'x');
  assert.equal(await layout('enotdir', checkout => writeFile(join(checkout, '.git'), `gitdir: ${join(root, 'not-a-directory')}\n`)), join(root, 'enotdir/.git/objects'));
  if (process.platform === 'win32') {
    // git may record a lowercase drive letter; the resolved path must match the canonical (uppercase) form.
    const lower = join(common, 'worktrees/linked').replace(/^[A-Z]:/u, drive => drive.toLowerCase());
    assert.equal(await layout('lowercase-drive', checkout => writeFile(join(checkout, '.git'), `gitdir: ${lower}\n`)), join(common, 'objects').replace(/^[a-z]:/u, drive => drive.toUpperCase()));
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log('source objects path: ok');
