# I0025/J004 — Claude windows and individual native snapshots

## What changed and why

Extended the existing bounded converter for supported Claude cumulative tree windows and completed individual AgentOutput snapshots. Useful engineering was performed between operator-supplied current-Pi start/end captures; A003 retains the resulting preliminary real sample. Source completion is not full installed-Claude/Windows acceptance or automatic collection.

## Visual summary

| Input | Source behavior |
| --- | --- |
| Same-session/model-set cumulative Claude start/end | Guarded per-model deltas, one inclusive report tree row |
| Single/resumed cumulative result | Snapshot only, rejected as ordinary report window |
| Supplied completed AgentOutput | Opaque individual snapshot; missing categories unknown, never additive to inclusive tree |
| Pi measurement | Rounded parent start/end plus four exact host-normalized new child summaries; approximately22.28M known processed subtotal, not full total |

## Checks and results

Target base `a7ac95ba53213044418c1c6d626eabd9ccf955fb` (PR146), document checkpoint `adfb79e354ccc0d5a4024653befd787a413e7938` / brief-r2. Initial source `2a85519c9456b08af0026dd67f5cfc19128d9d42`; corrected reviewed source `00a937812e93ba7bd0887379e318c4feb7066b5f`.

Coordinator independently ran native-usage/report focused suites and full portable quality on both candidates: PASS. Full ESLint/Knip on corrected source: PASS. Worker reports docs/diff checks PASS. Corrected literal Claude tree fixture deltas input16/output6/cacheRead7/cacheWrite3 produce32processed and one acceptance; individual omitted categories and exact row-ID consumer limit covered. Fixtures and declared source schemas do not establish native Claude2.1.312 or Windows behavior. Full portable quality marks separate native-host delegation NOT_RUN; exact published-head CI is separate.

## Independent review

V001 Standards fail / Spec fail against2a85519: absent individual counters rejected rather than unknown, and composed Claude row IDs could exceed consumer128limit. One correction cycle fixed both with tests and equivalent guides; initial fail retained. A001 strict-required-counter description is historical and superseded by A002, not silently rewritten.

V002 Standards pass / Spec pass on exact00a9378 correction delta with justified unchanged-source reuse; no optional/blocking findings remain in that scope. Required procedure consumed; source reads/checks attributed, no reviewer commands or actual native observation. All initial worker/correction/two-review allowances spent; no further automatic actor/retry. Functional source unchanged after final review.

## Scope

Existing native converter, focused tests and canonical EN/ES operations only. No report-contract weakening, telemetry, automatic Pi collection, extension activation, harness/dependency/settings changes, artificial provider calls, private transcripts/auth discovery or installation. Native AgentOutput source is the locked2.1.299 declaration; installed2.1.312 compatibility is explicitly unverified. Host version for window inputs is caller-declared, not independently verified provenance. Windows evidence remains pending.

## Integration risk and recovery

**Medium:** newly enabled window arithmetic and agent attribution can mislead optimization decisions if source scope/version/continuity is mislabeled. Native schemas can carry adjacent sensitive content; the adapter must continue numeric-only allowlisting and opaque identities. Monotone/session/model checks, unknown handling, snapshot/window separation, unchanged consumer guards and independent correction review mitigate demonstrated risks. No execution settings or product-data migration changes. Detect discrepancies by comparing source summaries and focused checks; correct inputs and regenerate derived output, or revert converter changes. Reverting cannot recall previously leaked data; live installed-Claude rollback was not tested. Residual uncertainty: native runtime/version compatibility, caller-declared provenance, per-agent resume semantics and cross-platform behavior.

## Closure and acceptance

Bounded source checks/review complete. Overall J004 remains partial: installed-Claude/Windows verification, exact-head CI and operator acceptance remain separate. DraftPR147 was published at1545091; source review complete. Current-parent end measurement is now retained in A003, not pending. No savings, full attribution or all-host readiness claim.

`measurement/start.json` records operator-transferred rounded display before any J004 model actor. `measurement/actors.json` records the four exact known native child attempts only: input415611/output32842/cacheRead4069888/cacheWrite0, processed4518341,66hostturns. These are host-normalized counters, not provider billing or whole-workflow totals. Prior9children excluded; no unavailable warning is not completeness proof. Parent cacheWrite is undisplayed/unknown; retained nominal parent delta is input40000/output21000/cacheRead17700000/54turns, approximate due to k/M rounding. Combined known subtotal approximately22279341/120turns, not a full processed total. Do not sum inclusive totals plus children.

## Blockers and next action

Draft stacked PR147 against feat/i0025-native-metrics at a7ac95b was read back at head1545091; CI41503551152 portable/Ubuntu PASS and Windows IN_PROGRESS at observation. Operator supplied the end summary; A003 and measurement/calculate.mjs verify approximate parent difference and new child IDs without old-work duplication. Retain this bounded receipt checkpoint; exact-head CI and native/runtime gates remain separate. No new measurement-only model calls. Full native capability, acceptance and merge remain open; preserve unrelated .pi/subagents and all unique evidence.
