# I0058 J001 brief r3: pane roles, host guides and empty runs

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; batch distribution accepted. Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines. Runs in parallel with I0058 J004 (disjoint files); integrated in one batched PR.
- Objective and acceptance: [plan.md](../../plan.md) J001, the pane item ("names each run's role, distinguishes an unresolved transcript from a run that used nothing, and lists host guides apart from references").

## Observed (research r1, file:line at e2cc00f4)

- Host guides land in `usedReferences` (`tools/isswf-run-usage-core.mjs:153-158`) and render under references (`hooks/register.tsx:882`).
- A run that used nothing is dropped (`row()` `:878`, `used()` `:876`); an unresolved run shows `unknown`; `merge` returns undefined when any run is unresolved (`:874`, `:887`); `found` is taken before `resolveUsage` (`:863`, `:873`), so the first draw is unknown.
- Roles: `parseRole` (`tools/isswf-snapshot-core.mjs:103-116`) yields `unknown` when no profile line names a role; the Claude hook stores the run assignment but not the agent name (`hooks/register.tsx:603-607`); Pi transcript file names carry the agent (`tools/isswf-run-usage-core.mjs:43-44`).

## Changes

1. Host guides (`.agents/hosts/`) in their own block in the Agents tab, labels in both languages.
2. A found run with empty maps shows an explicit "no reads" line; an unresolved run still shows unknown; one unresolved run no longer blanks the whole role.
3. Role fallback: when the record names no role, use the agent name the host gave the run (store it next to the assignment on Claude; Pi transcript name).
4. Tests in `tests/run-usage.mjs` and the pane tests for each case (host-guide fixture, empty run, unresolved run, role fallback).

## Scope

- Out: new record-check rules, transcript command capture, brief comparison, the gate.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. Then the touched tests, `node tooling/quality/check-docs.mjs`, `git diff --check`, and `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final head (writes the stamp). Record wall-clock times. Write A001-pane as `A002.md` inside your checkout with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD for the core changes. One opus/medium reviewer, 2 rounds, 1 correction.
