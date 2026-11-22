# I0065 J005 brief r1: documentation gap inventory

- Authorization: operator, 2026-11-22 ("igual teniais que dar una revision al proyecto en busqueda de cosas que se me hayan pasado ... en el readme y en el diagrama"). Read-only.
- Actor: one isswf-researcher in a detached base worktree. No file writes; the coordinator records the result.
- Objective and acceptance: [plan.md](../../plan.md) J005.

## Scope

Compare what isSWF actually offers with what three user-facing pages say:

- Pages: `README.md`, `docs/en/reference.md` (both at the J003 candidate when available, otherwise the base), and `docs/diagrams/flow.json` (the flowchart's data).
- Capabilities to inventory: every skill under `.agents/skills/`, every role under `.agents/roles/`, the tools under `tools/` that a user or coordinator runs, the plugin hooks and guards (`hooks/register.tsx`, `docs/en/operations.md`), the initiatives panel, setup choices (`.agents/skills/isswf-setup/SKILL.md`), host support (`docs/host-portability.md`), and the current guides in `docs/en/`.
- Out: `docs/en/future-actions.md` (proposals), `.factory/initiatives/` (history), `isswf/` and `examples/` (historical prototypes), legacy executor paths.

## Return

A ranked table: capability, source path, missing from (README / reference / flowchart), why a new user would care, suggested one-line wording. Then the top ten at most. Mark anything uncertain as uncertain. Report resource consumption.

## Method

- Researcher profile, read-only. Codegraph first for structural questions when available.
- No review: the operator decides on the result.
