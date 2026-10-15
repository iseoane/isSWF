**Evidence read:** `docs/sdk.md`; `examples/sdk/{05,12,09}.ts`; `dist/core/sdk.d.ts`, `model-runtime.d.ts`, `resource-loader.d.ts`, `extensions/types.d.ts`; pi-ai `auth/types.d.ts`; `.audit/probe-64.mjs` + closure. LunaHigh = `openai-codex/gpt-6-luna`, high; dispatch declared, runtime unproven.

**Threat model.** Trusted: host supervisor (model loop, default auth, network). Untrusted: fixture content and model tool calls — the LLM is input validation's counterpart, not an authority. Assets: host FS, auth.json, other projects, network. Boundary: bwrap namespaces (proven in probe‑64: net/pid/ipc/uts, clearenv, fixture-only bind) + SDK policy.

**Option A — recommended, minimal.** Supervisor outside bwrap runs `createAgentSession` with: custom `ResourceLoader` (12‑full-control shape), `SettingsManager.inMemory`, `SessionManager.inMemory`, explicit model, `noTools:"all"` plus allowlist of one custom tool. That tool spawns fixed `bwrap … bash -c` (fixture bind only, sanitized env, timeout, bounded output). Creds/model/network never enter the sandbox; inside is a shell, not Pi's built-ins.

**Option B — "all tools inside".** Same supervisor; the custom tool is a JSON-RPC bridge to `pi --mode rpc --no-mcp --no-extensions --no-session` inside bwrap. Probe‑64 proved an RPC `bash` request executes tools without a model call, so the inside process needs no creds/network. Reuses proven bwrap args; larger surface, closer to the batch wording.

Both forbid routing overrides, MCP/codemode/tool_search loading, host discovery, persistent sessions.

**Tests (parent-owned, each with a paired actual negative control outside bwrap):** host-file canary read/symlink → ENOENT; TCP canary refused (host positive control connects); fake env token absent; fixture write positive + host readback; source EROFS; sleep → SIGKILL with bounded close; oversized output truncated; `session.systemPrompt`/messages contain no host AGENTS.md or models canary; no auth bytes under fixture or session files.

**Hidden risks / blockers.**
- `ModelRuntime` default authPath = `agentDir/auth.json`; real calls may refresh OAuth through `CredentialStore.modify` (serialized read‑modify‑write, cross-process lock) → host auth write and token rotation. Don't dump or copy; record mtime only.
- `DefaultResourceLoader` loads host extensions via jiti (arbitrary code) — replace it or the boundary fails.
- Default session/settings managers persist to host dirs; built-in `bash` runs in the supervisor — never enable it.
- Provider attribution headers: set `PI_TELEMETRY=0`, `PI_SKIP_VERSION_CHECK=1`.
- No credential channel into the sandbox exists without a routing override or secrets inside: full in-sandbox agent loop is infeasible under the stated constraints.

**Unproven / marked:** LLM not authority; TCP canary ≠ MCP/authority broker (MCP absent by SDK default); multi-writer exclusion remains a precondition, untested. Not a final review candidate.

**Recommendation:** API evidence supports both; choose A unless "all tools inside" is contractual.
