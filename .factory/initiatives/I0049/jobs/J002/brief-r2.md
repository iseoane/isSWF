# Job brief J002 / r2

- Source: operator observation, Claude Code session 2026-11-12; plan [I0049](../../plan.md) J002.
- Authorization: operator start 2026-11-13 ("I0049 y luego la 50"), same scope as J001 r2: commits on `feat/i0049-proportional-verification`, push, one I0049 PR against main, exact-head CI. Merge needs a separate operator decision.
- Baseline: J001 committed on the branch (worker profile step 5 and Return; coordinator brief Checks bullet and "Keep verification proportional").
- Objective: new tests and mutation experiments earn their place.
  - A new test covers a behavior or risk named in the acceptance criteria or brief; no duplicate or self-referential tests (tests that only restate the implementation or assert a constant they define).
  - Mutation or sensitivity experiments run only when the brief asks or a reviewer proposes one for a concrete doubt (review.md, line ~48 already describes the reviewer side); workers do not add them on their own. Keep the existing TDD rule and the existing "sensitivity or mutation results used as substitute evidence for missing RED" retention paragraph in worker.md consistent with this (that case is brief/reviewer-driven).
  - Coordinator briefs name the risks to test, not only a list of cases.
- Scope: `.agents/roles/worker.md`, the coordinator brief bullets in `.agents/skills/isswf-coordinator/SKILL.md`, and only if needed one sentence in `.agents/roles/references/review.md` or `.agents/roles/references/tdd.md` / `verification-principles.md` to avoid contradiction. Single canonical place per rule; link, do not copy. Packaged Markdown may link only packaged files.
- Pi and Claude Code: shared profiles; no host-guide change unless contradicted.
- Checks: `node tooling/quality/check-docs.mjs`, `node tests/host-portability.mjs .`, plus any test under `tests/` asserting edited text (grep). Not the full suite.
- Methodology considered: isswf-writing selected. Interview, TDD, E2E declined (decided methodology text).
- Review: one semantic review of the whole I0049 candidate after J003.
- Budget: 1 worker, 1 correction round.
