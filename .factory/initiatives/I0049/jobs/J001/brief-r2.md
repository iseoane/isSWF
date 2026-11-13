# Job brief J001 / r2

- Source: operator observation, Claude Code session 2026-11-12; plan [I0049](../../plan.md) J001.
- Authorization: operator start 2026-11-13 ("I0049 y luego la 50"): implementation, focused checks, commits on `feat/i0049-proportional-verification`, push, one PR for I0049 against main and exact-head CI. Merge into main needs a separate operator decision.
- Objective: workers run only the checks their change affects and name the checks they did not run; the coordinator runs the full suite at most once on the final candidate, only when the target project's rule requires it, and otherwise relies on PR CI.
- Technical constraint found by the coordinator: `docs/en/development.md` is not shipped in the package (packaged Markdown may link only packaged files; see the host-portability packaged-link check that failed on I0046 J009). Its rule is this repository's own check policy, already referenced from `AGENTS.md`. So the shared worker profile and coordinator state the host- and project-neutral principle (focused checks for the changed behavior; the full suite only when the project's documented rule requires it; name checks not run) and point to "the project's documented check rule (for isSWF itself, `AGENTS.md` and `docs/en/development.md`)" by name, not by link. This replaces the plan's "link docs/en/development.md" wording.
- Scope: `.agents/roles/worker.md` (check and report guidance) and the coordinator brief/verification guidance in `.agents/skills/isswf-coordinator/SKILL.md` or the one existing reference it already uses for that (choose the single canonical place; do not copy). No code, no user guide changes expected (if one changes, update its docs/es mirror).
- Pi and Claude Code: both read the same shared profiles; no host-guide change unless one contradicts the new text.
- Checks: `node tooling/quality/check-docs.mjs`, `node tests/host-portability.mjs` (packaged-link rule), plus any test under `tests/` that asserts the edited text (grep). Do not run the full suite.
- Methodology considered: isswf-writing selected (agent instructions). Interview declined (decision recorded by the operator 2026-11-12). TDD/E2E declined (instruction text).
- Review: semantic review of the whole I0049 candidate once, after J003, because it changes shared methodology for every project and host.
- Budget: 1 worker, 1 correction round.
