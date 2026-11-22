# I0065 J001 brief r1: bilingual interactive workflow flowchart

- Authorization: operator, 2026-11-22, "prepara la iniciativa" for the flowchart replacing Archify. Standing grant: merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Base: 990445dd20a15d9c3638ea08040d96efef04742e.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Input

- [mockup.html](../../mockup.html) is the approved behavior and content draft. Its node positions, plain-language wording, yes/no layout, single-open accordion, arrow highlight, guard mark and GitHub links are the target. It is a mockup, not code to copy as is. Do not use its external Google Fonts link: the generated page uses system font stacks.
- Mockup content was written by the coordinator from these sources. Verify each question against them and correct any wording the source does not support:
  - `.agents/skills/isswf-coordinator/SKILL.md`: §2 "Choose a proportionate path", "Optional methodology triggers", "Reclassify after research", "Stop churn", "Size and split jobs", §5.
  - `.agents/roles/{researcher,planner,worker,reviewer,diagnostician,delivery}.md`: the Boundaries and Execution sections.
  - Guards: `docs/en/operations.md` (dispatch, command, branch and record guards; compaction) and `docs/en/architecture.md` lines 28-34.

## Changes

1. A data file, for example `docs/diagrams/flow.json`. Each node, edge, question and guard has a stable `id` and `en`/`es` text. Cited paths are repository-relative.
2. A generator, for example `tooling/maintenance/workflow-flow.mjs`, using Node built-ins only. It writes `docs/en/workflow.html` and `docs/es/workflow.html`, each with inline CSS and JS. Links point to `https://github.com/iseoane/isSWF/blob/main/<path>`. `--check` compares the bytes and validates the data (see the acceptance criteria).
3. A test `tests/workflow-flow.mjs` with disposable fixtures: a missing translation, an unknown edge target, a missing cited path and a stale generated page. Wire it into `tools/check-quality.mjs`.
4. Leave the Archify files in place. J002 removes them. Overwriting `docs/*/workflow.html` here is expected, so the old `tests/workflow-diagrams.mjs` hash check will fail. In this job, update only its hash expectation, or skip only the HTML part of that check, and record which in A001.

## Scope

- In: the data file, generator, the two pages, the test and its wiring, and a short maintenance note in `docs/en/development.md` and `docs/es/development.md`.
- Out: README text, the SVG overview, removing Archify, and `pages.yml`.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. `node tests/workflow-flow.mjs .`, `node tests/workflow-diagrams.mjs .`, `node tests/unrun-tests.mjs .`
3. `node tooling/quality/check-docs.mjs`, `git diff --check`, and ESLint and Knip as listed in `.github/workflows/quality.yml`.
4. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final head. Report the stamp.
5. Open both pages in a browser once, in light and dark, and record what you saw. If you cannot, say so.
6. Record wall-clock times. Write and commit A001.

## Quality inventory

ESLint and Knip run in CI. The tests are the portable Node tests. There is no build step. Knip covers dead code. There is no duplicate detector, so check by hand that the generator does not copy logic already in `tooling/quality/check-docs.mjs`.

## Method

- `isswf-writing`: selected for the bilingual plain-language text.
- `design-principles`: selected, because this is a new data contract.
- TDD: not selected. The check's failure cases are covered by fixtures.
- Review: one reviewer, semantic and mechanical. Its focus is grounding of every question against its source and parity between the two languages. One round, one correction.
