import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Top-level tests that no check runs on purpose, each with its reason.
const EXEMPT = {
  'project-context-engram.mjs': 'needs an external Engram executable; Engram is not a factory dependency',
};

async function names(directory, suffixes) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries.filter(entry => entry.isFile() && suffixes.some(suffix => entry.name.endsWith(suffix))).map(entry => entry.name).sort();
}

// Returns the top-level tests/*.mjs files that neither check-quality nor a CI workflow runs
// and that no other top-level test imports or runs by path. tests/support and tests/fixtures are not scanned.
export async function unrunTests(source, exempt = EXEMPT) {
  for (const [name, reason] of Object.entries(exempt)) {
    if (!String(reason || '').trim()) throw new Error(`exemption ${name} needs a reason`);
  }
  const tests = await names(join(source, 'tests'), ['.mjs']);
  const workflows = join(source, '.github/workflows');
  const runners = [await readFile(join(source, 'tools/check-quality.mjs'), 'utf8')];
  for (const name of await names(workflows, ['.yml', '.yaml'])) runners.push(await readFile(join(workflows, name), 'utf8'));
  const testTexts = new Map(await Promise.all(tests.map(async name => [name, await readFile(join(source, 'tests', name), 'utf8')])));
  const mentioned = name => new RegExp(`(?:^|[\\\\/'"\\s])tests[\\\\/]${name.replace(/[.]/gu, '\\.')}(?![\\w.-])`, 'mu');
  const imported = name => new RegExp(`['"]\\./${name.replace(/[.]/gu, '\\.')}['"]`, 'u');
  return tests.filter(name => !(name in exempt)
    && !runners.some(text => mentioned(name).test(text))
    && ![...testTexts].some(([other, text]) => other !== name && (imported(name).test(text) || mentioned(name).test(text))));
}
