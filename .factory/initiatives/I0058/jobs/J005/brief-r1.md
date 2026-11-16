# I0058 J005 brief r1

- Authorization: operator, 2026-11-16, "I0058 J005" after the coordinator recommended it. This is a feature-to-PR start covering implementation, commits, independent review, push, PR and CI on `feat/i0058-j005-plan-commit-guard`. Merge is not covered.
- Writer: the coordinator in the primary checkout (shared-sequential, sole writer).
- Baseline: origin/main c288f65.
- Objective and acceptance: [plan.md](../../plan.md) J005.

## Design

1. `setField` in `tools/isswf-plan-edit-core.mjs` also accepts `Brief`. The edited plan must still parse, so the parser's brief-reference rules apply.
2. A plan commit guard runs next to the branch guard on both hosts, in `hooks/register.tsx` and `tools/isswf-command-guard-pi-extension.mjs`. For each `git commit` segment, it reads the plan files (`.isswf|.factory/initiatives/I*/plan.md`) that the commit would record:
   - the staged blob from the index;
   - with `-a`/`--all`, also the working-tree file.
   It refuses the call when a plan does not read back as `isswf-status` reads it: `parsePlan` must pass and the `# <ID>: <title>` heading must be valid. The refusal names the parser's error and line.
3. The guard fails open, like the branch guard: a missing `git` or any fault allows the command.
4. A deleted plan is not checked.

## Scope

- In:
  - `tools/isswf-plan-edit-core.mjs`
  - a new core `tools/isswf-plan-commit-guard-core.mjs`
  - both host wirings
  - tests in `tests/isswf-plan-edit.mjs` and a new `tests/isswf-plan-commit-guard.mjs`
  - `docs/en/operations.md` and `docs/es/operations.md`, where the guards and plan editing are described
- Out:
  - other record types
  - pre-commit hooks
  - CI

## Method

- TDD (isswf-tdd) for both behaviors.
- Checks: focused tests, `claude plugin test .` for the hooks module, `check-docs`, `git diff --check` and `check-quality`.
- Review: one independent reviewer, opus/medium. Budget: at most 2 review rounds and 1 correction cycle.
- Platforms:
  - Linux is verified locally.
  - On Windows, the Pi side spawns `git` through `execFile` without a shell.
  - CI covers Windows only through its portable tests.
