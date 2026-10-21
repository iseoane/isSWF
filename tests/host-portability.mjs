import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const read = (file) => readFile(path.join(root, file), 'utf8');
const manifest = JSON.parse(await read('.claude-plugin/plugin.json'));
assert.equal(manifest.name, 'isswf');
assert.ok(manifest.skills.includes('./skills/isswf-coordinator'));
for (const file of ['skills/isswf-coordinator/SKILL.md', ...manifest.agents]) {
  assert.ok((await read(file)).length > 0, `missing manifest entry ${file}`);
}
for (const [file, role] of [['agents/isswf-worker.md','worker'],['agents/isswf-reviewer.md','reviewer'],['agents/isswf-researcher.md','researcher'],['agents/isswf-planner.md','planner']]) {
  const body = await read(file);
  assert.match(body, new RegExp(`\\.agents/roles/${role}\\.md`));
  assert.match(body, /Read /);
  assert.ok(body.length < 1200, `${file} should remain a thin wrapper`);
}
const skill = await read('.agents/skills/isswf-coordinator/SKILL.md');
assert.match(skill, /actually running in Claude Code/);
assert.match(skill, /Pi remains the default/);
const host = await read('.agents/hosts/claude-code.md');
assert.match(host, /Bash.*not.*sandbox/i);
assert.match(host, /exact retained candidate.*stopped writer|stopped writer.*partial candidate/i);
assert.doesNotMatch(host, /bypassPermissions|permissionMode:|hooks:|mcpServers:/i);
const docs = await read('docs/host-portability.md');
assert.match(docs, /--plugin-dir/);
assert.match(docs, /\/isswf:isswf-coordinator/);
assert.match(docs, /static contract check, not proof of live delegation/i);
assert.match(docs, /does not establish Pi-equivalent sandboxing/i);
assert.doesNotMatch(docs, /A00[1-3]|2\.1\.299|bounded live validation/i);
const piManifest = JSON.parse(await read('package.json'));
assert.equal(piManifest.version, manifest.version, 'Pi and plugin must publish one release version');
assert.deepEqual(piManifest.pi.skills, ['./.agents/skills/isswf-coordinator', './.agents/skills/isswf-setup']);
assert.deepEqual(piManifest.bin, { isswf: 'tools/isswf.mjs' });
assert.ok(manifest.skills.includes('./skills/isswf-setup'));
const worker = await read('tools/isswf-job.mjs');
assert.match(worker, /only exact configured LunaHigh worker route supported; no fallback/);
assert.match(worker, /installed runtime must match the explicit project pin/);
const preparer = await read('tools/pi-worker-task.mjs');
assert.match(preparer, /profile must pin methodology files at the authorized baseline/);
assert.match(preparer, /brief.path must name a committed regular-file blob/);
console.log('host-portability: static manifest and preserved contract checks ok; no Claude invocation');
