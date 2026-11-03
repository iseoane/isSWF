import { symlink } from 'node:fs/promises';

// Unprivileged Windows sessions cannot create file symlinks (EPERM). Such a
// session also cannot plant one, so the refusal case is reported as not run
// instead of failing the whole test or being counted as passed.
export async function fileSymlinkOrSkip(target, path, label) {
  try {
    await symlink(target, path, 'file');
    return true;
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EPERM') throw error;
    console.error(`NOT_RUN: ${label}: file symlinks require Windows Developer Mode or elevation`);
    return false;
  }
}
