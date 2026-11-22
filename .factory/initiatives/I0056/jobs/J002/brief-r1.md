# I0056 J002 brief r1: release build accepts a cross-drive output

- Authorization: operator, 2026-11-22, "Coordinador I0056". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Research done by the coordinator

- `tools/build-release.mjs:16` defines `isWithin(parent, child)` with `path.relative`. On Windows, `relative('D:\a', 'C:\x')` returns the absolute `C:\x`, which does not start with `..`, so it is treated as inside.
- Find every caller of `isWithin` (and any copy of the same helper elsewhere in `tools/`) and fix them consistently.

## Changes

1. `isWithin` returns false when the relative part is absolute (`isAbsolute(part)`), keeping the existing inside/outside behavior otherwise.
2. A focused regression test using `path.win32` semantics so it runs on Linux and Windows: different drives are outside; same-drive child is inside; `..` siblings are outside. Export or inject the helper only as far as testing needs; no production test hook.

## Scope

- In: the helper, its callers if needed, its test.
- Out: other release-build behavior.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. The new/touched test, `node tests/unrun-tests.mjs .`, `node tests/release-package.mjs .` if packaging lists change.
3. `node tooling/quality/check-docs.mjs`, `git diff --check`.
4. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final code head; report the stamp.
5. Record wall-clock times. Write and commit A001 with each check naming the full SHA it ran at.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the helper. One opus/medium reviewer, 1 round, 1 correction.
