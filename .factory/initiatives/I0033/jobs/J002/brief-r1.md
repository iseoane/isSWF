# Job brief J002 / r1

## Identity and authorization

- Source: operator conversation, 2026-11-06.
- Authorization: local implementation and local commits on branch `feat/e2e-verification-practices`. No push, PR, merge or integration.
- Profile: worker. Review: semantic, independent reviewer (this changes shared review policy, which execution cannot verify).

## Objective

isSWF is used to develop application repositories, where most changes are executable. Today `review.md` maps any behavior change to semantic review, so a reviewer model is selected even when tests or E2E journeys prove the behavior. Add an empirical mode so executed, sensitivity-proven evidence can close behavior changes, and make the coordinator always weigh it.

## Scope

- `.agents/roles/references/review.md`, section "Choose sufficient verification" (around lines 1-20 of that section): add **Empirical** next to Mechanical/Semantic/Combined. Requirements: every acceptance criterion observable through executed tests/journeys on the exact candidate; each relevant test shown able to fail (negative control per `isswf-e2e` test-quality); semantic stays for trust boundaries, permissions, shared contracts/APIs, design decisions, data migrations, methodology/instruction text and claims execution cannot establish. If the project has no executable way to observe a criterion, that criterion falls to semantic (and `isswf-e2e` may be proposed). Combined may mix empirical with semantic for the uncovered part only.
- `.agents/skills/isswf-coordinator/SKILL.md` step 2 (line ~41 review bullet and line ~42 E2E bullet): before selecting semantic review, always record in the brief whether existing tests or `isswf-e2e` journeys cover acceptance, and why not when not. Not mandatory E2E; "always weigh, not always use".
- `.agents/roles/reviewer.md` line 13 and `.agents/skills/isswf-review/SKILL.md` line 11: mode list becomes "mechanical, empirical, semantic or combined".

## Exclusions

- `docs/en/workflow.html`/`docs/es/workflow.html` diagrams (generated); record as follow-up in the report, do not edit.
- No new skill, tool or test file. Do not change review convergence rules or budgets.

## Checks

- `node tests/review-guidance.mjs`
- `node tests/host-portability.mjs`
- `node tooling/quality/check-docs.mjs`
- `git diff --check`

## Execution

- Branch `feat/e2e-verification-practices`, base 3cb6e79 plus the coordinator commit recording this brief.
- Keep the existing concise imperative English style; do not duplicate guidance between review.md and the coordinator (coordinator links to review.md).
- One conventional commit, no AI attribution lines. Report: what changed per file with line ranges, checks with exit codes, resources read, deviations.
