# I0063 J002 brief r1

- Authorization: operator, 2026-11-21, "si por favor" to batched PRs and records-only CI skip in J002, and to completing I0063. Merge per the standing rule (not HIGH risk).
- Writers: two isswf-workers in parallel, J004 and J005, each alone in its own worktree under the configured `isswf.worktreeRoot` sibling layout, bound with `checkout:` and `branch:` prompt lines (J001 guard).
- Objective and acceptance: [plan.md](../../plan.md) J002.

## Flow

1. Coordinator creates `<root>/i0063-j004` on `feat/i0063-j004-records-ci-skip` and `<root>/i0063-j005` on `feat/i0063-j005-ci-minutes`, both from the same main commit.
2. Dispatch both workers in the background. Record whether the branch guard was observed binding each child.
3. Each job: focused checks run by the coordinator in its worktree, its own review chain and V record on its branch.
4. Batch branch `feat/i0063-j002-batch` from main merges both reviewed branches (merge commits, no rebase). Coverage on the batch. One PR, one CI run. A failure is fixed forward on a new branch merged into the batch.
5. After merge: remove both worktrees and local branches per the repository cleanup grant.
6. Measure CI minutes with the J005 script; update the host guide worktree rule, coordinator skill and docs/en|es operations with the observed behavior, including the batched PR as an option. This last change is its own small reviewed PR.

## Method

Review per job (opus/medium, 2 rounds, 1 correction each). The host-guide change needs operator approval (REVIEW.md).
