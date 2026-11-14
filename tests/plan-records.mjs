import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { parsePlan, planStates } = await import(pathToFileURL(join(source, 'tools/isswf-plan.mjs')));

const job = ({ status = 'pending', acceptance = '### Acceptance\n\n- Observable outcome\n' } = {}) =>
  `# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n${acceptance}\n### Evidence\n\n- Synthetic record\n`;
for (const status of planStates) assert.equal(parsePlan(job({ status }))[0].reportedStatus, status);
for (const status of ['active', 'done', 'ready']) assert.throws(() => parsePlan(job({ status })), /^Error: invalid-job$/u, status);
assert.throws(() => parsePlan(job({ acceptance: '' })), /^Error: invalid-job$/u);
// Each error keeps its message and says where it is: job, field and 1-based line.
const where = (markdown) => { try { parsePlan(markdown); } catch (error) { return { code: error.code, job: error.job, field: error.field, line: error.line }; } };
const lineOf = (markdown, text) => markdown.split('\n').findIndex(line => line.includes(text)) + 1;
const base = job();
assert.deepEqual(where(job({ status: 'done' })), { code: 'invalid-job', job: 'J001', field: 'Status', line: lineOf(base, '- Status:') });
assert.deepEqual(where(job({ acceptance: '' })), { code: 'invalid-job', job: 'J001', field: 'Acceptance', line: lineOf(base, '## J001') });
const noted = base.replace('(jobs/J001/brief-r1.md)', '(jobs/J001/brief-r1.md) (r1 superseded)');
assert.deepEqual(where(noted), { code: 'unsafe-brief-reference', job: 'J001', field: 'Brief', line: lineOf(base, '- Brief:') });
assert.deepEqual(where(base.replace('- Depends on: None', '- Depends on: J009')), { code: 'invalid-dependency', job: 'J001', field: 'Depends on', line: lineOf(base, '- Depends on:') });
assert.deepEqual(where(base.replace('- Blocker: None.\n', '- Blocker: None.\n- Blocker: Again.\n')), { code: 'duplicate-field', job: 'J001', field: 'Blocker', line: lineOf(base, '- Blocker:') + 1 });
assert.deepEqual(where(base.replace('Type: bug', 'Type: chore')), { code: 'invalid-plan-type', job: undefined, field: 'Type', line: lineOf(base, 'Type:') });
assert.throws(() => parsePlan(noted), /^Error: unsafe-brief-reference$/u);

// Historical records predate the current contract and stay unchanged; any other plan must parse.
const knownHistorical = new Map();
const root = join(source, '.factory/initiatives');
let checked = 0;
for (const entry of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  let markdown;
  try { markdown = await readFile(join(root, entry.name, 'plan.md'), 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const expected = knownHistorical.get(entry.name);
  if (expected) assert.throws(() => parsePlan(markdown), new RegExp(`^Error: ${expected}$`, 'u'), `${entry.name} now parses; remove it from knownHistorical`);
  else assert.doesNotThrow(() => parsePlan(markdown), `${entry.name}/plan.md must parse with parsePlan`);
  checked++;
}
assert.ok(checked > knownHistorical.size);
console.log(`plan records: ${checked} plans checked, ${knownHistorical.size} known historical exceptions`);
