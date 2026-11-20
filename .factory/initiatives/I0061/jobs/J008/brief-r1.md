# I0061 J008 brief r1

- Authorization: operator, 2026-11-20, "ok" to the J004 research recommendations. Feature-to-PR start on `feat/i0061-j008-misses`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J008. Source: J004 research (conversation, 2026-11-20).

## Design

1. `.factory/templates/retrospective.md`: add a "Misses" section with one block per miss, fields: Kind (revert | ci-only | later-contradicted | uncovered-commit | bug-issue | false-pass), Observer and evidence, Candidate SHA that passed and passing review (verdict quoted), Local checks on that candidate, Missed defect (path:line, class, origin), Why not caught, Attribution (review-round | check <argv> | rule <id> | none), Fix and regression with status.
2. `.agents/roles/references/retrospective.md` and the coordinator skill (`.agents/skills/isswf-coordinator/SKILL.md`, one short rule): when the coordinator observes a miss (a CI failure on a reviewed candidate that local checks did not report, or a revert), it records the miss block at once in the job's records (append to the latest review record's coordinator section or the attempt record), and the retrospective collects them. Never edit a reviewer's verdict.
3. Docs only if a current guide describes the retrospective record fields (EN + ES).

## Scope

- Out: new record kinds, tools, resolution vocabulary (J009), evals.

## Checks

`node tooling/quality/check-docs.mjs`, `git diff --check`, the tests that read templates or skill text (find them with grep for `retrospective.md` under `tests/`). Full suite to CI.

## Method

No TDD (prose). One opus/medium reviewer, 1 round, 1 correction.
