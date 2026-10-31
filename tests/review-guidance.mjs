import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const output = process.argv[3];
assert.ok(process.argv.length <= 4 && (output === undefined || isAbsolute(output)), 'Optional fixture output must be an absent absolute directory');
const temporary = output === undefined ? await mkdtemp(join(tmpdir(), 'isswf-review-cases-')) : null;
const root = output ?? join(temporary, 'fixtures');
const cases = [
  {
    id: 'authorization',
    contract: 'canWrite(owner, actor, enabled) returns true only when owner equals actor AND enabled is true. enabled is a boolean; identifiers are strings.',
    base: 'export const canWrite = (owner, actor, enabled) => owner === actor && enabled;\n',
    candidate: 'export const canWrite = (owner, actor, enabled) => owner === actor || enabled;\n',
    check: "assert.equal(canWrite('a', 'a', true), true); assert.equal(canWrite('a', 'b', false), false);",
    probe: "assert.equal(canWrite('a', 'b', true), false); assert.equal(canWrite('a', 'a', false), false);",
    imports: 'canWrite',
    defect: true,
  },
  {
    id: 'cache',
    contract: 'createCache().get(tenant, key, load) caches a loaded string independently for each tenant and key. Tenant and key strings contain no NUL characters.',
    base: 'export function createCache() { const entries = new Map(); return { get(tenant, key, load) { const id = tenant + "\\0" + key; if (!entries.has(id)) entries.set(id, load()); return entries.get(id); } }; }\n',
    candidate: 'export function createCache() { const entries = new Map(); return { get(tenant, key, load) { const id = key; if (!entries.has(id)) entries.set(id, load()); return entries.get(id); } }; }\n',
    check: "const cache = createCache(); assert.equal(cache.get('a', 'x', () => 'A'), 'A'); assert.equal(cache.get('a', 'x', () => 'changed'), 'A');",
    probe: "const cache = createCache(); cache.get('a', 'x', () => 'A'); assert.equal(cache.get('b', 'x', () => 'B'), 'B');",
    imports: 'createCache',
    defect: true,
  },
  {
    id: 'budget',
    contract: 'validBudget(value, maximum) accepts safe integers from 1 through maximum inclusive. maximum is a positive safe integer.',
    base: 'export const validBudget = (value, maximum) => Number.isSafeInteger(value) && value > 0 && value <= maximum;\n',
    candidate: 'export function validBudget(value, maximum) { return Number.isSafeInteger(value) && value <= maximum && value > 0; }\n',
    check: 'for (const [value, expected] of [[1, true], [4, true], [0, false], [5, false], [1.5, false], [NaN, false], [Infinity, false], ["1", false], [null, false], [Symbol("x"), false]]) assert.equal(validBudget(value, 4), expected);',
    probe: 'assert.equal(validBudget(4, 4), true); assert.equal(validBudget(5, 4), false);',
    imports: 'validBudget',
    defect: false,
  },
  {
    id: 'guard',
    contract: 'ownsEnabled(owner, actor, enabled) returns true exactly when owner equals actor and enabled is true. enabled is a boolean; identifiers are strings.',
    base: 'export const ownsEnabled = (owner, actor, enabled) => enabled && owner === actor;\n',
    candidate: 'export const ownsEnabled = (owner, actor, enabled) => owner === actor && Boolean(enabled);\n',
    check: "for (const actor of ['a', 'b']) for (const enabled of [true, false]) assert.equal(ownsEnabled('a', actor, enabled), actor === 'a' && enabled);",
    probe: "for (const actor of ['a', 'b']) for (const enabled of [true, false]) assert.equal(ownsEnabled('a', actor, enabled), actor === 'a' && enabled);",
    imports: 'ownsEnabled',
    defect: false,
  },
];

try {
  await mkdir(root);
  const observations = [];
  for (const version of ['base', 'candidate']) {
    await mkdir(join(root, version, 'checks'), { recursive: true });
    await mkdir(join(root, version, 'probes'));
    await writeFile(join(root, version, 'contract.md'), '# Contracts\n\n' + cases.map(item => `- ${item.id}.mjs: ${item.contract}`).join('\n') + '\n\nNo dependencies are added or upgraded. Review behavioral regressions; style alone is not blocking.\n');
    for (const item of cases) {
      await writeFile(join(root, version, item.id + '.mjs'), item[version]);
      for (const [directory, statements] of [['checks', item.check], ['probes', item.probe]]) {
        const script = `import assert from 'node:assert/strict';\nimport { ${item.imports} } from '../${item.id}.mjs';\n${statements}\n`;
        const path = join(root, version, directory, item.id + '.mjs');
        await writeFile(path, script);
        const result = spawnSync(process.execPath, [path], { encoding: 'utf8', timeout: 5000 });
        assert.ifError(result.error);
        const expectedExit = version === 'candidate' && directory === 'probes' && item.defect ? 1 : 0;
        assert.equal(result.status, expectedExit, `${version}/${directory}/${item.id}: ${result.stderr}`);
        observations.push({ version, kind: directory, path: item.id + '.mjs', exitCode: result.status });
      }
    }
  }
  const oracle = { blockingPaths: cases.filter(item => item.defect).map(item => item.id + '.mjs'), nonblockingPaths: cases.filter(item => !item.defect).map(item => item.id + '.mjs'), observations, limits: 'Executable fixture ground truth only. Do not supply the oracle or held-out probes to a blinded reviewer. A model evaluation needs separate authorized native calls and manual finding classification.' };
  await writeFile(join(root, 'oracle.json'), JSON.stringify(oracle, null, 2) + '\n');
  const guidance = await readFile(join(source, '.agents/roles/references/review.md'), 'utf8');
  for (const heading of ['## Examine behavior and tests first', '### Targeted detection experiments', '### Changed dependencies']) assert.ok(guidance.includes(heading));
  assert.match(guidance, /changed required test.*not executed.*exact candidate.*inconclusive/u);
  assert.match(guidance, /`BLOCKED` is not a pass.*nonzero/u);
  console.log(JSON.stringify({ status: 'PASS', cases: cases.length, blockingPaths: oracle.blockingPaths, nonblockingPaths: oracle.nonblockingPaths, ...(output ? { fixtureRoot: root } : {}), limits: oracle.limits }));
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
