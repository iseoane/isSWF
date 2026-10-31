# J032: Pi execution authorization

Supersedes brief-r3 only for start, host allocation and current preflight. Its outcome, scope, acceptance, required resources, red/green dogfooding and exclusions remain binding; read brief-r3 and brief-r1 in full.

## Current trusted operator assignment

The operator explicitly requests J023 Pi verification, installation on success, then J032 execution; after clarification explicitly selects Pi with the current isSWF configuration and this coordinator. This supersedes the Claude-only/no-Pi-call allocation in brief-r3 §10 and the prepare-only/no-start wording in earlier revisions. Feature-to-PR authority applies as in brief-r3; no merge, project-pin migration, model-setting changes or extra actors.

## Base and preflight

Target and trusted factory root: `/home/iseoane/Work/isSWF`. Branch `feat/j032-method-evidence`, code base `135d0fbc97d3b9421a3945f365b3ca8b3451e8c2` (integrated PR117). Existing uncommitted plan and J027–J032 records are operator work and must be preserved. The coordinator alone owns plan and briefs; freeze those while the author writes. No actor may stage unrelated initiative records.

Coordinator observed four PASS results on this base: `node tests/git-evidence.mjs .`, `node tests/git-content.mjs .`, `node tests/git-evidence-pi.mjs .`, and `ISSWF_PI_ONLY=1 ISSWF_PI_SUBAGENTS=/home/iseoane/.pi/agent/npm/node_modules/pi-subagents node tests/host-native-delegation.mjs .`. Pi SDK and subagent transport are exercised; transport is loopback synthetic, not live-model acceptance or new Windows evidence. J023 brief-r21 removes the live-tool-use closure requirement. Pi 1.4.0 and pi-subagents 0.83.0 observed. Registered isSWF package updated through Pi from d5ba7f2 to 135d0fb; no project runtime pin migration. Installed-resource reload remains separate; this source assignment uses trusted source resources already loaded.

Initial assumption: brief-r3's Claude allocation applied. Observed/current decision: operator selects native Pi, current effective roles available. Implementation remains methodology/templates/static fixtures, not a runtime redesign. Shared host guidance and Linux/Windows acceptance remain in scope; no duplicate live host calls are required. Keep deterministic tests and proportionate required-reference maps.

## Finite allocation and ownership

- One sequential `isswf-worker` author: effective project override `openai-codex/gpt-6-luna`, thinking `high`.
- Up to two independent `isswf-reviewer` rounds: effective project override `openai-codex/gpt-6.1-sol`, thinking `medium`.
- At most one active actor; no nested delegation or additional author/retry allocation inferred. Corrections remain within the unit and available author/review budget; report a blocker if further actors are needed.
- Native discovery lists these roles and models; active subagent fleet empty before start. Use existing authentication; no paid-tier/provider substitution.
- Author may create explicit-file red/green commits in the feature branch, excluding `.factory/initiatives/**`. Coordinator owns push, PR and CI. No merge or cleanup.
- Read all required resources from brief-r3 §9 beneath the absolute trusted factory root, including writing and TDD skills and required references. Report consumed/missing resources and reference application, behavioral RED/GREEN commits, checks and limits. Stop if required resources are unavailable.

## Next boundary

Dispatch one Pi author with this input checkpoint, brief-r3 and brief-r1. Inspect exact returned candidate and reproduce RED/GREEN before independent review. Keep prior failures/deviations visible and publish only the bounded J032 unit after checks/review; exact-head native Linux/Windows CI and human integration remain separate gates.
