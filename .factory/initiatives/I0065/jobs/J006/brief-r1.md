# I0065 J006 brief r1: documentation gaps from J005

- Authorization: operator, 2026-11-22 ("2 si"). Standing grant: merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Base: the merge commit of J003. The coordinator records it at dispatch.
- Objective and acceptance: [plan.md](../../plan.md) J006. Gap list and sources: plan J005 Evidence.

## Notes

- Ground every sentence in its canonical source; keep observed-only qualifiers (for example compaction observed on manual `/compact`, Pi guards wired but unobserved, usage capture opt-in and estimated).
- Flowchart: change `docs/diagrams/flow.json` only, regenerate pages and SVGs with `tooling/maintenance/workflow-flow.mjs`.
- Out: J004's animations; other guides' content.

## Checks

`node tests/workflow-flow.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tests/stale-statements.mjs .`, and `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final head. Record times.

## Method

- `isswf-writing`: selected.
- Review: one reviewer, semantic: grounding and Spanish parity. One round, one correction.
