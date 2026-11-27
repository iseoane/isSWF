// The job state machine: `isswf-status` derives in-progress and in-review from attempt (A) and review (V) records, and every legacy plan value still parses.
import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.'), root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-job-state-')));
const project = join(root, 'project'); await mkdir(project);
initRepository(project);
const invoke = (tool, args) => spawnSync(process.execPath, [join(source, 'tools', tool), ...args], { encoding: 'utf8', timeout: 15000 });
const core = await import(pathToFileURL(join(source, 'tools/isswf-plan-core.mjs')).href);
const status = { pending: 'pending', 'in-progress': 'in-progress', 'in-review': 'in-review', blocked: 'blocked', 'awaiting-human': 'awaiting-human', completed: 'completed' };
try {
  // One job per stored value and record combination; the plan keeps the stored value, the status tool reports the derived one.
  const cases = [
    ['J001', 'pending', [], 'pending'],
    ['J002', 'pending', ['A001.md'], 'in-progress'],
    ['J003', 'pending', ['A001.md', 'V001.md'], 'in-review'],
    ['J004', 'in-progress', [], 'in-progress'],
    ['J005', 'in-review', ['A001.md'], 'in-review'],
    ['J006', 'blocked', ['A001.md', 'V001.md'], 'blocked'],
    ['J007', 'awaiting-human', ['A001.md'], 'awaiting-human'],
    ['J008', 'completed', ['A001.md', 'V001.md'], 'completed'],
    // A correction after a review: more attempts than reviews puts the work back with its author.
    ['J009', 'pending', ['A001.md', 'V001.md', 'A002.md'], 'in-progress'],
    ['J010', 'in-review', ['A001.md', 'V001.md', 'A002.md'], 'in-progress'],
    ['J011', 'pending', ['A001.md', 'A002.md', 'V001.md', 'V002.md'], 'in-review'],
  ];
  const jobs = cases.map(([id, stored]) => ({ id, objective: `Job ${id}`, status: stored, dependsOn: [], acceptance: ['A result'], blocker: 'None', nextStep: 'None', evidence: stored === 'completed' ? ['Merged'] : [] }));
  await writeFile(join(root, 'proposal.json'), JSON.stringify({ version: 1, initiative: 'I0001', title: 'Job state fixture', type: 'enhancement', jobs }));
  await writeFile(join(root, 'grant.json'), JSON.stringify({ version: 1, project, initiative: 'I0001', reference: 'Synthetic plan-only grant', permissions: ['plan'] }));
  const prepared = invoke('isswf-plan.mjs', ['prepare', '--project', project, '--initiative', 'I0001', '--proposal', join(root, 'proposal.json'), '--grant', join(root, 'grant.json')]);
  assert.equal(prepared.status, 0, prepared.stderr);
  for (const [id, , records] of cases) {
    const directory = join(project, '.factory/initiatives/I0001/jobs', id); await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'brief-r1.md'), '# Brief\n');
    for (const record of records) await writeFile(join(directory, record), '# Record\n');
  }
  const result = invoke('isswf-status.mjs', ['--project', project, '--initiative', 'I0001']);
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(result.stdout);
  assert.deepEqual(observed.jobs.map(job => [job.id, job.reportedStatus, job.status]), cases.map(([id, stored, , derived]) => [id, stored, derived]));

  // The fixture above holds every legacy value and still parses. A value outside the shared module is refused.
  assert.deepEqual([...core.jobStates], Object.keys(status));
  const invented = `# I0002: Legacy

Type: maintenance

## J001

- Status: invented
- Objective: One
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A result
`;
  assert.throws(() => core.parsePlan(invented), { code: 'invalid-job' });

  // The moves: in-review is derived, so only a legacy plan moves out of it.
  const allowed = { pending: ['in-progress', 'blocked', 'awaiting-human'], 'in-progress': ['blocked', 'awaiting-human', 'completed'], blocked: ['in-progress', 'pending', 'awaiting-human'], 'awaiting-human': ['in-progress', 'pending', 'blocked'], 'in-review': ['in-progress', 'blocked', 'awaiting-human', 'completed'], completed: [] };
  for (const from of core.jobStates) assert.deepEqual(core.jobStates.filter(to => core.canTransition(from, to)), core.jobStates.filter(to => allowed[from].includes(to)), from);
} finally { await rm(root, { recursive: true, force: true }); }
console.log('job-state ok');
