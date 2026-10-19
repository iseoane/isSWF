import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? '.');
const { plan, parsePlan } = await import(pathToFileURL(join(source, 'tools/isswf-plan.mjs')));
assert.equal(typeof parsePlan, 'function', 'canonical status and worker admission need the same validated plan parser');
const root = await mkdtemp(join(tmpdir(), 'isswf-plan-dependencies-')), project = join(root, 'project');
try {
  await mkdir(project); const init = spawnSync('git', ['-C', project, 'init', '-q'], { encoding: 'utf8' }); assert.equal(init.status, 0, init.stderr);
  const grantPath = join(root, 'grant.json'), proposalPath = join(root, 'proposal.json');
  await writeFile(grantPath, JSON.stringify({ version: 1, project, initiative: 'I0001', permissions: ['plan'], reference: 'Synthetic test-only authority' }));
  const job = (id, dependsOn) => ({ id, dependsOn, status: 'pending', objective: 'Verify ' + id, acceptance: ['Observable result'], evidence: [], blocker: 'None', nextStep: 'Prepare' });
  await writeFile(proposalPath, JSON.stringify({ version: 1, initiative: 'I0001', title: 'Dependency fixture', type: 'enhancement', jobs: [job('J001', []), job('J002', ['J001'])] }));
  const prepared = await plan({ action: 'prepare', project, initiative: 'I0001', proposalPath, grantPath });
  const markdown = await readFile(prepared.path, 'utf8');
  const parsed = parsePlan(markdown);
  assert.deepEqual(parsed.map(j => ({ id: j.id, dependencies: j.dependencies, status: j.reportedStatus })), [{ id: 'J001', dependencies: [], status: 'pending' }, { id: 'J002', dependencies: ['J001'], status: 'pending' }]);
  assert.throws(() => parsePlan(markdown.replace('- Depends on: None', '- Depends on: J002')), /cyclic job dependencies/u);
  assert.throws(() => parsePlan(markdown.replace('- Depends on: J001', '- Depends on: J001, J001')), /invalid-dependency/u);
  assert.throws(() => parsePlan(markdown.replace('- Depends on: J001', '- Depends on: MISSING')), /invalid-dependency/u);
  assert.throws(() => parsePlan(markdown.replace('- Depends on: J001', '- Depends on: J002')), /invalid-dependency/u);
  console.log('PASS actual native canonical plan parser: exact status/edges, cycle, duplicate, missing and self-dependency refusal; no execution authority');
} finally { await rm(root, { recursive: true, force: true }); }
