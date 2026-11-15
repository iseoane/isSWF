import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { parsePlan } = await import(pathToFileURL(join(source, 'tools/isswf-plan-core.mjs')));
const { setField, appendEvidence, addJob, newPlan } = await import(pathToFileURL(join(source, 'tools/isswf-plan-edit-core.mjs')));

// One job in the plan format the coordinator writes, so expectations differ from the input only in the field under test.
const block = (id, { status = 'pending', deps = 'None', evidence = ['None.'], blocker = 'None.', next = 'Prepare.', size = 'S (synthetic)', objective = `Synthetic ${id}`, acceptance = ['Observable outcome'], pending = '' } = {}) => [
  `## ${id}`, '', `- Status: ${status}`, `- Size: ${size}`, `- Objective: ${objective}`, `- Depends on: ${deps}`, `- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)${pending}`, `- Blocker: ${blocker}`, `- Next step: ${next}`, '',
  '### Acceptance', '', ...acceptance.map(item => `- ${item}`), '', '### Evidence', '', ...evidence.map(item => `- ${item}`), '',
].join('\n');
const plan = (...jobs) => ['# I0001: Synthetic', '', 'Type: bug', '', 'Intro text.', '', jobs.join('\n')].join('\n');
const jobSpec = { job: 'J002', objective: 'Add the thing', dependsOn: ['J001'], size: 'S (one flow)', nextStep: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'] };
const addedBlock = block('J002', { deps: 'J001', size: 'S (one flow)', objective: 'Add the thing', next: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'], pending: ' (pending until prepared)' });

// Each edit changes only its own lines; CRLF and LF plans keep their endings and every result parses.
for (const eol of ['\n', '\r\n']) {
  const withEol = text => text.replaceAll('\n', eol);
  const label = JSON.stringify(eol);
  const expectEdit = (actual, expected) => {
    assert.equal(actual, withEol(expected), label);
    assert.ok(parsePlan(actual).length >= 1, label);
  };
  const base = withEol(plan(block('J001'), block('J002')));

  expectEdit(setField(base, { job: 'J002', field: 'Status', value: 'in-progress' }), plan(block('J001'), block('J002', { status: 'in-progress' })));
  expectEdit(setField(base, { job: 'J002', field: 'Blocker', value: 'Waiting for $& and $1' }), plan(block('J001'), block('J002', { blocker: 'Waiting for $& and $1' })));
  expectEdit(setField(base, { job: 'J001', field: 'Next step', value: 'Dispatch the worker.' }), plan(block('J001', { next: 'Dispatch the worker.' }), block('J002')));

  expectEdit(appendEvidence(base, { job: 'J001', value: '2026-11-15: ran the focused test' }), plan(block('J001', { evidence: ['2026-11-15: ran the focused test'] }), block('J002')));
  const evidenced = withEol(plan(block('J001', { evidence: ['first'] }), block('J002')));
  expectEdit(appendEvidence(evidenced, { job: 'J001', value: 'second' }), plan(block('J001', { evidence: ['first', 'second'] }), block('J002')));
  const open = withEol(plan(block('J001'), block('J002', { evidence: ['first'] }))).slice(0, -eol.length);
  assert.equal(appendEvidence(open, { job: 'J002', value: 'second' }), withEol(plan(block('J001'), block('J002', { evidence: ['first', 'second'] }))).slice(0, -eol.length), label);

  expectEdit(addJob(withEol(plan(block('J001'))), jobSpec), `${plan(block('J001'))}\n${addedBlock}`);
  expectEdit(addJob(withEol(plan(block('J001'))).slice(0, -eol.length), jobSpec), `${plan(block('J001'))}\n${addedBlock}`);
  expectEdit(addJob(withEol(plan(block('J001'))), { ...jobSpec, dependsOn: [] }), `${plan(block('J001'))}\n${block('J002', { size: 'S (one flow)', objective: 'Add the thing', next: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'], pending: ' (pending until prepared)' })}`);
}

const fresh = newPlan({ initiative: 'I0002', title: 'Fresh plan', type: 'enhancement', ...jobSpec, job: 'J001', dependsOn: [] });
assert.equal(fresh, `# I0002: Fresh plan\n\nType: enhancement\n\n${block('J001', { size: 'S (one flow)', objective: 'Add the thing', next: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'], pending: ' (pending until prepared)' })}`);
assert.equal(parsePlan(fresh).length, 1);

// The command applies the same edits to the plan under the state directory; `\` and `/` project paths both work.
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-plan-edit-')));
try {
  const project = join(root, 'project');
  const planPath = join(project, '.factory/initiatives/I0001/plan.md');
  await mkdir(join(project, '.factory/initiatives/I0001'), { recursive: true });
  const cli = (...args) => {
    const run = spawnSync(process.execPath, [join(source, 'tools/isswf-plan-edit.mjs'), ...args], { encoding: 'utf8', timeout: 15000 });
    return { status: run.status, out: run.stdout.trim() ? JSON.parse(run.stdout) : undefined, stderr: run.stderr };
  };
  const spellings = [project, ...(process.platform === 'win32' ? [project.replaceAll('\\', '/')] : [])];
  for (const eol of ['\n', '\r\n']) for (const spelled of spellings) {
    const withEol = text => text.replaceAll('\n', eol);
    const target = ['--project', spelled, '--initiative', 'I0001'];
    const run = async (args, expected, result) => {
      const done = cli(...args);
      assert.equal(done.status, 0, done.stderr);
      assert.deepEqual(done.out, result);
      assert.equal(await readFile(planPath, 'utf8'), withEol(expected), args[0]);
    };
    await writeFile(planPath, withEol(plan(block('J001'), block('J002'))));
    await run(['set', ...target, '--job', 'J002', '--field', 'Status', '--value', 'in-progress'], plan(block('J001'), block('J002', { status: 'in-progress' })), { ok: true, initiative: 'I0001', job: 'J002', action: 'set' });
    await run(['append-evidence', ...target, '--job', 'J001', '--value', 'ran it'], plan(block('J001', { evidence: ['ran it'] }), block('J002', { status: 'in-progress' })), { ok: true, initiative: 'I0001', job: 'J001', action: 'append-evidence' });
    await run(['add-job', ...target, '--job', 'J003', '--objective', 'Add the thing', '--depends-on', 'J001,J002', '--size', 'S (one flow)', '--next-step', 'Prepare the brief.', '--acceptance', 'First outcome', '--acceptance', 'Second outcome'],
      `${plan(block('J001', { evidence: ['ran it'] }), block('J002', { status: 'in-progress' }))}\n${block('J003', { deps: 'J001, J002', size: 'S (one flow)', objective: 'Add the thing', next: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'], pending: ' (pending until prepared)' })}`, { ok: true, initiative: 'I0001', job: 'J003', action: 'add-job' });
  }

  const created = cli('new-plan', '--project', project, '--initiative', 'I0002', '--title', 'Fresh plan', '--type', 'enhancement', '--job', 'J001', '--objective', 'Add the thing', '--depends-on', 'None', '--size', 'S (one flow)', '--next-step', 'Prepare the brief.', '--acceptance', 'First outcome', '--acceptance', 'Second outcome');
  assert.equal(created.status, 0, created.stderr);
  assert.deepEqual(created.out, { ok: true, initiative: 'I0002', job: 'J001', action: 'new-plan' });
  assert.equal(await readFile(join(project, '.factory/initiatives/I0002/plan.md'), 'utf8'), fresh);
} finally { await rm(root, { recursive: true, force: true }); }

console.log('plan edit tests passed');
