import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const root = await mkdtemp(join(tmpdir(), 'isswf-plan-boundary-'));
const project = join(root, 'project spaces ñ'), sibling = join(root, 'project spaces ñ-sibling');
const proposal = join(root, 'proposal.json');
let passed = false;
try {
  await mkdir(project); await mkdir(sibling);
  const initialized = spawnSync('git', ['init', '-q', project], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(initialized.error);
  assert.equal(initialized.status, 0, initialized.stderr);
  // Stop after authority validation; durable publication and directory sync are separate behavior.
  await writeFile(proposal, '{"version":2}\n');
  const grant = { version: 1, project: await realpath(project), initiative: 'I0042', reference: 'Synthetic boundary regression', permissions: ['plan'] };
  const external = join(root, 'external.json'), siblingGrant = join(sibling, 'grant.json'), internal = join(project, 'internal.json');
  for (const path of [external, siblingGrant, internal]) await writeFile(path, JSON.stringify(grant));
  const externalBytes = await readFile(external), siblingBytes = await readFile(siblingGrant), internalBytes = await readFile(internal);
  function probe(path, expected) {
    const result = spawnSync(process.execPath, [join(source, 'tools/isswf-plan.mjs'), 'prepare', '--project', project, '--initiative', 'I0042', '--proposal', proposal, '--grant', path], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0, `unexpected success for ${path}`);
    assert.equal(result.stderr.trim(), expected, `unexpected diagnostic for ${path}`);
  }
  // Both valid outside locations must reach proposal validation, not be misclassified as internal.
  probe(external, 'invalid initiative plan');
  probe(siblingGrant, 'invalid initiative plan');
  probe(internal, 'grant must be external');
  probe(project, 'grant must be external');

  const projectAlias = join(root, 'project-alias');
  await symlink(project, projectAlias, process.platform === 'win32' ? 'junction' : 'dir');
  probe(join(projectAlias, 'internal.json'), 'grant must be external');
  const externalAlias = join(project, 'external-alias');
  await symlink(sibling, externalAlias, process.platform === 'win32' ? 'junction' : 'dir');
  const projectEntries = await readdir(project);
  probe(join(externalAlias, 'grant.json'), 'invalid initiative plan');

  assert.deepEqual(await readdir(project), projectEntries);
  assert.deepEqual(await readFile(external), externalBytes);
  assert.deepEqual(await readFile(siblingGrant), siblingBytes);
  assert.deepEqual(await readFile(internal), internalBytes);
  await assert.rejects(readdir(join(project, '.factory')), { code: 'ENOENT' }, 'refusals must not publish initiative/state files');
  passed = true;
  console.log('PASS native external/internal/root/prefix-sibling/canonical-alias plan grant boundaries; unchanged grants and no initiative/state publication');
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained failing boundary fixture: ${root}`);
}
