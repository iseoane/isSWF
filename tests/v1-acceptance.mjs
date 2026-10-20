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
function validate(value) {
  assert.equal(value.version, 1); assert.equal(value.specSha256, hash(spec));
  assert.match(value.sourceBase, /^[a-f0-9]{40}$/u);
  assert.equal(new Set(expected).size, 61); assert.equal(value.criteriaCount, expected.length);
  assert.deepEqual(value.criteria.map(row => row.id).sort(), expected, 'all exact spec IDs required once');
  assert.notEqual(value.status, 'PASS', 'this artifact must not substitute a machine PASS for product acceptance');
  assert(['not-recorded-for-whole-v1', 'explicit-operator-acceptance-recorded'].includes(value.operatorAcceptance));
  if (value.operatorAcceptance === 'explicit-operator-acceptance-recorded') assert.ok(value.operatorAcceptanceEvidence?.quote && value.operatorAcceptanceEvidence?.reference);
  for (const row of value.criteria) {
    assert(modes.has(row.mode) && row.observation && row.remaining, row.id + ': evidence mode, observed scope and limits required');
    assert(value.evidenceGroups[row.evidenceGroup]?.length, row.id + ': evidence group required');
  }
  const referenced = [...new Set(Object.values(value.evidenceGroups).flat())].sort();
  assert.deepEqual(Object.keys(value.evidencePins).sort(), referenced, 'all referenced records must be pinned, no orphan pins');
  for (const path of referenced) {
    assert(path && !path.startsWith('/') && !path.includes('\\') && path.split('/').every(part => part && part !== '.' && part !== '..'), 'safe project evidence path');
    const absolute = join(source, path), stat = fs.lstatSync(absolute);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 2 * 1024 * 1024 && fs.realpathSync(absolute) === absolute, 'bounded canonical regular record');
    assert.equal(hash(fs.readFileSync(absolute)), value.evidencePins[path], path + ': exact evidence bytes required');
  }
  return referenced.length;
}
const records = validate(matrix);
for (const mutate of [
  value => value.criteria.pop(),
  value => value.criteria[0].id = value.criteria[1].id,
  value => value.criteria[0].mode = 'automatic-product-pass',
  value => value.criteria[0].remaining = '',
  value => value.specSha256 = '0'.repeat(64),
  value => value.evidencePins[Object.keys(value.evidencePins)[0]] = '0'.repeat(64),
  value => value.operatorAcceptance = 'explicit-operator-acceptance-recorded',
]) { const copy = structuredClone(matrix); mutate(copy); assert.throws(() => validate(copy)); }
console.log(`PASS v1 evidence structure: ${expected.length} exact criteria, ${records} current record hashes and explicit scope/limits; not semantic review, deployment approval or operator acceptance`);
