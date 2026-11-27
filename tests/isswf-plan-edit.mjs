import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { parsePlan } = await import(pathToFileURL(join(source, 'tools/isswf-plan-core.mjs')));
const { createPlanFile, editPlanFile } = await import(pathToFileURL(join(source, 'tools/isswf-plan-edit.mjs')));
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

  // The brief field is set by the tool too; a revision that the parser refuses as a reference is refused before writing.
  expectEdit(setField(withEol(plan(block('J001'), block('J002', { pending: ' (pending until prepared)' }))), { job: 'J002', field: 'Brief', value: '[brief-r1.md](jobs/J002/brief-r1.md)' }), plan(block('J001'), block('J002')));
  assert.throws(() => setField(base, { job: 'J002', field: 'Brief', value: '[brief-r1.md](jobs/J002/brief-r1.md) ' }), label);
  expectEdit(appendEvidence(base, { job: 'J001', value: '2026-11-15: ran the focused test' }), plan(block('J001', { evidence: ['2026-11-15: ran the focused test'] }), block('J002')));
  const evidenced = withEol(plan(block('J001', { evidence: ['first'] }), block('J002')));
  expectEdit(appendEvidence(evidenced, { job: 'J001', value: 'second' }), plan(block('J001', { evidence: ['first', 'second'] }), block('J002')));
  const open = withEol(plan(block('J001'), block('J002', { evidence: ['first'] }))).slice(0, -eol.length);
  assert.equal(appendEvidence(open, { job: 'J002', value: 'second' }), withEol(plan(block('J001'), block('J002', { evidence: ['first', 'second'] }))).slice(0, -eol.length), label);

  expectEdit(addJob(withEol(plan(block('J001'))), jobSpec), `${plan(block('J001'))}\n${addedBlock}`);
  expectEdit(addJob(withEol(plan(block('J001'))).slice(0, -eol.length), jobSpec), `${plan(block('J001'))}\n${addedBlock}`);
  expectEdit(addJob(withEol(plan(block('J001'))), { ...jobSpec, dependsOn: [] }), `${plan(block('J001'))}\n${block('J002', { size: 'S (one flow)', objective: 'Add the thing', next: 'Prepare the brief.', acceptance: ['First outcome', 'Second outcome'], pending: ' (pending until prepared)' })}`);
}

// Every Unicode control character and line or paragraph separator would end the line for some reader, so a value holding one is refused.
for (const bad of [0x85, 0x2028, 0x2029, 0x9f].map(code => String.fromCharCode(code))) {
  const value = `one${bad}two`;
  const current = plan(block('J001'));
  assert.throws(() => setField(current, { job: 'J001', field: 'Next step', value }), { code: 'invalid-value' }, JSON.stringify(bad));
  assert.throws(() => appendEvidence(current, { job: 'J001', value }), { code: 'invalid-value' }, JSON.stringify(bad));
  assert.throws(() => addJob(current, { ...jobSpec, objective: value }), { code: 'invalid-value' }, JSON.stringify(bad));
}

// appendEvidence by plan shape, with the exact text each branch writes.
const evidenceShapes = [
  ['no Evidence section', block('J001').replace('\n### Evidence\n\n- None.\n', ''), text => `${text}\n### Evidence\n\n- added\n`],
  ['empty Evidence section', block('J001', { evidence: [] }), () => `${block('J001', { evidence: ['added'] })}\n`],
  ['a lone placeholder with no blank line before it', block('J001').replace('### Evidence\n\n- None.', '### Evidence\n- None.'), text => text.replace('- None.', '- added')],
];
for (const [name, jobText, expected] of evidenceShapes) {
  const result = appendEvidence(plan(jobText), { job: 'J001', value: 'added' });
  assert.equal(result, plan(expected(jobText)), name);
  assert.equal(parsePlan(result)[0].evidence.at(-1), 'added', name);
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

  // A request that would produce an invalid plan, or that cannot be read, exits 1 with a coded JSON error and leaves the plan byte-identical.
  const current = plan(block('J001'), block('J002', { status: 'in-progress' }));
  await writeFile(planPath, current);
  const target = ['--project', project, '--initiative', 'I0001'];
  const addArgs = (job, deps = 'J001') => ['add-job', ...target, '--job', job, '--objective', 'Add', '--depends-on', deps, '--size', 'S', '--next-step', 'Go', '--acceptance', 'Outcome'];
  const refused = async (args, code, where = {}) => {
    const before = await readFile(planPath);
    const done = cli(...args);
    assert.equal(done.status, 1, `${args.join(' ')} ${done.stderr}`);
    assert.equal(done.out.ok, false, args.join(' '));
    assert.equal(done.out.code, code, args.join(' '));
    for (const [key, value] of Object.entries(where)) assert.deepEqual(done.out[key], value, `${args.join(' ')} ${key}`);
    assert.deepEqual(await readFile(planPath), before, args.join(' '));
  };
  await refused(['set', ...target, '--job', 'J999', '--field', 'Status', '--value', 'in-progress'], 'unknown-job');
  await refused(['set', ...target, '--job', 'J001', '--field', 'Status', '--value', 'invented'], 'invalid-job', { job: 'J001', field: 'Status' });
  await refused(['set', ...target, '--job', 'J001', '--field', 'Status', '--value', 'completed'], 'completed jobs require evidence', { job: 'J001' });
  // in-review is derived from review records, so an edit never writes it; a move the transition table rejects is refused.
  await refused(['set', ...target, '--job', 'J002', '--field', 'Status', '--value', 'in-review'], 'invalid-transition', { job: 'J002', from: 'in-progress', to: 'in-review' });
  await refused(['set', ...target, '--job', 'J001', '--field', 'Status', '--value', 'in-review'], 'invalid-transition', { job: 'J001', from: 'pending', to: 'in-review' });
  await refused(['set', ...target, '--job', 'J001', '--field', 'Objective', '--value', 'Other'], 'unknown-field');
  await refused(['set', ...target, '--job', 'J001', '--field', 'Next step', '--value', 'one\ntwo'], 'invalid-value');
  await refused(['set', ...target, '--job', 'J001', '--field', 'Next step', '--value', 'tab\there'], 'invalid-value');
  await refused(['set', ...target, '--job', 'J001', '--field', 'Next step', '--value', ' '], 'invalid-value');
  await refused(['append-evidence', ...target, '--job', 'J999', '--value', 'ran it'], 'unknown-job');
  await refused(['append-evidence', ...target, '--job', 'J001', '--value', 'one\r\ntwo'], 'invalid-value');
  await refused(addArgs('J003', 'J404'), 'invalid-dependency', { job: 'J003', field: 'Depends on' });
  await refused(addArgs('J003', 'J003'), 'invalid-dependency');
  await refused(addArgs('J001'), 'duplicate-job', { job: 'J001' });
  await refused(addArgs('j3'), 'invalid-job-id');
  await refused([...addArgs('J003'), '--acceptance', ''], 'invalid-value');
  await refused(['add-job', ...target, '--job', 'J003', '--objective', 'Add', '--depends-on', 'J001', '--size', 'S', '--next-step', 'Go'], 'usage');
  await refused(['rename', ...target], 'usage');
  await refused(['set', ...target, '--job', 'J001', '--field', 'Status', '--value', 'pending', '--bogus', 'x'], 'usage');
  await refused(['set', '--project', 'relative/path', '--initiative', 'I0001', '--job', 'J001', '--field', 'Status', '--value', 'pending'], 'invalid-project');
  await refused(['set', '--project', project, '--initiative', '../I0001', '--job', 'J001', '--field', 'Status', '--value', 'pending'], 'invalid-initiative');
  await refused(['set', '--project', project, '--initiative', 'I0404', '--job', 'J001', '--field', 'Status', '--value', 'pending'], 'plan-not-found');

  // A plan that was hand-edited into an invalid state is reported, not repaired or extended.
  const handEdited = current.replace('- Brief: [brief-r1.md](jobs/J001/brief-r1.md)', '- Brief: None.');
  await writeFile(planPath, handEdited);
  await refused(['set', ...target, '--job', 'J002', '--field', 'Status', '--value', 'pending'], 'current-plan-invalid', { planError: { code: 'unsafe-brief-reference', job: 'J001', field: 'Brief', line: handEdited.split('\n').findIndex(line => line.startsWith('- Brief: None.')) + 1 } });
  await writeFile(planPath, current);

  // new-plan refuses an existing plan and an invalid request without writing anything.
  const newArgs = (initiative, type = 'bug') => ['new-plan', '--project', project, '--initiative', initiative, '--title', 'Another', '--type', type, '--job', 'J001', '--objective', 'Add', '--depends-on', 'None', '--size', 'S', '--next-step', 'Go', '--acceptance', 'Outcome'];
  const existing = await readFile(planPath);
  const exists = cli(...newArgs('I0001'));
  assert.deepEqual([exists.status, exists.out.code], [1, 'plan-exists']);
  assert.deepEqual(await readFile(planPath), existing);
  for (const [args, code] of [[newArgs('I0003', 'chore'), 'invalid-plan-type'], [newArgs('i0003'), 'invalid-initiative'], [[...newArgs('I0003'), '--job', 'J001'], 'usage']]) {
    const done = cli(...args);
    assert.deepEqual([done.status, done.out.ok, done.out.code], [1, false, code], code);
    assert.equal(await readFile(join(project, '.factory/initiatives/I0003/plan.md')).catch(error => error.code), 'ENOENT', code);
  }

  // A new plan is written whole to a temporary file and linked into place, so no reader sees it partial and a plan that appears meanwhile is not replaced.
  const fresher = join(project, '.factory/initiatives/I0005');
  let seen;
  await createPlanFile({ project, initiative: 'I0005', text: fresh, beforeLink: async () => {
    const names = await readdir(fresher);
    seen = { names: names.length, plan: names.includes('plan.md'), temp: names[0] && await readFile(join(fresher, names[0]), 'utf8') };
  } });
  assert.deepEqual(seen, { names: 1, plan: false, temp: fresh });
  assert.deepEqual(await readdir(fresher), ['plan.md']);
  assert.equal(await readFile(join(fresher, 'plan.md'), 'utf8'), fresh);
  await rm(join(fresher, 'plan.md'));
  await assert.rejects(createPlanFile({ project, initiative: 'I0005', text: fresh, beforeLink: () => writeFile(join(fresher, 'plan.md'), 'other writer') }), { code: 'plan-exists' });
  assert.equal(await readFile(join(fresher, 'plan.md'), 'utf8'), 'other writer');
  assert.deepEqual(await readdir(fresher), ['plan.md']);

  // A project that does not exist, or has no state directory, is refused and nothing is created for it.
  await mkdir(join(root, 'bare'));
  const entries = await readdir(root);
  for (const absent of [join(root, 'missing'), join(root, 'bare')]) {
    for (const args of [newArgs('I0003'), ['set', ...target, '--job', 'J001', '--field', 'Status', '--value', 'pending'], ['append-evidence', ...target, '--job', 'J001', '--value', 'x']]) {
      const done = cli(...args.map(value => (value === project ? absent : value)));
      assert.deepEqual([done.status, done.out.ok, done.out.code], [1, false, 'state-not-found'], `${absent} ${args[0]}`);
    }
  }
  assert.deepEqual(await readdir(root), entries);
  assert.deepEqual(await readdir(join(root, 'bare')), []);

  // A plan another writer changed between read and rename is not overwritten, and no temporary file is left.
  await writeFile(planPath, current);
  const edit = text => setField(text, { job: 'J001', field: 'Status', value: 'in-progress' });
  const changed = current.replace('Intro text.', 'Intro text, edited meanwhile.');
  for (const [name, change] of [['edited', () => writeFile(planPath, changed)], ['same length', () => writeFile(planPath, current.replace('Intro text.', 'Intro texts'))], ['removed', () => rm(planPath)]]) {
    await writeFile(planPath, current);
    await assert.rejects(editPlanFile({ project, initiative: 'I0001', edit, beforeRename: change }), { code: 'plan-changed' }, name);
    assert.deepEqual((await readdir(join(project, '.factory/initiatives/I0001'))).filter(entry => entry.endsWith('.tmp')), [], name);
  }
  assert.equal(await readFile(planPath, 'utf8').catch(error => error.code), 'ENOENT');
  await writeFile(planPath, changed);
  await assert.rejects(editPlanFile({ project, initiative: 'I0001', edit, beforeRename: () => writeFile(planPath, current) }), { code: 'plan-changed' }, 'restored to different bytes');
  assert.equal(await readFile(planPath, 'utf8'), current);
  await editPlanFile({ project, initiative: 'I0001', edit, beforeRename: async () => {} });
  assert.equal(await readFile(planPath, 'utf8'), plan(block('J001', { status: 'in-progress' }), block('J002', { status: 'in-progress' })));
} finally { await rm(root, { recursive: true, force: true }); }

console.log('plan edit tests passed');
