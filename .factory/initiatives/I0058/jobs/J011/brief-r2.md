# I0058 J011 brief r2: correction for review V001

- Authorization: operator, 2026-11-21, "Dale". Standing grant. Role-profile and coordinator-skill edits are approved in scope: they need a person's approval under REVIEW.md, which the coordinator gives under the standing grant.
- Writer: the same isswf-worker, in the same worktree and branch.
- Objective and acceptance: [plan.md](../../plan.md) J011. Brief r1 still holds; this revision adds only the scope below.

## Changes

1. **V001 F1.** Reconcile `.agents/roles/worker.md` lines 49 and 60 with the guard. A worker writes its attempt record in its assigned checkout's state directory, and the record travels on its branch. Remove the "primary checkout" and "not inside a separate candidate worktree" wording.
2. **Skeleton location.** State in `.agents/skills/isswf-coordinator/SKILL.md`, near line 114, where the coordinator creates a worker's record skeleton: `isswf-record-new create --project <the worker's checkout>`. Make the operations "Record creation" text in EN and ES agree.
3. **Stale phrases.** Add the removed profile phrases to `tooling/quality/stale-statements.json` where they are stable enough to match.
4. **V001 F2.** Record the setup-failure RED as a disclosed deviation in A001. Do not redo the RED.
5. **V001 F3.** Drop the duplicate Pi assertion in `tests/host-portability.mjs`.
6. **V001 F4.** Record it in the docs as a known limit: UNC, `/c/` and junction spellings are compared exactly and fail closed.

## Checks

Run the touched tests, `node tests/stale-statements.mjs .`, `node tooling/quality/check-docs.mjs` and `git diff --check`. Then run the job tier once on the final code head and report its stamp. Append a "Correction 1" section to A001 with full SHAs and commit it in the checkout.
