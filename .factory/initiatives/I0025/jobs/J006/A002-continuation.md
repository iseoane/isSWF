# J006 A002 — Same reserved correction, updated result

**Disposition: substantial correction committed; B1–B4 are materially covered by source and portable fixtures, but the job is still partial pending independent review and platform/policy limits.** This continues the original correction authorization, not a new attempt or cycle. Checkout `/home/iseoane/Work/isSWF`, branch `feat/i0025-auto-claude-capture`; initial correction candidate `d47eda4c018776f85b5b5b4900fd3eb03b21fbe6`; document checkpoint `74134748b2a11ef37a09040c7878238f2e0ac828`. Commits made in this correction:

- `d146600f1e83fce5df83910817ac80b8a5c833ef` — `fix: validate Claude metric series and values` (B1/B2, consumer preservation, initial bounded cancellation logic).
- `9be29fa98260231e1d1a0ef39b43873e40ff9c2f` — `test: cover Claude launch ingress and cancellation` (controlled child/HTTP fixtures, explicit executable resolver and resistant-child regression).

Final HEAD is `9be29fa98260231e1d1a0ef39b43873e40ff9c2f`. Changed paths across both commits: `tools/token-native-claude.mjs`, `tools/token-native-summary.mjs`, `tests/token-native-claude.mjs`. No files are staged. The unrelated dirty I0026 plan, untracked I0026 brief and `.pi/subagents/` are preserved and untouched.

## Correction and fixture coverage

- **B1:** Required cumulative point start/end timestamps and retain opaque hashed resource/series/group identities. Changed start for an existing series, duplicate series, non-increasing/replayed export order and decreasing values are rejected, rather than silently merged. Consumer validates and carries source grouping through to an opaque bounded report-row identity. Tests include changed-start, equal/nondecreasing repeated values, replay, out-of-order and multiple source/model rows.
- **B2:** Exactly one supported numeric representation is required. Safe integer `asInt`/`asDouble` numbers and canonical integer strings are accepted; absent, null, boolean, empty, negative, fractional, non-finite and ambiguous dual representations fail before conversion.
- **B3:** Controlled helper process test launches a fake native child that ignores SIGTERM, sends SIGTERM to the helper, and observes helper completion after bounded SIGKILL escalation; the assertion requires the helper to close in under six seconds. The helper keeps cancellation distinct from child exit/capture and reports descendant state unknown; it makes no descendant-cessation claim. This fixture proves the exercised Linux path only, not all OS/process-kernel failure modes.
- **B4:** Tests launch the actual helper against controlled executable fixtures. An enabled valid fixture POSTs native-shaped OTLP to the helper's ephemeral loopback endpoint and asserts a retained numeric receipt, argument preservation and inherited stdin/stdout. Wrong path, auth, invalid schema and oversized body are each exercised and assert no receipt. Missing executable/version spawn failure returns nonzero. Disabled launch still proves preserved arguments/stdin/stdout and no capture destination/write. `claudeExecutable('win32')` selects `claude.exe`; `claudeExecutable('linux')` selects `claude`. This is a portable selection assertion, not actual Windows execution or proof that all Windows spawn/stdio semantics work.

## Checks on final committed candidate

All commands below were run with bounded process deadlines where applicable; final source/test focused checks were run before the final test commit and the commit contains those exact changes. The full-quality and native-entry commands were run after the final commit.

- `node tests/token-native-claude.mjs` — PASS, including controlled enabled ingress and resistant-child cancellation.
- `node tests/token-native-usage.mjs` — PASS.
- `node tests/token-report.mjs` — PASS.
- `node tests/token-native-auto-pi.mjs` — PASS.
- `node --check tools/token-native-claude.mjs`, `node --check tests/token-native-claude.mjs` — PASS.
- Focused ESLint on `tools/token-native-claude.mjs`, `tools/token-native-summary.mjs`, `tests/token-native-claude.mjs` — PASS.
- Knip — exit 0, no findings.
- `git diff --check` — PASS; final post-commit invocation also passed.
- `timeout 120s node tools/check-quality.mjs` — PASS after commit. Output revision is exact final HEAD `9be29fa98260231e1d1a0ef39b43873e40ff9c2f`; portable quality reports its separate `nativeHostDelegation` check NOT_RUN. ESLint/Knip were run separately as above.
- `timeout 120s node tooling/.local/i0025-claude-feasibility/native-entry.mjs` — PASS after final commit using the installed direct Claude 2.1.312 binary and the existing synthetic loopback API fixture. It reported two API-path requests, one captured row, child exit 0, consumer exit 0 and total 26. Evidence remains in ignored `tooling/.local/i0025-claude-feasibility/entry-output`; this is actual CLI telemetry under synthetic provider replies, not real-provider usage. No raw payload was inspected or retained.

## Scope and residual limits

- No actual Windows run; Linux fixtures and the executable-name selector do not prove Windows parity.
- No independent review of final candidate `9be29fa` has been performed. The one already-reserved independent review remains the next coordinator action.
- Managed endpoint/credential/selector precedence was supplied in the pinned brief; installed managed policy was not inspected or verified. Readiness remains unknown where policy conflicts might apply.
- Prior adverse process evidence remains unchanged: unauthorized wrapper-triggered installation attempt, prohibited temporary-root cleanup, and possible global mise-config mutation unknown/unreconciled. No wrapper/mise/install/global-configuration operation, real provider call, evidence cleanup, push, PR or merge occurred during the correction.
- No global config was read/repaired, no additional actor or retry was used, and no coordinator/I0026/`.pi/subagents/` files were edited.

## Resources and method

The original correction already consumed the pinned plan, J006 r1/r2/r3, V001, A001 and A001-continuation; the shared worker role; design/code-quality/comments/verification/execution references; observability/security/writing/setup skills and their selected writing references; and Claude host guide. This continuation reopened the exact changed sources/tests and preserved consumers. No additional long methodology resource was reread without need. Consumption remains self-reported; no host read trace is available. TDD/RED was not selected or claimed. The finite correction time was used for committed behavioral tests instead of ending after the earlier partial implementation.

**Current status:** partial pending independent review. Exact final source candidate is `9be29fa98260231e1d1a0ef39b43873e40ff9c2f`; request review of that commit under the already-reserved review allowance. Do not infer acceptance from passing checks.
