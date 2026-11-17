# I0058 J010 brief r1

- Authorization: operator, 2026-11-17, "vamos con el J010". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0058-j010-unrun-tests`. Merge needs the operator's go.
- Writer: the coordinator in the primary checkout (sole writer).
- Baseline: origin/main after #349 (e301cd6).
- Objective and acceptance: [plan.md](../../plan.md) J010.

## Design

1. `tooling/quality/unrun-tests.mjs` exports `unrunTests(source, exempt)`: the top-level `tests/*.mjs` files whose basename appears neither in `tools/check-quality.mjs` nor in any `.github/workflows/*.yml`, and that no other top-level test imports. `tests/support/` and `tests/fixtures/` are not scanned.
2. `tools/check-quality.mjs` calls it before the test runs and fails naming each unrun file. The exemption list holds only `project-context-engram.mjs`, which needs an external Engram executable (its header says it is intentionally outside the portable checks); each exemption carries its reason.
3. `tests/isswf-plan-commit-guard.mjs` (J005, run by no check) is added to `check-quality`.
4. After the tests, `check-quality` runs ESLint and Knip with the CI commands when `tooling/quality/node_modules/{eslint,knip}` exist, and otherwise reports each as `SKIPPED` with the install command. The `limits` text is updated.
5. `docs/en/development.md` "Quality checks" and the Spanish mirror say so.

## Scope

- In: the files above and a new `tests/unrun-tests.mjs`.
- Out: `.github/workflows/**` (no workflow change; Windows coverage of the guard test stays as today), the Windows test list.

## Method

TDD (RED: the module is missing, asserted). One opus/medium reviewer; budget 2 review rounds, 1 correction.
