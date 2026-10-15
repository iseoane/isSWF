# Model routing implementation record

## Provenance

- Worktree: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a40bb734150804f3b`.
- Starting base: `f78792878909530b730956c439b3172a90e25c51`.
- Authorization: operator instruction in this session, limited to `docs/model-routing.md`, `.agents/roles/worker.md`, `.agents/skills/isswf-coordinator/SKILL.md`, and this audit brief.
- The earlier implementation and its two reviews concerned a prior candidate. They do not establish that this corrected candidate passed those reviews.

## Scope

This correction changes only the four authorized paths above. It clarifies whole-route grant validation, checks runtime availability and effort compatibility only for the selected tuple, and permits ordered fallback only after the prior writer stops and its grant is reconciled. Unknown or unsupported next tuples block without skipping. Test failures, review findings, and poor output do not trigger fallback. The worker and coordinator refer to the guide with plain paths, not Markdown links.

No route values, algorithms, attempt records, durable-work guidance, tools, runtime behavior, agents, network access, commits, or main-worktree files were changed in this correction.

## Checks performed for this candidate

- Confirmed the worktree path with `git rev-parse --show-toplevel`.
- Read the four authorized files and the existing worker and coordinator guidance before editing.
- Confirmed the guide links in the worker and coordinator files were replaced with plain `docs/model-routing.md` paths.
- Reviewed the current diff and worktree status after editing. The worktree also contains earlier changes outside this correction's authorization; this correction did not modify them.

No runtime dispatch or availability probe was performed. No tests or independent reviews were run against this corrected candidate. Those results remain unclaimed.
