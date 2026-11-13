# Job brief J009 / r1

- Source: operator request, Claude Code session 2026-11-12 ("en setup diremos al usuario como activar el panel").
- Authorization: operator start 2026-11-13 ("vamos por el j009 ... para cerrarlo y llevar todo a main"): implementation, checks, commit and push on feat/i0046-j008-plugin-pane (PR #281 chain), CI, and merge of the I0046 PR chain into main once CI is green on the exact head.
- Objective: make `.agents/skills/isswf-setup/SKILL.md` tell Claude Code users that the opt-in initiatives pane exists and how to turn it on, by linking `docs/en/installation.md` (pane paragraph) instead of copying it.
- Acceptance: setup flow mentions the pane for Claude Code only (/config, Initiatives pane, /isswf-initiatives) with a link; Pi flow unaffected; if any user guide changes, its docs/es mirror changes too; `node tooling/quality/check-docs.mjs` and focused tests touching setup skill text pass.
- Scope: the setup skill (and any test asserting its text). No code, no packaging changes, no state writes.
- Methodology considered: isswf-writing selected (agent instruction text). Interview declined (spec clear). TDD/E2E declined (instruction text only).
- Review: mechanical (check-docs, focused tests) plus coordinator read of the diff; semantic review declined, single-sentence instruction change with low risk.
- Budget: 1 worker, 1 correction round.
