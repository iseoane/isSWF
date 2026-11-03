# J006 / A006 continuation — observed-series snapshot under r7

Coordinator-retained summary of the worker's returned report (worker Write again got no auto-mode verdict; not retried). Status: implementation complete, review pending. Baseline 50df98ba77901b52b5ace9afed91b476b3ea0c70, candidate **63a64d0a48863340ee647d63849141b1ac85f2c7**; files: tools/token-native-claude.mjs, tools/token-native-summary.mjs, tools/token-report.mjs, tests/token-native-claude.mjs, docs/en|es/operations.md, .agents/skills/isswf-setup/SKILL.md. Ignored evidence: tooling/.local/i0025-claude-feasibility/native-entry-r6.mjs and entry-output-r6/ (original entry-output untouched). Model parent-inherited, observed claude-opus-5-5, effort unknown.

## Implementation (self-reported)

Series identity digests canonical resource, instrumentation scope, metric name/unit and every point attribute; identical repeats are no-ops, same-end conflicts fail. Lifetime ingress cap removed (per-request 1 MiB, 2 concurrent, 100 rows, 64 KiB receipt kept); default interval 60000 ms, optional setup `exportIntervalMs` 1000..60000. Receipt v2: `exportStatus` export-observed/no-export-observed, `receivedExports`, `capture`, per-series start/end; `policyStatus` removed; no logs exporter. `normalizeClaudeOtel` replaced by `snapshotClaudeOtel` (`mode: observed-snapshot`, `observedSubtotal`, `total: null`, `totalStatus: unknown-coverage`). token-report adds strict snapshot validation and comparison (`exploratory-coverage-limited` / `incomparable`), refuses snapshot/window mixing; window path byte-unchanged. EN/ES operations and setup skill updated.

## Checks (worker, exact candidate unless noted)

Four focused suites PASS; native-entry-r6 PASS (installed Claude 2.1.312, synthetic loopback, 60 s interval, final export at exit, export-observed, 4 series, subtotal 26); `node tools/check-quality.mjs` exit 0 in 96 s, nativeHostDelegation NOT_RUN; check-docs, ESLint, Knip, diff --check PASS on byte-identical pre-commit tree. Coordinator re-ran the four focused suites on 63a64d0: PASS.

## Self-reported deviations and risks

r5 check 1 uses a reconstructed 1 ms fixture (original receipt bytes lost). Check 5: no new dedicated cardinality-overflow/storage-conflict tests. Window format still accepts `native-claude-otel` rows and operations line 45 (EN/ES) still lists it. Any rejected request invalidates the capture. Windows native, interactive TTY, real child coverage and managed-policy behaviour unverified.
