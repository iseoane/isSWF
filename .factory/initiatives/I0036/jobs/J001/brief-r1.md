# Job brief J001 / r1

## Identity and authorization

- Source: operator chat 2026-11-08 after reviewing unclebob/ub-mode (https://github.com/unclebob/ub-mode, HEAD 3da62bf3) and unclebob/swarm-forge (main f4f5fbca).
- Authorization: implementation and local commits on `feat/ub-mode-practices`. Push, PR and merge are coordinator-owned.
- Profile: worker. Target base: e6a7773c8b83ce4edb64bf3c59f0082dab383f9a.

## Objective

Add three short practices to the shared methodology and record two future actions.

## Units

1. **Attack the premise.** Source rule: "When two fixes that share one premise fail the same gate, write that premise in one sentence… Do not start another fix until you have done that." Add to `.agents/roles/references/verification-principles.md` "Cause before patch" and one line in `.agents/roles/worker.md` Execution: after a second failed fix against the same check, record the shared premise in the attempt record and either challenge it with evidence or return to the coordinator before a third fix.
2. **Empty-return test check.** Source rule: "If the test would still pass when every function returned nothing, throw it out." Add as one checkable line to `.agents/roles/references/tdd.md` and to the test-quality part of `.agents/roles/references/review.md`.
3. **Build the lever.** Source rule: "Do one unit by hand, then make the tool match that unit." Add to `.agents/roles/references/execution-principles.md` "Automate and encode when justified": hand-do one unit first, then compare the tool's output against it before applying it broadly.
4. **Future actions (EN and ES mirror).** In `docs/en/future-actions.md` "Review quality" (or the closest section) and the same place in `docs/es/future-actions.md`: (a) project-declared numeric quality gates — complexity (e.g. CRAP), duplication and differential mutation on changed code, declared in the target's REVIEW.md/setup, run by the worker before hand-off and checked by the reviewer; cost: new locked dev dependencies, slow mutation and equivalent-mutant noise, gameable thresholds; pilot on `tools/` first. (b) optional refactor assignment after green, selected by the coordinator for larger features, behavior pinned by tests; cost: an extra model call and churn; never a mandatory stage. Cite the source repos. Proposals grant no work.

## Exclusions

- No new skill, role, tool or dependency. No mandatory pipeline stage. Keep each addition to one or two sentences in the most specific existing place; do not duplicate guidance.

## Checks

- `node tooling/quality/check-docs.mjs`, `node tests/host-portability.mjs`, `node tests/worker-methodology.mjs`, `node tests/worker-method-evidence.mjs`, any test asserting on edited files (grep tests/ for their paths, e.g. diagnostic bundle size for review.md), `git diff --check`.

## Review

Semantic review of methodology text by an independent reviewer after the worker stops.
