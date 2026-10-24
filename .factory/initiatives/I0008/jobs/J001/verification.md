# Specialised skills verification

## Candidate and scope

- Original checkout base: `b301d977ce336deca59861227f4dbc834f8739ee`.
- Retained unpublished source fixture: `66d49b73c99e186a14af3bd8dc027403189a7ebc`.
- The fixture contains the exact 35 changed product/test/guide and brief files reviewed. Its source/resource bytes are retained in private `tooling/.local/specialized-skills-validation/candidate.json` with hashes and modes. This is a test-fixture commit, not a commit in the operator checkout.
- Scope: three standalone/shared task skills and Claude entry files; conditional coordinator and worker/reviewer/diagnostician pointers; planner/reviewer design guidance; Pi/plugin manifests and resource provenance; pinned caller transport, tests and matching English/Spanish guides.
- Release version, role keys, model routes, user settings, installed project pins and historical inputs remain unchanged.

## Observed checks

| Check | Observed result | Scope and limits |
| --- | --- | --- |
| `ISSWF_TEST_BUN=<installed Bun> ISSWF_TEST_BUN_WORKER=1 node tools/check-quality.mjs` | PASS | Current working-tree checks plus disposable current-source Node/Bun packages. The top-level reported Git revision is the unchanged base; nested fixture commits identify packaged current bytes. |
| Native diagnostic/reviewer/planner fixtures | PASS | Complete selected skill/design text reaches the caller at the same methodology SHA as its role. Source/legacy paths do not silently adopt new resources. Synthetic transports are not live specialist executions. |
| Compiled offline worker | PASS | New resources are readable under `/factory`; actual Linux Bubblewrap read-only boundary and owned-write controls pass with a synthetic SDK. No provider prompt is sent. |
| Locked ESLint, Knip, documentation checker and `git diff --check` | PASS | Configured syntax/static/unused/link/mirror checks, not proof of all possible defects or translation quality. |
| `tests/platform-package.mjs` against the retained fixture | PASS | Native Linux x64 Bun artifact, installed tarball and exact receipt; actual CLI/read-only behavior and resource contracts. |
| Native Pi 1.4.0 and Claude Code 2.1.299 inventory | PASS | All fourteen distributed skills discovered in isolated local test configurations. No model session, real credentials or global host settings change. |
| Source-checkout host selection | PASS | Fifteen source skills including source-only triage, collision controls, unchanged neighbouring/user settings, scoped filters and explicit Claude source discovery. This is resource selection, not sandboxing. |

No Windows run, remote CI, production scan, application profiling, telemetry deployment or real skill-adherence evaluation is claimed for this pending source change.

## Independent source review

The supported native reviewer caller reviewed the full retained candidate using the unchanged `openai-codex/gpt-6-luna` route at requested `high`, with SDK-confirmed OAuth subscription coverage, one attempt, one fetch and HTTP 200. The caller verified the returned provider/model; requested effort is runtime-supported, not a separate provider effort receipt.

- Standards: **pass**.
- Spec: **pass**.
- Aggregate: **pass**.
- Findings and suggestions: **none**.
- Base/candidate: the full SHAs above.
- Supplied bundle SHA-256: `748ac89da5594e5ec188f87b7ec5bfa7157bb0e8dc83c588394cf96b575eb710`.
- Methodology SHA-256: `08d496b936b874d7864a8752efa758323e72159583f0db394b8e0c4d423d837c`.

The reviewer assessed supplied pinned source and evidence in an independent text-only execution. It did not run checks, recompute Git identity with workspace tools, certify compliance or accept product/publication decisions. The parent reconciles the report with retained hashes and observed checks. Raw requests, result and report remain under ignored `tooling/.local/specialized-skills-validation/`.

## Static workflow walkthrough

These are instruction-structure checks, not measured adherence improvements:

- Security assessment: map assets and trust boundaries, inspect relevant abuse cases and report evidence; fixes, active scans and production probes remain separately authorized. Missing essential evidence leaves the affected result inconclusive rather than secure.
- Authorized hardening: preserve legitimate access and test the forbidden effect using controlled data; do not generalize fixture results to the whole environment.
- Performance question: require the correct workload, comparable baseline and actual bottleneck evidence. A fast error, skipped work, setup difference or overlapping sample spread cannot support a speedup claim.
- Observability proposal: name operational questions, fields, units, cardinality, retention and destination before adding instrumentation. Read-only or text-only execution cannot install telemetry or contact unseen services.
- Observability implementation: inspect actual emitted data and relevant failure behavior. Correlation values remain untrusted, metric dimensions bounded, and saved events do not prove live process state or lifecycle authority.
- Domain/interface work: use the target glossary and existing decisions, inspect concrete scenarios and caller contracts, distinguish relocated complexity from reduced complexity, and preserve persisted names. Routine choices do not require an ADR.

## Remaining boundary

The local implementation and selected verification are complete for this scope. Operator acceptance, source checkpoint, remote CI, publication, installation and project runtime updates are separate. No automatic follow-up or delayed wakeup remains active for this assignment.
