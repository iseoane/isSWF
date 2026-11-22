# I0056 J001 brief r2: Bun recovery and retained retired-claim coverage

- Authorization: operator, 2026-11-22, "Coordinador I0056". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001. Research r1 findings (coordinator-held) are summarized below; verify each cited line before relying on it.

## Findings from r1 research

- `tests/state-interruption.mjs` pauses `moveState` with a `node --import` preload that patches `fs.promises` (around lines 33-60, 125). The compiled Bun executable has no evidence-backed equivalent: `tools/bun-release.mjs` passes unknown leading args to the `isswf` tool, which rejects them, and no production code reads `ISSWF_TEST_*`. Adding one is excluded.
- `recoverState` (`tools/state-migration.mjs` ~112-131) decides only from on-disk state, so recovery can be proven on Bun from constructed boundary states without a pause.
- `clearClaim` (~78-83) renames `.isswf-transition` to `.isswf-transition-retired-<uuid>`, syncs, then `rm`s. A kill between rename and `rm` leaves the retired directory; `recover-state` then fails with ENOENT and changes nothing, `migrate-state` with the same id returns `unchanged`, a new id is refused. Nothing tests or documents this.

## Changes

1. Bun state-equivalence: when a Bun build is available (same gating/skip as `tests/bun-release.mjs`), build the release with `--runtime bun`, construct each of the three boundary states (shapes the Node test asserts) with a dead-owner claim, run `recover-state` then `migrate-state` through the binary, and apply the Node test's receipt checks. Reuse the shared assertions; do not duplicate them. Without Bun it reports SKIP, as today.
2. Retained retired-claim control: after a successful migration, create `.isswf-transition-retired-<uuid>/owner.json`; assert the three behaviors above (no bytes changed on refusal). Run it on the Node launcher, and on Bun when available.
3. Document in `docs/installation.md` and `docs/es/installation.md` (recovery section): the literal mid-migration pause is exercised only on the Node launcher; the Bun binary is covered by constructed boundary states; a retained `.isswf-transition-retired-*` directory after `complete.json` is harmless, refused by `recover-state`, and may be removed by the operator. Update the Node test's header/report lines that state the Node-only limit.

## Scope

- In: tests, the two docs, test wiring in CI only if a new test file is unregistered.
- Out: any production code change; automatic cleanup of retired directories (product decision, not made); real-kill timing tests on Bun; `.pending-*` and `.isswf-transition-stage-*` leftovers (note in A001 as follow-ups).

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. `node tests/state-interruption.mjs .`, the Bun test (with `ISSWF_TEST_BUN=1` if Bun is installed locally; else report SKIP), `node tests/unrun-tests.mjs .`, `node tests/release-package.mjs .`.
3. `node tooling/quality/check-docs.mjs`, `git diff --check`.
4. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final code head; report the stamp.
5. Record wall-clock times. Write and commit A001 with each check naming the full SHA it ran at.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

Test-first. One opus/medium reviewer, 1 round, 1 correction.
