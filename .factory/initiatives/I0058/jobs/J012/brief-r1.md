# I0058 J012 brief r1: research the parallel-job limit

- Authorization: operator, 2026-11-21, "Si y adelante con el j012"; the limit is local per machine, default 2 ("debe ser un límite local"). Standing grant.
- Actor: one isswf-researcher, read-only, at the base named in the assignment.
- Objective and acceptance: [plan.md](../../plan.md) J012. This round grounds the design; implementation follows in brief r2.

## Questions (file:line or "not found")

1. Counting running workers: which host events tell that a delegated child finished. Claude Code: the plugin hook API in `hooks/register.tsx` and its host types (is there a subagent stop or task-notification event, and does a background Agent call return before the child ends?). Pi: the subagent tool's result in `tools/isswf-command-guard-pi-extension.mjs` and `tools/isswf-dispatch-guard-pi-extension.mjs` (`tool_result`). Say which host cannot observe completion.
2. Where the dispatch guard (`tools/isswf-dispatch-guard-core.mjs` `guardDispatch`, `checkCall`) could add a count check, and how its io and session state (accepted dispatches in `tools/isswf-compaction-core.mjs`) could hold in-flight workers.
3. Local storage: how the verification stamps resolve `git rev-parse --git-common-dir` (`tools/isswf-verify.mjs`) and whether the guard's io can read a file there; the shape for a local limits file.
4. Setup: where `.agents/skills/isswf-setup/SKILL.md` asks local or host questions and how a local answer is written without touching committed setup.
5. Fail-open behaviour and stale entries: what happens after a crash or restart (an in-flight entry never closed).

## Return

A short report per question, a proposed design for one S unit, and the per-host gaps. Mark observed facts versus inferences.
