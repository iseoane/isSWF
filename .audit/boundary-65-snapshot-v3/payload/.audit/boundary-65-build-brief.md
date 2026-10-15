# Task 65 — boundary verifier correction

## Authorized scope

Only `.audit/boundary-65.mjs` and `.audit/boundary-65-build-brief.md` in `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a246df6f17c0f0ca2`, pinned baseline `cb58f811b3c5c5127d437d60d5f2994125ec0ab1`. No commits, agents, Python, network/install, global config, cleanup, or other repository writes. Fixtures/results only under unique `/tmp/isswf-boundary65-*`. `--run-model` remains prohibited until parent review and explicit reauthorization.

## Design and constraints

The Node harness embeds Pi SDK 1.2.0 in the host. It derives repo root from its own script location and checks the exact baseline object. The complete worker profile is read only from `/home/iseoane/Work/isSWF/.agents/roles/worker.md`, then checked against the baseline Git object digest (`645ac895b558b293717051aa818ba7d586b4d128cd6119579141bf44e84afbed`); no mutable worktree-relative profile is supplied. Runtime selection is fixed to `openai-codex/gpt-6-luna`, high effort, no fallback. `PI_TELEMETRY=0` and `PI_SKIP_VERSION_CHECK=1` are set before SDK initialization. Standard Pi host auth may be used; `agentDir` does not relocate supplied `ModelRuntime` auth. An optional `hasConfiguredAuth` check inspects only the boolean API, never token material.

Only `sandbox_shell` is made active and callable; `mcp__*` is explicitly excluded and both active/callable sets are asserted. The host tool validates command/timeout bounds, pins cwd to `/work`, invokes a fixed bubblewrap policy, clears sandbox environment, supplies a fake credential canary only, mounts the fixture writable and runtime read-only, captures at most 16 KB in memory, and kills the process group on timeout or SDK abort. No raw output/transcript/assistant text or credentials are retained.

The explicit model path has a 180-second prompt deadline, at most 12 tool invocations, and at most 30 seconds per tool. Bound exhaustion is `PARTIAL`; abort/dispose waits are bounded and a process watchdog is used to prevent an orphaned run. A normalized command match (independent of optional timeout/whitespace) records whether the model invoked the canary. The structured result is parsed from the actual tool result event, not inferred from arguments. That evidence remains distinct from the parent-owned post-run canary: a fresh host-authored script is hashed, run over the bridge while a real host TCP listener stays open, and required to return all expected negative controls while the host control remains positive. Original protected fixture hashes (check, model canary, outside canary) are checked before and after; `sum.mjs` is the sole expected mutable fixture file and its resulting hash is recorded.

## Verification

`--prepare` creates a fresh unique fixture. Default `--self-test` is offline and exercises initial failure, positive correction, canary/path/symlink/network/fake-environment boundaries, host TCP positive control, memory output cap, timeout, and abort cancellation. `--model-preflight` additionally runs the exact shared model-fixture preparation, controls, hash, and post-canary helpers against a fresh unique fixture, without creating a ModelRuntime/session or contacting a provider; it mocks tool start/end events to verify call-ID command correlation and parsed result controls. Run `node --check .audit/boundary-65.mjs`, `node .audit/boundary-65.mjs --self-test`, and `node .audit/boundary-65.mjs --model-preflight`; inspect status/diff to confirm only these two files changed. Never use `--run-model` in this task.

## Limits

This harness does not prove credential confinement against malicious host code, exhaustive path/FD safety, production security, authority/MCP lifecycle, recovery, resource limits, or multiwriter exclusion. A passing offline self-test is host bridge evidence only, not model-run or model-authority proof. No model/provider execution has been authorized or performed.
