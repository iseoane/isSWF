import { existsSync, lstatSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const installed = existsSync(join(dirname(dirname(fileURLToPath(import.meta.url))), '.isswf-release.json'));

export function stateDirectory(project) {
  const current = existsSync(join(project, '.isswf'));
  const legacy = existsSync(join(project, '.factory'));
  if (current && legacy) throw Error('Both .isswf and .factory exist; reconcile before selecting an active state directory');
  const name = current ? '.isswf' : legacy ? '.factory' : installed ? '.isswf' : '.factory';
  if (current || legacy) {
    const stat = lstatSync(join(project, name));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Regular directory required for project state');
  }
  return name;
}
