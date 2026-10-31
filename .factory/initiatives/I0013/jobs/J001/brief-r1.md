# I0013/J001: One native model configuration authority per host

## Accepted objective and authority

Operator explicitly requested resolving divergent model configuration and chose **one native authority per host for now**, not one cross-host file. Pi model selections live only in the supported project-local Pi configuration; Claude selections use its supported native configuration. `models.json` is only for explicitly selected retained legacy execution. Preserve current approved selections, unrelated settings, historical pins and bytes. No shared schema/projection/synchronization engine or new dispatcher.

New independent initiative I0013 owns this outcome. Earlier I0009/J033 remains a historical planning registration/input, not a second active implementation. Do not move or rewrite checkpoint-pinned paths. Reuse planner4754c6c9 result; its one allocation is consumed and does not restart with this new initiative ID.

Trusted root/target `/home/iseoane/Work/isSWF`; code baseline `5cd5a95c49e7a9b735328979d752b37679f1548c`; branch `feat/model-config-single-source`; existing extra commit370c0d3 adds only the original configuration brief. Current document input checkpoint supplied at dispatch. Source factory resources are trusted here, separate from the installed package. Delivery is explicit-file feature commits, coordinator push and PR to iseoane/isSWF main, exact-head CI. No integration, release, install, host/global setting mutation, state migration or cleanup. Future evidence UI and all other pending jobs excluded.

## Adopted design and implementation boundary

1. Current Pi: `.pi/settings.json` owns project defaults and subagents.agentOverrides, with actual native user/project precedence and loaded mapping verification. Do not copy these selections into .factory/models.json or infer provider availability from disk. User overrides/runtime selection/reload must be inspected honestly; conflicting approval/effective mapping blocks affected dispatch, not automatic repair.
2. Current Claude: actual supported native project configuration/profile/delegation mechanisms own selections. No Pi provider IDs, invented effort fields or duplicate editable model table in setup records. When effort cannot be persisted, supported explicit delegation only after verification; otherwise pending. Setup records report approval/application status and refer to owner, not another current selection source.
3. Portable preset is offered default instruction for unset choices, not runtime fallback configuration.
4. Retained legacy: selected-state models.json and pinned input SHA/digest remain authoritative only for explicitly assigned legacy contracts. Retain package payload/init/schema/caller compatibility. Clarify generated setup text and install/routing docs so it cannot be mistaken for ordinary host-native configuration. Do not silently migrate/delete/rewrite these inputs or change init persistence behavior.
5. Missing/unknown/unsupported roles/models/effort/config/effective mapping leave the affected native role pending. No fallback to packaged JSON, inheritance, another host/provider or effort without explicit approved selection. Avoid adding new enforcement machinery merely to claim prose is mechanically enforced.

## Current evidence and reading map

Read/recheck exact locations before implementation; base code references were independently read by planner4754c6c9 (read-only proposal, no test execution). Its brief at `.factory/initiatives/I0009/jobs/J033/brief-r1.md` checkpoint370c0d3ee374f2b835718e1015536570ce9942d9 SHA25668b63a8f376504d20ae767f8dac21d317140868a463407d1cd94b3826a60fe19 was coordinator verified. Planner recommendation above is now adopted by current operator choice; no new planner necessary.

- `.pi/settings.json:11–35`: current private native overrides; observe only, never stage/edit. Approved coordinator/planner openai-codex/gpt-6.1-sol low; worker/researcher gpt-6-luna high; reviewer gpt-6.1-sol medium. Preserve unrelated package filters. These are configured/requested values, not independently authenticated provider metadata.
- `.agents/hosts/pi.md:30–45`, `.agents/hosts/claude-code.md:5–10`: supported configuration ownership and capability constraints.
- `.agents/skills/isswf-setup/SKILL.md:17–65`: current native setup and explicit legacy boundary; later clauses are legacy-only. Do not rewrite them as native setup or change historical schemas.
- `tools/isswf.mjs:274–307` trackingRecord/initialize/inspect: generated setup wording advertises models.json; preserve existing defaults/copy/no-op behavior while labelling explicit legacy role.
- `tools/isswf-job.mjs:223–228`, researcher-task.mjs:47–50, planner-task.mjs:87–88, reviewer-task.mjs:98–99, diagnostic-task.mjs:77–78: real pinned legacy readers. Retain digests/grants/fixed compatibility and never resolve historical execution against current native defaults.
- `.factory/models.json`, package.json/files, tools/factory-package.mjs and build-release.mjs allowlists: genuine legacy payload consumers; no deletion or route edits.
- `docs/model-routing.md` opening, `docs/durable-work.md` Model routing, `docs/source-activation.md:26`: broadly worded ownership misleading for current native work. Qualify and navigate current/native versus legacy, keep detailed legacy semantics in canonical contract.
- `.factory/project-setup.md` current startup lookup vs historical approvals: reconcile only current lookup wording, no rewritten historical evidence or extra editable model-value table. It may be in scope for this wording, not other initiative records.
- Existing tests: host-native-delegation.mjs user/project override seams, host-portability.mjs static guards, factory-tools-install/platform/host-discovery and successor-model-config.mjs pinned-preservation controls; .github/workflows/quality.yml native matrix. Inspect actual dependency prerequisites, never install without existing grant.

Initial delete/sync assumption proved unsafe because real legacy consumers remain. Reclassified to ownership/navigation plus deterministic actual-boundary evidence, not a general removal of legacy execution or a new config engine. Shared consumers/host precedence warrant combined review. This unit must remain proportionate and independently useful.

## Acceptance and test evidence

- All affected current instruction entry points identify the selected native host as the only current configuration owner, distinguish offered defaults and historical decisions, and never present legacy JSON as a second native selection.
- Equivalent Pi/Claude native ownership intent on Linux/Windows through verified supported mechanisms; unavailable Claude per-role persistence stays explicit, not falsely tested. Existing discovery is not live effort-application evidence.
- Deterministic ordinary selection and user/project precedence/conflict controls at existing Pi SDK/subagent seams, using distinctive fixture values. Preserve unrelated settings/package filters/custom fields and pins byte-for-byte where no edit authorized. Approved-versus-effective mismatch remains pending by coordinator contract; static checks of that instruction must be labelled static, not runtime enforcement.
- Missing/unknown model/unsupported effort and absent native capability must not fall back to legacy JSON or another destination. Test actual supported refusal/resolution boundary where feasible; do not invent SDK guarantees. Report exact limitations and concrete blockers rather than overclaim.
- Legacy init/repeat preserves custom config, no automatic host settings creation, package retains required legacy payload, pinned readers/digest refusal and successor preservation continue to work despite distinct native/working-tree values.
- Any necessary current EN/ES human docs updated together. No unrelated glossary terms or persisted keys renamed.
- Selected TDD for meaningful executable selection/preservation/refusal contracts: test-only behavioral RED before production, separate GREEN, full SHAs/command/assertion. Prose-only/static wording checks honestly labelled, with declared no-honest-behavioral-RED deviations as appropriate. Keep logs/harness if substitute sensitivity evidence used. Do not substitute a regex-only suite for needed actual-host boundary evidence.
- Run focused suites, node tools/check-quality.mjs, docs checker, ESLint, Knip, git diff --check. Use existing native Linux/Windows CI, no unnecessary live provider calls. Bound failures stay visible.

## Required methodology and application reporting

Author must read full canonical resources under trusted root: .agents/roles/worker.md; .agents/hosts/pi.md and claude-code.md; .agents/skills/isswf-tdd/SKILL.md with references/tdd.md; .agents/skills/isswf-writing/SKILL.md with references/agent-documents.md and human-documents.md; .agents/roles/references/design-principles.md, execution-principles.md, code-quality.md, comments.md, verification-principles.md; relevant review.md Selected-method evidence; GLOSSARY.md/GLOSSARY.es.md; docs/en/development.md Quality checks. Required engineering-reference map: design-principles, execution-principles, code-quality, comments, writing/agent-documents. Read actual affected canonical install/routing/durable contracts before editing. Report required resources consumed/missing, initially self-reported unless coordinator trace confirms; reference → concrete path/line/commit or justified not-applicable, deviations/consequences and all commands/results. No private reasoning transcript.

Reviewer must consume reviewer role, isswf-review skill, review.md, verification-principles.md, this brief/checkpoint and relevant required standards/actual candidate. Combined semantic ownership/precedence/compatibility and mechanical fixture checks; tests/contracts first. Standards and Spec separate, resource/method/reference map evidence explicit. Missing required procedure prevents aggregate PASS. Bound tools optional unless separately selected at review launch.

## Actors, ownership and delivery

Cumulative inherited allocation: planner1/1 spent; author one isswf-worker openai-codex/gpt-6-luna high; up to two independent isswf-reviewer openai-codex/gpt-6.1-sol medium rounds. Sequential, at most one active actor, no nested agents/additional actors/automatic retry or provider switch. Existing authentication only, no paid API permission. Coordinator bounded corrections allowed within scope, no new worker inferred. A new initiative ID does not reset budgets.

Author owns only affected functional files/tests/docs and explicit-file RED/GREEN commits; never stage .factory/initiatives/**, private .pi settings, unrelated pending jobs or coordinator records. Coordinator owns/freeze canonical records during writer activity. Preserve dirty J027–J033 planning and J032 probe evidence. .factory/project-setup.md current lookup is allowed bounded wording, not settings mutation. No force/reset/cleanup or worktree creation required; sole sequential author in assigned checkout. No push/PR by author; coordinator performs covered publication after candidate/check/review. Integration requires separate approval.

## Next boundary

One author implements this adopted unit, reports exact candidate and honest behavioral/static evidence. Coordinator replays RED/GREEN and affected checks, then independent combined review/corrections within remaining budget, bounded PR and exact-head CI, then human integration decision. Any unsupported capability or unmet acceptance stays explicit; no other jobs.
