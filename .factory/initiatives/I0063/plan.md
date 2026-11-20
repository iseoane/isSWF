# I0063: Parallel jobs in worktrees

Type: enhancement

## J001

- Status: pending
- Size: S (guard)
- Objective: A worker's commits are refused outside the worktree and branch the coordinator assigned to it, so parallel writers cannot mix changes.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Implementation brief.

### Acceptance

- The branch guard refuses a worker's commit whose checkout or branch differs from its assignment, on Claude and Pi, Linux and Windows; the coordinator's own commits are unaffected.

### Evidence

- 2026-11-20: operator: the real problem is no parallel development; asked why a job cannot open a worktree, develop and test there until integration, then remove it. Coordinator found the blocker is the host-guide rule `.agents/hosts/claude-code.md:28` (binding by instruction not accepted), not a Git limit; operator accepted a guard plus pilot.

## J002

- Status: pending
- Size: M (pilot and rule update)
- Objective: Two independent jobs run in parallel, each in its own worktree and branch through test, review, PR and merge, and the worktrees are removed after integration.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Pick two small independent jobs after J001.

### Acceptance

- A pilot runs two independent jobs concurrently in coordinator-created worktrees (or the host's automatic worktree isolation if it fits), each integrated only when its checks and review are green, dependent jobs never in parallel, and each worktree removed after merge.
- The host guide worktree rule and docs/en|es are updated to the observed, guarded behavior, including checks on the pinned candidate while the next worker continues (former I0061 J011).

### Evidence

- 2026-11-20: moved from I0061 J011 (pinned worktree checks), operator decision.
