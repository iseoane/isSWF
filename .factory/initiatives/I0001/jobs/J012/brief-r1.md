# I0001 / J012 / r1

## Objective

Show a concise descriptive initiative label beside its stable ID, using the canonical plan title. Own initiative is displayed as I0001 · Factory v1.

## Authority and inputs

Operator explicitly requested this job and continued v1 implementation. Parent performs local offline implementation; no native worker/provider grant is inferred. Source base c314d343f5b0bba16ca040de22716b59b744e23f. Document checkpoint pending commit, not a dispatch input.

## Acceptance

- Existing status output exposes the canonical initiative title and an ID-plus-title display label.
- Title derives from plan.md, not a second editable record; changing the canonical title changes the displayed label.
- Stable initiative ID, path, job state and readonly behavior remain unchanged.
- Missing or malformed title is unknown rather than an invented label.
- Actual own initiative displays I0001 · Factory v1. Future full panel J009 consumes the same contract; this job does not implement that panel.

## Checks

Public status CLI tests, actual I0001 readonly query, portable quality, ESLint and Knip. One independent review and exact-head CI precede guarded merge. Human functional acceptance remains separate.
