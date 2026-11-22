# I0066 J001 brief r1: missing Run line is refused

- Authorization: operator, 2026-11-22 ("crealo como una iniciativa nueva"). Starts after I0065 closes.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Notes

- Ground first: the launch guard's accepted-dispatch log and its run identity; `tools/isswf-record-new.mjs` (`--run`, `parseRunLine`); `tools/isswf-record-check.mjs` (`run-line-unparsed`, `run-id-unfilled`); `hooks/register.tsx` (how the panel finds records, including linked worktrees).
- Observed case: I0065 records have no Run line except J006 V001 and V002.

## Method

- `isswf-tdd`: selected for the refusal rules.
- Review: one reviewer, standards and spec. One round, one correction.
