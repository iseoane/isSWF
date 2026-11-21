# I0058 J003 brief r2: turn-end warning for an undispatched brief

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058" and "coordinador, ok adelante!" (batch 2). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J003. Research: brief r1 report, summarized in the plan's J003 Evidence.

## Design (decided)

1. Shared core (for example `tools/isswf-undispatched-core.mjs`): given the project root, the parsed plan (`parsePlan`) and the session's accepted dispatch assignments, return each job that is `in-progress`, whose `Brief:` path is committed at HEAD (same check as the dispatch guard), with no `A###.md` in its job directory and no accepted dispatch naming that brief. Read-only Git; any fault returns nothing (fail open).
2. Claude: in `hooks/register.tsx` `turn.complete`, only after the coordinator skill was activated in the session, skip aborted and error turns; show one status line naming job and brief. Warn once per job and brief revision per session.
3. Pi: the same in the compaction extension's `agent_settled` handler through `ctx.ui.setStatus`, same conditions.
4. Docs: one paragraph in docs/en|es/operations.md (guards section) with the known gaps: live display not observed on either host; a dispatch past the 5-entry session cap or before a restart can produce a false warning.

## Scope

- In: the core, both host wirings, tests for the core (Linux and Windows paths, brief not committed, attempt present, dispatch present, revision change warns again), docs EN/ES.
- Out: blocking the turn, changing the dispatch guard, the record-path classifier (J007).

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. The new and touched tests, a jiti ts+jsx transform of `hooks/register.tsx` (jiti is in `tooling/host-tests/node_modules`), `node tooling/quality/check-docs.mjs`, `git diff --check`, then `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final code head (report its stamp path). If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`. Record wall-clock times. Write A001 with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD for the core. One opus/medium reviewer, 2 rounds, 1 correction.
