# I0063 J003 brief r1

- Authorization: operator, 2026-11-20, "ponlo como primer Job y ataquémoslo". Feature-to-PR start on `feat/i0063-j003-close-not-run`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J003.

## Design

1. `tools/isswf-plan-commit-guard-core.mjs` (close record validation, around line 40): a record passes only when every check's status is `passed`. Remove the "not run allowed, at least one passed" rule introduced by I0061 J010. The refusal lists the checks that are not `passed` with their status and says to record a passing CI run (`source: "ci"`) or run `--record` on a platform where those checks run.
2. `tools/isswf-verify.mjs --record`: keep writing the record (so the gate refuses it), but exit non-zero and print which checks did not run when any check is `not run`, so the operator sees it before committing.
3. Docs EN/ES (`docs/*/operations.md` close-gate text, and the tiered CI guide if it states the old rule): match.

## Scope

- Out: per-platform merging of several records, changes to verification.json platforms.

## Checks

TDD (test-only RED, then GREEN): `tests/isswf-plan-commit-guard.mjs`, `tests/isswf-verify.mjs`, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Full suite to CI. Write A001. Leave no background shells.

## Method

TDD. One opus/medium reviewer, 2 rounds, 1 correction.
