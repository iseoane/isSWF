import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, realpath, mkdir, writeFile, readFile, readdir, lstat, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const source = resolve(process.argv[2] || '.'), root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-status-test-')));
const project = join(root, 'project'); await mkdir(project);
assert.equal(spawnSync('git', ['init', '-q', project]).status, 0);
const invoke = (tool, args) => spawnSync(process.execPath, [join(source, 'tools', tool), ...args], { encoding: 'utf8', timeout: 15000 });
const inspect = () => { const result = invoke('isswf-status.mjs', ['--project', project, '--initiative', 'I0001']); assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); };
async function tree(path) {
  const output = {};
  for (const name of (await readdir(path)).sort()) {
    const file = join(path, name), stat = await lstat(file);
    output[name] = stat.isDirectory() ? await tree(file) : stat.isSymbolicLink() ? 'symlink' : createHash('sha256').update(await readFile(file)).digest('hex');
  }
  return output;
}
try {
  const absent = inspect(); assert.equal(absent.status, 'absent'); assert.equal(absent.freshness, 'not-verified'); assert.deepEqual(await readdir(project), ['.git']);
  const proposal = join(root, 'proposal.json'), grant = join(root, 'grant.json');
  const input = { version: 1, initiative: 'I0001', title: 'Status fixture', type: 'enhancement', jobs: [
    { id: 'J001', objective: 'First unit', status: 'in-progress', dependsOn: [], acceptance: ['Status: acceptance text is not a metadata field'], blocker: 'None', nextStep: 'Continue bounded work', evidence: ['candidate ref, not authenticated by status reader'] },
    { id: 'J002', objective: 'Second unit', status: 'blocked', dependsOn: ['J001'], acceptance: ['A result'], blocker: 'Await integrated J001', nextStep: 'Wait', evidence: [] },
  ] };
  await writeFile(proposal, JSON.stringify(input));
  await writeFile(grant, JSON.stringify({ version: 1, project, initiative: 'I0001', reference: 'Synthetic plan-only grant', permissions: ['plan'] }));
  const prepared = invoke('isswf-plan.mjs', ['prepare', '--project', project, '--initiative', 'I0001', '--proposal', proposal, '--grant', grant]); assert.equal(prepared.status, 0, prepared.stderr);
  const directory = join(project, '.factory/initiatives/I0001'), job = join(directory, 'jobs/J001'); await mkdir(job, { recursive: true });
  await writeFile(join(job, 'brief-r1.md'), '# Synthetic brief\n');
  await writeFile(join(job, 'A001.md'), '# Attempt report\n\n- Reported status: complete\n- Report timestamp and timezone: 2001-01-01T00:00:00Z\n');
  await writeFile(join(job, 'V001.md'), '# Review report\n- Verdict: pass\n');
  const before = await tree(project), observed = inspect();
  assert.equal(observed.freshness, 'not-verified');
  assert.equal(observed.initiative, 'I0001');
  assert.equal(observed.title, 'Status fixture');
  assert.equal(observed.label, 'I0001 · Status fixture');
  assert.equal(observed.status, 'observed'); assert.equal(observed.executionAuthorized, false); assert.equal(observed.processState, 'not-inspected');
  assert.equal(observed.jobs.length, 2); assert.equal(observed.jobs[0].reportedStatus, 'in-progress');
  assert.equal(observed.jobs[0].artifacts.reports[0].reportedStatus, 'complete');
  assert.deepEqual(observed.jobs[0].acceptance, ['Status: acceptance text is not a metadata field']);
  assert.equal(observed.jobs[0].artifacts.intake.status, 'absent');
  assert.equal(observed.jobs[1].artifacts.status, 'not-prepared'); assert.deepEqual(observed.jobs[1].dependencies, ['J001']);
  assert.equal(observed.jobs[1].blocker, 'Await integrated J001'); assert.ok(observed.plan.modifiedAt); assert.match(observed.limits, /not process heartbeats/u);
  assert.deepEqual(await tree(project), before);
  await writeFile(join(job, 'intake.json'), '{}'); assert.equal(inspect().jobs[0].artifacts.intake.status, 'unknown');
  await symlink(join(root, 'private'), join(directory, 'jobs/J002'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(inspect().jobs[1].artifacts.status, 'unknown');
  const planPath = join(directory, 'plan.md'), original = await readFile(planPath, 'utf8');
  await writeFile(planPath, original.replace('# I0001: Status fixture', '# I0001: Factory v1'));
  assert.equal(inspect().label, 'I0001 · Factory v1');
  assert.equal(inspect().initiative, 'I0001');
  await writeFile(planPath, original.replace('# I0001: Status fixture', '# I0001: '));
  assert.equal(inspect().status, 'unknown');
  await writeFile(planPath, original.replace('jobs/J001/brief-r1.md', '../../outside.md'));
  assert.equal(inspect().status, 'unknown'); assert.equal(inspect().freshness, 'not-verified');
  await writeFile(planPath, original.replace('- Status: in-progress', '- Status: invented'));
  assert.equal(inspect().status, 'unknown');
  await writeFile(planPath, original.replace('Type: enhancement\n', ''));
  const malformedBytes = await tree(project);
  assert.equal(inspect().status, 'unknown', 'missing canonical plan type remains explicitly unknown');
  assert.deepEqual(await tree(project), malformedBytes, 'status reads never rewrite malformed plan bytes');
  await writeFile(planPath, original.replace('## J002', '## J001')); assert.equal(inspect().status, 'unknown');
  await rm(planPath); await symlink(grant, planPath); assert.equal(inspect().status, 'unknown');
  console.log('PASS: actual plan and artifacts summarized without writes; absent/malformed/unsafe records visible; reported progress never becomes liveness or acceptance');
} finally { await rm(root, { recursive: true, force: true }); }
