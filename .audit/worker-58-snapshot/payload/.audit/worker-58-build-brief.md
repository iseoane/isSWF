# #58 worker profile build brief

## Identity and authorization

- Job: #58, authorized sole-writer assignment.
- Grant owner: the operator, through the instruction in this conversation. No further owner identity is available here.
- Authorized writer: the assigned LunaHigh worker in this isolated exclusive worktree.
- Repository checkout: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a4e2ea7e9f4022bec`.
- Baseline: `7fd328f43505aaf27757d9fe33f7eee53939042d`, observed as `HEAD` before editing. This records the source baseline, not this brief or candidate.
- Side effects authorized: edits only to `.agents/roles/worker.md` and `.audit/worker-58-build-brief.md`, plus local read-only checks. No commits, agents, Python, network, installation, global configuration, runtime execution, or writes outside those paths. Do not write to the coordinator's or main checkout.
- Requested model/effort: LunaHigh, high effort, as stated in the grant and existing worker dispatch configuration. The runtime's effective model was not independently observed.

## Objective

Add a concise English simplicity baseline to the worker profile that applies to every assignment, not only planning, while retaining its boundaries, permissions, and conditional references. Record the grant, source grounding, checks, and limits here without claiming parent provenance or using a candidate/self SHA.

## Scope and exclusions

Included paths:

- `.agents/roles/worker.md`
- `.audit/worker-58-build-brief.md`

Explicit exclusions: every other path. Do not translate Spanish references, copy upstream skills, duplicate the existing reference bundle, or claim that inherited pstack scaffolding proves the worker can run without a pstack runtime.

## Acceptance criteria

- The worker says every assignment should use the simplest sufficient change, fit existing patterns, avoid speculative abstractions or wrappers, and remain easy to navigate.
- The simplicity baseline does not excuse omitting meaningful tests or contracts and does not require external pstack skills.
- Existing conditional reference guidance, permission boundaries, grant/review ownership, and execution steps remain intact apart from the scoped addition.
- The brief records the exact grant owner as available, worktree, baseline, requested model/effort, scope, checks, and limits without fabricating parent provenance or a candidate SHA.

## Grounding and source checks

Read the current worker profile and these existing references to avoid duplicating their guidance:

- `.agents/roles/references/code-quality.md` for reuse, avoiding duplicate helpers/wrappers, meaningful checks, and proportional close review.
- `.agents/roles/references/comments.md` for comment constraints.
- `.agents/roles/references/design-principles.md` for conditional design guidance and navigation/simplicity constraints.
- `.agents/roles/references/execution-principles.md` for conditional execution guidance and the threshold for automation.
- `.agents/roles/references/verification-principles.md` for selective behavioral verification and honest limits.

These are the worker's existing local references. They remain conditional where specified; this change does not add a mandatory bundle. The profile itself retains its boundaries and permission language.

## Verification and limits

- `git status --short --branch` and `git rev-parse HEAD` were run before editing. They showed this worktree on branch `worktree-agent-a4e2ea7e9f4022bec`, a clean initial status, and the baseline SHA above.
- `git diff --check` passed for the tracked worker-profile edit. `git diff --no-index --check /dev/null .audit/worker-58-build-brief.md` returned no whitespace errors for the new brief; exit code 1 was normalized because it indicates a new-file diff.
- The final status shows only `.agents/roles/worker.md` modified and `.audit/worker-58-build-brief.md` untracked. The worker diff is one localized execution-step change.
- No project runtime or pstack execution was performed. These checks do not prove runtime independence, LLM compliance, or independent review.
- This brief is authored for this assignment and does not claim to be parent-authored or pinned at its own candidate SHA.
