# I0068 J001 brief r1

- Size: M
- Authorization: operator, 2026-11-27 (initiative creation); the job needs an explicit start.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Method

- `isswf-tdd`: selected (a refusal is behavior). Review: one reviewer, standards and spec.
- Risks: a false refusal blocks every records-only commit; keep fail-open on faults and never refuse a record the CI check accepts.
- Paths: guard code under `tools/` and both host wirings (`hooks/register.tsx`, the Pi guard extension) need person approval per REVIEW.md when they change.
