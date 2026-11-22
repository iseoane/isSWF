# I0066 J003 brief r1: integration and review-preparation tools

- Authorization: operator, 2026-11-22 ("si", to adding the PR integration sequence as a tool).
- Objective and acceptance: [plan.md](../../plan.md) J003.

## Notes

- Existing pieces: `tools/isswf-handoff.mjs` (review, coverage), `tools/isswf-ci-state.mjs`, `tools/isswf-record-new.mjs`, `tools/isswf-plan-edit.mjs`, the records push grant in `.factory/project-setup.md`.
- Observed failures to prevent: review dispatch refused for a missing brief path (I0065 J006 V002); handoff regenerated after the record existed (I0065 J003); missing Run lines (J001).

- Also (retrospective P5): the review template's placeholder lines end in a backtick followed by a period, so a filled "None." becomes "None.." and the record check refuses it; fix the template or make the parser tolerant.

## Method

- `isswf-tdd`: selected. Review: one reviewer, standards and spec.
