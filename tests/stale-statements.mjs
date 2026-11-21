import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as packaging from '../tools/factory-package.mjs';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));

assert.equal(typeof packaging.packagedFileSet, 'function', 'tools/factory-package.mjs exports the packaged file set');
const { loadStatements, findStale } = await import('../tooling/quality/stale-statements.mjs');

const tracked = spawnSync('git', ['-C', source, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
assert.equal(tracked.status, 0, tracked.stderr);
const packaged = packaging.packagedFileSet(tracked.stdout.split('\0').filter(Boolean));

// Both packaging routes are covered: Pi payload files, plugin/release directories and the tools glob.
for (const path of ['.agents/skills/isswf-coordinator/SKILL.md', '.agents/skills/isswf-handoff/SKILL.md', '.agents/hosts/pi/agents/isswf-worker.md', '.agents/roles/references/tdd.md', 'docs/durable-work.md', 'tools/factory-package.mjs', 'hooks/register.tsx', 'agents/isswf-worker.md']) {
  assert.ok(packaged.includes(path), `packaged: ${path}`);
}
for (const path of ['tests/stale-statements.mjs', 'docs/en/development.md', 'tooling/quality/check-docs.mjs', 'AGENTS.md']) {
  assert.ok(!packaged.includes(path), `not packaged: ${path}`);
}

// A conditional skill ships as a whole directory, so a file the Pi lists omit is still selected.
assert.deepEqual(packaging.packagedFileSet(['.agents/skills/isswf-e2e/references/unlisted.md', '.agents/skills/isswf-debug/extra.md', '.agents/skills/isswf-unknown/SKILL.md']), ['.agents/skills/isswf-debug/extra.md', '.agents/skills/isswf-e2e/references/unlisted.md']);

const statements = await loadStatements(source);
assert.ok(statements.length > 0, 'the phrase list is seeded');

// Every packaged text file is free of every listed phrase.
const files = new Map();
for (const path of packaged.filter(name => /\.(?:md|mjs|json|tsx|ts)$/u.test(name))) files.set(path, await readFile(join(source, path), 'utf8'));
assert.deepEqual(findStale(statements, files), [], 'a packaged text still carries a listed stale statement');

// Sensitivity: the search finds a seeded phrase in a packaged file, with CRLF and scope honored.
const probe = { phrase: 'exits 0 even for an invalid plan', reason: 'probe', since: 'I0000/J000' };
const seeded = new Map([['.agents/skills/isswf-coordinator/SKILL.md', 'It exits 0 even\r\nfor an invalid plan.']]);
assert.deepEqual(findStale([{ ...probe, phrase: 'exits 0 even for an invalid plan' }], new Map([['a.md', 'It exits 0 even for an invalid plan.']])).map(hit => hit.path), ['a.md']);
assert.deepEqual(findStale([{ ...probe, phrase: 'exits 0 even\nfor an invalid plan' }], seeded).map(hit => hit.path), ['.agents/skills/isswf-coordinator/SKILL.md']);
assert.deepEqual(findStale([{ ...probe, scope: 'docs/*.md' }], new Map([['docs/x.md', probe.phrase], ['.agents/x.md', probe.phrase], ['docs/en/x.md', probe.phrase]])).map(hit => hit.path), ['docs/x.md']);
assert.deepEqual(findStale([{ phrase: 'pending in J[0-9]', regex: true, reason: 'probe', since: 'I0000/J000' }], new Map([['b.md', 'remain pending in J12']])).map(hit => hit.path), ['b.md']);

// Literal matching ignores case like regex matching does.
assert.deepEqual(findStale([{ ...probe, phrase: 'Exits 0 Even For An Invalid Plan' }], new Map([['a.md', probe.phrase]])).map(hit => hit.path), ['a.md']);

// A malformed entry is refused with its index.
const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
const { tmpdir } = await import('node:os');
const scratch = await mkdtemp(join(tmpdir(), 'isswf-stale-'));
try {
  await mkdir(join(scratch, 'tooling/quality'), { recursive: true });
  for (const [bad, pattern] of [[{ regex: 'yes' }, /statement 1.*regex/u], [{ scope: 3 }, /statement 1.*scope/u]]) {
    await writeFile(join(scratch, 'tooling/quality/stale-statements.json'), JSON.stringify({ statements: [{ ...probe }, { ...probe, ...bad }] }));
    await assert.rejects(loadStatements(scratch), pattern);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}

console.log(`PASS ${statements.length} stale statements searched in ${files.size} packaged text files`);
