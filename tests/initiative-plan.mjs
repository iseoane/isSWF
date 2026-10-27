import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink, lstat , realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] || '.'), root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-plan-test-')));
const project = join(root, 'project'), proposal = join(root, 'proposal.json'), grant = join(root, 'grant.json');
await mkdir(project);
assert.equal(spawnSync('git', ['init', '-q', project]).status, 0);
const input = { version: 1, initiative: 'I0042', title: 'A bounded feature', type: 'enhancement', jobs: [
  { id: 'J001', objective: 'First unit', status: 'pending', dependsOn: [], acceptance: ['Observable result'], nextStep: 'Prepare first brief', blocker: 'None', evidence: [] },
  { id: 'J002', objective: 'Dependent unit', status: 'pending', dependsOn: ['J001'], acceptance: ['Second result'], nextStep: 'Wait for J001', blocker: 'J001 is not complete', evidence: [] },
] };
const authority = { version: 1, project, initiative: 'I0042', reference: 'Synthetic operator grant', permissions: ['plan'] };
async function save() { await writeFile(proposal, JSON.stringify(input)); await writeFile(grant, JSON.stringify(authority)); }
function run(action, extra = []) {
  return spawnSync(process.execPath, [join(source, 'tools/isswf-plan.mjs'), action, '--project', project, '--initiative', 'I0042', ...extra], { encoding: 'utf8', timeout: 15000 });
}
const mutation = ['--proposal', proposal, '--grant', grant];
try {
  await save();
  assert.equal(JSON.parse(run('read').stdout).status, 'absent');
  assert.deepEqual(await readdir(project), ['.git']);
  assert.notEqual(run('prepare', ['--proposal', proposal]).status, 0);
  assert.deepEqual(await readdir(project), ['.git']);
  const created = run('prepare', mutation); assert.equal(created.status, 0, created.stderr);
  const first = JSON.parse(created.stdout), bytes = await readFile(first.path, 'utf8');
  assert.equal(first.status, 'prepared'); assert.equal(first.executionAuthorized, false);
  assert.match(bytes, /Depends on: J001/u); assert.match(bytes, /jobs\/J002\/brief-r1.md/u);
  assert.equal(JSON.parse(run('prepare', mutation).stdout).status, 'reused');
  assert.equal(JSON.parse(run('read').stdout).markdown, bytes);
  input.jobs[0].status = 'completed'; await save();
  assert.notEqual(run('revise', [...mutation, '--expected-sha256', first.sha256]).status, 0);
  input.jobs[0].evidence = ['Reviewed commit abc and passing test report']; await save();
  assert.notEqual(run('prepare', mutation).status, 0);
  assert.notEqual(run('revise', [...mutation, '--expected-sha256', '0'.repeat(64)]).status, 0);
  assert.equal(await readFile(first.path, 'utf8'), bytes);
  const uncommitted = run('revise', [...mutation, '--expected-sha256', first.sha256]);
  assert.notEqual(uncommitted.status, 0, 'Uncommitted prior plan must block revision');
  assert.match(uncommitted.stderr, /checkpoint required/u);
  assert.equal(await readFile(first.path, 'utf8'), bytes);
  await assert.rejects(readdir(join(project, '.factory/initiatives/I0042/.plan-write')), { code: 'ENOENT' });
  const gitEnv = { PATH: process.env.PATH, HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  assert.equal(spawnSync('git', ['-C', project, 'add', '.factory'], { env: gitEnv }).status, 0);
  assert.equal(spawnSync('git', ['-C', project, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Checkpoint original plan'], { env: gitEnv }).status, 0);
  const revised = run('revise', [...mutation, '--expected-sha256', first.sha256]); assert.equal(revised.status, 0, revised.stderr);
  assert.equal(JSON.parse(revised.stdout).status, 'revised');
  assert.equal(spawnSync('git', ['-C', project, 'show', 'HEAD:.factory/initiatives/I0042/plan.md'], { env: gitEnv, encoding: 'utf8' }).stdout, bytes);
  assert.deepEqual(await readdir(join(project, '.factory/initiatives/I0042')), ['plan.md']);
  input.jobs[1].nextStep = 'A further change'; await save();
  assert.equal(spawnSync('git', ['-C', project, 'add', '.factory'], { env: gitEnv }).status, 0);
  const stagedOnly = run('revise', [...mutation, '--expected-sha256', JSON.parse(revised.stdout).sha256]);
  assert.notEqual(stagedOnly.status, 0); assert.match(stagedOnly.stderr, /checkpoint required/u);
  assert.equal(JSON.parse(run('read').stdout).sha256, JSON.parse(revised.stdout).sha256);
  await assert.rejects(readdir(join(project, '.factory/initiatives/I0042/.plan-write')), { code: 'ENOENT' });
  input.jobs[0].dependsOn = ['J002']; await save();
  assert.notEqual(run('revise', [...mutation, '--expected-sha256', JSON.parse(revised.stdout).sha256]).status, 0);
  input.jobs[0].dependsOn = []; authority.permissions = ['plan', 'execute']; await save();
  assert.notEqual(run('prepare', mutation).status, 0);
  await mkdir(join(root, 'elsewhere'));
  const unsafeAlias = join(project, '.factory/initiatives/I0043');
  await symlink(join(root, 'elsewhere'), unsafeAlias, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal((await lstat(unsafeAlias)).isSymbolicLink(), true, 'The directory-alias negative fixture must exist');
  const unsafe = spawnSync(process.execPath, [join(source, 'tools/isswf-plan.mjs'), 'read', '--project', project, '--initiative', 'I0043'], { encoding: 'utf8' });
  assert.notEqual(unsafe.status, 0);
  assert.match(unsafe.stderr, /regular directory required/u);
  assert.deepEqual(await readdir(join(root, 'elsewhere')), []);
  console.log('PASS: local multi-job plan, dependencies, readonly read, repeat, guarded revisions with exact prior Git checkpoint and no duplicate history files, missing authority, evidence and cycle guards');
} finally { await rm(root, { recursive: true, force: true }); }
