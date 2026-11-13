# I0014/J002 r1: Stop seeding legacy routes and gate migration on open legacy attempts (started)

## Authorization (2026-11-13)

Operator explicit start in Claude Code ("B" = start J002 with the full flow to PR, no merge), after deciding: retire the legacy engine; installed projects must update after reconciling open legacy attempts under their original pin (no bridge release). Covered: implementation in the primary checkout on feature branch `feat/i0014-j002-legacy-seeding`, focused checks, independent review and corrections within budget, commits, push of that branch, PR to `main`, exact-head CI wait. Not covered: merge, other branches, installation, release, deleting legacy tools (J003), changes to I0009 records.

## Objective

New installations stop receiving the legacy route file, and a version migration of an installed project refuses while it still has legacy attempts that are not fully reconciled, so they are closed under their original pin first.

## Acceptance

1. `isswf init` no longer writes `.isswf/models.json`; `inspect` no longer lists it as a change for a new project; the setup text produced by `trackingRecord` no longer advertises legacy routes. Existing `.isswf/models.json` files are never deleted or rewritten, and `managedPaths`/transaction recovery still handle them.
2. The migration/update path that today uses `activity()`/`idle()` (`tools/isswf.mjs`) additionally blocks when a registered legacy attempt has open external effects or pending recovery reviews (verify in code what records express this; if the store cannot express it, report that instead of inventing a format). `inspect` reports those blockers with a reason telling the operator to reconcile under the original pin. Unknown state blocks.
3. Focused tests cover 1 and 2 including a negative control (test fails without the change). Linux and Windows path handling preserved (no POSIX-only assumptions).
4. `docs/installation.md` plus `docs/en|es/installation.md` and `operations.md` (wherever they describe seeded models.json or migration gates) updated in both languages; `node tooling/quality/check-docs.mjs` passes.

## Scope / exclusions

Files: `tools/isswf.mjs` and the tests/docs it needs. Do not remove legacy tools, `.factory/models.json` from the package, or `native-recovery.mjs` (J003). Do not touch `.factory/initiatives/I0009`.

## Checks

Focused: tests touching init/inspect/migration (e.g. `tests/release-package.mjs`, `platform-package`, `host-native-delegation`, `documentation`, state-migration tests), `node tooling/quality/check-docs.mjs`, `git diff --check`. Full `node tools/check-quality.mjs` because this touches packaging/install; report if skipped. CI (ubuntu + windows) on the PR head is the cross-platform evidence.

## Methodology considered

- execution-principles: selected (migration gate, repeated operations).
- design-principles: selected (install contract changes).
- verification-principles: selected (acceptance needs negative controls).
- isswf-writing: selected (EN/ES docs).
- isswf-tdd: declined (focused tests with negative control suffice).
- e2e, security, performance, observability, interview: not triggered.

## Budget and review

Worker: 1 actor (Claude native, parent model inherited). Review: combined; existing tests do not cover the new gate, so independent semantic review is required. Max 3 review rounds, 2 correction cycles. Spent so far: 0.
