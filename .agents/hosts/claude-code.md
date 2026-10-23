# Claude Code host instructions

Use this guide only when the coordinator is actually running in Claude Code. Shared objective, grounding, plan ownership, authorization and review contracts remain in `.agents/skills/isswf-coordinator/SKILL.md`; this guide replaces only Pi-specific dispatch mechanics.

Claude Code native subagents replace Pi SDK dispatch for work explicitly approved for this host. Before work, the coordinator must obtain explicit assignment approval for Claude and the inherited/selected model, then observe and record the actual model metadata. `model: inherit` is not evidence of model identity or authorization. Pi route configuration does not configure Claude, and a configured Pi model is not automatically Claude-compatible. If model or capability is unavailable, stop that dispatch; never silently substitute a model or fall back to the Pi SDK.

## Required child context

Before delegating any native role, the coordinator resolves the project pin using the original installed launcher outside the private store. Keep that launcher path separate from the pinned runtime root returned by `locate`. A retained runtime inside the store is a resource location, not a replacement launcher for a second `locate` call against that same store.

Include the following values in each child's trusted assignment, even when the parent already read them:

| Context | Required value |
| --- | --- |
| Project and scope | Absolute exclusive project root, full baseline commit, objective, sole mutable paths, protected checks and granted side effects. |
| Installed launcher | Absolute original launcher path and explicitly selected private store. |
| Pinned runtime root | Exact absolute root returned by the verified project lookup, not reconstructed from an ID or inferred from the loaded plugin. |
| Release identity | Absolute `.isswf-release.json` path, `version`, `revision`, `runtimeId` and `artifactId` verified by the coordinator. The artifact ID is the SHA-256 of the exact receipt bytes. |
| Document inputs | Absolute plan and brief paths, owning project, full document-input checkpoint and complete project-relative paths. Include every assigned input. If the approved assignment has no plan, state that explicitly instead of inventing one. |
| Host and model | Approved Claude role/model, requested effort, observed model metadata when available, and remaining actor budget. Label unobserved metadata as unknown. |
| Evidence directory | Explicitly authorized absolute directory for diffs, fingerprints and reports. Keep artifacts there rather than choosing an unrelated temporary path. |

For source-checkout assignments without a release receipt, explicitly declare source-checkout mode, the trusted factory root and its full source revision instead of inventing release IDs. Project document checkpoints remain separate.

Resolve document paths from the project root before dispatch. An initiative plan such as `.isswf/initiatives/I0001/plan.md` is not inside `jobs/J001/`; provide that full path and the separate `.isswf/initiatives/I0001/jobs/J001/brief-r1.md` path. Preserve an existing `.factory/` prefix when that is the selected state. Supply checkpoint-matching readable inputs for read-only roles. A bare `plan.md` or `brief.md` is not a complete input reference. Check that each required input is present and matches its declared checkpoint before dispatch.

The child must acknowledge the supplied root, identity and exact input paths before task work. For an installed release, first Read the host guide and receipt from that pinned root, compare the readable version/revision with the assignment, then Read its shared role profile and each required document at the exact supplied path. Use the coordinator's verified digest evidence; a read-only child must not claim it recomputed hashes. For source-checkout mode, Read the guide and role from the explicitly assigned source root. If required context is missing, mismatched or unreadable, stop before acting and return the missing field or exact path. The loaded plugin directory is not a fallback for missing installed pins. The coordinator checks the acknowledgement and subsequent file accesses before accepting the child's result; a successful repair alone does not close an incomplete handoff.

## Native tools and review

Delegate with Claude's native agent mechanism and the plugin role definitions. The coordinator retains responsibility for authorization, plan ownership, grounding, budget, evidence and acceptance. Native delegation does not provide equivalent Pi sandboxing, persistence or recovery. Tool declarations are not a security boundary; reviewer agents must have only Read, Grep and Glob, never Bash or other mutating tools. Bash is capable of mutation and is not a sandbox guarantee. Do not use permission bypasses, hooks or MCP to imply enforcement.

An independent reviewer must judge the writer's exact retained candidate, including a stopped writer's partial candidate, not a substitute or later workspace. In addition to the required child context, provide the exact diff/snapshot identity and untracked contents, base, scope and original protected-check observations with their observer. Keep the writer stopped and those bytes fixed through review, then check the fingerprint again. The reviewer reads the supplied plan, brief and shared review reference from their explicit paths. Reviewer reports are evidence, not acceptance. Record missing context separately from the repair verdict; do not call full host validation passed while a required handoff check is missing.
