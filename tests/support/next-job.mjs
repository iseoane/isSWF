import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function checkNextJob(source) {
const module = await import(pathToFileURL(join(source, 'tools/isswf-status.mjs')));
assert.equal(typeof module.nextJob, 'function', 'isswf-status exports nextJob(jobs)');
const { nextJob } = module;
const job = (id, state, dependencies = [], blocker = 'None.') => ({ id, reportedStatus: state, dependencies, objective: `${id} objective`, blocker });

// The first pending job whose dependencies are all completed.
let next = nextJob([job('J1', 'completed'), job('J2', 'pending', ['J1']), job('J3', 'pending')]);
assert.equal(next.state, 'eligible');
assert.equal(next.job, 'J2');
assert.equal(next.objective, 'J2 objective');
assert.equal(next.executionAuthorized, false);
// A pending job with an unfinished dependency is not eligible; another one is.
assert.equal(nextJob([job('J1', 'in-progress'), job('J2', 'pending', ['J1']), job('J3', 'pending')]).job, 'J3');

// Nothing eligible: say why, in order.
next = nextJob([job('J1', 'awaiting-human', [], 'Choose a name'), job('J2', 'blocked', [], 'CI down')]);
assert.equal(next.state, 'awaiting-human');
assert.deepEqual(next.jobs.map(item => item.job), ['J1']);
assert.match(next.jobs[0].reason, /Choose a name/u);
assert.equal(nextJob([job('J1', 'in-review'), job('J2', 'pending', ['J1'])]).state, 'in-flight');
next = nextJob([job('J1', 'blocked', [], 'CI down'), job('J2', 'pending', ['J1'])]);
assert.equal(next.state, 'blocked');
assert.match(next.jobs[0].reason, /CI down/u);
next = nextJob([job('J1', 'pending', ['J2']), job('J2', 'pending', ['J1'])]);
assert.equal(next.state, 'waiting-on-dependencies');
assert.match(next.jobs[0].reason, /J2/u);
assert.equal(nextJob([job('J1', 'completed')]).state, 'none');
assert.equal(nextJob([]).state, 'none');

// The CLI prints it for an observed plan.
const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-next-job-')));
try {
  assert.equal(spawnSync('git', ['init', '-q', temp]).status, 0);
  const plan = join(temp, '.factory/initiatives/I0001');
  mkdirSync(plan, { recursive: true });
  const block = (id, state, deps) => `## ${id}\n\n- Status: ${state}\n- Objective: ${id} objective\n- Depends on: ${deps}\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: Go.\n\n### Acceptance\n\n- Outcome\n\n### Evidence\n\n- ${state === 'completed' ? 'Merged in #1.' : 'None.'}\n\n`;
  writeFileSync(join(plan, 'plan.md'), `# I0001: Synthetic\n\nType: enhancement\n\n${block('J001', 'completed', 'None')}${block('J002', 'pending', 'J001')}`);
  const run = spawnSync(process.execPath, [join(source, 'tools/isswf-status.mjs'), '--project', temp, '--initiative', 'I0001', '--next'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const printed = JSON.parse(run.stdout);
  assert.equal(printed.status, 'observed');
  assert.equal(printed.next.state, 'eligible');
  assert.equal(printed.next.job, 'J002');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
console.log('PASS next job');
}
