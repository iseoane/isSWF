# I0034: Structural fixes from the 2026-11-06 session retrospective

Type: maintenance

## Objective and authority

Implement the structural improvements proposed by the 2026-11-06 session retrospective so the observed failure classes are caught by code and checks instead of reviewers or red CI. Operator request 2026-11-06 ("No los registres, implementa las mejoras"). Feature-to-PR scope on branch `feat/retrospective-improvements`; no merge without operator approval.

## Decisions

- confirmed by operator: implement P1-P5 instead of recording them as proposals.
- assumption: P2 must not change the legacy diagnostician contract silently; if every option changes a documented contract, the worker stops and reports options.

## J001

- Status: completed
- Objective: Implement retrospective proposals P1-P5 as structural checks and tooling.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Operator integration decision on the PR.

### Acceptance

- P1: `parsePlan` accepts CRLF plans; a CRLF fixture reports `status: observed` through `isswf-status`.
- P2: the diagnostician bundle margin is measured by a test that fails with a clear message before `review.md` growth breaks the bundle, and the current margin no longer blocks ordinary `review.md` edits, without silently changing a documented legacy contract.
- P3: CI-only host checks can be run locally with one documented command when their dependencies exist, and report a clear skip otherwise; English and Spanish development guides document it.
- P4: a check fails when a packaged skill or role links to a file outside the package allowlist; the I0031 round-1 failure class (`docs/en/*` from a packaged skill) is covered by a negative control.
- P5: a maintenance script re-pins diagram citations to a new revision by exact text match and reports unresolved citations without writing them.
- Each new or changed check is shown able to fail (negative control) and the full suite passes.

### Evidence

- Worker commits 50d5998 (P1), a3c0cb1 (P4), b05058c (P3), b961fe8 (P5), a704bc8 (P2); full suite exit 0 on a704bc8 (worker).
- Criterion-to-assertion map (coordinator-checked; implementer tests are not independent judgment): P1 -> `tests/initiative-status.mjs` CRLF assertion. The parser-only test missed the `isswf-status` heading split; coordinator fix c233e35, and the old `isswf-status` fails that assertion (coordinator negative control); the real I0034 plan in CRLF reports observed. P4 -> `tests/host-portability.mjs` packaged link check, negative control with a `docs/en/reference.md` link fails. P3 -> `tooling/quality/host-checks.mjs`, local run PASS/SKIPPED, a failing host check exits 1. P5 -> `tests/workflow-citations.mjs`, ambiguous-match negative control fails; double application is covered by the `--write` assertion. P2 -> `tests/diagnostic-task.mjs` margin assertion, cap 70000 negative control fails.
- P2 independent semantic review round 1: pass/pass; suggestions S1 (oversized fixture tied to the cap) and S2 (document the diagnostic cap in `docs/model-routing.md`) applied in 3fcbfa0.
- Coordinator reran initiative-dependencies, plan-records, host-portability, workflow-citations, diagnostic-task, workflow-diagrams, initiative-status and check-docs: exit 0. ESLint and Knip were not run locally (dependencies absent); CI runs them.
