# Lifecycle 44 — per-attempt local supervisor design

## Decision and boundary

Use one detached Node supervisor per authorized attempt, started by a short-lived CLI. The supervisor owns that attempt’s worker process, lifecycle metadata, bounded logs and terminal evidence; it does not depend on the initiating chat, Pi child-session teardown, or a global daemon. A separate read-only `status` invocation observes it. This is the smallest design that survives caller exit and makes recovery explicit. Reject chat-owned background workers (lifecycle tied to chat) and a persistent service/queue (extra shared state, authentication and deployment surface). A2A adds no needed lifecycle guarantee here.

Grounding: the grant/acceptance are `.audit/lifecycle-44-grant.md` and `.audit/lifecycle-44-acceptance.md`; the latter is a contract, not test evidence. `docs/durable-work.md` separates coordinator plans, worker-owned A001 and product acceptance, and warns Markdown/Git are not process recovery or atomicity. `docs/arquitectura-candidata.md` favors external ownership + RPC; `docs/research/pi-lifecycle.md` proves bounded process observations but not recovery after simultaneous owner/machine failure. The detached feasibility probe proves only one Node child outlives its launcher. `.audit/boundary-65.mjs` has a useful bounded single-tool/session seam, not a durable supervisor.

## Caller and records

Expose a narrow CLI over one module (`tools/worker-lifecycle.mjs`):

```js
start({ grantRef, attemptId, briefRef, inputCommit, targetBase, checkout, route })
status({ attemptId })
recover({ attemptId })
```

`start` validates explicit authorization, unique attempt ID, exclusive disposable checkout and full-SHA pins; materializes pinned brief/references read-only and checks their hashes before spawning. `inputCommit` pins documents; `targetBase` pins code separately. `route` records the already-authorized exact destination/effort, not a resolver or permission. `start` claims a never-used ID with exclusive directory creation before any spawn; an existing ID, incomplete/missing manifest in an existing directory, corrupt state or uncertain state blocks another writer. `status` never mutates or reruns. `recover` only reconciles evidence and requests no automatic retry.

Use only `.factory/runs/<attemptId>/` for supervisor-owned `attempt.json` (immutable launch manifest + latest lifecycle observation) and `terminal.json` (write-once terminal evidence), plus bounded stdout/stderr files. The worker alone writes its assigned `A001.md` in its exclusive checkout. Coordinator alone owns job/plan/authorization changes and records operator product acceptance; neither supervisor nor worker marks acceptance. Persist phase `starting | running | terminal | unknown`, attempt and worker identity, input pins, timestamps, last observation, and terminal outcome `exit-0 | nonzero | signaled | interrupted | unknown` with exit/signal, diagnostic limit/truncation and artifact hashes. `terminal.json` records observer identity/time and checks actually observed; it is not A001 or acceptance.

## Ownership, identity and failure rules

The supervisor spawns the authorized worker with ignored stdin, bounded output capture, deadline and process-group containment; the worker uses the existing Pi worker path. Record supervisor and worker identities as `{hostBootId,pid,procStartTicks,exe,argvHash,attemptNonce}`. On this first Linux host, obtain boot ID/start ticks and re-check `/proc/<pid>/exe` and command identity; PID alone, nonce alone, or a saved `running` value never establishes liveness. Open pidfd where available before signaling and revalidate identity. A missing `/proc`, mismatch, PID reuse, corrupt manifest, expired host boot ID, or uncertain descendant state means `unknown`: do not signal an unverified process, free ownership, or replace it. Only verified cessation plus inspected partial output permits a newly authorized attempt; never re-execute the same attempt automatically. Limits: Linux `/proc` only, same-host local filesystem, bounded time/output; no power-loss guarantee or exactly-once side effects.

Publish each JSON record via exclusive temp file in the same directory, write+fsync, rename, then fsync directory; never overwrite `terminal.json`. A crash before `running` publication leaves `starting`/unknown and requires process reconciliation. A crash after worker exit but before terminal rename leaves no terminal proof: inspect process and artifacts, then record `interrupted` only when exit/partial evidence is directly established, otherwise `unknown`. A torn temp file is ignored, not promoted. Terminal evidence proves observed process outcome, not task correctness; independent checks and candidate identity remain required.

## Verification boundary

Use the parent-prepared `.audit/lifecycle-44-fixture.json` as the disposable task input without inspecting or changing it: pinned J601, worker-write scope only `src/math.mjs` + `A001`, protected `check.mjs`, and baseline `check.mjs` red at 11 (expected 21). The proof plan runs the independent check before and after; worker may change only the two authorized paths. Add rerunnable real-process fixtures for launcher/chat-parent exit while child finishes, successful result, nonzero failure, supervisor-owner crash then fresh recovery, repeated start, PID/identity mismatch, and corrupt/torn metadata. Assert no duplicate writer, no unsafe signal, bounded cleanup, preserved partial work and durable terminal evidence. Deterministic fixtures prove lifecycle mechanics only. A future native model worker needs a separately authorized exact-model run and distinct proof of actual model attribution. Reuse boundary-65’s bounded tool-call/deadline/output and host-owned tool seam conceptually; do not treat a deterministic fake, SDK setup, or fake tool result as model integration. No model/provider call is authorized by this design.