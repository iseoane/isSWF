# I0058 J002 brief r1

- Authorization: operator, 2026-11-17, "coordinador I0058 J002". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0058-j002-next-job`. Merge needs the operator's go.
- Writer: the coordinator in the primary checkout (sole writer).
- Baseline: origin/main after #347.
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Design

1. `nextJob(jobs)` in `tools/isswf-status.mjs` returns one state:
   - `eligible`: the first pending job whose dependencies are all `completed`, with its ID and objective.
   - Otherwise, in this order: `awaiting-human` (jobs waiting on an operator decision, with their blocker), `in-flight` (in-progress or in-review jobs), `blocked` (blocked jobs, with their blocker), `waiting-on-dependencies` (pending jobs and the unmet dependencies), `none` (every job completed).
   - Each non-eligible state lists the jobs and the reason. It grants no execution.
2. `isswf-status --next` prints `{ status, initiative, next }` for an observed plan; an unreadable plan prints the status result unchanged and exits 1 as today.
3. The coordinator skill's job-close step points to `isswf-status --next` instead of a prose rule; `docs/en/operations.md` and the Spanish mirror document the option.

## Scope

- In: `tools/isswf-status.mjs`, a new `tests/isswf-next-job.mjs`, `.agents/skills/isswf-coordinator/SKILL.md`, `docs/en/operations.md`, `docs/es/operations.md`.
- Out: `recommendation` (panel) behavior, the panel, other record types.

## Method

TDD (RED: the export is missing and the CLI rejects `--next`, asserted, not a load failure). One opus/medium reviewer; budget 2 review rounds, 1 correction.
