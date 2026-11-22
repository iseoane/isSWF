# I0066: Deterministic run-identity control and retrospective follow-ups

Type: enhancement

On 2026-11-22 the operator saw that the Claude Code initiatives panel showed no worker runs for I0065. The panel counts a run only from a `- Run: claude agent=<id>` line in an attempt or review record. The coordinator did not pass the launch identity the host returned, so every I0065 worker record and the J001-J003 review records have no such line. `isswf-record-check` reports a malformed `Run:` line but not a missing one. The operator decided that this must be a deterministic control, not a retrospective note, and asked for a new initiative. It also holds a retrospective of the work done on 2026-11-21 and 2026-11-22; the operator decides which of its findings become further jobs here.

Order: starts after I0065 closes. Changes in packaged files (`tools/`, `hooks/`) need a patch release at close; that release needs its own operator authorization.

## J001

- Status: pending
- Objective: An attempt or review record for a host launch that returned a run identity cannot be created or pass the record check without the matching `Run:` line, and the coordinator gets a refusal that names the missing line.
- Depends on: None
- Brief: None yet; written before dispatch.
- Blocker: None.
- Next step: Ground the design: where the launch guard records accepted dispatches and their run identity, how `isswf-record-new create` and `isswf-record-check` read records, and whether the panel reads records in linked worktrees.

### Acceptance

- Creating or checking an attempt or review record for a brief with a recorded accepted launch that has a run identity fails when the record has no matching `Run:` line. Records from a coordinator acting as writer, and launches whose identity the host did not return, are not refused.
- Tests cover both refusal cases and the two exceptions.
- It works on Windows and Linux in Claude Code. Pi equivalence is checked, or its absence is recorded as an explicit limit.
- If the panel does not show runs whose records are only in a linked worktree, that is either fixed here or recorded as a separate job.

## J002

- Status: pending
- Objective: A retrospective of the work done on 2026-11-21 and 2026-11-22 (I0055, I0056, I0064, I0065 and their releases) gives evidence-backed improvement drafts for the operator to choose from.
- Depends on: None
- Brief: None yet; written before dispatch.
- Blocker: None.
- Next step: Run `isswf-retrospective` with the operator after I0065 closes.

### Acceptance

- Each finding cites its evidence (record, commit, transcript or guard output) and says whether it can be checked mechanically.
- The operator chooses which findings become jobs in this initiative. Each chosen finding becomes a job with its own acceptance criteria.
