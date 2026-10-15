**PRECALL PASS** (narrow). Static read-only; no model/provider call, writes, agents, Python, or network.

Frozen payload verified: worktree `agent-a246df6f17c0f0ca2/.audit/boundary-65.mjs` sha `f2323123…` byte-identical to snapshot-v3 payload; brief `c1d62784…` matches; worktree HEAD = pinned `cb58f811`; worker profile `645ac895…` matches git object.

v2→v3 delta read directly (snapshot `candidate.diff` is empty — same as delivery-59 precedent): only the three fixes plus `--model-preflight` and try/finally.

- Blocker 1: `prepareModelFixture` creates canary before manifest/controlsBefore; shared by `runModel` and preflight.
- Blocker 2: start args → toolCallId map, end resolves result. SDK 1.2.0 types confirm end lacks `args`; both carry `toolCallId`.
- Blocker 3: `runPostCanary` runs `node <basename>` (cwd `/work`); hash read after probe.
- Pre-session failures close listener via finally.

Preflight PASS (mocked start/end correlation, controls, host TCP) is offline helper evidence only — no provider/session. Model path: opaque boolean auth, explicit gpt-6-luna high, `sandbox_shell` only, `mcp__*` excluded, 180s/12-call budget.

No new material regressions. Final actual model behavior still pending; client ready **false**.
