# I0025/J001 — Offline token metrics, slice 1

## What changed and why

Added deterministic offline reporting/comparison for explicitly supplied sanitized Pi/Claude summaries. This makes consumption and cache reuse comparable without model calls to extract metrics. Per-agent rows are preserved where available; tree aggregates and unknown attribution are labelled separately.

## Visual summary

| Supplied input | Observable output |
| --- | --- |
| Curated independent summary windows | Token components, processed totals/partial subtotals, cache-read share |
| Individual agent rows sharing an accepted outcome | One acceptance denominator, not one per participant |
| Matched before/after summaries | Guarded differences; mismatched or zero-baseline data stays incomparable |

## Checks and results

Source base: `f8aef700c4a1c6889ee393e4ac6f9b0beeed0b66`. Document checkpoint: `e6ce435c2d66959c1d969d33d3b04d3a129b440a`, brief-r3. Initial candidate: `56b018141bfd084390bb4e7ece00ba5ca39f7dc4`. Corrected source candidate: `31603985d34137c36fa8a8211ac75b71cbdd4045`.

Coordinator independently ran `node tests/token-report.mjs` and `node tools/check-quality.mjs` on both source candidates: exit 0. Full corrected-candidate quality log identifies 3160398 and PASS, with separate native-host check NOT_RUN. Worker A002 additionally reports docs/documentation checks, scoped ESLint, Knip, syntax and diff checks passing. These are synthetic offline/packaging/static checks, not actual usage measurements or native collection validation. Exact published-head CI remains pending at this record checkpoint.

## Independent review

V001: Standards fail / Spec fail against 56b0181, retained unchanged. Four blockers: repeated acceptance counts, misleading tree attribution, combined row limit, and zero-baseline arithmetic. The single correction cycle fixed all four with focused regressions and matching bilingual docs.

V002: Standards pass / Spec pass against exact 3160398 correction delta, with explicit reuse only for demonstrably unchanged scope. Bound identity/diff/content integrity observed; no reviewer commands run. Both reviewers consumed required methodology; implementer consumption remains self-reported. Optional nonblocking suggestion: guide identity syntax should state the initial alphanumeric character explicitly when next edited. No source changed after final review.

## Scope

One Node.js offline CLI, focused tests registered in portable quality, existing EN/ES operations guides, and durable work records. No dependency additions, session discovery, native adapter, telemetry exporter, provider experiment, configuration changes, I0024 changes, real baseline or savings claim. Linux/Windows and Pi/Claude native collection remain outside this slice; synthetic portability is not native proof.

## Integration risk and recovery

**Low**, bounded to an explicitly invoked local reporting tool and its documentation/test registration. Wrong supplier declarations or a semantic defect could mislead consumption decisions; the tool does not alter host execution, product data, permissions or billing. Input/row/output bounds, allowlisted fields, contradiction/overlap refusal, hand-calculated fixtures and independent correction review mitigate demonstrated risks. Detection is through report consistency and focused regression checks; discard/recompute a derived report after correcting supplied data. A code revert restores the prior absence of this tool; no persistent data migration exists and rollback was not live-tested. Residual exposure: manually supplied data can be incomplete or inaccurate; coverage row counts do not establish the real expected actor population. Do not interpret estimates as billing or quality acceptance.

## Closure and acceptance

Local source checks and required independent source review complete for slice 1. PR publication and exact-head CI are separate pending delivery states at this checkpoint. Operator product acceptance and integration are not recorded. No direct-main integration granted by this feature start. Slices 2/3 are not started.

## Blockers and next action

Publish feature branch/PR to `iseoane/isSWF:main`, verify head/base/body and exact-head CI. All initial worker, correction and two independent review allowances are consumed; no retry/replacement or new actor is inferred. Preserve unrelated untracked `.pi/subagents/`. After green CI, request the bounded operator integration/acceptance decision rather than silently integrating.
