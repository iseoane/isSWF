# I0058 J001 brief r1: research

- Authorization: operator, 2026-11-21, "empezando por la j001 de la I0058, ataca la iniciativa completa I0058"; standing grant for reversible work, merge unless HIGH risk.
- Actor: one isswf-researcher, read-only. No edits, commands with side effects, model calls or network.
- Objective and acceptance: [plan.md](../../plan.md) J001. This round only grounds the design; implementation follows in brief r2.

## Questions (answer each with file:line evidence, or "not found")

1. Observed reads and commands: what the Claude plugin hook (`hooks/register.tsx`) already sees for a child's tool calls (agent id, tool name, input such as file path or shell command) and what it stores today; the same for the Pi extension (`tools/isswf-command-guard-pi-extension.mjs` and siblings). What is missing to record, per child run, the files read and the commands run.
2. Pane gaps: why `tools/isswf-run-usage-core.mjs` (around lines 152-158) yields `unknown` roles and `skills: unknown`, and why host guides appear under references. Name the smallest change for each.
3. Verification stamp: how `tools/isswf-verify.mjs` output (per-check `candidate`, `dirty`, `argvSha256`, `verificationSha256`) could become a per-commit stamp written by a tool. Compare where it could live (a state file keyed by commit, git notes, a commit trailer added by a tool) against durability, worktrees, rebases/squash merges and Windows/Linux parity.
4. Commit gate: where an `off|observe|enforce` gate fits among the existing commit guards (`tools/isswf-branch-guard-core.mjs`, `tools/isswf-verification-guard-core.mjs`, record/plan guards), how the guard would know the commit's paths before it exists, and where the project setup would record the mode (default `observe`).
5. Brief comparison: how an attempt close could compare a brief's selected skills and required references with observed reads, and where that report would surface.

## Return

A short report per question, then a proposed split into functional units (one per PR, sized S/M) with the order and the risks. Mark facts observed in code versus inferences.
