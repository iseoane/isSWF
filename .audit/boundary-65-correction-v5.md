Implemented the bounded canary-attribution correction from `main556e50a` (`556e50aedb508509dc7c946e0b5cc68644931677`). **Only these two files changed:**

- `.audit/boundary-65.mjs`
- `.audit/boundary-65-build-brief.md`

**Diff:** The existing `sandbox_shell` now supports ordinary `shell` and a fixed `boundary_check` operation. The latter accepts no caller command; the host runs its fixed canary through the same sandbox executor, using a host-owned read-only copy and checking both canary hashes before and after. Attribution correlates tool start/end by call ID and records only bounded metadata. Matching JSON from ordinary shell output cannot count as canary execution.

**Offline evidence:** `node --check`, `--self-test`, `--model-preflight`, and `git diff --check` passed. The shared bridge preflight accepted the trusted operation and rejected spoofed, malformed, failed, unmatched-call, and tampered-canary cases. Standalone and compound shell invocations remained non-attributing. The preflight reported `providerPromptStarted: false` and only `sandbox_shell` callable.

No model/provider call was made. The prior actual call remains partial and inconclusive; Task 65 is **not complete**. Parent inspection/freeze and an independent pre-call gate remain pending before any separately authorized real call.
