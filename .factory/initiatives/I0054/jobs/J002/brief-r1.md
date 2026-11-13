# I0054/J002 r1: Agents tab with skill and reference use (started 2026-11-13)

Grounding (2026-11-13): hooks/register.tsx already resolves per-run usage (`resolveRunUsage` in tools/isswf-run-usage-core.mjs returns skills and `.agents` reads per run) for pills; the coordinator's own counts can come from `$.session.messages()` tool uses (Skill calls, Read of `.agents/` paths). Pane UI uses Box/Button/Text; state keys live under `plugin: 'isswf'`. Keep drawing cheap (usage resolved after the draw, as today).
Checks: `claude plugin test`, snapshot tests if the core changes, check-docs (EN/ES installation pane paragraph), Linux+Windows CI; bound review.
