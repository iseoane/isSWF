# I0067 J003 brief r1

- Size: S
- Authorization: operator, 2026-11-28 (accepted the J001 design note recommendations); the job needs an explicit start.
- Objective and acceptance: [plan.md](../../plan.md) J003.
- Source: [J001 design note](../J001/design-note.md).

## Method

- `isswf-tdd`: selected (a behavior change with a cheap regression seam). Review: one reviewer, standards and spec.
- Run `tests/release-package.mjs` locally when the change touches `tools/isswf.mjs` or `tools/state-migration.mjs` (I0067 J002 missed it).
- Risks: never weaken identity, authority or recovery guarantees; nothing is cleared or pushed automatically.
- From J001 review V001: handle SIGINT, SIGHUP (console closed) and SIGBREAK on Windows; `tools/isswf.mjs:417` keeps the lease when the child exits by signal, so the handler path must remove it after the child exits whatever its exit signal; the lease already records `tool` and `runtimeId`, only the child PID is new.
