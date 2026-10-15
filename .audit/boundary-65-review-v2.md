Static read only (no model/provider run, no writes). Worktree `boundary-65.mjs` is byte-identical to `boundary-65-candidate-v2` (sha256 `4cb3ada2…`); `node --check` PASS; SDK 1.2.0 `.d.ts` inspected.

**Exact blockers — `--run-model` can only return PARTIAL:**
1. `runModel` first does `readFile(fixture/boundary-check.mjs)`, but `prepare()` writes only sum.mjs, check.mjs, outside-canary, outside-link; nothing creates boundary-check.mjs and `runModel` never calls `makeCanaryScript`. This is a v1 regression (v1 created it in-runModel). Fresh `--prepare` → ENOENT. Fix: after `listenHost()`, `await makeCanaryScript(fixture, outside, port)` before manifest hashes and `controlsBefore`.
2. `ToolExecutionEndEvent` has no `args` (only `toolCallId`, `toolName`, `result`, `isError`, `durationMs`; args exist on start/update). The `event.args?.command` gate in `tool_execution_end` is always false → `modelCanaryControls` unreachable. Fix: map `toolCallId`→normalized command from `tool_execution_start`; resolve on end.
3. Parent post-run canary executes `node "<host /tmp/…/parent-canary-*.mjs>"`; sandbox mounts fixture at `/work` with empty tmpfs `/tmp` → ENOENT → `postProbe.exitCode!==0` → PARTIAL. Fix: `node ${basename(postScript)}` (cwd `/work`).

**Non-blocking:** `postScriptHashAfter` is read before `postProbe`; move after the probe (no post-prompt writer, so label only). `runAbort` is unused, but harmless: SDK threads the run signal into `execute`, and `killTree` covers abort.

**v1 resolution:** S1 (deadline, call cap, signal→killTree), S2 (listener open through prompt, post canary), S3 (telemetry/version flags, auth precheck), F1/F2/F4 (parsed result, manifest, `excludeTools` + callable assert), U1–U3 structurally addressed. F3: `git show` pin plus live worker hash match is sufficient — no style change required. Restoring an offline/inline preflight (as v1 had) is the cheap control; optional.

Net: fix 1–3, then run-model is evidence-capable pending parent review.
