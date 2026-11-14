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

// A `Run:` line the pane would ignore is a violation; the pane's own parser decides which ones.
const { parseRunLine, readSnapshot } = await import(pathToFileURL(join(source, 'tools/isswf-snapshot-core.mjs')));
const attempt = runs => `# Attempt report\n\n## Identity and pinned inputs\n\n- Job ID and attempt ID: J001 A001\n${runs.map(run => `- Run: ${run}\n`).join('')}- Reported status: complete\n`;
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
// The pane keeps `agent=unknown` as an identity, but the template says to omit the line when the ID is unknown.
assert.equal((await paneRuns(attempt(['claude agent=unknown'])))[0].id, 'unknown');
for (const path of recordPaths('A001.md')) assert.deepEqual(codes(path, attempt(['claude agent=unknown'])), ['run-id-unknown']);
assert.deepEqual(codes(recordPaths('A001.md')[0], attempt(['claude agent=a1']).replaceAll('\n', '\r\n')), [], 'CRLF records');
// Only plans and records are checked.
assert.deepEqual(codes(recordPaths('brief-r1.md')[0], '- Run: claude agent=\n'), []);

console.log('record check tests passed');
