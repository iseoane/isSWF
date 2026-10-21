import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
assert.match(docs, /static integration only, not live-model verified/i);
assert.equal(await read('package.json'), '{\n  "name": "isswf-pi-resources",\n  "version": "1.0.0",\n  "description": "A fixed-version Pi resource package for isSWF project workflows.",\n  "pi": {\n    "skills": [\n      "./.agents/skills/isswf-coordinator",\n      "./.agents/skills/isswf-setup"\n    ]\n  }\n}\n');
const piRuntimePins = {
  'tools/isswf-job.mjs': 'a1d3f5d21b5861b1e7c5b1892755d8016ca1c1e7a09d13032817d57feb0de939',
  'tools/pi-worker-task.mjs': '49fa47475cc63e1267177d92a2fdcb7f0f23d38781d7403df6b89c05feb4b4cf',
};
for (const [file, expected] of Object.entries(piRuntimePins)) {
  const bytes = await readFile(path.join(root, file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `Pi runtime changed: ${file}`);
}
console.log('host-portability: ok');
