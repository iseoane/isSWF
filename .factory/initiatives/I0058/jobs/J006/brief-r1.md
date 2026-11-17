# I0058 J006 brief r1

- Authorization: operator, 2026-11-17, "y si puedes luego I0058 J006". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0058-j006-stopped-waits`. Merge needs a person's approval (REVIEW.md: `feature-delivery.md`).
- Writer: the coordinator in the primary checkout (sole writer).
- Baseline: origin/main 785368b.
- Objective and acceptance: [plan.md](../../plan.md) J006.

## Design

Guidance only; no hook. Neither host gives a hook a reliable event for a background command the host stopped, and the coordinator already consumes completion notices. Add to the shared delivery step that governs CI waits (`.agents/roles/references/feature-delivery.md`, step 5, both hosts):

1. A notice whose status is not a normal exit, or that lacks the command's final output, is a stopped wait, not a result.
2. Rerun the same bounded command once; if it stops again, report it pending to the operator with the cause.
3. When a wait passes its bound plus a margin with no notice, check its state through the host before waiting longer.

## Scope

- In: `.agents/roles/references/feature-delivery.md`.
- Out: hooks, host guides, docs (the reference is the canonical resource).

## Method

No TDD (prose). One opus/medium reviewer; budget 1 review round, 1 correction.
