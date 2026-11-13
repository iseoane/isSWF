# I0053/J001 r1: Coordinator use of Engram and Codegraph (started 2026-11-13)

Grounding (2026-11-13, origin/main a038066):
- The plugin already ships a hook module (hooks/hooks.json -> hooks/register.tsx) with `session.start`, but it is the opt-in initiatives pane and returns early when the option is off. The reminder must not depend on that option; decide between a separate module or an always-on branch in the module.
- Reference pattern: gentle-ai injects a short marked always-on rules block and delivers the full Engram protocol through the MCP server instructions and a SessionStart hook; Codegraph guidance is added only when Codegraph is installed.
- Detection must use the session's configured MCP servers (not guessing paths); unknown availability prints nothing rather than a false claim.
- The coordinator step goes in .agents/skills/isswf-coordinator/SKILL.md (EN only); user docs change in docs/en and docs/es mirrors if the hook is user-visible.
- Out of scope: subagent prompt changes, installing or configuring Engram/Codegraph, changing AGENTS.md wording beyond a pointer.

Acceptance: see plan. Checks: hook tests (claude plugin test), check-docs, focused Pi check if a Pi mechanism is added, Linux+Windows CI.
