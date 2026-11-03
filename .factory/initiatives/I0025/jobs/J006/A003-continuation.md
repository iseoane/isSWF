# J006 A003 — finite extra correction continuation

**Status: implementation complete for the three source findings; independent review pending.** This continues the one originally authorized extra correction; no new attempt, actor, or cycle was used.

## Identity and commits

- Checkout `/home/iseoane/Work/isSWF`, branch `feat/i0025-auto-claude-capture`.
- Original source candidate `9be29fa98260231e1d1a0ef39b43873e40ff9c2f`; document checkpoint `488f1cbe0c02ffc602e63236a25d3391cde74084`.
- Commits from this correction: `03bcabf09a3eb35efd38511c5f33b67744689d9d` (canonical resource attributes and preserved report identities), followed by `c7afd308941c3e73f13adcaacd8935e65e2e3b2c` (`test: use portable controlled Claude executable fixtures`). Final HEAD is `c7afd308941c3e73f13adcaacd8935e65e2e3b2c`.
- Changed paths across the two commits: `tools/token-native-claude.mjs`, `tools/token-native-summary.mjs`, `tools/token-report.mjs`, `tests/token-native-claude.mjs`.
- No staged files. Dirty I0026 plan, untracked I0026 brief and `.pi/subagents/` were preserved.

## Findings addressed

- **B1a:** Keyed resource and point attributes are validated for duplicate keys and canonicalized by key before hashing. The literal regression reverses resource attribute order for cumulative input 11, advances export end time, and verifies equal series identity and merged total 11. Changed-start and replay/order guards remain tested.
- **B1b:** Conversion rejects incoherent category intervals within a source/model/resource group. Rows preserve explicit source and an opaque session/group/interval segment value. Row IDs use stable task/source/model/resource-group identity, not launch or interval, so separate matched launches can compare. Report comparison still requires matching source but does not require equal opaque segment IDs. A regression compares two independent launches with changed session/start/end and confirms `comparable`, while retaining different segment identities and the existing 26 arithmetic/window behavior.
- **B4:** Replaced POSIX shebang/chmod fixture executables with a copy of the current `process.execPath` named per platform (`claude` / `claude.exe`), passing the fixture JS pathname as the first ordinary argument. This uses Node's native `--version` as the controlled version response and runs the test script with inherited stdio. Fixture PATH contains only its controlled executable directory, preventing fallback to an installed Claude. Missing-executable coverage uses an empty fixture-only search directory, not `/usr/bin`. Resistant-SIGTERM proof is explicitly POSIX-only; Windows branch asserts the native `.exe` executable mechanism and does not claim native Windows cancellation parity. The full process fixture suite is written to run on Windows, but was executed only on Linux here.

## Checks and incidents

- `timeout 50s node tests/token-native-claude.mjs` — PASS on final source (portable controlled launch/ingress, missing executable, Linux resistant-child path, identity and comparison regressions).
- `timeout 40s node tests/token-native-usage.mjs` — PASS.
- `timeout 40s node tests/token-report.mjs` — PASS.
- `timeout 40s node tests/token-native-auto-pi.mjs` — PASS.
- Locked ESLint command supplied by coordinator — PASS (exit 0, no findings): `timeout 60s node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools/token-native-claude.mjs tools/token-native-summary.mjs tools/token-report.mjs tests/token-native-claude.mjs` (run on exact final changed contents before commit c7afd30).
- Locked Knip command supplied by coordinator — PASS (exit 0, no findings): `timeout 60s node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress` (same exact final changed contents before commit c7afd30).
- `timeout 120s node tooling/.local/i0025-claude-feasibility/native-entry.mjs` — PASS after c7afd30: pinned direct Claude 2.1.312 ELF via fixture PATH, two synthetic API requests, one row, CLI/consumer exit 0, total 26. Evidence remains under ignored `tooling/.local/i0025-claude-feasibility/entry-output`. This is real native CLI telemetry against synthetic provider replies, not real-provider usage.
- `timeout 120s node tools/check-quality.mjs` — PASS after c7afd30; quality output identifies exact revision and `nativeHostDelegation` as NOT_RUN.
- `git diff --check` — PASS. No staged files.
- Prior continuation's `npx eslint` and `npx knip` warnings that they would install missing packages remain adverse evidence; effects are unknown. In this continuation neither npx nor npm, mise, cleanup, global configuration inspection/repair, wrapper, or real Claude was invoked. Original unauthorized install attempt, cleanup violation and possible global mise mutation remain unreconciled; no global unchanged claim is made.

## Limits / disposition

B1a, B1b, and portable fixture design are corrected in source/tests. Independent review of final `c7afd30` remains required; this report does not claim review acceptance. Actual Windows execution/cancellation parity is unverified; managed-policy compatibility, interactive TTY behavior, native child coverage and descendant cessation remain unverified. Full-quality's separate nativeHostDelegation check remains NOT_RUN. Historical and npx-related process incidents are preserved separately from source status.

### Required references and method

The shared worker role was reread for this continuation. The checkpoint-pinned plan and J006 documents plus canonical methodology/resources were consumed in the original correction context as recorded in the preceding A003 report; no read trace is available and that consumption remains self-reported. Concrete continuation application: design/verification in canonical identity, coherent intervals, and independent-launch comparison tests; code quality in focused implementation and locked lint/Knip; execution principles in no fallback to installed Claude and POSIX-only signal evidence. TDD/RED was not selected or claimed. No documentation changes were needed for this scoped source/test correction.

## Acceptance report

```acceptance-report
{
  "criteriaSatisfied": [
    {"id":"criterion-1","status":"satisfied","evidence":"This report gives concise outcome, exact commits, checks, and remaining risks."}
  ],
  "changedFiles": ["tools/token-native-claude.mjs","tools/token-native-summary.mjs","tools/token-report.mjs","tests/token-native-claude.mjs"],
  "testsAddedOrUpdated": ["tests/token-native-claude.mjs"],
  "commandsRun": [
    {"command":"timeout 50s node tests/token-native-claude.mjs","result":"passed","summary":"Portable controlled executable fixture and identity/comparison regressions pass on Linux."},
    {"command":"timeout 40s node tests/token-native-usage.mjs && timeout 40s node tests/token-report.mjs && timeout 40s node tests/token-native-auto-pi.mjs","result":"passed","summary":"Native usage, report, and Pi regressions pass."},
    {"command":"timeout 60s node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools/token-native-claude.mjs tools/token-native-summary.mjs tools/token-report.mjs tests/token-native-claude.mjs","result":"passed","summary":"Coordinator-provided locked ESLint, no findings."},
    {"command":"timeout 60s node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress","result":"passed","summary":"Coordinator-provided locked Knip, no findings."},
    {"command":"timeout 120s node tooling/.local/i0025-claude-feasibility/native-entry.mjs","result":"passed","summary":"Pinned direct Claude 2.1.312 synthetic-provider native capture/report, total 26."},
    {"command":"timeout 120s node tools/check-quality.mjs","result":"passed","summary":"Full portable quality on final commit; nativeHostDelegation NOT_RUN."},
    {"command":"git diff --check","result":"passed","summary":"No whitespace errors; no staged files."}
  ],
  "validationOutput": ["Final source HEAD c7afd308941c3e73f13adcaacd8935e65e2e3b2c.","Native synthetic proof total 26; two API requests, one receipt row, child/consumer exit 0."],
  "residualRisks": ["Independent review of final candidate is pending.","Windows suite was not executed; Windows native cancellation/platform parity remains unverified.","Managed-policy compatibility, TTY behavior, native child coverage and descendant cessation remain unverified.","Historical unauthorized install/cleanup/possible mise mutation and previous npx acquisition warning/effects remain unreconciled.","nativeHostDelegation remains NOT_RUN."],
  "noStagedFiles": true,
  "diffSummary": "Canonical resource identity, strict duplicate handling, coherent/preserved native source and segment semantics, stable cross-launch comparison identity, and platform-supported controlled Node executable fixtures.",
  "reviewFindings": ["No independent review performed by this worker; review final commit c7afd308941c3e73f13adcaacd8935e65e2e3b2c."],
  "manualNotes": "Correction implementation complete within the original finite allowance; review and acceptance remain separate. Prior npx breach and original incidents are not erased."
}
```
