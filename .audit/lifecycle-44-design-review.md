**Verdict — base Design B (worker-owned detached attempt), with surgical grafts from A.**

B has exactly one lifecycle writer and removes the supervisor-crash/orphan-child class outright; A's per-attempt supervisor adds a second crashable process without resolving the spawn/ack ambiguity it cites. B's read-only reader is the right recovery primitive: reconciliation, not resumption.

**Grafts from A:** publication rule (same-dir temp + fsync + rename, never overwrite terminal); phase vocabulary `starting|running|terminal|unknown` plus crash-window text; identity tuple `{bootId,pid,startTicks,exe,nonce}` revalidated per read; verification case list with the existing `.audit/lifecycle-44-fixture.json` (confirmed present).

**Required corrections, verified against source:**

1. **No existing adapter.** `boundary-65.mjs` is audit-only: top-level mode dispatch (:383), hardcoded SDK/node/profile hash (:17–25), zero exports — importing executes a mode. `tools/` holds only `factory-package.mjs`. Both designs must drop "existing bounded worker adapter" and name a narrow `runAttempt` seam inside the new module: deterministic runner first, native Pi/model runner later under separate authorization and exact model pin. Never import boundary-65.
2. **Terminal must not require A001.** Write `terminal.json` on every exit with optional `reportPath/reportSha256`; nonzero exit with no report stays failure. B currently gates terminal on A001 — that is the success-only hole.
3. **No pidfd.** Not Node core; that would be a new dependency. Signal only the worker's own child handle/process group after identity re-verify; fresh readers never signal. Mismatch → unknown.
4. **Reconciliation ≠ resumption.** Confirmed cessation plus inspected partials → preserve partial, coordinator may authorize a *new* attemptId; the same attempt is never re-executed; unknown blocks. No exactly-once claim.
5. **Incomplete launch window.** Exclusive `mkdir` claim before `dispatch.json`; crash before spawn → unknown claim; after spawn before `owner.json` → unknown. Never free or repair an attempt; PID reuse is covered by the tuple.
6. **Single writer.** One claim dir = one attempt; repeat launch fails closed while live, terminal, or unknown.

**Minimal shape:** one dependency-free module `tools/worker-lifecycle.mjs`; CLI `launch | read | reconcile`; per-attempt dir holding `dispatch.json` (immutable, pre-spawn), `owner.json` (worker), write-once `terminal.json`, bounded logs; `A001.md` stays worker-owned in its checkout. Reader states `running | terminal | unknown`. No queue, framework, daemon, or global config.

**Rubric:** owner interface, states/unknown, chat-independence, crash reconciliation, no-new-framework, rerunnable real-process tests — all pass with the corrections. The "reuse existing bounded-tool contract" clause fails in both designs until the seam is named.

**Caveats:** B has no external watchdog; bounds are cooperative inside the worker, so a hung worker is unknown, not auto-killed — acceptable only if fixtures prove self-timeout and own-child kill. The feasibility probe proved only `spawnSync` launcher exit, not real chat teardown. Deterministic fixtures prove mechanics only; actual model-worker integration remains a separate authorized unit. Linux `/proc` only; no power-loss or exactly-once guarantees. This is design selection only, not implementation authority.

## Subsequent amendment

**Decision (amends my earlier B+grafts verdict, nothing else changes): make the checkout attempt-scoped — derive it, don't accept it.**

Concretely: the attempt's exclusive `mkdir` creates `.factory/runs/<attemptId>/`, and the disposable checkout is created under that same claim, at a path derived from the attemptId. Delete `checkout` as a caller input from the interface (Design A's `start({checkout})`, Design B's `dispatch.json` input); record the derived canonical path in `dispatch.json` as evidence for recovery, not as a choice. One attempt dir = one attempt = one fresh checkout; the existing same-ID guard is then sufficient by construction.

Reject external exclusive checkout as a tested precondition: the lifecycle would be trusting a path it doesn't control, which is an invisible dependency and a false assurance for the multiwriter case. Reject the canonical per-checkout claim for this cut: it is a second lock keyed by realpath that exists only to support checkout reuse we don't need, and "no auto-release" turns stale claims into ongoing manual reconciliation. If authorized reuse ever becomes a hard requirement, add that claim then as its own unit — not now.

**Exact bounded claim to record:** distinct attemptIds cannot share a checkout because checkout paths are attempt-scoped and not caller-supplied. Testable in the existing fixture sweep: launch A, then launch B with a different ID — B must receive a provably distinct fresh checkout; there is no input that can point B at A's checkout; repeat launch of A still fails closed while live, terminal, or unknown; A's partials remain preserved for inspection. Do not claim technical checkout locking or full multiwriter proof — neither is demonstrated in this cut, and the grant contains no such proof.

If the operator would rather allow a pinned external checkout path anyway, the fallback is the canonical per-checkout claim (realpath-keyed, no auto-release) as an explicit, separately tested addition — but that is the larger surface, and I do not recommend it first.
