# Job brief J003 / r1

## Identity and authorization

- Source: operator conversation, 2026-11-06, after the headless trial.
- Authorization: local edits and one local commit on branch `feat/e2e-verification-practices`. No push, PR or merge.
- Profile: worker. Review: semantic delta review (methodology text).

## Objective

Trial evidence (headless coordinator on worktree `trial/empirical-e`, I0034 there): the coordinator selected empirical mode and skipped the reviewer correctly, but recorded no negative control and no criterion-to-assertion map. Those preconditions live only in `review.md`; the coordinator line says only that mechanical or empirical verification needs no model call. Make the preconditions visible where the decision is taken.

## Scope

- `.agents/skills/isswf-coordinator/SKILL.md` step 2 review bullet (line 41): condition empirical closure on two recorded items (executed negative control for each relevant test; criterion-to-assertion map), each in the brief or job evidence; a missing item sends that criterion to semantic review. Link `review.md#choose-sufficient-verification` instead of restating the rest.
- If needed for consistency, one clause in step 5 (line ~105) or `review.md` line 22 saying the records are checked before closing; do not otherwise rewrite.

## Exclusions

- No new files, tests or tools. Do not touch diagrams.

## Checks

- `node tests/review-guidance.mjs`, `node tests/host-portability.mjs`, `node tooling/quality/check-docs.mjs`, `git diff --check`.

## Execution

- Base: commit recording this brief on `feat/e2e-verification-practices`.
- One conventional commit, no AI attribution lines. Report diff, checks with exit codes, resources read.
