# I0064 J002 brief r1: record skeletons without copying the brief

- Authorization: operator, 2026-11-21, "Si, y prepara jobs para resolver los 3 hallazgos" and "si vamos a por esa iniciativa". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J002, all three items.

## Changes

1. In `tools/isswf-record-new.mjs`, change `requireBrief` and `requireInProgress`.
   - When the brief file or the plan's in-progress job is missing from the `--project` tree, read it from the `--checkpoint` commit with `git show <checkpoint>:<path>`, using `GIT_OPTIONAL_LOCKS=0`.
   - The skeleton is still written in the `--project` tree.
   - Refuse with `brief-not-found` only when neither the tree nor the checkpoint has the brief, and with `job-not-in-progress` only when neither has the job in progress.
2. Check whether `tools/isswf-handoff.mjs review` has the same brief lookup. If it does, apply the same fallback there; the I0058 J011 r2 handoff hit `brief-not-found`.
3. Tests in `tests/isswf-record-new.mjs`, and in the handoff tests if item 2 applies:
   - the brief exists only at the checkpoint;
   - the plan is in progress only at the checkpoint;
   - the brief is in neither, which is refused.
   - Use `tests/support/git-fixture.mjs`.
4. Docs:
   - Replace the precondition sentence in the EN/ES operations Record creation section, added by I0058 J013.
   - Add the old sentence to `tooling/quality/stale-statements.json`.
   - Align the coordinator SKILL.md line about `create --project`.

## Checks

1. Run the touched tests, `node tests/unrun-tests.mjs .`, `node tests/fixture-repositories.mjs .`, `node tests/git-optional-locks.mjs .`, `node tests/stale-statements.mjs .`, `node tooling/quality/check-docs.mjs` and `git diff --check`.
2. On the final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report the stamp.
3. If `.factory/verification.json` changes, refresh its digest in `.factory/project-setup.md`.
4. Report wall-clock times and full SHAs in A001. A not-run reason uses no outcome word.

Commit only in the assigned checkout and branch, and leave no background shells.

## Method

TDD for the fallback. One opus/medium reviewer, 2 rounds, 1 correction.
