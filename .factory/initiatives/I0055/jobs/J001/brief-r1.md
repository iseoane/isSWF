# I0055 J001 brief r1: view-only pane presses skip the snapshot read

- Authorization: operator, 2026-11-22, "coordinador, I0055". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001, all three acceptance items.

## Research done by the coordinator

- `hooks/register.tsx:874` calls `readSnapshot(cwd, fs)` on render; `tools/isswf-snapshot-core.mjs` reads every initiative, job directory and record, then drops fully completed initiatives (plan Evidence).
- Two options to compare, measured against a cache: (a) decide closed initiatives from `plan.md` alone before opening job directories, with no new persisted state; (b) a persisted index. Option (b) is a second status store that can drift; only choose it if measurements show (a) plus the cache is not enough, and say why.

## Changes

1. Measure first, on this Windows checkout: press-to-redraw latency (or the closest measurable proxy, stated) and snapshot fs-call count. Keep the measuring script in the test or under `tooling/`, not ad hoc.
2. Cache the snapshot in the pane so view-only presses (fold, unfold, record detail, tab) redraw from it. Re-read only when records may have changed, within the existing refresh bounds. Never present cached data as fresh after a change.
3. If cheap and safe, apply option (a) in the snapshot core. Unparseable plans, missing state and the pinned/touched rules behave as today.
4. Focused pane/snapshot tests for cache invalidation and the unchanged edge cases.
5. Update EN and ES docs only if they describe pane refresh behavior.

## Scope

- In: `hooks/register.tsx`, `tools/isswf-snapshot-core.mjs`, their tests, docs touched by the behavior.
- Out: a persisted index unless justified by numbers; Pi pane changes beyond shared snapshot core.
- Linux: run the tests; Linux latency is not measurable from this machine. State it as a limitation; CI covers Linux tests.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Touched tests, `node tests/unrun-tests.mjs .`, `node tests/stale-statements.mjs .`.
3. `node tooling/quality/check-docs.mjs`, `git diff --check`.
4. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final code head; report the stamp.
5. Record wall-clock times and before/after numbers.
6. Write and commit A001 with each check naming the full SHA it ran at.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the cache invalidation. One opus/medium reviewer, 2 rounds, 1 correction.
