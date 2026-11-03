# I0025/J003 — Native usage bridges, source candidate

## What changed and why

Added explicitly opted-in native Pi usage snapshot source code and a bounded converter for Pi receipts/Claude final-result counters. It avoids model-based extraction and raw session parsing. Overall slice3 remains **partial**: source implementation/review is not actual host activation or complete native/platform acceptance.

## Visual summary

| Path | Supported source outcome | Explicit limit |
| --- | --- | --- |
| Optional Pi command | One native cost-RPC snapshot, parent/children, opaque identities | Not loaded or registered; native acquisition unverified |
| Pi start/end converter | Guarded delta to existing report window | Refuses incompatible session/branch/version, missing rows, decreases or unresolved children |
| Claude final-result converter | Numeric-only inclusive tree snapshot using modelUsage | Snapshot-only; no child shares or accepted-outcome window |
| Existing report | Accepts curated windows, rejects snapshots | No change to prior report semantics |

## Checks and results

Target source base635277b834e63f461a12296401a9ee0b1fbc897c (PR145); document checkpoint876c2691626353c2f6ec5c6940ece4373ffe8b77 with brief-r2; initial candidate2741cfea0eeddcc6926a9382f2aa880032a53e5e; corrected source2eca40b0a4e82a28fe84498940ec8eba9e354899.

Coordinator independently ran native-usage and existing report focused suites plus full portable quality on both source candidates: PASS. On corrected source, coordinator additionally ran full ESLint, Knip and diff checks: PASS. Worker A001/A002 report docs/package/syntax checks and full host-resource reads; these remain self-reported. Existing shared synthetic fixtures exercise privacy, snapshot rejection, Pi windows, Claude model identity, timeout and exclusive destination behavior, not live native collection. Full portable quality explicitly does not run the separate native-host CI gate.

## Independent review

V001 Standards fail / Spec fail on initial2741cfe: cumulative snapshots were emitted as windows, private counter extras could leak, model identity was collapsed, and Pi version was invented. The single correction cycle addressed all four; failed verdict is preserved.

V002 Standards pass / Spec pass on exact2eca40b correction delta, with explicit unchanged-source evidence reuse. Bound identity/diff/content integrity observed; required procedure consumed. No reviewer command/native activation. Optional nonblocking suggestion: strengthen token-value-independent model fingerprint, explicit observed version and known-version mismatch assertions on a future relevant edit. No source changes after V002.

## Scope

Two native bridge modules, focused portable tests/registration, Knip entrypoint and canonical bilingual operations guidance. No dependencies, autoload/registration/settings edits, telemetry activation, provider calls, raw transcripts/private-store discovery, daemon/exporter/server, host installation or model extraction. Source-only opt-in code is not an installed feature. J002 baseline remains partial and is not retroactively completed.

## Integration risk and recovery

**Medium.** An explicitly loaded Pi extension runs with host permissions and writes a chosen local destination. Wrong counter identity/window semantics could mislead optimization decisions; a filtering defect could expose sensitive adjacent native fields. Bounded allowlists, opaque hashes, generic errors, exclusive file creation, snapshot/window separation and independent correction review mitigate demonstrated failures. No activation/autoload limits immediate exposure, but fixtures do not establish real host/Windows behavior. Detection: inspect sanitized output and run focused regressions before use. Recovery: stop loading the optional extension, discard/recompute derived receipts and revert source; a revert cannot recall any previously disclosed data. Actual host loading/unloading and rollback were not tested. Residual risk includes host-normalized missing-vs-zero, unknown Pi version, unavailable per-child Claude attribution and native API/version compatibility.

## Closure and acceptance

Bounded source checks and independent source review complete. Full native acceptance, operator acceptance, integration and persistent installation/activation are not complete. A003 records a later explicitly authorized actual temporary Pi/Linux extension load and native costRPC snapshot in a fresh empty session: PASS, no model/tool activity, no settings changes. This establishes empty-session loader/API acquisition only; nonzero coordinator/child/window behavior, installed Claude/Linux result validation and Pi/Claude Windows-native evidence remain pending. Claude windows unsupported. No measurement savings or complete coordinator/child coverage claim.

## Blockers and next action

Draft stacked PR146 against feat/i0025-real-baseline at635277b was verified at head3e187822d7c1b20df0887a39da319aae7357f7b0; all three CI41494490046 checks SUCCESS. A003 retains the later authorized Pi empty-session native proof without functional changes; its record-only checkpoint and CI remain separate identities. Resolve real nonzero ordinary-work/native Claude observations and Windows evidence rather than manufacture completeness. Research, initial worker, correction and both independent review allowances consumed; no automatic extra actor/retry. Preserve unrelated .pi/subagents. No merge or direct-main push under current start.
