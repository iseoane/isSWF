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
assert.equal(result.totals.tokensPerAccepted, 77.5);
assert.equal(result.totals.cacheReadShare, 60 / 230);
assert.equal(result.totals.rows.length, 2);
const claude = { version: 1, mode: 'window', rows: [{ ...row('all', 100, 1, 'unattributed'), host: 'claude', provenance: 'manual-claude', counters: { input: null, output: 20, cacheRead: 5, cacheWrite: 0 } }] };
const partial = report(claude);
assert.equal(partial.totals.processed, null);
assert.equal(partial.totals.processedSubtotal, 25);
assert.equal(partial.totals.tokensPerAccepted, null);
assert.equal(partial.totals.attribution, 'includes-unattributed');
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
const zero = { version: 1, mode: 'window', rows: [row('zero', 0)] };
assert.equal(report(pi, zero).comparison.status, 'incomparable');
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
} finally { await rm(root, { recursive: true, force: true }); }
console.log('PASS: offline token receipt arithmetic, missingness, attribution, comparison, privacy and CLI bounds');
