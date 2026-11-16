# I0060 J001 brief r1

- Authorization: operator, 2026-11-16, "atacala por favor!" — feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0060-coverage-chain`. Merge is not covered.
- Writer: the coordinator, in the worktree `/home/iseoane/Work/isSWF-i0060` (shared-sequential, sole writer). Records in that worktree's `.factory/`.
- Baseline: origin/main 3d875158d52e7210700e217289449c924a94cad7.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Decided rule

A job's reviews cover the union of the ranges of its review chain. The chain starts at the latest review and steps to the previous review ID while that review's `Candidate commit SHA` equals the current review's `Base commit SHA`. The chain stops at the first review that does not chain. The chain's verdicts are not read, as today: a delta review carries the earlier findings forward, so the earlier range is part of what it assessed. Override lines are read from every review in the chain.

## Scope

- In: `coverage` in `tools/isswf-handoff.mjs`, `tests/isswf-handoff.mjs`, the coverage text in `docs/en/operations.md`, `docs/es/operations.md` and `.agents/skills/isswf-handoff/SKILL.md`.
- Out: verdict parsing, override rules, other `isswf-handoff` commands.

## Method

- TDD (isswf-tdd): commit a failing chained-delta test, then the change.
- Verification: `node tests/isswf-handoff.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, then `node tools/check-quality.mjs` (it runs `coverage`).
- Review: one independent reviewer, opus/medium. Budget: at most 2 review rounds and 1 correction cycle.
