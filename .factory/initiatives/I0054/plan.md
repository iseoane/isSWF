# I0054: Initiatives pane review rounds and coordinator role

Type: enhancement

Operator feedback 2026-11-13 on the Claude Code initiatives pane (hooks/register.tsx, tools/isswf-snapshot-core.mjs), after I0053/J001: two reviews of one brief (round 1 changes requested, round 2 delta passed) were drawn in the same "R1", and an attempt written by the coordinator itself showed its ID instead of a role.

## J001

- Status: pending
- Objective: The pane distinguishes review rounds within a brief revision and labels attempts the coordinator writes itself as `coordinator`.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Needs an explicit operator start.
- Next step: Operator start; then implementation with focused tests and PR.

### Acceptance

- Within one brief revision, records are grouped by review round, so a follow-up review of corrected work appears as a new round instead of sharing the first one; the grouping rule is documented and works for records that state no round.
- An attempt record whose profile is the coordinator acting as writer shows the role `coordinator`, and the coordinator guidance tells writers to state it in a form the pane recognises.
- The snapshot JSON contract (docs EN/ES `operations.md`) documents any new or changed field.

### Evidence

- 2026-11-13: I0053/J001 records A001 (coordinator writer), V001 (changes requested) and V002 (delta pass) all cite brief-r1 and were drawn as one round "R1 A001 reviewer reviewer".
