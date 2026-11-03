import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalize, report } from '../tools/token-report.mjs';

const source = resolve(process.argv[2] || '.');
const row = (id, input, accepted = 2, scope = 'agent') => ({ id, host: 'pi', hostVersion: '1.4.0', model: 'model-x', effort: 'high', taskClass: 'test', candidate: 'c1', outcome: 'o1', accepted, provenance: 'manual-pi', scope, window: 'w1', counters: { input, output: 40, cacheRead: 30, cacheWrite: 10 } });
const pi = { version: 1, mode: 'window', rows: [row('agent-a', 100), row('agent-b', 50)] };
const result = report(pi);
assert.equal(result.totals.counters.input, 150);
assert.equal(result.totals.processed, 310);
assert.equal(result.totals.accepted, 2);
assert.equal(result.totals.tokensPerAccepted, 155);
assert.equal(result.totals.cacheReadShare, 60 / 230);
assert.equal(result.totals.rows.length, 2);
for (const unsupported of [
  { ...row('pi-source', 1), source: { prompt: 'dummy prompt text' } },
  { ...row('pi-segment', 1), segment: 'arbitrary segment text' },
  { ...row('claude-source', 1), host: 'claude', provenance: 'manual-claude', source: { prompt: 'dummy prompt text' } },
  { ...row('claude-segment', 1), host: 'claude', provenance: 'manual-claude', segment: 'arbitrary segment text' },
]) assert.throws(() => report({ version: 1, mode: 'window', rows: [unsupported] }), /invalid token summary/u);
const claude = { version: 1, mode: 'window', rows: [{ ...row('all', 100, 1, 'unattributed'), host: 'claude', provenance: 'manual-claude', counters: { input: null, output: 20, cacheRead: 5, cacheWrite: 0 } }] };
const partial = report(claude);
assert.equal(partial.totals.processed, null);
assert.equal(partial.totals.processedSubtotal, 25);
assert.equal(partial.totals.tokensPerAccepted, null);
assert.equal(partial.totals.attribution, 'unattributed');
assert.deepEqual(partial.totals.coverage, { individualRows: 0, aggregateRows: 0, unattributedRows: 1 });
const treeOnly = report({ version: 1, mode: 'window', rows: [row('tree', 100, 1, 'tree')] });
assert.equal(treeOnly.totals.attribution, 'aggregate-only');
assert.deepEqual(treeOnly.totals.coverage, { individualRows: 0, aggregateRows: 1, unattributedRows: 0 });
const after = structuredClone(pi);
after.rows.forEach(r => { r.candidate = 'c2'; r.counters.input -= 10; });
const compared = report(after, pi).comparison;
assert.equal(compared.status, 'comparable');
assert.equal(compared.processedDifference, 20);
assert.equal(compared.processedReductionPercent, 20 / 310 * 100);
const mismatch = structuredClone(after); mismatch.rows[0].scope = 'unattributed';
assert.equal(report(mismatch, pi).comparison.status, 'incomparable');
assert.equal(report({ ...pi, rows: [row('zero', 0)] }).comparison, null);
assert.equal(report({ version: 1, mode: 'window', rows: [row('zero', 0, 0)] }).totals.tokensPerAccepted, null);
const zero = { version: 1, mode: 'window', rows: [{ ...row('agent-a', 0), counters: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }, { ...row('agent-b', 0), counters: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }] };
const zeroComparison = report(pi, zero).comparison;
assert.equal(zeroComparison.status, 'incomparable');
assert.equal(zeroComparison.processedDifference, null);
assert.equal(zeroComparison.processedReductionPercent, null);
assert.doesNotMatch(JSON.stringify(zeroComparison), /Infinity|NaN/u);
const multiBefore = { version: 1, mode: 'window', rows: [row('agent-a', 10), { ...row('agent-a', 20), window: 'w2', outcome: 'o2' }] };
const multiAfter = structuredClone(multiBefore);
multiAfter.rows.reverse();
multiAfter.rows.forEach(rowValue => { rowValue.counters.input -= 1; rowValue.candidate = 'c2'; });
assert.equal(report(multiAfter, multiBefore).comparison.status, 'comparable');
const contradiction = { version: 1, mode: 'window', rows: [row('a', 1, 1), row('b', 1, 2)] };
assert.throws(() => normalize(contradiction), /contradictory outcome acceptance/u);
const candidateContradiction = { ...contradiction, rows: contradiction.rows.map(rowValue => ({ ...rowValue, accepted: 1, candidate: rowValue.id })) };
assert.throws(() => normalize(candidateContradiction), /contradictory outcome acceptance/u);
const sharedOutcome = { version: 1, mode: 'window', rows: ['coordinator', 'worker', 'reviewer', 'correction'].map((actor, i) => ({ ...row(actor, 1, 1), outcome: 'accepted-result', candidate: 'same', counters: { input: i + 1, output: 1, cacheRead: 0, cacheWrite: 0 } })) };
const sharedSummary = report(sharedOutcome).totals;
assert.equal(sharedSummary.accepted, 1);
assert.equal(sharedSummary.processed, 14);
assert.equal(sharedSummary.tokensPerAccepted, 14);
assert.throws(() => report({ version: 1, mode: 'window', rows: [row('huge', Number.MAX_SAFE_INTEGER), row('huge2', 1)] }));
for (const bad of [
  { ...pi, mode: 'cumulative' },
  { ...pi, mode: 'reset' },
  { ...pi, extra: 'sensitive' },
  { ...pi, rows: [{ ...row('bad/path') }] },
  { ...pi, rows: [{ ...row('bad', -1) }] },
  { ...pi, rows: [{ ...row('unsafe', Number.MAX_SAFE_INTEGER + 1) }] },
  { ...pi, rows: Array.from({ length: 101 }, (_, i) => row(`agent${i}`, 1)) },
  { ...pi, rows: [row('same', 1), row('same', 1)] },
  { ...pi, rows: [row('tree', 1, 1, 'tree'), row('child', 1)] },
]) assert.throws(() => normalize(bad));
const sensitive = structuredClone(pi); sensitive.rows[0].prompt = 'do not emit';
assert.throws(() => report(sensitive));
assert.doesNotMatch(JSON.stringify(result), /prompt|tool contents|private/u);
const root = await mkdtemp(join(tmpdir(), 'token report ü-'));
try {
  const input = join(root, 'summary.json'); await writeFile(input, JSON.stringify(pi));
  const cli = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--input', input], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).totals.processed, 310);
  const bad = join(root, 'bad.json'); await writeFile(bad, JSON.stringify({ ...pi, mode: 'events' }));
  const refused = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--input', bad], { encoding: 'utf8' });
  assert.equal(refused.status, 1); assert.doesNotMatch(refused.stderr, /events|prompt/u);
  const huge = join(root, 'huge.json'); await writeFile(huge, ' '.repeat(1024 * 1024 + 1));
  const oversized = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--input', huge], { encoding: 'utf8' });
  assert.equal(oversized.status, 1); assert.match(oversized.stderr, /input limit exceeded/u);
  const comparisonRows = length => ({ version: 1, mode: 'window', rows: Array.from({ length }, (_, i) => ({ ...row(`agent${i}`, 1), window: `window${i}`, outcome: `outcome${i}` })) });
  const beforePath = join(root, 'before.json'), afterPath = join(root, 'after.json');
  await writeFile(beforePath, JSON.stringify(comparisonRows(50)));
  await writeFile(afterPath, JSON.stringify(comparisonRows(50)));
  const atLimit = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--before', beforePath, '--after', afterPath], { encoding: 'utf8' });
  assert.equal(atLimit.status, 0, atLimit.stderr); assert.equal(JSON.parse(atLimit.stdout).comparison.status, 'comparable');
  await writeFile(afterPath, JSON.stringify(comparisonRows(51)));
  const overLimit = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--before', beforePath, '--after', afterPath], { encoding: 'utf8' });
  assert.equal(overLimit.status, 1); assert.match(overLimit.stderr, /row limit exceeded/u);
  const zeroPath = join(root, 'zero.json'); await writeFile(zeroPath, JSON.stringify(zero));
  const zeroCli = spawnSync(process.execPath, [join(source, 'tools/token-report.mjs'), '--before', zeroPath, '--after', input], { encoding: 'utf8' });
  assert.equal(zeroCli.status, 0, zeroCli.stderr);
  const zeroOutput = JSON.parse(zeroCli.stdout).comparison;
  assert.equal(zeroOutput.processedDifference, null); assert.equal(zeroOutput.processedReductionPercent, null);
  assert.doesNotMatch(zeroCli.stdout, /Infinity|NaN/u);
} finally { await rm(root, { recursive: true, force: true }); }
console.log('PASS: offline token receipt arithmetic, missingness, attribution, comparison, privacy and CLI bounds');
