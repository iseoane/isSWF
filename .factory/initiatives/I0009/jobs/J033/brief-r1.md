# J033: One authoritative model configuration

## Current assignment and boundary

Operator explicitly requests resolving divergent/distributed model configuration with one editable authority; the future methodology-evidence UI is out of scope. This is a new bounded feature-to-PR assignment after J032; do not start other pending jobs. Trusted factory root/target `/home/iseoane/Work/isSWF`; base `5cd5a95c49e7a9b735328979d752b37679f1548c`, exclusive feature branch `feat/model-config-single-source`. GitHub destination iseoane/isSWF, main via PR; coordinator owns explicit-file commits/push/PR/CI. Integration, release, installation, project pin migration, global config changes and cleanup remain separate. Preserve all current effective Pi selections and unrelated host settings and local evidence. Do not silently change models/effort, paid coverage or host capability claims.

## Outcome and acceptance

One unambiguous editable authority for current isSWF model selections, with supported Pi/Claude host application or transparent limitations. No divergent independently editable mirror config or accidental fallback to legacy defaults. Exact native mappings must remain verifiable. Host-specific identifiers/efforts remain distinct where required; never pretend a single provider ID is valid in both hosts. Generated projections, if structurally necessary, must be clearly derived and guard drift rather than become a second owner. Prefer existing native mechanisms and minimal code over a new dispatcher or config engine.

1. Inventory current readers/writers/defaults and distinguish native current usage, packaged defaults, installed initialization and pinned legacy inputs.
2. Adopt one explicit ownership model for new/current work; document editable source vs any derived host projection and precedence/drift/missing-input behavior.
3. Preserve current approved choices; no automatic installation/configuration mutation or historical pin/schema rewrite. Legacy compatibility may remain only explicitly scoped, not presented as a competing current source.
4. Include relevant setup/host/coordinator guidance, affected installer/package/docs/templates/tests in one functional unit; update paired EN/ES human guides where affected. Verify Linux/Windows and Pi/Claude equivalent intended mechanisms without unnecessary live models or fabricated host capability.
5. Ordinary selection, unrelated-settings preservation, conflict/drift, missing/unsupported config and historical pinned consumption have honest deterministic controls. No silent substitution, automatic fallback or widening permissions.
6. Source quality, docs, ESLint, Knip/diff and exact-head native CI; combined independent review before delivery. No future UI or other jobs.

## Evidence and initial scope reassessment

Current .pi/settings.json effective mappings: coordinator gpt-6.1-sol/low, planner gpt-6.1-sol/low, worker/researcher gpt-6-luna/high, reviewer gpt-6.1-sol/medium (all openai-codex); no user settings modified. Actual subagent mapping discovery verified earlier current session. `.factory/models.json` differs (legacy routes) and is still packaged/copied by tools/isswf.mjs init as .isswf/models.json. Current setup skill explicitly scopes later models.json procedures to selected legacy runtime, while docs/model-routing.md first paragraph claims state models.json generally; docs/durable-work.md bottom likewise points there. Claude guide uses supported native settings/role configuration and setup record, not Pi model IDs; thin plugin role profiles declare inherit.

Initial assumption: obsolete duplicate file can simply be deleted. Observed: retained installer/package/legacy consumers and host-native precedence make deletion unsafe; current host mappings must not be replaced with old JSON values. This is a shared ownership/compatibility design question, so select one read-only planner before a writer. Planner must recommend the smallest viable functional repair and identify any genuine product choice, not improvise host configuration formats. No generic repository-wide legacy retirement.

Reading map (reopen and confirm exact lines before implementation): .agents/skills/isswf-setup/SKILL.md:15–65 native preset/legacy boundary and 85–151 legacy procedures; .agents/hosts/pi.md:30–45 effective overrides; .agents/hosts/claude-code.md:5–10 native selection limits; tools/isswf.mjs:223,279–307 managed defaults/init; .factory/models.json; package.json/files and tools/factory-package.mjs/build-release.mjs allowlists; docs/model-routing.md opening and docs/durable-work.md Model routing; .factory/project-setup.md current approvals; relevant tests host-portability/host-native-delegation/installation/plan before deciding scope. Inspect all active consumers through Git/search, not only this map.

## Roles, budgets and required resources

Finite maximum for this unit: one read-only isswf-planner Sol/low call, one isswf-worker Luna/high author, up to two independent isswf-reviewer Sol/medium rounds, sequential, no nested calls or automatic retry. These current Pi project mappings remain approved; no model/provider switch or extra API-cost permission. Further calls need separate finite allocation. Coordinator can perform bounded local corrections within existing scope. No active actor before initial planner dispatch.

Planner required resources: .agents/roles/planner.md, .agents/roles/references/planning.md, design-principles.md and execution-principles.md, docs/durable-work.md, actual Pi host guide; this checkpoint-pinned brief and current evidence. Return proposal in handoff only, no source/plan/artifact writes. Name resources actually consumed/missing, concrete source findings and reference applications. Full-SHA checkpoint supplied at launch, separately from code base.

Author/reviewer methodology and exact implementation scope will be finalized in a new brief after adopting grounded design. Author requires worker, applicable writing guidance and selected TDD for useful deterministic contracts (retain RED/GREEN commits), required-reference application map and consumption status. Reviewer requires reviewer/isswf-review/review/verification-principles plus accepted brief; mode combined for authority/precedence/migration wording and deterministic host/config controls. Missing procedure remains inconclusive. Do not launch author before adoption and current preflight.

## Next boundary

Read-only planner examines current consumers and recommends one authoritative configuration model, with minimal supported host application, preserved existing choices, compatibility boundary and testable conflict behavior. Coordinator adopts technical decisions or asks only a genuine missing product decision before writer dispatch. Shared plan/brief frozen while any writer is active. Existing uncommitted J027–J032 evidence and unrelated plan deltas remain local and preserved.
