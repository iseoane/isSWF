**Verdict (frozen v1, unchanged): Standards FAIL, Spec FAIL — 4/4 parent reds stand; the Pi-teardown PASS is real but separate and does not unblock v1.**

**Positive evidence (actual, same bytes).** `verify-lifecycle-44-pi-teardown.mjs` → `lifecycle-44-parent-pi-teardown-v1.json` PASS: launcher runs inside an isolated offline Pi RPC bash; Pi exits (code 0 + ESRCH) *before* the `parent-release` gate; fresh CLI read shows `running` (legit owner) then `terminal`/success, and the parent reruns the protected checks (`check.mjs` sha == `checksSha256`, 5 assertions). Identity cross-check: proof `executableSha256 9715aada…` equals the manifest payload and build-brief hashes, so the green lever and all four reds exercised identical frozen bytes — no drift. Scope is honest: no native model, no interactive main-chat shutdown, no hostile-task/exactly-once proof. This closes the initiator-exits axis only.

**Red blockers (confirmed in frozen `tools/worker-lifecycle.mjs`).**
1. `parseArgs` tests raw `--key` but stores `key.slice(2)` → duplicate `--attempt-id` accepted, second launch (exit 0).
2. `add()` slices mid-codepoint; 257-byte bound emits 259-byte string (U+FFFD), `observe` rejects → terminal attempt permanently `unknown`.
3. Escalation gated on root `exitCode===null`; root exits 0, TERM-ignoring same-group descendant holds pipes → 2410 ms at 200 ms deadline; permanent holder hangs the host.
4. Empty nonce makes `cmdline.includes('')` vacuous; forged owner with parent PID + copied boot identity → `running`.

**Minimal corrections (one file, fixes 1–4; no retry/security framework/deps).**
1. Normalized duplicate check (`Object.hasOwn(result, key.slice(2))`), reject empty option names.
2. Clamp decoded text to `outputBytes` (drop leading code points until byteLength ≤ bound) before terminal publication, both streams.
3. Send group SIGKILL unconditionally at deadline+250 ms (drop root-exit gate); additionally race `close` against a bounded grace and publish with an explicit open-pipes/partial-capture marker for escaped sessions.
4. In `linuxIdentity`: nonce `/^[0-9a-f]{48}$/`, integer pid > 0, exact argv-element match. Residual store-writer forgery stays documented/out of scope.
5. Verifier relocatability: `.audit/verify-lifecycle-44.mjs` `resolve(root,'../../..')` resolves to `/home` in main (node-verified); read the fixture via CWD/argv as the Pi and regression levers already do, and absorb the four cases.

**Gate plan.** Keep v1 byte-identical (snapshot verified, empty diff). Writer produces v2 in isolated checkout; re-freeze; deterministic verifier + 4 regression cases + Pi lever all green on identical v2 bytes; both finals, then integrate. No mutations or process launches were performed during this read-only review.
