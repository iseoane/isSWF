# I0058 J003 brief r1: research the turn-end check

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; parallel work accepted ("continua"). Standing grant.
- Actor: one isswf-researcher, read-only, at the base named in the assignment (a writer is active in other worktrees; the primary checkout is not being written).
- Objective and acceptance: [plan.md](../../plan.md) J003. This round grounds the design; implementation follows in brief r2 after the J001 pane branch merges (both touch `hooks/register.tsx`).

## Questions (file:line or "not found")

1. Claude Code: which turn-end or stop event the plugin hook API (`hooks/register.tsx`, its host types) exposes, and how it can emit a warning visible to the coordinator or operator.
2. Pi: which extension event fires at turn end (`tools/*-pi-extension.mjs`, Pi host types under `tooling/host-tests` if present) and how an extension shows a warning.
3. Data: how to find, cheaply and read-only, jobs that are `in-progress` with a committed brief and no attempt record (`tools/isswf-status.mjs`, `tools/isswf-snapshot-core.mjs`), and how to know whether a dispatch was accepted for that brief in this session (`tools/isswf-compaction-core.mjs` assignments, Pi compaction extension).
4. Where a shared core would live and which tests pin similar hooks.

## Return

A short report per question, a proposed design for one functional unit (S), and the per-host gaps. Mark observed facts versus inferences.
