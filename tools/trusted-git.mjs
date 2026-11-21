import { spawnSync } from 'node:child_process';
import { realpath } from 'node:fs/promises';

/**
 * Resolves the Git executable to its real path: `given` when the caller names one, otherwise the first `git` the platform locator
 * (`where.exe` on Windows, `which` elsewhere) finds. Fails with an error whose message and `code` are `notFound` when none is found.
 */
export async function locateGit(given, notFound = 'git-not-found') {
  if (given) return realpath(given);
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const found = spawnSync(locator, ['git'], { encoding: 'utf8', windowsHide: true }).stdout?.trim().split(/\r?\n/u)[0];
  if (!found) throw Object.assign(Error(notFound), { code: notFound });
  return realpath(found);
}
