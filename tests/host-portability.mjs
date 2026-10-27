import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const read = (file) => readFile(path.join(root, file), 'utf8');
const manifest = JSON.parse(await read('.claude-plugin/plugin.json'));
assert.equal(manifest.name, 'isswf');
assert.ok(manifest.skills.includes('./skills/isswf-coordinator'));
assert.equal(manifest.agents, undefined, 'Use Claude default-directory discovery, not per-file manifest entries');
assert.deepEqual((await readdir(path.join(root, 'agents'))).sort(), ['isswf-planner.md', 'isswf-researcher.md', 'isswf-reviewer.md', 'isswf-worker.md']);
for (const file of manifest.skills.map(skill => `${skill}/SKILL.md`)) {
  assert.ok((await read(file)).length > 0, `missing manifest entry ${file}`);
}
for (const [file, role] of [['agents/isswf-worker.md','worker'],['agents/isswf-reviewer.md','reviewer'],['agents/isswf-researcher.md','researcher'],['agents/isswf-planner.md','planner']]) {
  const body = await read(file);
  assert.match(body, new RegExp(`\\.agents/roles/${role}\\.md`));
  assert.match(body, /Read /);
  assert.match(body, /Required child context/);
  assert.match(body, /before.*work/i);
  assert.match(body, /missing.*block|block.*missing/i);
  if (role === 'reviewer') assert.match(body, /^tools: Read, Grep, Glob$/m, 'Claude reviewer must remain read-only');
  assert.ok(body.length < 1200, `${file} should remain a thin wrapper`);
}
const skill = await read('.agents/skills/isswf-coordinator/SKILL.md');
assert.ok(skill.includes('[isswf-issue](../isswf-issue/SKILL.md)'), 'Coordinator must route independent reports to the shared issue skill');
assert.match(skill, /actually running in Claude Code/);
assert.match(skill, /Windows and Linux, Pi and Claude Code are equal/);
assert.match(skill, /No|Neither|Neither path requires/u);
const claudeSkill = await read('skills/isswf-coordinator/SKILL.md');
assert.match(claudeSkill, /Required child context/);
assert.doesNotMatch(claudeSkill, /locate|runtimeId|artifactId/);
const host = await read('.agents/hosts/claude-code.md');
assert.match(host, /## Required child context/);
assert.match(host, /## External worktree assignments/);
assert.match(host, /isswf\.worktreeRoot/u);
assert.match(host, /Missing native working-directory support blocks/u);
for (const field of ['Factory resources', 'Task', 'Checkout', 'Review', 'Host and model', 'Documents']) assert.ok(host.includes(field));
assert.match(host, /no factory release receipt, project runtime pin/);
assert.match(host, /acknowledge/);
assert.match(host, /Missing.*blocks/);
assert.match(host, /Bash.*not.*sandbox/i);
assert.match(host, /exact retained candidate.*stopped writer|stopped writer.*partial candidate/i);
assert.doesNotMatch(host, /bypassPermissions|permissionMode:|hooks:|mcpServers:/i);
const piHost = await read('.agents/hosts/pi.md');
assert.match(piHost, /pi-subagents.*0\.83\.0/);
assert.match(piHost, /agentOverrides/);
assert.match(piHost, /thinking/);
assert.match(piHost, /async: false/);
assert.match(piHost, /contact_supervisor/);
assert.match(piHost, /does not install.*automatically/i);
const docs = await read('docs/host-portability.md');
assert.match(docs, /--plugin-dir/);
assert.match(docs, /\/isswf:isswf-coordinator/);
assert.match(docs, /static contract check, not proof of live delegation/i);
assert.match(docs, /does not establish Pi-equivalent sandboxing/i);
const piManifest = JSON.parse(await read('package.json'));
assert.equal(piManifest.version, manifest.version, 'Pi and plugin must publish one release version');
assert.deepEqual(piManifest.pi.skills, ['./.agents/skills/isswf-coordinator', './.agents/skills/isswf-setup', './.agents/skills/isswf-writing', './.agents/skills/isswf-understanding', './.agents/skills/isswf-pr', './.agents/skills/isswf-issue', './.agents/skills/isswf-e2e', './.agents/skills/isswf-debug', './.agents/skills/isswf-review', './.agents/skills/isswf-retrospective', './.agents/skills/isswf-tdd', './.agents/skills/isswf-security', './.agents/skills/isswf-performance', './.agents/skills/isswf-observability']);
assert.deepEqual(piManifest.bin, { isswf: 'tools/isswf.mjs' }, 'Retained legacy executable is not removed');
assert.deepEqual(piManifest.pi.subagents, { agents: ['./.agents/hosts/pi/agents'] });
for (const role of ['worker', 'reviewer', 'researcher', 'planner']) {
  const body = await read('.agents/hosts/pi/agents/isswf-' + role + '.md');
  assert.match(body, new RegExp('name: isswf-' + role));
  assert.ok(body.includes('.agents/roles/' + role + '.md'));
  assert.doesNotMatch(body, /^model:|^thinking:/mu, 'Host settings own model/effort');
  assert.match(body, /Missing.*blocks/);
  assert.ok(body.length < 1200);
  if (role !== 'worker') assert.match(body, /^tools: read, grep, find, ls$/mu);
}
for (const name of ['isswf-writing', 'isswf-understanding', 'isswf-pr', 'isswf-issue', 'isswf-e2e', 'isswf-debug', 'isswf-review', 'isswf-retrospective', 'isswf-tdd', 'isswf-security', 'isswf-performance', 'isswf-observability']) {
  assert.ok(piManifest.files.includes(`.agents/skills/${name}`));
  assert.ok(manifest.skills.includes(`./skills/${name}`));
  const body = await read(`.agents/skills/${name}/SKILL.md`);
  assert.equal(body.match(/^name: (.+)$/mu)?.[1], name);
  assert.match(body, /^---\nname: [a-z0-9-]+\ndescription: .+\n---\n/u);
  for (const match of body.matchAll(/\[[^\]]*\]\((references\/[^)]+)\)/gu)) {
    assert.ok((await read(`.agents/skills/${name}/${match[1]}`)).length > 0);
  }
  const wrapper = await read(`skills/${name}/SKILL.md`);
  assert.ok(wrapper.includes('${CLAUDE_PLUGIN_ROOT}/.agents/skills/' + name + '/SKILL.md'));
  assert.ok(wrapper.length < 800, 'Utility wrappers must keep methodology in the shared skill');
}
for (const [name, role, reference] of [
  ['debug', 'diagnostician', 'bug-diagnosis'],
  ['review', 'reviewer', 'review'],
  ['retrospective', 'retrospective', 'retrospective'],
  ['tdd', 'worker', 'tdd'],
]) {
  const path = '../skills/isswf-' + name + '/SKILL.md';
  assert.ok((await read('.agents/roles/' + role + '.md')).includes(path));
  assert.ok(skill.includes('../isswf-' + name + '/SKILL.md'));
  const body = await read('.agents/skills/isswf-' + name + '/SKILL.md');
  assert.ok(body.includes('../../roles/references/' + reference + '.md'));
  assert.match(body, /does not require factory activation/u);
  assert.match(body, /Missing required evidence or capability/u);
}
for (const name of ['security', 'performance', 'observability']) {
  assert.ok(skill.includes('../isswf-' + name + '/SKILL.md'));
  for (const role of ['worker', 'reviewer', 'diagnostician']) assert.ok((await read('.agents/roles/' + role + '.md')).includes('../skills/isswf-' + name + '/SKILL.md'));
  const body = await read('.agents/skills/isswf-' + name + '/SKILL.md');
  assert.match(body, /does not require factory activation/u);
  assert.match(body, /text-only/iu);
}
const featureFlow = await read('.agents/roles/references/feature-delivery.md');
assert.ok(skill.includes('../../roles/references/feature-delivery.md'));
for (const file of ['.agents/skills/isswf-setup/SKILL.md', '.agents/skills/isswf-pr/SKILL.md', '.agents/roles/delivery.md', '.agents/roles/references/delivery.md']) assert.ok((await read(file)).includes('feature-delivery.md'), 'Workflow consumer must link to its canonical contract: ' + file);
for (const pattern of [/trusted operator request/u, /read-only, local-only/u, /prospective/u, /finite.*budget/u, /Definition questions|definition decision/u, /Do not merge/u, /auto-merge/u, /delivery helper may remain prepare-only/u]) assert.match(featureFlow, pattern);
assert.match(featureFlow, /configuration.*not permission|not permission on their own/iu);
assert.match(await read('.agents/skills/isswf-setup/SKILL.md'), /Establish readiness for normal feature delivery/u);
assert.match(await read('.agents/skills/isswf-setup/SKILL.md'), /Initialization defaults alone do not establish this readiness/u);
const multiAgentSetup = await read('.agents/skills/isswf-setup/SKILL.md');
for (const pattern of [/Configure the multi-agent composition/u, /enabled or conditional/u, /maximum total actors and concurrent actors/u, /correction\/review round budget/u, /dependencies or independence requirements/u, /do not create another dispatcher/u, /existing `project-setup.md`/u, /Reuse a settled composition/u]) assert.match(multiAgentSetup, pattern);
assert.match(await read('.factory/templates/job-brief.md'), /Current feature-start or other authorization source/u);
assert.match(await read('.factory/templates/delivery.md'), /Integration boundary/u);
assert.match(await read('AGENTS.md'), /trusted current feature-to-PR start/u);
assert.match(skill, /implementation alone/u);
const effectGuide = await read('docs/local-worker-lifecycle.md');
assert.match(effectGuide, /materializes that authorization into the concrete external-effect grant/u);
assert.match(effectGuide, /Neither the helper nor a sandbox worker gains publication authority/u);
const e2e = await read('.agents/skills/isswf-e2e/SKILL.md');
assert.match(e2e, /does not require factory activation/u);
for (const mode of ['Create or extend', 'Run', 'Maintain or audit']) assert.ok(e2e.includes(mode));
for (const reference of ['browser.md', 'cli-and-api.md', 'test-quality.md']) assert.ok(e2e.includes('references/' + reference));
assert.match(e2e, /Generated tests that were not executed are a draft/u);
assert.match(e2e, /Installing a framework, browser binary or service needs a current installation\/network grant/u);
assert.match(await read('.agents/skills/isswf-e2e/references/browser.md'), /Playwright is an option/u);
assert.match(await read('.agents/skills/isswf-e2e/references/test-quality.md'), /without interactive instructions to an AI agent/u);
assert.ok(skill.includes('../isswf-e2e/SKILL.md'));
assert.ok((await read('.agents/roles/worker.md')).includes('../skills/isswf-e2e/SKILL.md'));
assert.ok((await read('tools/isswf-job.mjs')).includes("installedRelease?.files['.agents/skills/isswf-e2e/SKILL.md']"));
const delivery = await read('.agents/roles/delivery.md');
assert.ok(delivery.includes('[isswf-pr](../skills/isswf-pr/SKILL.md)'), 'Delivery must use the shared PR skill');
const deliveryReference = await read('.agents/roles/references/delivery.md');
assert.ok(deliveryReference.includes('[isswf-pr](../../skills/isswf-pr/SKILL.md)'));
assert.ok(deliveryReference.includes('../../skills/isswf-pr/references/risk-assessment.md'));
const prDescription = await read('.agents/skills/isswf-pr/references/pr-description.md');
assert.match(prDescription, /^## Risk assessment$/mu);
assert.match(prDescription, /^## Testing$/mu);
assert.ok((await read('.factory/templates/delivery.md')).includes('.agents/skills/isswf-pr/references/risk-assessment.md'));
assert.ok(manifest.skills.includes('./skills/isswf-setup'));
const setup = await read('.agents/skills/isswf-setup/SKILL.md');
assert.match(setup, /## Discover before asking/);
assert.match(setup, /### Select the local worktree location/u);
assert.match(setup, /git config --local/u);
assert.ok(skill.includes('../../roles/references/worktrees.md'));
const worktrees = await read('.agents/roles/references/worktrees.md');
assert.match(worktrees, /sole location setting/u);
assert.match(worktrees, /unknown or active writer blocks/u);
assert.match(worktrees, /does not change Pi task snapshots/u);
assert.match(worktrees, /Do not copy the absolute path into tracked setup records/u);
assert.ok((await read('.gitignore')).split('\n').includes('/.claude/worktrees/'));
assert.match(setup, /current directory.*subdirectory/);
assert.match(setup, /full HEAD SHA automatically/);
assert.match(setup, /initial setup, existing setup to reconcile, available runtime update, or interrupted operation/);
assert.match(setup, /pi --offline --list-models/);
assert.match(setup, /For an initial model selection, ask/);
assert.match(setup, /host availability is not executor support/);
assert.match(setup, /source-checkout mode must leave a missing config pending/);
assert.match(setup, /Persist Claude-native role\/model\/effort decisions/);
assert.doesNotMatch(setup, /full input checkpoint named in the trusted grant/);
const claudeSetup = await read('skills/isswf-setup/SKILL.md');
assert.match(claudeSetup, /\$\{CLAUDE_PLUGIN_ROOT\}\/\.agents\/skills\/isswf-setup\/SKILL\.md/);
assert.match(host, /## Setup model choices/);
assert.match(host, /Claude Code model selection/);
assert.match(host, /Setup selection is a preference, not assignment approval/);
const worker = await read('tools/isswf-job.mjs');
assert.match(worker, /only exact configured LunaHigh worker route supported; no fallback/);
assert.match(worker, /installed runtime must match the explicit project pin/);
const preparer = await read('tools/pi-worker-task.mjs');
assert.match(preparer, /profile must pin methodology files at the authorized baseline/);
assert.match(preparer, /brief.path must name a committed regular-file blob/);
// These are instruction-contract checks, not a live evaluation of agent adherence.
for (const role of ['planner', 'researcher']) {
  for (const file of [`.agents/roles/${role}.md`, `.agents/roles/references/${role === 'planner' ? 'planning' : 'research'}.md`]) {
    const body = await read(file);
    assert.match(body, /complete brief.*handoff/u, `${file}: an ordinary inline assignment must not require a committed brief`);
    assert.match(body, /explicitly checkpoint-pinned document assignments/u, `${file}: scope the additional document gates explicitly`);
    assert.match(body, /full Git SHA/u, `${file}: retain full-SHA protection for assigned document pins`);
    assert.match(body, /readable checkpoint material/u, `${file}: read-only profiles need a coordinator-supplied pinned-input route`);
    assert.match(body, /(?:missing|unavailable)[^.]*blocks?/iu, `${file}: missing required evidence must still block`);
    assert.doesNotMatch(body, /(?:An actual|Require an actual) research-job brief path/u, `${file}: remove the unconditional legacy input gate`);
    assert.doesNotMatch(body, /when the grant, durable brief path/u, `${file}: a durable brief is conditional, not a universal stop condition`);
  }
}
assert.match(await read('.agents/roles/references/planning.md'), /write.*artifact only.*explicitly authorized/u, 'Read-only planners return through the authorized channel instead of requiring a file write');
assert.match(await read('.agents/roles/references/research.md'), /never substitute.*latest/u, 'Unavailable pinned documents must not silently become current files');
console.log('host-portability: static manifest and preserved contract checks ok; no Claude invocation');
