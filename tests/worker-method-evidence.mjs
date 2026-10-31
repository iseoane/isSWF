import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const read = (path) => readFile(join(root, path), 'utf8');
const [brief, attempt, review, worker, tdd, reviewer, coordinator, pi, claude, docs, hostTest] = await Promise.all([
  read('.factory/templates/job-brief.md'),
  read('.factory/templates/attempt.md'),
  read('.factory/templates/review.md'),
  read('.agents/roles/worker.md'),
  read('.agents/roles/references/tdd.md'),
  read('.agents/roles/references/review.md'),
  read('.agents/skills/isswf-coordinator/SKILL.md'),
  read('.agents/hosts/pi.md'),
  read('.agents/hosts/claude-code.md'),
  read('docs/en/development.md'),
  read('tests/host-portability.mjs'),
]);

assert.match(brief, /red commit.*green commit|red\/green commit pair/iu, 'Brief must require retained test-only RED and passing GREEN commit provenance');
assert.match(attempt, /Required-resource consumption:[\s\S]*observed \(host trace\) or self-reported/u, 'Attempt must distinguish observed and self-reported resource consumption');
assert.match(attempt, /Required-reference application map:[\s\S]*concrete application in candidate/u, 'Attempt must map required references to visible application evidence');
assert.match(review, /observed in candidate/u, 'Review template must assess application visible in the exact candidate');
assert.match(review, /claimed, not visible/u, 'Review template must distinguish unsupported application claims');
assert.match(review, /not applicable accepted/u, 'Review template must preserve the justified not-applicable outcome');
assert.match(worker, /test.*alone.*before.*production|failing test alone/iu, 'Worker procedure must commit behavioral RED before production changes');
assert.match(worker, /exact focused command.*failing assertion/iu, 'Worker must make the RED commit independently reproducible');
for (const [owner, body] of [['worker role', worker], ['review guidance', reviewer], ['attempt template', attempt], ['review template', review]]) {
  assert.match(body, /substitute evidence/iu, `${owner} must cover substitute evidence for missing RED`);
  assert.match(body, /harness and run log/iu, `${owner} must retain the substitute harness and run log`);
  assert.match(body, /tests\/.*tooling\/\.local\//iu, `${owner} must name durable substitute-evidence locations`);
  assert.match(body, /archived commit.*unmutated baseline/iu, `${owner} must bind substitute evidence to its archived commit and unmutated baseline`);
  assert.match(body, /attempt\/review record/iu, `${owner} must link retained substitute artifacts from the attempt/review record`);
}
assert.match(tdd, /git bisect skip/iu, 'TDD procedure must explain retained red commits in bisect');
assert.match(reviewer, /not red.*not green|RED.*GREEN/iu, 'Review procedure must provide a manual red/green reproduction when no checker is built');
assert.match(reviewer, /claimed, not visible/u, 'Review outcomes must reject a self-report as evidence of application');
assert.match(coordinator, /observed.*self-reported/iu, 'Coordinator must distinguish trace-observed from self-reported consumption');
for (const [owner, body] of [['brief template', brief], ['attempt template', attempt], ['review template', review], ['worker role', worker], ['review guidance', reviewer], ['coordinator skill', coordinator], ['Pi host', pi], ['Claude host', claude]]) {
  assert.doesNotMatch(body, /self-reported(?:\s+\w+){0,2}\s+observed/iu, `${owner} must not upgrade a self-report to observed consumption`);
}
assert.match(pi, /Pi session record/u, 'Pi guide must describe its consumption trace where available');
assert.match(claude, /stream-json/u, 'Claude guide must describe its consumption trace where available');
const example = await read('tests/fixtures/method-evidence/example.md');
assert.match(example, /RED.*GREEN/isu, 'Example must demonstrate a TDD red/green pair');
assert.match(example, /deviation/iu, 'Example must demonstrate a declared no-red deviation');
assert.match(example, /self-reported/u, 'Example must demonstrate self-reported consumption');
assert.match(example, /observed/u, 'Example must demonstrate observed consumption');
assert.match(example, /claimed, not visible/u, 'Example must demonstrate a false application claim');
assert.match(example, /not a pass/u, 'False application claims must never pass an entry');
assert.match(docs, /git bisect skip/iu, 'Developer quality documentation must explain red-commit bisect behavior');
assert.match(hostTest, /worker-method-evidence\.mjs/u, 'The host portability static contract suite must execute the new assertions');
console.log('PASS method evidence contract: TDD provenance, consumption, reference application, review outcomes, false-claim control, host trace guidance and example');
