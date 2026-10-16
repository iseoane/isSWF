**Delta gate: FAIL — Standards FAIL, Spec FAIL (process-runner output publication only).**

**Identity.** All four v2 payload sha256 match `manifest.json` (runner `91e9fd85…`); `candidate.diff` unchanged/empty; identity-v2 `374ad33a…`; v1 retained `66407858…`, v1 FAIL preserved.

**Green on same bytes, unchanged.** parent-v2-proof PASS (14 checks); regression-green-v2 4/4 (normalized duplicate refused, UTF-8 tail 254≤257, leader-exit pipe bound 591 ms, empty nonce unknown); pi-teardown-v2 PASS with `executableSha256 91e9fd85…`. Only the premise file was added; no source change after evidence. Live tree has no `tools/worker-lifecycle.mjs`; the frozen payload is the artifact.

**Premise confirmed, statically and empirically.** `textOutput` runs `while (Buffer.byteLength(text) > available) text = [...text].slice(1).join('')` — quadratic. Red-v2: 64 KiB of `0xFF`, truncated=true → ETIMEDOUT/SIGTERM at 2500 ms. That step runs after the task deadline cleared, so the gap is publication-side, not deadline enforcement. Exact-bound case: `joined.length === max` ⇒ `truncated=false`; 65,536 `0xFF` bytes expand ×3 on decode; the loop drops ~43,691 codepoints to 65,535 bytes while `stdoutTruncated` stays **false** — content omitted with no marker. The doc promise that omitted bytes always begin with `[...truncated...]` is falsified at this boundary. Raw-byte bound ≠ bounded decoded work; the 1 MiB validation cap worsens the quadratic ~256×.

**Minimal linear clamp (no new formatter/timeout, public fields preserved):** skip leading continuation bytes before decode, trim codepoints in one forward pass, set `stdoutTruncated`/`stderrTruncated` when rendering itself clips. Gate closes only when that lands and green evidence is refrozen on the new bytes. No model/client-ready claim touched.

## Later bounded evidence note

**Delta gate stands: Standards FAIL, Spec FAIL — output publication only. CLI-level red verified.**

Evidence chain: `verify-lifecycle-44-binary.mjs` → `lifecycle-44-binary-red-v2.json` (`passed:false`, `terminalPublished:false`, exit 1). Residue `/tmp/isswf-lifecycle44-binary-control-2q2rm8/runs/binary`: `owner.json` published; `dispatch.json` pins `lifecycleSourceSha256 91e9fd85…` (frozen v2 bytes); `task.mjs` is the 47-byte 64 KiB `0xFF` writer; `timeoutMs:1000`, `outputBytes:65536`; **no `terminal.json`** after the 2500 ms guard. The actual CLI accepts the launch, the trusted task emits and exits, and the host never publishes a terminal: `textOutput`'s quadratic clamp holds it past any guard, the task deadline is already cleared, and the runner imposes no publication deadline. Exact-bound path (`joined.length === max` ⇒ `truncated=false`) enters that same clamp, so even on completion it drops content without the `[...truncated...]` marker — the silent-omission facet the premise names. Raw capture bound ≠ bounded decoded work, now confirmed end-to-end, not just by the extracted helper.

Scope honored: guard is verifier-owned; SIGKILL only after launched PID + boot id + start ticks + exe realpath + exact nonce argv-element match; pure task, no descendants; not production fresh-reader signaling. Source immutable since 20:36:09 (`91e9fd85…`); identity-v2 unchanged; v1 FAIL preserved.

Green 4 regressions + Pi RPC remain valid but exercise only short/ASCII output; they do not cover this boundary.

Closure requirement unchanged: linear byte-safe clip — skip leading continuation bytes, one forward pass for codepoints, set `stdoutTruncated`/`stderrTruncated` when rendering clips, preserve public fields and marker; no new formatter, no larger timeout. Re-freeze, re-run controls, then gate.

## Later bounded evidence note

Addendum: confirmed. The actual-CLI red (`verify-lifecycle-44-binary.mjs` → `lifecycle-44-binary-red-v2.json`) strengthens the same publication blocker: same frozen `91e9fd85…` bytes, same bounded public fields, now end-to-end — launch accepted, trusted 64 KiB `0xFF` task exits, no terminal within guard. It does not change the verdict (Standards FAIL, Spec FAIL, publication scope) or the minimal linear-clamp closure. No candidate changes made. Next fresh writer awaits both finals.
