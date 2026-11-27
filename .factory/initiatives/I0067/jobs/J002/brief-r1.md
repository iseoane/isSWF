# I0067 J002 brief r1

- Size: M
- Authorization: operator, 2026-11-22 (I0066 state machines, "priorizando las de mas impacto primero"), moved to I0067 on 2026-11-27; the job needs an explicit start.
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Method

- `isswf-tdd`: selected (recovery from each phase is behavior). Review: one reviewer, standards and spec.
- Risks: a migration interrupted under the old layout must still recover; never create a second active state directory.
