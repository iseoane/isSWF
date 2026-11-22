# I0066: Deterministic run-identity control and retrospective follow-ups

Type: enhancement

On 2026-11-22 the operator saw that the Claude Code initiatives panel showed no worker runs for I0065. The panel counts a run only from a `- Run: claude agent=<id>` line in an attempt or review record. The coordinator did not pass the launch identity the host returned, so every I0065 worker record and the J001-J003 review records have no such line. `isswf-record-check` reports a malformed `Run:` line but not a missing one. The operator decided that this must be a deterministic control, not a retrospective note, and asked for a new initiative. It also holds a retrospective of the work done on 2026-11-21 and 2026-11-22; the operator decides which of its findings become further jobs here.

Order: starts after I0065 closes. Changes in packaged files (`tools/`, `hooks/`) need a patch release at close; the operator authorized that patch release on 2026-11-22 ("lo tienes autorizado!").

## J001

- Status: pending
- Objective: An attempt or review record for a host launch that returned a run identity cannot be created or pass the record check without the matching `Run:` line, and the coordinator gets a refusal that names the missing line.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
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
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Run `isswf-retrospective` with the operator after I0065 closes.

### Acceptance

- Each finding cites its evidence (record, commit, transcript or guard output) and says whether it can be checked mechanically.
- The operator chooses which findings become jobs in this initiative. Each chosen finding becomes a job with its own acceptance criteria.

## J003

- Status: pending
- Objective: The coordinator integrates a reviewed job and prepares a review dispatch through host-neutral tools in `tools/`, called from the coordinator skill, instead of hand-run command sequences.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Ground the current hand-run sequences in the I0065 transcript and the existing tools.

### Acceptance

- An integration command checks review coverage and exact-head CI success, merges with the head pinned, records the job close in the plan, pushes that records-only commit, and removes the job worktree and branch. It refuses with a named reason when a check fails, and changes nothing in that case.
- A review-preparation command generates the handoff, creates the review record with the run identity when known, and prints the prompt lines including the brief path, so the dispatch guard's reference condition is met.
- Risk and operator-acceptance judgment stay with the coordinator; the commands never decide them.
- Tests cover success and each refusal. Works on Windows and Linux; Pi and Claude Code both use it through the skill.

## J004

- Status: pending
- Objective: The Windows CI job and the local initiative-tier verification on Windows take measurably less time, based on a per-step timing breakdown.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: Measure per-step and per-test durations in the windows-latest job and in a local `isswf-verify --tier initiative` run on Windows.

### Acceptance

- A recorded breakdown names the slowest steps and tests on Windows, compared with Linux.
- Changes cut the Windows wall-clock time without dropping any check or platform coverage; before and after times are recorded.
