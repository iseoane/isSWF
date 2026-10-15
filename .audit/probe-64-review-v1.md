**Verdict.** Evidence chain intact: reviewed `probe-64.mjs` sha256 `303ef6c2…` matches `result.json`; 18 cases match code and the separate parent replay (`probe-64-parent-v1.log`, root `nYDNsj`). Not gate-complete.

**Standards**
1. Rerunnability: `probe-64.mjs:108` hard-asserts `HEAD == 5c9a516…`; the integration commit (files still untracked) makes every rerun abort before `git archive <sourceId>`, which needs only the object. Pin the commit object (`git cat-file -e`) plus archive digest; drop HEAD equality.
2. Cleanup can hang: `:92-95` `close()` and `:212` listener await `once("close")` with no timeout and no already-exited check; if the child exited earlier, the event never fires while the SIGKILL timer was cleared. Add bounded wait, `exitCode/signalCode` precheck, SIGKILL fallback.

**Spec**
3. `outside-controls-live` (`:151-154`) records PROVEN with expected "TCP listener accepts on host loopback", but only binds and prints a port; no host-side connect is ever made. The brief requires live canaries before relying on denials, and coverage row 5 requires listeners proven alive. Without a host connect/accept count, `fake-authority-endpoint`'s ECONNREFUSED is not a controlled denial.
4. Marker preservation (`:145-147`, `:207`): settings already contain the activation (`packages:[{source:"/factory"}]`) before the baseline hash, and no activation/setup command runs (RPC log is get_state/get_commands/bash only). `target-markers-preserved` proves only non-modification during this isolation run; do not present it as row 7 "activation preservation" or as real existing activation preserved.

**Evidence**
5. `worker-positive-write` (`:167`, `:173`) claims writes "only under /work", but judges by in-sandbox exit code plus echoed "write-ok"; the file is never read back from `/tmp/isswf-probe64-*/project`. Location is unverified.
6. Host-canary ENOENT cases show namespace path-nonexistence (fresh `/tmp` tmpfs), not mount denial; the only existing-path errno is `factory-source-write` EROFS. Root/ro-mount read limits are untested (no attempt against an in-namespace host path such as `/etc/...`).
7. Unsupported labels are present and adequate: limits list "MCP disabled; no authority broker claimed", "no real model/auth/provider integration", "no general resource limits", "no multiwriter proof", status `PROBE_COMPLETE_WITH_UNPROVEN_REQUIREMENTS`; row 8 is correctly excluded from PASS. Note the staged factory is archive plus synthetic `package.json`, so `pinned-source-preserved` is staged-copy stability, not archive equality (archive digest is recorded separately).

**Still unproven, keep blocked:** live network control, FD inheritance, real activation preservation, MCP/authority channel, resources, multiwriter.
