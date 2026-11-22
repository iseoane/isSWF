# I0065 J002 brief r1: static README overview and Archify removal

- Authorization: operator, 2026-11-22. Standing grant: merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Base: the merge commit of J001. The coordinator records it at dispatch.
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Changes

1. Extend the J001 generator to write `docs/en/workflow.svg` and `docs/es/workflow.svg` from the same data file. The SVG has nodes and arrows only, no script, and must stay readable on GitHub's light and dark backgrounds. `--check` covers the SVG bytes.
2. In `README.md` and `README.es.md`, change only the "Workflow diagrams" section and its Spanish counterpart: show the SVG, link the Pages URLs, and drop the Archify-specific wording.
3. Remove Archify:
   - `docs/diagrams/workflow.json` and `workflow.generated.json`
   - `docs/en/workflow.delivery.json` and `docs/es/workflow.delivery.json`
   - `tooling/maintenance/workflow-diagrams.mjs` and `workflow-citations.mjs`
   - `tests/workflow-diagrams.mjs` and `tests/workflow-citations.mjs`, with their `tools/check-quality.mjs` lines 53-54 and the `workflowDiagramsResult` field
   - `/.archify/` in `.gitignore`

   Before each removal, search the whole repository for other references, including `tooling/quality/stale-statements.json`, the packaging allowlists and the Knip config.
4. Rewrite "Maintain the workflow diagrams" in `docs/en/development.md` and `docs/es/development.md` for the new generator.
5. Carried from J001 V002 N1: in `flow.json` `coord.who`, say helpers do not start helpers of their own, and that only a worker or diagnostician may when its brief explicitly allows it (`.agents/roles/researcher.md:29`, `worker.md:50`, `diagnostician.md:15`). Regenerate the pages.
6. Add the removed Archify regeneration statement to `tooling/quality/stale-statements.json`.

## Scope

- In: the items above. `.github/workflows/pages.yml` changes only if a published path changes.
- Out: README tone or structure outside the diagram section.

## Checks

As in J001 checks 1-4 and 6, plus `node tests/stale-statements.mjs .` and `node tests/release-package.mjs .` if the packaging lists change. Look at both SVGs once, as GitHub would render them, and record it.

## Method

- `isswf-writing`: selected.
- Review: one reviewer, mechanical. Its focus is that no reference to a removed file is left behind and that the two languages match. One round, one correction.
