import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));

async function description(path) {
  const text = await readFile(path, 'utf8');
  const value = text.match(/^---\r?\n(?:.*\r?\n)*?description: (.*?)\r?\n/u)?.[1];
  assert.ok(value, `missing frontmatter description: ${path}`);
  return value;
}

const wrappers = (await readdir(join(source, 'skills'), { withFileTypes: true }))
  .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
assert.ok(wrappers.length > 0, 'no Claude plugin skill entries found');
for (const name of wrappers) {
  const shared = join(source, '.agents', 'skills', name, 'SKILL.md');
  // Claude selects plugin skills by the wrapper description, so it must activate exactly like the shared skill.
  await access(shared).catch(() => assert.fail(`${name}: no shared skill counterpart at ${shared}`));
  const expected = await description(shared);
  assert.equal(await description(join(source, 'skills', name, 'SKILL.md')), expected, `${name}: wrapper description differs from shared skill`);
}
console.log(`PASS ${wrappers.length} Claude plugin skill descriptions match their shared skills`);
