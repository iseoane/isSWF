# I0058 J008 brief r1: research repeated contract definitions

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; parallel work accepted ("continua"). Standing grant.
- Actor: one isswf-researcher, read-only, at the base named in the assignment.
- Objective and acceptance: [plan.md](../../plan.md) J008.

## Questions (file:line or "not found")

1. Where each record field of the attempt and review templates (`.factory/templates/attempt.md`, `review.md`, `job-brief.md`) is defined or restated in packaged text (`.agents/**`, `skills/**`, `agents/**`, `docs/**`), and which copy is the most complete.
2. Which tests already assert phrases of those definitions (`tests/*methodology*`, `tests/plan-records.mjs`, others found by grep) and what they miss (the I0057 J008 V002 F4 case).
3. What a "mechanical search for the old statement" could be: an existing tool or test pattern that greps packaged text for a phrase list, and where a changed-contract phrase list could live.
4. Which packaged files form the package (`tools/factory-package.mjs` allowlist), so the search covers exactly them.

## Return

A short report per question, a proposed split into at most two functional units with sizes, and the risks. Mark observed facts versus inferences.
