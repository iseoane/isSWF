## DELTA gate — FAIL

**Standards — FAIL (scoped to the process runner).** The new `textOutput` clamp repeatedly spreads and slices the remaining string. That makes a supported 64 KiB input path quadratic; the frozen helper control timed out with `ETIMEDOUT`. No repository coding-standards file was found.

**Spec — FAIL (bounded publication).** The task deadline is cleared before output formatting. So valid binary task output can stall the host before it publishes the terminal record; the task deadline does not bound this work. This is a helper-only control—not a benchmark or full-process failure—and the recorded parent regression and Pi/RPC checks do not cover it.

V2’s four payloads match its frozen manifest. The parent regression-green evidence covers the original four regressions and portable-verifier fixes; this finding is additional and scoped only to the runner. **Minimal remedy:** replace the repeated spread/slice loop with a single-pass linear clamp that preserves the byte cap and UTF-8 boundaries. No new framework needed.

Missing native-model evidence remains an honest limitation, not a blocker for the first generic process unit. Source remains unchanged; prior full audit not reopened.

## Later bounded evidence note

The written premise is sound: **capping raw bytes does not bound decoded-text work or ensure rendered output stays within the byte cap.**

There’s a second failure at the same boundary: when raw capture is exactly at the cap, `stdoutTruncated` is false. Invalid UTF-8 can expand into replacement characters; `textOutput` then drops decoded content to fit, but emits no omission marker and leaves the flag false. The output is bounded, but the omission is hidden.

Minimal correction: use a **linear, byte-safe clip** and make the existing truncation indication reflect either raw capture overflow or render-time clipping. Preserve the public fields and omission marker; no larger timeout or new formatter.

The existing four regression cases and Pi RPC result remain unchanged; they don’t cover this exact-bound invalid-UTF-8 case. No source changes made.

## Later bounded evidence note

Confirmed from the frozen artifact: this is an **actual CLI-level bounded terminal-publication failure**, not just a helper timeout. The task emits 64 KiB of `0xFF` at the supported cap; no terminal appears within the verifier’s guard.

The verifier kills only its launched host, after matching PID, boot ID, start ticks, executable, and exact nonce. That is test cleanup—not runtime-reader signaling. The task has no descendants.

This strengthens the same linear, byte-safe clipping correction; it does not change the scope or introduce a new feature. Source remains unchanged.
