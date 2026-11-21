# I0064 J001 brief r1: review chain survives a merge of main

- Authorization: operator, 2026-11-21, "Si, y prepara jobs para resolver los 3 hallazgos" and "si vamos a por esa iniciativa". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001, all three items.

## Changes

1. In `tools/isswf-handoff.mjs`, change `chainsTo`. Today an earlier review chains to a later review's base only when the commits between them change records only.
   - Also allow the range to contain merge commits whose non-first parents are ancestors of `refs/remotes/origin/main`, together with the commits those merges bring in from main.
   - The non-merge commits in the range that are not on main must still change records only.
2. Commits brought in from main stay out of the uncovered list. `rev-list --no-merges from..tip` already starts at the merge base with main, so check this still holds after a merge of main.
3. Tests in `tests/isswf-handoff.mjs`:
   - the I0058 J013 shape, with a V002 candidate, then a records commit, then a merge of main, then a fix, then V003 based on the merge: coverage is ok;
   - a merge of a branch that is not on main breaks the chain;
   - a code commit between the earlier candidate and the merge still breaks the chain.
   - Use the shared fixture helper `tests/support/git-fixture.mjs`.
4. Docs: update the coverage text in EN/ES operations.

## Checks

1. Run the touched tests, `node tests/unrun-tests.mjs .`, `node tests/fixture-repositories.mjs .`, `node tests/git-optional-locks.mjs .`, `node tooling/quality/check-docs.mjs` and `git diff --check`.
2. On the final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report the stamp.
3. If `.factory/verification.json` changes, refresh its digest in `.factory/project-setup.md`.
4. Report wall-clock times and full SHAs in A001. A not-run reason uses no outcome word.

Commit only in the assigned checkout and branch, and leave no background shells.

## Method

TDD for the chain rule. One opus/medium reviewer, 2 rounds, 1 correction.
