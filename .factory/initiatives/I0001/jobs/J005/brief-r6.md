# I0001 / J005 / r6

## Objective and authority

Complete the remaining finite review-panel verification and reconcile J005's existing evidence. The operator authorized this v1 work and necessary bounded native reviews. This unit adds a public test and quality wiring, not a scheduler or another runtime. No live worker/provider panel, reboot, client work or product acceptance is authorized by this brief.

## Functional unit and acceptance

Use the existing reviewer and planner callers with explicit fixture-only grants and one shared pool of two slots. Declare three distinct reviewer participants. Verify that a concurrent planner consumes the same limit, refused participants consume zero attempts and leave no attempt record, and later participants use released slots without deadlock. An inconclusive review remains a coordinator decision but releases its completed execution slot. Verify unrelated work progresses, completed participants cannot replay, and each invocation has its own opaque session ID with the fixed high-effort, zero-retry route.

The test must call the actual native entry points and inspect their results and capacity records. Injected model responses are synthetic: they are not independent reviews, provider availability evidence or product verdicts. Keep this distinction in output and delivery evidence.

## Existing J005 evidence to reconcile

| Criterion | Existing behavior and evidence |
| --- | --- |
| OPS-07 | Participating callers share one finite pool. PR62–64 cover SDK roles; PR65 and the installed-SDK offline worker test cover two isolated workers and unrelated progress. |
| OPS-08 | PR65 verifies permanent admission and task/tool cessation before worker release. PR66's normal CLI rejects unresolved decisions and unintegrated code before capacity or writer claims. Status labels alone do not prove integration. |
| OPS-09 | The shared parser and worker gate distinguish graph errors, decisions, missing attestations, code integration and later capacity exhaustion. Native plan, status and installed-tool checks preserve their boundaries. |
| MOD-07 | The new public test exercises three distinct reviewers using successive slots while sharing the same limit with a planner. |

Read the existing `sdk-capacity`, `diagnostic-capacity`, `researcher-capacity`, `worker-capacity` and `dependency-verification` records for each prior review's exact scope. Their earlier pending limitations are historical; do not rewrite them or turn them into claims of live-provider coverage.

## Verification and closure

Run `node tests/review-panel-capacity.mjs .`, aggregate quality, ESLint and Knip. Include this exact candidate's observations and relevant runtime contracts in one prepared independent review. Publish the test, quality wiring, evidence and progress together. Exact PR and main CI remain mandatory delivery gates.

No operator acceptance is recorded here. Legacy or unbound callers remain outside the shared-pool guarantee. Grants and pool records are cooperative operator-owned boundaries, not authenticated identities or machine-wide provider quotas. J006 continuity, J007 context/security, J013 retention agreement and whole-v1 acceptance remain separate.
