# I0061 J005 brief r1

- Authorization: operator, 2026-11-20, "ok" to the J005 split and to starting J005. Feature-to-PR start on `feat/i0061-j005-tiers`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J005 (narrowed; J010 and J011 hold the rest).

## Design (keep it small: prose plus at most one pure helper)

1. Coordinator default (`.agents/skills/isswf-coordinator/SKILL.md`, the "Keep verification proportional" paragraph): without a project check rule and with CI that runs the full suite, a job runs locally only `isswf-verify --tier job` (focused checks whose `covers` match the diff, plus affected consumers) and leaves the full suite to CI; full suite locally only when there is neither a rule nor such CI. Edit the existing sentences; do not add a parallel rule.
2. Path-keyed table: `isswf-verify` gains `--table` that prints, from the approved `verification.json`, a Markdown table keyed by path class (code, tests, E2E harness, packaging or CI, docs or records only, initiative close) -> the check ids and cost tier each requires, derived from `covers` and `cost`. If that cannot be derived cleanly from the existing fields, stop and report instead of adding schema.
3. Setup (`.agents/skills/isswf-setup/SKILL.md`): propose that table as the project's AGENTS.md check rule. When the project already has check rules, show existing vs proposal side by side; the operator chooses existing, proposal, or an edited merge; nothing is written without that choice; the chosen rule overrides the factory default.
4. Guide: a short section in `docs/en/development.md` and `docs/es/development.md` (or the existing CI page if one fits better) on tiered CI for private repos: fast tier per PR with path filters and cancel-in-progress, full tier on main or manual dispatch or schedule, Windows/macOS runner-minute multipliers (state them as GitHub's published multipliers with a link, no invented numbers).

## Scope

- Out: close gate and CI dispatch workflow (J010), pinned worktrees (J011), changes to this repository's own workflows.

## Checks

`node tests/isswf-verify.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, tests that read the coordinator/setup skill text (grep `tests/` for the edited files). Full suite to CI.

## Method

TDD for `--table`. One opus/medium reviewer, 2 rounds, 1 correction.
