# I0061 J009 brief r1

- Authorization: operator, 2026-11-20, "puedes seguir con el siguiente job". Feature-to-PR start on `feat/i0061-j009-resolutions`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J009.

## Design

1. Review template (`.factory/templates/` review record): the "Finding resolutions" line takes one entry per finding: `<ID> <resolution>: <reason>`, resolution in {fixed, wrong, known-limit, not-material, dismissed}. A deferral to a tracked job is `known-limit` naming the job. Findings may carry `rule:` or `check:` with the ID of the rule or check that produced them, when one applies. State the vocabulary once in the template and in the review reference that describes resolutions; do not duplicate it elsewhere.
2. Record check: find the existing check that validates review records (start from `tools/isswf-handoff.mjs coverage` and the plan/record guards; codegraph first). Enforce the vocabulary only on review records that are new relative to the base (not present at the base), so historical records stay valid. If no record check exists where this fits cleanly, stop and report instead of building a new tool.
3. `.agents/roles/references/retrospective.md` (J008 V001): S1, name the review record location exactly (after the coordinator lines at the end of "Limits and return"); S2, allow recording a miss found later in authorized job records as late-recorded.

## Scope

- Out: rewriting existing records, a derived misses tool, model evals.

## Checks

Focused test for the record check (TDD), the tests that read the edited references, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Full suite to CI. Leave no background shells.

## Method

TDD for the enforcement. One opus/medium reviewer, 2 rounds, 1 correction.
