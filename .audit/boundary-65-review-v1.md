**Verdict:** the candidate is well-contained for a single-tool, no-network sandbox run, but `--run-model` cannot yet produce trustworthy isolation evidence. Authorize only as routing/metadata evidence after S1/F1/F2 fixes; not as evidence-grade boundary proof.

**Security**
- **S1 No whole-run bound.** `session.prompt` has no deadline or turn/tool-call cap; `sandboxExec` never receives the tool `AbortSignal` (only a pre-start check), so an aborted or looping run keeps spawning bwrap until each 30s timer. Fix: run deadline → `session.abort()`, thread signal to `child.kill("SIGKILL")`, cap invocations; report timeout as PARTIAL.
- **S2 Network negative not alive.** `listener.close()` runs before `ModelRuntime.create`, so during the model call nothing proves the port was reachable on the host; an escape during the run is indistinguishable from isolation. Fix: keep the listener open through `prompt`; post-run, host-write a fresh canary (host-recorded hash), run it via bridge, require `ECONNREFUSED` inside while host still gets `host-positive`; close after.
- **S3 Auth framing.** Because `modelRuntime` is supplied, the fake `agentDir` does not relocate auth — `ModelRuntime` uses default host auth (permitted, `refreshOnCreate:false`); don't claim empty-dir confinement. Add `PI_TELEMETRY=0`, `PI_SKIP_VERSION_CHECK=1` (design-review item).

**False proof**
- **F1 Model canary isn't evidence.** Pass needs only exact-args hash `{"command":"node boundary-check.mjs"}`; the writable `boundary-check.mjs` can be overwritten with a fake reporter, and an optional `timeout` or whitespace yields false PARTIAL. The model's reported JSON is never parsed. Fix via S2 post-run host canary; match parsed command, ignore optional args.
- **F2 Hash scope.** `immutable` covers only `check.mjs` + outside canary; `boundary-check.mjs` and fixture manifest are unbound. Hash a pre/post manifest (sum.mjs expected rewrite).
- **F3 Content not pinned.** Both candidate files are untracked; `verifyBaseline` only proves commit existence and `toplevel==ROOT`; `worker.md` (sha256 `645ac895…`) is read live from the main checkout. Parent should pass/verify expected hashes: mjs `82dfdf84ab38b5b8eb77093f007830b20d49e02cd9e47867961d5f2de0fc955c`, brief `36195803…`.
- **F4 MCP carve-out.** `tools:["sandbox_shell"]` correctly filters built-ins (`usesDefaultTools` false; verified in `sdk.js`/`agent-session.js`), but SDK keeps MCP tools callable unless the allowlist mentions `mcp__`. None are registered via the stub loader — treat as intentionally unproven. Add `excludeTools:["mcp__*"]` and assert `getCallableToolNames()==["sandbox_shell"]`. (`noTools:"all"` alone doesn't change this when `tools` is supplied.)

**Usability**
- **U1** Hardcoded worktree `ROOT` blocks post-integration/fresh-checkout runs; derive from script location or accept an env root with the same toplevel check.
- **U2** Exact-args match brittleness (F1) will misreport success as PARTIAL; compare normalized command.
- **U3** No `hasConfiguredAuth` precheck: missing auth surfaces as generic PARTIAL; a cleaner hard stop is cheap.

**Allowed parent checks before the call** (no `--run-model`, no provider): confirm the three hashes above; `node --check` (I ran it: PASS); re-run `--self-test` (offline, `/tmp` only) in the worktree at `cb58f81`; run `--prepare` and confirm failing initial check; statically read that no credential path/file/mount reaches the tool. MCP/resources/lifecycle remain intentionally unproven.
