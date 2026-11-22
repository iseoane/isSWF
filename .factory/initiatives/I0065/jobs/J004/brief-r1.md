# I0065 J004 brief r1: first-session animation and panel recording

- Authorization: operator, 2026-11-22, "incluidos en esa primera pagina, para hacer de gancho". Standing grant: merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Base: the merge commit of J003. The coordinator records it at dispatch.
- Objective and acceptance: [plan.md](../../plan.md) J004.

## Changes

1. A bilingual script file, for example `docs/diagrams/first-session.json`: ordered steps (who speaks, text in `en`/`es`, delay). Steps follow J003's story: install, setup, an `isswf-howto` question and its answer, a first coordinator request, review and PR, the operator's approval, retrospective.
2. A generator, for example `tooling/maintenance/first-session.mjs`, Node built-ins only, writing an SVG terminal animation with CSS keyframes (no JavaScript, no external fonts), light and dark aware, readable at GitHub README width. A visible "simulated session" label.
3. A test `tests/first-session.mjs` with fixtures for a stale SVG and a missing translation, wired into `tools/check-quality.mjs`.
4. A second animation from the same generator: `docs/en/initiatives-panel.svg` and `docs/es/initiatives-panel.svg`, simulating the Claude Code initiatives panel following a job from pending to in-progress to done. Operator decision, 2026-11-22: simulated, not recorded. Ground it in the panel's rendering code and `docs/en/installation.md`: show only fields, states and layout it actually renders, with neutral demo data (no real paths, names or emails) and a visible "simulated" label. Its script data and test fixtures are covered by the same `--check`.
   Visual reference (operator, 2026-11-22): a private screenshot at `tooling/.local/i0065/initiatives-panel-reference.png` in the primary checkout (Git-ignored; never commit, copy or describe its personal content). Use it only for look: a right-hand pane beside the conversation; a header line with the version and project, then status dots for optional tools; tabs (initiatives, agents, files) with the active one bracketed; a framed card per active initiative with a title line, a "jobs done/total" progress line, and one line per job with a marker for the current job and hollow markers for the others; a separate framed "not active" section. Dark navy theme with cyan and green accents, monospace. The code decides fields and states; where the screenshot and code disagree, follow the code and note it in A001.
5. README placement in both languages, keeping J003's structure.

## Grounding

Every simulated command and reply must match the real behavior at the base: `.agents/skills/isswf-setup/SKILL.md`, `.agents/skills/isswf-howto/SKILL.md` (its output format), `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/roles/references/feature-delivery.md`. Shorten, but do not invent features or outputs.

## Checks

1. `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund` in the new worktree.
2. `node tests/first-session.mjs .`, `node tests/unrun-tests.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, ESLint and Knip.
3. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final head.
4. Open both SVGs in a browser in light and dark and record what you saw. Record wall-clock times.

## Method

- `isswf-writing`: selected, plain bilingual text.
- `design-principles`: not selected; it mirrors J001's data-and-generator pattern.
- TDD: not selected; fixtures cover the check.
- Review: one reviewer, semantic: grounding of each simulated step and Spanish parity. The operator views the README before merge.
