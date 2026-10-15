# Task 65 — implement and audit only

## Grant and writable scope

Implement exactly `.audit/boundary-65.mjs` and `.audit/boundary-65-build-brief.md` in `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a246df6f17c0f0ca2` (baseline `cb58f811b3c5c5127d437d60d5f2994125ec0ab1`). No commits, agents, Python, network/install, global config, cleanup, or other repository writes. Generated fixtures/results may exist only beneath unique `/tmp/isswf-boundary65-*` directories. Do not invoke `--run-model`; parent must read the code and separately authorize that call.

## Objective and accepted design

A short Node `.mjs` audit harness embeds the Pi 1.2.0 SDK in the host process. The model runtime is fixed to `openai-codex/gpt-6-luna` at `high`; missing model/auth is a hard stop, with no fallback. Only one custom `sandbox_shell` model tool is registered. There are no Pi built-in host tools (`bash`, `read`, `ls`, etc.), extensions, context discovery, session files, retries, compaction, MCP, or extra resources. The in-memory session receives only a fixed prompt and the complete authorized `.agents/roles/worker.md` text.

The host tool validates command length and bounded timeout, pins cwd to `/work`, invokes one fixed bubblewrap policy, inherits no caller options/env/cwd/mounts, clears the sandbox environment, and captures/truncates output in memory only. Bubblewrap provides user/PID/network/IPC/UTS namespaces, drops capabilities, mounts `/usr`, Node, and the installed SDK read-only, mounts only the unique fixture writable, and supplies fixed non-secret `PATH`, `HOME`, and `LANG`. Only fake canaries may be used. No real credential values/files are read, logged, mounted, or sent to the tool. Normal provider OAuth resolution remains inside Pi's host runtime; standard host refresh side effects are possible only through that runtime.

`--prepare` creates a fresh temp fixture. Default `--self-test` runs offline bridge controls, an initially failing arithmetic fixture, a positive code correction/check, positive host TCP control, negative host-path/symlink/source/network/fake-env checks, output-cap and timeout checks. `--run-model` is a separate explicit gate and is not run in this assignment.

## Grounding and API choices

- `.audit/probe-64.mjs` and `.audit/probe-64-closure.md`: existing fixed bubblewrap policy, fixture-only scope, and known evidence limits. ENOENT is reported as path absence, not permission denial.
- `.audit/boundary-65-design-a.md` in `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a632c03e07f30b08d`: selected host SDK + one custom sandbox tool architecture.
- `/home/iseoane/Work/isSWF/.agents/roles/worker.md`: exact full authorized profile supplied to the session.
- Pi SDK 1.2.0 `docs/sdk.md`; SDK examples `02-custom-model.ts`, `05-tools.ts`, `06-extensions.ts`, `09-api-keys-and-oauth.ts`, `10-settings.ts`, `12-full-control.ts`; installed declarations `core/sdk.d.ts`, `resource-loader.d.ts`, `extensions/types.d.ts`, `model-runtime.d.ts`, `settings-manager.d.ts`, `agent-session.d.ts`, `tools/bash.d.ts`.
- Baseline source is explicitly pinned by object ID, not `HEAD`.

## Acceptance and verification

- Only the two granted files change; no model call occurs.
- `node --check .audit/boundary-65.mjs` passes.
- `node .audit/boundary-65.mjs --self-test` passes offline and prints only fixture roots, hashes, statuses, and bounded evidence (not full contents).
- Check source and parent-owned check-file hashes; preserve canary hash. Do not confuse self-test/host preflight denial with a future model-run result.
- Any blocked provider/model call in a future authorized run is partial, not a pass. This artifact does not prove credential confinement against malicious host code, exhaustive path/FD safety, production security, authority/MCP, lifecycle/recovery, resource limits, or multiwriter exclusion.