# I0068: Check work records before records-only pushes

Type: enhancement

The operator created this initiative on 2026-11-27 ("para el records-only pushes prepara tambien iniciativa"). It takes the "Records-only pushes" proposal from `docs/en/future-actions.md`. The plan commit guard already refuses a `plan.md` that `isswf-status` cannot read. Attempt and review records (A/V) are checked only when an agent writes them through the record location guard, or later in CI, so a record edited by a script or by hand can reach `main` malformed and break CI for every open pull request. Plan approval is preparation only; each job needs an explicit operator start. Every job is S or M.

## J001

- Status: completed
- Size: M
- Objective: A commit that records an attempt or review record is refused when the record check rejects that record as the commit would record it, on both hosts, so a malformed record no longer reaches `main` through a records-only push.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None. Previously: Size M. Ground the plan commit guard in `tools/isswf-plan-commit-guard-core.mjs` (how it reads the staged or working-tree version) and `checkRecord` in `tools/isswf-record-check-core.mjs`; reuse both rather than adding a second reader.

### Acceptance

- A commit with a malformed A or V record is refused with the path and the record check's violation; a valid record commits.
- The record is read as the commit would record it (staged, `-a`, pathspec or a chained `git add`), like plan files.
- It fails open on a git fault, like the plan commit guard; CI's record check still runs.
- Works in Claude Code and Pi, on Windows and Linux; the EN and ES operations guides describe it.

### Evidence

- Candidate 80b4a36ff1fba9be33b49b559960130f3071df2b; attempt A001; reviews V001 (fail, corrected), V002 (pass), V003 (pass). Operator decision 2026-11-28: the guard enforces parity with isswf-record-check --base HEAD.
