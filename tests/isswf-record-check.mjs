import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkRecord, REQUIRED_FIELDS } = await import(pathToFileURL(join(source, 'tools/isswf-record-check-core.mjs')));

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

// A `Run:` line the pane would ignore is a violation; the pane's own parser decides which ones.
const { parseRunLine, readSnapshot } = await import(pathToFileURL(join(source, 'tools/isswf-snapshot-core.mjs')));
// The labels every record needs, so fixtures only vary the field under test; an attempt need not carry the review's.
const attemptFields = ['Deviations from required procedure and consequence:', 'Process deviations observed:'];
const reviewFields = ['Unreviewed areas and evidence limits:', 'Convergence advice:', 'Process deviations observed:'];
const withFields = fields => fields.map(label => `- ${label} None.\n`).join('');
const attempt = (runs, fields = [...attemptFields, ...reviewFields]) => `# Attempt report\n\n## Identity and pinned inputs\n\n- Job ID and attempt ID: J001 A001\n${runs.map(run => `- Run: ${run}\n`).join('')}- Reported status: complete\n\n## Technical result\n\n${withFields(fields)}`;
const recordPaths = name => paths(`jobs/J001/${name}`).map((path, index) => (index ? path.replaceAll('/', '\\') : path));
const codes = (path, text) => checkRecord({ path, text }).violations.map(({ code }) => code);

// The pane reads records through an injected fs; this one is in memory.
const memoryFs = files => {
  const names = Object.keys(files);
  const under = dir => names.filter(name => name.startsWith(`${dir}/`));
  return {
    exists: async path => names.includes(path) || under(path).length > 0,
    list: async dir => [...new Set(under(dir).map(name => name.slice(dir.length + 1).split('/')[0]))].map(name => ({ name, kind: names.includes(`${dir}/${name}`) ? 'file' : 'dir' })),
    stat: async path => ({ size: files[path].length }),
    read: async path => files[path],
  };
};
const paneRuns = async text => {
  const base = '/work/project/.factory/initiatives/I0001';
  const snapshot = await readSnapshot('/work/project', memoryFs({ [`${base}/plan.md`]: plan(job('J001', 'in-progress')), [`${base}/jobs/J001/brief-r1.md`]: '# Brief\n', [`${base}/jobs/J001/A001.md`]: text }));
  return snapshot.initiatives[0].jobs[0].rounds[0].entries[0].runs;
};

const accepted = ['claude agent=a1b2c3', 'claude session=0f9e-77', 'pi child=run_42'];
const ignored = ['claude agent=a1b2c3 (resumed)', 'claude agent=', 'claude agent a1b2c3', 'codex child=x1', 'claude agent=a1 b2'];
for (const [name, text] of [['attempt', attempt(accepted)], ['review', attempt(accepted).replace('# Attempt report', '# Review report')]]) {
  for (const path of recordPaths(name === 'attempt' ? 'A001.md' : 'V001.md')) assert.deepEqual(codes(path, text), [], `${name} ${path}`);
}
for (const run of [...accepted, ...ignored]) {
  const text = attempt([run]);
  const paneSees = (await paneRuns(text)).length === 1;
  assert.equal(paneSees, parseRunLine(`- Run: ${run}`) !== null, `pane and parser agree on ${run}`);
  for (const path of recordPaths('A001.md')) assert.deepEqual(codes(path, text), paneSees ? [] : ['run-line-unparsed'], `${run} at ${path}`);
}
const [trailing] = checkRecord({ path: recordPaths('A001.md')[0], text: attempt(['claude agent=a1 (resumed)']) }).violations;
assert.deepEqual(trailing, { code: 'run-line-unparsed', field: 'Run:', line: 6, message: 'Run: line is ignored by the pane: use "- Run: <claude agent|claude session|pi child>=<id>" alone on the line' });
// A template line whose `<id>` was never replaced names no launch, though the pane's parser accepts it.
for (const path of recordPaths('A001.md')) assert.deepEqual(codes(path, attempt(['claude agent=<id>'])), ['run-id-unfilled']);
// The pane keeps `agent=unknown` as an identity, but the template says to omit the line when the ID is unknown.
assert.equal((await paneRuns(attempt(['claude agent=unknown'])))[0].id, 'unknown');
for (const path of recordPaths('A001.md')) assert.deepEqual(codes(path, attempt(['claude agent=unknown'])), ['run-id-unknown']);
assert.deepEqual(codes(recordPaths('A001.md')[0], attempt(['claude agent=a1']).replaceAll('\n', '\r\n')), [], 'CRLF records');
// Only plans and records are checked.
assert.deepEqual(codes(recordPaths('brief-r1.md')[0], '- Run: claude agent=\n'), []);

// A job directory that holds an attempt or review record contradicts a pending or blocked plan status.
const staged = plan(job('J001', 'pending'), job('J002', 'blocked'), job('J003', 'in-progress'), job('J004', 'pending'));
const listing = { J001: ['brief-r1.md', 'A001.md'], J002: ['brief-r1.md', 'V001.md'], J003: ['brief-r1.md', 'A001.md'], J004: ['brief-r1.md', 'notes.md'] };
const statusLine = id => lineOf(staged, `## ${id}`) + 2;
for (const path of paths('plan.md')) {
  assert.deepEqual(checkRecord({ path, text: staged, jobFiles: listing }), {
    ok: false,
    violations: [
      { code: 'records-for-unstarted-job', job: 'J001', field: 'Status', line: statusLine('J001'), message: 'J001 is pending but its directory holds A001.md' },
      { code: 'records-for-unstarted-job', job: 'J002', field: 'Status', line: statusLine('J002'), message: 'J002 is blocked but its directory holds V001.md' },
    ],
  });
}
assert.equal(checkRecord({ path: paths('plan.md')[0], text: staged }).ok, true, 'without a listing the rule has no input');
assert.deepEqual(checkRecord({ path: paths('plan.md')[0], text: invented, jobFiles: { J001: ['A001.md'] } }).violations.map(({ code }) => code), ['invalid-job'], 'an unparsed plan reports only its parse error');

// Each label the core enforces must still appear in its template, so a template rename cannot leave the check demanding a label no record is given.
for (const [kind, template] of [['A', 'attempt.md'], ['V', 'review.md']]) {
  const templateText = await readFile(join(source, '.factory/templates', template), 'utf8');
  for (const label of REQUIRED_FIELDS[kind]) assert.ok(templateText.includes(label), `${template} carries "${label}"`);
}

// A record missing a label of its current template is a violation, matched by the exact label.
const missing = (name, text) => checkRecord({ path: recordPaths(name)[0], text }).violations.filter(({ code }) => code === 'missing-field');
for (const [name, fields] of [['A001.md', attemptFields], ['V001.md', reviewFields]]) {
  assert.deepEqual(missing(name, attempt([], fields)), []);
  for (const label of fields) {
    for (const path of recordPaths(name)) {
      const text = attempt([], fields.filter(other => other !== label));
      assert.deepEqual(checkRecord({ path, text }).violations, [{ code: 'missing-field', field: label, message: `record lacks the template field "${label}"` }], `${name} without ${label}`);
    }
  }
}
assert.deepEqual(missing('A001.md', attempt([], ['Process deviations observed:']).replace('Process deviations observed:', 'Process deviations:')).map(({ field }) => field), ['Deviations from required procedure and consequence:', 'Process deviations observed:']);
assert.deepEqual(missing('A001.md', attempt([], attemptFields).replaceAll('\n', '\r\n')), [], 'CRLF records');
assert.deepEqual(missing('A001.md', attempt([], ['Process deviations observed:']).replace('- Process', '  - Process')).map(({ field }) => field), ['Deviations from required procedure and consequence:'], 'a nested bullet still carries the label');
assert.deepEqual(missing('brief-r1.md', ''), [], 'briefs have no required labels');
assert.deepEqual(missing('A001.md', attempt([], reviewFields)).map(({ field }) => field), ['Deviations from required procedure and consequence:'], 'an attempt does not need review labels');

// A review record that is new relative to the base carries finding resolutions from the closed vocabulary, each with a reason; older records keep their wording.
const resolutionLabel = 'Finding resolutions, recorded afterwards by the coordinator:';
const reviewWith = resolutions => `${attempt([], reviewFields).replace('# Attempt report', '# Review report')}- ${resolutionLabel} ${resolutions}\n`;
const resolutionViolations = (text, newRecord = true) => checkRecord({ path: recordPaths('V001.md')[0], text, newRecord }).violations;
const resolutionCodes = (resolutions, newRecord = true) => resolutionViolations(reviewWith(resolutions), newRecord).map(({ code }) => code);
for (const resolution of ['fixed', 'wrong', 'known-limit', 'not-material', 'dismissed']) assert.deepEqual(resolutionCodes(`F1 ${resolution}: the reason`), [], resolution);
assert.deepEqual(resolutionCodes('F1 fixed: reason one; S1 known-limit: tracked by J012; N2 dismissed: a reason, with a comma'), [], 'several entries on one line');
assert.deepEqual(resolutionCodes('None.'), []);
const templateLine = (await readFile(join(source, '.factory/templates/review.md'), 'utf8')).split('\n').find(line => line.includes(resolutionLabel));
assert.ok(templateLine, 'the real template carries the resolution line');
assert.deepEqual(resolutionViolations(`${attempt([], reviewFields).replace('# Attempt report', '# Review report')}${templateLine}\n`), [], 'the unfilled line of the real template');
for (const bad of ['F1 intentional: reason', 'F1 fixed', 'F1 fixed:', 'F1 not material: reason', 'fixed: reason', 'F1 fixed: ok; S1 wrong']) assert.deepEqual(resolutionCodes(bad), ['finding-resolution-invalid'], bad);
assert.deepEqual(resolutionCodes('F1 intentional: reason', false), [], 'a record that existed at the base keeps its wording');
assert.deepEqual(checkRecord({ path: recordPaths('V001.md')[0], text: reviewWith('F1 intentional: reason') }).violations, [], 'without a base nothing is new');
const badLine = reviewWith('F1 fixed: ok; S1 wrong');
assert.deepEqual(resolutionViolations(badLine), [{ code: 'finding-resolution-invalid', field: 'Finding resolutions', line: lineOf(badLine, 'Finding resolutions'), message: 'finding resolution "S1 wrong" is not "<ID> <fixed|wrong|known-limit|not-material|dismissed>: <reason>"' }]);
const nested = `${reviewWith('')}  - F1 fixed: reason\n  - S1 maybe: reason\n`;
assert.deepEqual(resolutionViolations(nested).map(({ message, line }) => [message.slice(0, 36), line]), [['finding resolution "S1 maybe: reason', lineOf(nested, 'S1 maybe')]], 'nested bullets are entries');
assert.deepEqual(checkRecord({ path: recordPaths('A001.md')[0], text: `${attempt([])}- Finding resolutions: F1 bogus\n`, newRecord: true }).violations, [], 'attempts have no resolutions');
assert.ok((await readFile(join(source, '.factory/templates/review.md'), 'utf8')).includes(resolutionLabel), 'the template carries the label the check reads');

// The CLI reads files, adds the job directory listing for a plan, prints JSON and exits 1 on any violation.
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-record-check-')));
try {
  const state = join(root, '.factory/initiatives/I0001');
  await mkdir(join(state, 'jobs/J001'), { recursive: true });
  await mkdir(join(state, 'jobs/J002'), { recursive: true });
  const files = {
    [join(state, 'plan.md')]: plan(job('J001', 'pending'), job('J002', 'in-progress')),
    [join(state, 'jobs/J001/A001.md')]: attempt(['claude agent=unknown'], ['Process deviations observed:']),
    [join(state, 'jobs/J002/A001.md')]: attempt(['claude agent=a1']),
  };
  for (const [file, text] of Object.entries(files)) await writeFile(file, text);
  const cli = (...args) => spawnSync(process.execPath, [join(source, 'tools/isswf-record-check.mjs'), ...args], { encoding: 'utf8', timeout: 15000 });
  const flat = [...Object.keys(files)].flatMap(file => ['--file', file]);
  const found = cli('--project', root, ...flat);
  assert.equal(found.status, 1, found.stderr);
  const report = JSON.parse(found.stdout);
  assert.equal(report.ok, false);
  assert.deepEqual(report.files.map(({ file, violations }) => [file, violations.map(({ code, field }) => [code, field])]), [
    [join(state, 'plan.md'), [['records-for-unstarted-job', 'Status']]],
    [join(state, 'jobs/J001/A001.md'), [['run-id-unknown', 'Run:'], ['missing-field', 'Deviations from required procedure and consequence:']]],
    [join(state, 'jobs/J002/A001.md'), []],
  ]);
  const clean = cli('--project', root, '--file', join(state, 'jobs/J002/A001.md'));
  assert.equal(clean.status, 0, clean.stderr);
  assert.deepEqual(JSON.parse(clean.stdout), { ok: true, files: [{ file: join(state, 'jobs/J002/A001.md'), ok: true, violations: [] }] });
  // The other separator style names the same file. Windows-only by design: a backslash is an ordinary filename character on POSIX, so the swap is skipped there.
  const swapped = process.platform === 'win32' ? join(state, 'jobs/J002/A001.md').replaceAll('\\', '/') : join(state, 'jobs/J002/A001.md');
  assert.equal(cli('--project', root.replaceAll('\\', '/'), '--file', swapped).status, 0);
  const before = JSON.stringify(await Promise.all(Object.keys(files).map(file => readFile(file, 'utf8'))));
  cli('--project', root, ...flat);
  assert.equal(JSON.stringify(await Promise.all(Object.keys(files).map(file => readFile(file, 'utf8')))), before, 'the check never edits files');
  // Usage errors and files outside the project fail without a report.
  for (const args of [[], ['--project', root], ['--file', join(state, 'plan.md')], ['--project', 'relative', '--file', join(state, 'plan.md')], ['--project', root, '--file', join(tmpdir(), 'elsewhere.md')], ['--project', root, '--file', join(state, 'missing.md')], ['--project', root, '--bogus', 'x']]) {
    const refused = cli(...args);
    assert.equal(refused.status, 1, args.join(' '));
    assert.equal(refused.stdout, '', args.join(' '));
  }
  // `--base REV` marks the records absent at REV as new: only they must use the resolution vocabulary.
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-C', root, ...args], { encoding: 'utf8', timeout: 15000 });
  const oldReview = join(state, 'jobs/J001/V001.md');
  const newReview = join(state, 'jobs/J001/V002.md');
  await writeFile(oldReview, reviewWith('F1 intentional: kept'));
  initRepository(root);
  assert.equal(git('add', '-A').status, 0);
  assert.equal(git('commit', '-q', '-m', 'base').status, 0);
  await writeFile(newReview, reviewWith('F1 intentional: kept'));
  const checked = (...files) => cli('--project', root, '--base', 'HEAD', ...files.flatMap(file => ['--file', file]));
  const judged = checked(oldReview, newReview);
  assert.equal(judged.status, 1, judged.stderr);
  assert.deepEqual(JSON.parse(judged.stdout).files.map(({ file, violations }) => [file, violations.map(({ code }) => code)]), [[oldReview, []], [newReview, ['finding-resolution-invalid']]]);
  await writeFile(newReview, reviewWith('F1 fixed: kept'));
  assert.equal(checked(oldReview, newReview).status, 0);
  assert.equal(cli('--project', root, '--file', newReview).status, 0, 'without --base nothing is new');
  // A project below the repository top level resolves its records from the project directory, not the top level.
  const nested = join(root, 'sub');
  const nestedState = join(nested, '.factory/initiatives/I0001/jobs/J001');
  await mkdir(nestedState, { recursive: true });
  const nestedOld = join(nestedState, 'V001.md');
  const nestedNew = join(nestedState, 'V002.md');
  await writeFile(nestedOld, reviewWith('F1 intentional: kept'));
  assert.equal(git('add', '-A').status, 0);
  assert.equal(git('commit', '-q', '-m', 'nested base').status, 0);
  await writeFile(nestedNew, reviewWith('F1 intentional: kept'));
  const nestedRun = cli('--project', nested, '--base', 'HEAD', '--file', nestedOld, '--file', nestedNew);
  assert.equal(nestedRun.status, 1, nestedRun.stderr);
  assert.deepEqual(JSON.parse(nestedRun.stdout).files.map(({ violations }) => violations.map(({ code }) => code)), [[], ['finding-resolution-invalid']]);
  for (const base of ['no-such-rev', '--file']) assert.equal(cli('--project', root, '--base', base, '--file', newReview).status, 1, `refuses base ${base}`);
} finally { await rm(root, { recursive: true, force: true }); }

console.log('record check tests passed');
