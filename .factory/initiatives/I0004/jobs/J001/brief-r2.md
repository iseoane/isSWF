# I0004/J001: Pi and Claude Code portability

## Authorized assignment

Operator approved implementation, commits, push and PR; merge only if low risk. This assignment authorizes ONE native worker, no retries/replacement, canonical openai-codex/gpt-6-luna high, one 110-second prompt within normal 120-second lifecycle. Existing OAuth readiness was observed with pi auth check without refresh. No extra API costs, Claude login/model calls, global config, installs or remote actions by worker. Coordinator owns publication. Prior r1 contains preliminary grounding; this r2 is self-contained and supersedes its pending-checkpoint permission statements.

## Outcome and limits

Deliver a minimal local Claude Code plugin integration using shared factory methodology, preserving the existing Pi entry and SDK runner. Do not build a second SDK, installer framework or recovery service. Claude Code static support is prepared, NOT live-model verified. OpenCode excluded.

Pi root package.json and tools/isswf-job.mjs / tools/pi-worker-task.mjs MUST remain unchanged. Existing Pi activation/hash/route behavior must remain intact. Prefer a Claude plugin manifest whose skills/agents point or read shared factory resources, rather than copying role bodies. A Claude host guide must explicitly replace Pi-specific dispatch instructions only on Claude Code; common objective, grounding, plan ownership and review contracts stay shared. Never silently fall back to Pi SDK or a different model when the selected host lacks a capability.

## Allowed files (exact)

- .agents/skills/isswf-coordinator/SKILL.md
- .agents/hosts/claude-code.md
- .claude-plugin/plugin.json
- skills/isswf-coordinator/SKILL.md
- agents/isswf-worker.md
- agents/isswf-reviewer.md
- agents/isswf-researcher.md
- agents/isswf-planner.md
- tests/host-portability.mjs
- docs/host-portability.md

All other paths protected. Do not write attempt artifacts outside this list. Return evidence in final response instead; coordinator records it. No .pi settings or model config changes. No external commands requiring network. No Git metadata in sandbox; coordinator commits candidate.

## Acceptance

1. A Claude Code local plugin manifest exposes a coordinator skill and native role definitions backed by shared .agents roles; no duplicate independently maintained methodology. Wrappers reference source-root resources with Claude-supported paths and explicitly read them.
2. Host instructions state how Claude's native delegation replaces Pi-specific dispatch, without claiming equal sandbox/persistence/recovery. Read-only reviewer excludes mutating tools; Bash is not described as a sandbox guarantee. Independent review judges a stopped writer's exact retained candidate. No bypassPermissions/hooks/MCP/global edits.
3. The common coordinator selects the Claude guide only when actually in Claude Code, preserving existing Pi default and routing. Configured Pi models do not automatically become Claude-compatible. Claude inherited/selected models need explicit assignment approval and observed metadata before work. Do not add silent model substitution.
4. Deterministic test validates plugin manifest and declared entry files, shared-source references, no independent role-body copies, no Pi package/runtime changes, and documents static versus pending real Claude validation. Use meaningful artifact assertions, not prose keyword counts alone.
5. docs/host-portability.md explains Pi existing activation, Claude local --plugin-dir against a trusted fixed checkout without global install, skills invocation syntax, capability limitations, and a reproducible real implementation/independent-review validation checklist. Claude executable version here is 2.1.299 but not logged in. Never run the local claude wrapper (it invokes mise use -g).

## Source grounding and official contracts

At 8607abf73102d5f97aa777d2c0ef8a867c7a4ba9 reopen package.json, .agents/skills/isswf-coordinator/SKILL.md, .agents/roles/{worker,reviewer,researcher,planner}.md, tools/factory-package.mjs (resource allowlist and Pi activation), docs/model-routing.md, docs/durable-work.md and tests/worker-methodology.mjs. Existing planner/researcher profiles may need explicit reading rather than a package export change.

Official docs observed by coordinator 2026-10-21:
https://code.claude.com/docs/en/skills: skills/<name>/SKILL.md in plugin; disable-model-invocation controls entry; plugin skills are namespaced.
https://code.claude.com/docs/en/sub-agents: plugin agents/ Markdown YAML name/description/tools/model fields; plugin agents ignore permissionMode/hooks/mcpServers, so do not use those fields for security. model: inherit is supported but is not proof of actual model or authorization. Read/Grep/Glob are nonmutating built-ins; Bash can mutate.
https://code.claude.com/docs/en/plugins: .claude-plugin/plugin.json is manifest; skills/ and agents/ live at plugin root, not under .claude-plugin. --plugin-dir loads local plugin for a session, not a global installation. Use ${CLAUDE_PLUGIN_ROOT} for plugin-root supporting references.

Pi is current supported runtime. Shared profiles are instructions, not native host services. Do not claim that merely installing a plugin enforces factory grants, quotas or durability. Factory coordinator remains responsible for explicit assignment and evidence.

## Method and evidence

Use focused behavioral test-first for meaningful manifest/entry contracts. Protected check: node tests/host-portability.mjs . && node tests/worker-methodology.mjs . && node tests/worker-route-admission.mjs .
Run the actual checks, report results, changed paths and any incompleteness. Keep it small enough to complete coherently in this invocation. No new agents. Independent combined semantic/mechanical review will be separate after coordinator inspection. Do not self-certify independent PASS or product acceptance.
