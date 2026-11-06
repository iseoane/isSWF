# I0033: E2E verification practices from pstack

Type: enhancement

## Objective and authority

Strengthen `isswf-e2e` with the verification practices from the pstack `create-verification-skill` (cursor/plugins, `pstack/skills/create-verification-skill/SKILL.md`) that the skill does not already cover. The skill keeps producing executable tests and a journey map; it does not generate a project-local agent skill. Operator request 2026-11-06: implement on a separate local branch, no push, no PR, no integration into `main`.

## Decisions

- confirmed by operator: improve `isswf-e2e` instead of adding a pstack-style generator skill; the output stays runnable tests.
- confirmed by operator: work stays on local branch `feat/e2e-verification-practices`; no push or integration.
- confirmed by operator (2026-11-06): add an empirical review mode so executable evidence can replace semantic review in application repositories; the coordinator always weighs it, without making E2E mandatory.
- assumption: only uncovered practices are added; already covered ones are not restated.

## J001

- Status: completed
- Objective: Add the uncovered pstack verification practices to the isswf-e2e skill and references.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Operator decides whether to keep, integrate or discard the branch.

### Acceptance

- Each gap listed in the brief is either added to the most specific existing `isswf-e2e` file or recorded as already covered with its location.
- No duplicated guidance, no new skill, no new reference file unless a gap cannot fit an existing one.
- `tests/host-portability.mjs` and `node tooling/quality/check-docs.mjs` pass.

### Evidence

- Worker commit 8f5188f added gaps 1-7; coordinator moved the build-as-is check to step 2. `node tests/host-portability.mjs`, `node tooling/quality/check-docs.mjs` and `git diff --check` exit 0 (coordinator rerun). No independent review; branch is local only.

## J002

- Status: completed
- Objective: Add an empirical verification mode and make the coordinator always weigh executable evidence before selecting semantic review.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Operator decides whether to keep, integrate or discard the branch. Follow-up for next release: update docs/diagrams/workflow.json:650-651 and regenerate workflow.html (EN/ES), plus README.

### Acceptance

- `review.md` defines an empirical mode: a behavior change whose acceptance criteria are all observable through executed tests or journeys with demonstrated sensitivity closes without a semantic reviewer, unless risk or an explicit requirement needs independent judgment.
- Semantic review stays required for claims execution cannot establish (trust boundaries, permissions, shared contracts, design decisions, data migrations, methodology text).
- The coordinator always records in the brief whether existing tests or `isswf-e2e` journeys cover acceptance before choosing semantic review, without making E2E mandatory.
- Reviewer profile and `isswf-review` skill name the empirical mode consistently.
- `tests/review-guidance.mjs`, `tests/host-portability.mjs` and `check-docs` pass.

### Evidence

- Worker commits b39e4e8 and 053d845 (correction cycle 1). Independent reviewer round 1: fail (F1 blocking, S1-S3, I1, I2); round 2 on delta 053d845: Standards pass, Spec pass. I2 deferred by operator to next release.
- Coordinator rerun on 053d845: review-guidance, host-portability, check-docs and git diff --check exit 0.

## J003

- Status: completed
- Objective: Make empirical closure in the coordinator conditional on recorded negative controls and a criterion-to-assertion map.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Operator reruns trial E on a fresh worktree from this head.

### Acceptance

- The coordinator text states that empirical closure requires, recorded in the brief or job evidence, an executed negative control per relevant test and a criterion-to-assertion map; otherwise the uncovered criterion goes to semantic review.
- No duplication of the full rule: the coordinator names the two preconditions and links `review.md`.
- `tests/review-guidance.mjs`, `tests/host-portability.mjs`, `check-docs` and `git diff --check` pass.

### Evidence

- Worker commit 978b3cb; independent reviewer round 1: Standards pass, Spec pass, S1 optional (concrete-risk exception) applied by the coordinator in the closing commit as a one-clause wording change matching review.md:26, not re-reviewed.
- Coordinator rerun after S1: review-guidance, host-portability, check-docs and git diff --check exit 0.
