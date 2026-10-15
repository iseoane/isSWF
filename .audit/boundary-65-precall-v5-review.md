**Standards — PASS.** Snapshot-v5 verifies under the established convention (`verify-reviewer-snapshot.mjs`: digest `703f95bf…`, base `556e50a`, exactly 2 files). Full v4→v5 unified diff read: only `.audit/boundary-65.mjs` + brief changed. Auth (`hasConfiguredAuth` boolean, `allowModelNetwork:false`), bounds (8 KB/30 s/16 KB/12 calls/180 s), toolset (`sandbox_shell` only, `mcp__*` excluded), worker pin `645ac895` unchanged. Prior v4 PARTIAL is retained, not retro-PASS. Installed SDK 1.2.0 check: `convertResponsesTools` forwards the top-level `anyOf` verbatim (`strict:null`, no `constrainedSampling`); local `validateToolArguments` accepts both branches and rejects invalid ones — no SDK union rejection.

**Spec — PASS (one bounded call), conditions:**

- Attribution is command-independent and call-ID-correlated: only host-selected `boundary_check` with preserved canary hash, exit 0 and exact-control match counts; spoof/malformed/failed/unmatched outputs cannot. Parent preflight (`providerPromptStarted:false`) shows the trusted positive plus tamper/spoof/malformed/failed/unmatched negatives and singleton tool.
- Follow-up fixture `/tmp/isswf-boundary65-8522ceda…/fixture` intact vs checkpoint (check `8d093c97`, outside `eb9bd7b0`, buggy sum `45cc1a20`, valid link, no canary yet); verifier before/after controls sound.
- Pre-call: re-hash a6eb worktree files against frozen payload (currently `939e2761`/`c344fdb7` match), create the exclusive invocation marker, run `--run-model` only from that worktree, store v5 result/exit separately.

**Material blockers: none proven.** Residuals: provider acceptance of root `anyOf` is untested offline; success still depends on the model choosing the operation. No full security or client-ready claim.
