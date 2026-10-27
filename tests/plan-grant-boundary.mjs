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
  assert.equal(spawnSync('git', ['init', '-q', project]).status, 0);
  // Stop at rendering after authority validation, before durable publication.
  // Directory fsync support is an independent platform capability.
  await writeFile(proposal, '{"version":2}\n');
  const grant = { version: 1, project: await realpath(project), initiative: 'I0042', reference: 'Synthetic boundary regression', permissions: ['plan'] };
  const external = join(root, 'external.json'), internal = join(project, 'internal.json');
  for (const path of [external, internal, join(sibling, 'grant.json')]) await writeFile(path, JSON.stringify(grant));
  const initial = await readdir(project);
  const probe = (path, expected) => {
    const result = spawnSync(process.execPath, [join(source, 'tools/isswf-plan.mjs'), 'prepare', '--project', project, '--initiative', 'I0042', '--proposal', proposal, '--grant', path], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error); assert.notEqual(result.status, 0);
    assert.equal(result.stderr.trim(), expected);
  };
  probe(external, 'invalid initiative plan');
  probe(join(sibling, 'grant.json'), 'invalid initiative plan');
  probe(internal, 'grant must be external');
  probe(project, 'grant must be external');
  const alias = join(root, 'project-alias');
  await symlink(project, alias, process.platform === 'win32' ? 'junction' : 'dir');
  probe(join(alias, 'internal.json'), 'grant must be external');
  const externalAlias = join(project, 'external-alias');
  await symlink(sibling, externalAlias, process.platform === 'win32' ? 'junction' : 'dir');
  probe(join(externalAlias, 'grant.json'), 'invalid initiative plan');
  assert.deepEqual((await readdir(project)).filter(name => name !== 'external-alias'), initial);
  assert.deepEqual(JSON.parse(await readFile(external, 'utf8')), grant);
  passed = true;
  console.log('PASS native external/internal/root/prefix-sibling/canonical-alias plan grant boundaries; no plan publication or provider calls');
} finally {
  if (passed) await rm(root, { recursive: true, force: true });
  else console.error(`Retained failing boundary fixture: ${root}`);
}
