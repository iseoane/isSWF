# Model routing implementation record

## Provenance

- Worktree: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a40bb734150804f3b` (isolated child worktree).
- Exact base: `f78792878909530b730956c439b3172a90e25c51`.
- Authorization: operator instruction in this session, limited to the seven paths listed below. This record and the route configuration do not grant work.
- Main-worktree decision sources read without writing there: `/home/iseoane/Work/isSWF/.audit/models-60-decision.md` and `/home/iseoane/Work/isSWF/.audit/models-60-design-review.md`.
- Tracked source contracts reopened at the base: `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/roles/worker.md`, `docs/templates/attempt.md`, and `docs/durable-work.md`.

## Scope

Changed only these authorized paths:

- `.factory/models.json`
- `docs/model-routing.md`
- `.agents/skills/isswf-coordinator/SKILL.md`
- `.agents/roles/worker.md`
- `docs/templates/attempt.md`
- `docs/durable-work.md`
- `.audit/models-60-build-brief.md`

The JSON contains only schema version 1 and the selected direct ordered role tuples. The manual guide defines interpretation without duplicating route values. Coordinator and worker instructions point to the canonical route and require an effective-brief selection. Attempt records pin configuration path and input SHA, resolved route, selected destination, observed actual metadata, support evidence, and transition reasons. Durable-work guidance points to the canonical configuration and guide instead of repeating route tuples.

## Verification evidence

At start, `git rev-parse HEAD` returned the exact base above. `git status --short --untracked-files=all` showed a clean child worktree. The authorized coordinator and worker source sections contained hardcoded worker and reviewer model dispatch values; those sections were replaced with route-guide pointers and per-assignment selection requirements. The durable-work guide contained researcher tuples duplicated from the decision; that paragraph was replaced by canonical links.

The configured model IDs and efforts are declarations from the approved decision, not observed runtime metadata. This implementation did not dispatch models, query runtime availability, validate credentials, or demonstrate actual model/effort selection. The guide requires those checks before future dispatch and does not claim them here. The current Pstack transport adapter remains an available current adapter, not a guarantee of future compatibility.

No independent implementation approval or review was performed. This record is not self-approval. No resolver, runtime, catalog, credentials, account aliases, defaults, revision counter, CLI, compatibility layer, installation, network access, global configuration, or main-worktree write was added.
