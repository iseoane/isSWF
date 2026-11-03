# J006 / A005 continuation — native-entry diagnosis

**Status: correction complete; independent review remains reserved/pending.**

Checkout `/home/iseoane/Work/isSWF`, branch `feat/i0025-auto-claude-capture`. Prior correction commit `af1fc668be03c833e3f931420152bc8b4438a0f4`; continuation commit `cafe6859159d576c1950b225b2e02e92985228fa` (`Allow one-nanosecond OTLP category boundary skew`). Only `tools/token-native-summary.mjs` and `tests/token-native-claude.mjs` changed in the continuation. Existing dirty I0026 files and `.pi/subagents/` were preserved and not staged.

## Diagnosis and correction

The failing `native-entry.mjs:54` converter invocation was neither caused by the scalar validation change nor by invalid overall schema. It was a genuine, narrowly demonstrated category-interval mismatch: the retained synthetic native receipt `tooling/.local/i0025-claude-feasibility/entry-output/entry-native-receipt.json` had matching resource/group and end timestamp across input/output/cache categories, but input `start` was `1793704489527000000` while the other categories started at `1793704489528000000` (1 ns difference). `normalizeClaudeOtel` rejected the group at its former exact `row.interval !== interval` check. Direct invocation on that receipt and metadata returned `invalid native summary input`; an earlier retained numeric receipt with fully matching intervals normalized successfully.

The converter now accepts category start boundaries differing by at most 1 ns only when end timestamps match, and uses the latest start (the common interval boundary) in the opaque segment identity. Larger skews and any end mismatch remain rejected. Tests prove the one-nanosecond case canonicalizes to an all-category common boundary and a 2 ns difference remains rejected. This preserves boundary/segment identity rather than dropping the check.

## Exact-candidate validation

On `cafe6859159d576c1950b225b2e02e92985228fa`:

- `timeout 15s node tests/token-native-claude.mjs` — PASS.
- `timeout 55s node tooling/.local/i0025-claude-feasibility/native-entry.mjs` — PASS: pinned direct Claude ELF 2.1.312, 2 synthetic loopback requests, exit 0, one consumer row, processed total 26, report consumer exit 0. This is synthetic-provider/native-CLI evidence, not a real provider call or Windows proof.
- `timeout 20s node tests/token-report.mjs`, `timeout 20s node tests/token-native-usage.mjs`, and `timeout 20s node tests/token-native-auto-pi.mjs` — PASS.
- Locked ESLint for `tools/token-native-claude.mjs tools/token-native-summary.mjs tests/token-native-claude.mjs` and locked Knip — PASS (exit 0, no output).
- `timeout 35s node tools/check-quality.mjs` — timed out (exit 124) after a manifest-only validation message; full quality is not established.
- `git diff --check` passed before commit. Post-commit status confirms no staged files and only the pre-existing I0026/.pi changes.

No independent review performed or verdict claimed. Full quality, Windows execution, managed-policy compatibility and nativeHostDelegation remain unverified/not run. Earlier A005 and historical process/policy findings remain unchanged. Required A005 output is this file. Reviewer remains the next action; no further correction cycle was used.
