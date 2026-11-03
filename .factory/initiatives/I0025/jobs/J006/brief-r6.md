# J006 / r6 — Authorized implementation of the r5 observed-series snapshot design

## Authority

On 2026-11-03 the operator reviewed the r5 design and its observed-only scope ("adelante coordinador"), then selected this finite sequential budget: **one isswf-worker ≤40 min, one isswf-reviewer ≤15 min; only if that review finds bounded defects, one correction ≤15 min (same worker context when eligible) and one second review ≤15 min.** No further rounds, automatic retries, model substitution, paid API/provider calls, installation, global configuration, cleanup, push, PR, merge or activation follow. Exhaustion or any r5 stop condition ends the unit with the exact blocker and preserved candidate.

Accepted product scope: observed per-series snapshots and observed subtotals with explicit unknown coverage. Whole-process/session/workflow completeness and plain `claude` outside the selected launch are **not** required by this unit and must not be claimed.

## Objective and acceptance

Implement exactly the architecture and decisive checks 1–6 in [brief-r5.md](brief-r5.md) (sections "Selected minimal architecture" and "One bounded functional outcome and decisive checks") as one functional unit: setup-selected automatic observed-series capture and snapshot comparison, with source, tests and required EN/ES guidance updates and honest readiness. r5 is the canonical design; this brief adds authority only.

## Checkout and baseline

- Working directory: `/home/iseoane/Work/isSWF`, branch `feat/i0025-auto-claude-capture`, sequential single writer, no separate worktree.
- Baseline: the commit that records this brief (child of `fbb1a55d2ed5ee6052ef693ccc83ad0d8002eb40`); runtime source equal to `cafe6859159d576c1950b225b2e02e92985228fa`.
- Do not touch or stage coordinator-owned or unrelated paths: `.factory/initiatives/I0026/**`, `.pi/subagents/`, this brief, `plan.md`. Write the worker report to `.factory/initiatives/I0025/jobs/J006/A006.md`.
- Commit the candidate locally on the branch; no push.

## Checks

Focused suites for the changed modules, locked ESLint and Knip, `node tooling/quality/check-docs.mjs`, `git diff --check`, then `node tools/check-quality.mjs` on the committed candidate (a timeout is reported as a timeout, not success). Exercise the implemented entry with the pinned installed Claude and controlled local synthetic replies only. Windows native journeys remain deferred; portable fixtures must cover the Windows executable/stdio selection.

## Preserved evidence

V001–V005 adverse verdicts, historical process violations, policy INCONCLUSIVE and the timeout124 observation remain attributed to their original candidates.
