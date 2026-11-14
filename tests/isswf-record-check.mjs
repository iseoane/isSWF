import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkRecord } = await import(pathToFileURL(join(source, 'tools/isswf-record-check-core.mjs')));

const job = (id, status) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const plan = (...jobs) => `# I0001: Synthetic\n\nType: bug\n\n${jobs.join('\n')}`;
const lineOf = (text, needle) => text.split('\n').findIndex(line => line.includes(needle)) + 1;
// Both separator styles must classify the same file; a Windows path never reaches a POSIX `path` module here.
const paths = name => [`/work/project/.factory/initiatives/I0001/${name}`, `C:\\work\\project\\.factory\\initiatives\\I0001\\${name}`];

// A valid plan has no violations.
for (const path of paths('plan.md')) assert.deepEqual(checkRecord({ path, text: plan(job('J001', 'in-progress')) }), { ok: true, violations: [] });

// A plan that fails parsePlan reports its code, job, field and 1-based line.
const invented = plan(job('J001', 'invented'));
for (const path of paths('plan.md')) {
  assert.deepEqual(checkRecord({ path, text: invented }), {
    ok: false,
    violations: [{ code: 'invalid-job', job: 'J001', field: 'Status', line: lineOf(invented, '- Status:'), message: 'invalid-job at J001 Status (line ' + lineOf(invented, '- Status:') + ')' }],
  });
}
const untyped = plan(job('J001', 'pending')).replace('Type: bug\n', '');
const [typeless] = checkRecord({ path: paths('plan.md')[0], text: untyped }).violations;
assert.equal(typeless.code, 'invalid-plan-type');
assert.equal(typeless.field, 'Type');

console.log('record check tests passed');
