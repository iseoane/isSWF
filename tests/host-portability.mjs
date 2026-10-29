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
// Static instruction-contract regression, not a live agent-adherence assertion.
const reviewGuidance = await read('.agents/roles/references/review.md');
assert.match(reviewGuidance, /## Required methodology/u);
assert.match(reviewGuidance, /full canonical contents/u, 'Trusted full-content handoffs must remain valid');
assert.match(reviewGuidance, /role summary or a link is not/u);
assert.match(reviewGuidance, /Standards.*inconclusive/u, 'Unread required procedure cannot accompany a complete pass');
assert.match(reviewGuidance, /budget.*does not waive/u);
assert.match(reviewGuidance, /optional.*does not/u, 'Do not turn optional tools or references into mandatory gates');
for (const pattern of [/changed candidate.*delta/u, /affected checks/u, /explicit requirement mandates independence/u, /fresh model review merely because the candidate identity changed/u, /candidate identity, provenance/u, /prior adverse or inconclusive verdicts/u]) assert.match(reviewGuidance, pattern, 'Review guidance must define proportionate, candidate-pinned delta verification');
const coordinatorDelta = skill.slice(skill.indexOf('For review, select'), skill.indexOf('For assigned review'));
assert.match(coordinatorDelta, /changed candidate.*affected delta/u);
assert.match(coordinatorDelta, /explicit requirement calls for it/u);
assert.match(coordinatorDelta, /do not demand a fresh model call solely/u);
assert.match(coordinatorDelta, /Preserve prior adverse or inconclusive verdicts/u);
const reviewRole = await read('.agents/roles/reviewer.md');
assert.match(reviewRole, /Before assessing the candidate/u);
assert.ok(reviewRole.includes('references/review.md#required-methodology'));
assert.match(reviewRole, /required resources.*consumed/u);
assert.match(reviewRole, /delta-based verification rule/u);
assert.match(reviewRole, /A new identity alone does not require a fresh model call/u);
assert.match(reviewRole, /Preserve prior adverse or inconclusive verdicts/u);
const durableWork = await read('docs/durable-work.md');
assert.match(durableWork, /Before the first native dispatch.*including an inline small task/u);
assert.match(durableWork, /If both exist, stop for reconciliation/u);
assert.match(durableWork, /Native Markdown record creation does not require the source CLI/u);
assert.match(durableWork, /current `parsePlan` contract/u);
assert.match(durableWork, /do not replace unrelated content or overwrite/iu);
assert.match(durableWork, /Read-only planner\/researcher\/reviewer roles may return findings only in their handoff/u);
assert.match(durableWork, /actual observer\/role, candidate or source, provenance/u);
assert.match(durableWork, /only after its writer is stopped/iu);
assert.match(durableWork, /post-hoc collision detection is not containment/u);
assert.match(durableWork, /no fixed artifact bundle or new filename is mandatory/u);
assert.match(durableWork, /For a changed candidate.*records the delta/u);
assert.match(durableWork, /changed identity alone does not require a fresh model call/u);
assert.match(durableWork, /Preserve prior adverse or inconclusive verdicts/u);
assert.match(skill, /Before the first native dispatch for new work/u);
assert.match(skill, /Read-only planner\/researcher\/reviewer results may arrive in the handoff/u);
assert.match(skill, /operator authority\/budget rules/u);
assert.match(skill, /selected skill and required reference/u);
assert.match(skill, /canonical absolute paths beneath the trusted factory root/u);
assert.match(skill, /full canonical contents/u);
assert.match(skill, /selection\/configuration alone is not consumption/iu);
assert.match(skill, /Missing required methodology blocks the affected assignment/u);
const workerContract = await read('.agents/roles/worker.md');
assert.match(workerContract, /trusted-root-resolved paths or full canonical contents/u);
assert.match(workerContract, /actually consumed \(read or supplied in full\)/u);
assert.match(workerContract, /missing\/unreadable required resource/u);
assert.match(workerContract, /selection alone is not evidence/u);
assert.ok(skill.includes('`<state>/project-setup.md`'), 'Tracking choice must use the single selected state root');
assert.ok(!skill.includes('`.factory/project-setup.md`'), 'Coordinator must not hard-code the legacy setup path');
for (const file of ['.agents/hosts/pi.md', '.agents/hosts/claude-code.md']) {
  const hostGuide = await read(file);
  assert.match(hostGuide, /Before the first native dispatch for new work/u);
  assert.match(hostGuide, /stop if both `\.isswf` and `\.factory` exist/u);
  assert.match(hostGuide, /plan CLI is optional/u);
  assert.match(hostGuide, /Do not stage worker\/reviewer artifacts until their writer is stopped/u);
  assert.match(hostGuide, /inline small-task handoff supplements, but does not replace|as a supplement to its minimal canonical plan and curated brief/u);
}
const reviewSkill = await read('.agents/skills/isswf-review/SKILL.md');
assert.ok(reviewSkill.includes('../../roles/references/review.md#required-methodology'));
assert.match(skill, /check required methodology coverage/u);
assert.match(skill, /Do not accept.*pass.*required procedure/u);
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
assert.match(host, /Selected methodology/u);
assert.match(host, /absolute resource paths or full canonical contents/u);
assert.match(host, /actually consumed \(read or received in full\)/u);
assert.match(host, /Do not claim all present or future Claude children lack Skill support/u);
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
assert.match(piHost, /selected method skill and required reference/u);
assert.match(piHost, /absolute path or full canonical contents/u);
assert.match(piHost, /actually read or supplied in full/u);
assert.match(piHost, /selection alone is not consumption/u);
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
