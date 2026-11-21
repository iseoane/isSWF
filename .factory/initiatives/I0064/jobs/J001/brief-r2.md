# I0064 J001 brief r2: judge a merge by what it adds beyond the automatic merge

- Authorization: operator, 2026-11-21, "Coordinador I0064, release patch, ...". Standing grant; merge unless HIGH risk. Brief r1 used its review budget, and V002 F4 is blocking; this revision gives a new budget.
- Writer: the same isswf-worker, in the same worktree and branch.
- Objective and acceptance: [plan.md](../../plan.md) J001. Brief r1 still holds; this revision changes only the merge test.

## Changes

1. **V002 F4.**
   - Replace the `diff-tree -c` merge test in `tools/isswf-handoff.mjs`. For a two-parent merge, compute the automatic result with `git merge-tree --write-tree <parent1> <parent2>` (Git 2.38 or later), with `GIT_OPTIONAL_LOCKS=0`.
   - The merge's own changes are `git diff --name-only <auto-tree> <merge>`.
   - A merge counts as covered only when its other parent is on `origin/main` and those own changes touch records only.
   - If `merge-tree` reports conflicts, the files it lists as conflicted count as the merge's own changes; the resolution must be reviewed.
   - When the merge has more than two parents, or `merge-tree` is unavailable or fails, the merge breaks the chain and is listed uncovered. This fails closed.
   - This applies both inside the chain and after the last candidate, including the CI `pull_request` merge commit.
2. **Tests.**
   - Add a case where main and the job both edit `src/a.mjs` in different hunks and the merge is clean. Coverage must be ok in the chain, and ok when it is the tip after the last candidate.
   - Keep the `merge-evil` and `merge-evil-open` cases.
   - Add a conflicted merge whose resolution adds code, which must be uncovered.
3. **V002 F5.** Record it as a known limit in the EN and ES coverage text: a resolution that keeps one side whole drops the other side's change without being listed. Fix the "a clean merge adds nothing" sentence.

## Checks

1. Run `node tests/isswf-handoff.mjs .`, unrun-tests, fixture-repositories, git-optional-locks, check-docs and `git diff --check`.
2. Commit, then run the job tier on the final head.
3. Append "Correction 2 (brief r2)" to A001 and commit it.
4. The RED must be behavioural and written before GREEN.

## Method

TDD. One opus/medium reviewer, 2 rounds, 1 correction.
