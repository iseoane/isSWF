# I0033: E2E verification practices from pstack

Type: enhancement

## Objective and authority

Strengthen `isswf-e2e` with the verification practices from the pstack `create-verification-skill` (cursor/plugins, `pstack/skills/create-verification-skill/SKILL.md`) that the skill does not already cover. The skill keeps producing executable tests and a journey map; it does not generate a project-local agent skill. Operator request 2026-11-06: implement on a separate local branch, no push, no PR, no integration into `main`.

## Decisions

- confirmed by operator: improve `isswf-e2e` instead of adding a pstack-style generator skill; the output stays runnable tests.
- confirmed by operator: work stays on local branch `feat/e2e-verification-practices`; no push or integration.
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
