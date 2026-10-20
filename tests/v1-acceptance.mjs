import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const source = fs.realpathSync(resolve(process.argv[2] ?? '.'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const spec = fs.readFileSync(join(source, 'docs/spec-v1.md'));
const expected = [...spec.toString().matchAll(/^- `([A-Z]+-[0-9]+)`: (.+)$/gm)].map(match => match[1]).sort();
const matrix = JSON.parse(fs.readFileSync(join(source, '.factory/initiatives/I0001/jobs/J008/acceptance-matrix.json')));
const modes = new Set(['bounded-supported', 'workflow-observed', 'structural-and-workflow-evidence', 'documented-and-observed', 'controlled-proof-only', 'controlled-native-review', 'controlled-and-real-case-evidence', 'actual-case-and-controlled-proof', 'actual-deployment-gate-retention-policy-accepted', 'operator-accepted-bounded-case', 'actual-native-review-and-operator-case', 'workflow-and-structural-evidence', 'supported-isolated-profile-with-deployment-gate', 'unverified', 'not-supported']);
function table(rows, columns) {
  assert(Array.isArray(rows));
  return rows.map(row => {
    assert(Array.isArray(row) && row.length === columns.length, 'complete table row required');
    return Object.fromEntries(columns.map((column, index) => [column, row[index]]));
  });
}
function validate(value) {
  assert.equal(value.version, 1); assert.equal(value.specSha256, hash(spec));
  assert.match(value.sourceBase, /^[a-f0-9]{40}$/u);
  assert.equal(new Set(expected).size, 61); assert.equal(value.criteriaCount, expected.length);
  assert.deepEqual(value.columns, ['id', 'mode', 'evidenceGroup', 'observation', 'remaining']);
  assert.deepEqual(value.recordColumns, ['path', 'sha256', 'groups']);
  const rows = table(value.criteria, value.columns), records = table(value.records, value.recordColumns);
  assert.deepEqual(rows.map(row => row.id).sort(), expected, 'all exact spec IDs required once');
  assert.notEqual(value.status, 'PASS', 'this artifact must not substitute a machine PASS for product acceptance');
  assert(['not-recorded-for-whole-v1', 'explicit-operator-acceptance-recorded'].includes(value.operatorAcceptance));
  if (value.operatorAcceptance === 'explicit-operator-acceptance-recorded') assert.ok(value.operatorAcceptanceEvidence?.quote && value.operatorAcceptanceEvidence?.reference);
  const groups = new Set(rows.map(row => row.evidenceGroup)), paths = new Set();
  for (const row of rows) {
    assert(Object.values(row).every(item => typeof item === 'string' && item) && modes.has(row.mode), row.id + ': typed evidence mode, scope and limits required');
    assert(records.some(record => record.groups?.includes(row.evidenceGroup)), row.id + ': evidence group required');
  }
  for (const record of records) {
    const { path, sha256 } = record;
    assert(path && !path.startsWith('/') && !path.includes('\\') && path.split('/').every(part => part && part !== '.' && part !== '..'), 'safe project evidence path');
    assert(!paths.has(path)); paths.add(path); assert.match(sha256, /^[a-f0-9]{64}$/u);
    assert(Array.isArray(record.groups) && record.groups.length && new Set(record.groups).size === record.groups.length && record.groups.every(group => groups.has(group)), 'no orphan record groups');
    const absolute = join(source, path), stat = fs.lstatSync(absolute);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 2 * 1024 * 1024 && fs.realpathSync(absolute) === absolute, 'bounded canonical regular record');
    assert.equal(hash(fs.readFileSync(absolute)), sha256, path + ': exact evidence bytes required');
  }
  return records.length;
}
const records = validate(matrix);
for (const mutate of [
  value => value.criteria.pop(),
  value => value.criteria[0][0] = value.criteria[1][0],
  value => value.criteria[0][1] = 'automatic-product-pass',
  value => value.criteria[0][4] = '',
  value => value.columns.reverse(),
  value => value.specSha256 = '0'.repeat(64),
  value => value.records[0][1] = '0'.repeat(64),
  value => value.records.push(value.records[0]),
  value => { value.operatorAcceptance = 'explicit-operator-acceptance-recorded'; delete value.operatorAcceptanceEvidence; },
]) { const copy = structuredClone(matrix); mutate(copy); assert.throws(() => validate(copy)); }
console.log(`PASS v1 evidence structure: ${expected.length} exact criteria, ${records} current record hashes and explicit scope/limits; not semantic review, deployment approval or operator acceptance`);
