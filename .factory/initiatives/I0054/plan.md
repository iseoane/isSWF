# I0054: Initiatives pane review rounds and coordinator role

Type: enhancement

Operator feedback 2026-11-13 on the Claude Code initiatives pane (hooks/register.tsx, tools/isswf-snapshot-core.mjs), after I0053/J001: two reviews of one brief (round 1 changes requested, round 2 delta passed) were drawn in the same "R1", and an attempt written by the coordinator itself showed its ID instead of a role.

## J001

- Status: completed
- Objective: The pane distinguishes review rounds within a brief revision and labels attempts the coordinator writes itself as `coordinator`.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None. I0054 stays open with J002 and J003.

### Acceptance

- Within one brief revision, records are grouped by review round, so a follow-up review of corrected work appears as a new round instead of sharing the first one; the grouping rule is documented and works for records that state no round.
- An attempt record whose profile is the coordinator acting as writer shows the role `coordinator`, and the coordinator guidance tells writers to state it in a form the pane recognises.
- The snapshot JSON contract (docs EN/ES `operations.md`) documents any new or changed field.

### Evidence

- 2026-11-13: started by the operator ("Adelante con I0054"); keep the initiative open after this job.
- 2026-11-13: I0053/J001 records A001 (coordinator writer), V001 (changes requested) and V002 (delta pass) all cite brief-r1 and were drawn as one round "R1 A001 reviewer reviewer".
- 2026-11-13: A001 complete at 8a58d93; bound reviews V001-V003 FAIL (fixed), V004 PASS (round 4 granted by the operator). Accepted under delegated acceptance (low risk).

## J002

- Status: in-progress
- Objective: The pane has two tabs: Initiatives (current view) and Agents, which lists for each agent of the session, including the coordinator, the skills and references it used and how many times.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: Coordinator implements in worktree isSWF-worktrees/i0054-j002; then bound review, PR and merge.

### Acceptance

- Two tabs at the top of the pane switch between Initiatives and Agents; the choice persists like the other pane state.
- Agents lists the coordinator (this session) and each delegated run, with per-skill and per-reference (`.agents/`) use counts; unknown usage stays "unknown".
- No model call or write; counts come from the session's own messages and the runs' transcripts already read for usage.

### Evidence

- 2026-11-13: operator request.
- 2026-11-13: started by the operator ("continua coordinador con el resto de jobs").

## J003

- Status: pending
- Objective: An opt-in switch in the pane title schedules a resume of the coordinator's work 5 minutes after the five-hour usage window resets, when usage reached 90% or more while work was in progress.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Needs an explicit operator start.
- Next step: Operator start; then implementation with focused tests and PR.

### Acceptance

- A switch in the pane title, off by default, persisted in pane state.
- When on and the `five_hour` rate-limit window is at 90% or more while a coordinator job is in progress, one resume prompt is scheduled for `resetsAt` plus 5 minutes; it names the in-progress initiative and job and asks the coordinator to reconcile state before continuing. No duplicate schedules; switching off cancels it.
- The limit is documented: the schedule lives only while the Claude session stays open.

### Evidence

- 2026-11-13: operator request (threshold 90%).
