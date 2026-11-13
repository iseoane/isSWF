# I0054/J001 r1: Review rounds and coordinator role in the pane (prepared, not started)

Grounding (2026-11-13, origin/main a993b66):
- Rounds are brief revisions: tools/isswf-snapshot-core.mjs readJob builds rounds from `brief-r<n>.md` and assigns each A/V record to the brief it cites (else the latest). A correction plus delta review inside one brief therefore shares a round.
- Options to settle at start: an explicit `Review round: <n>` line in records (template + coordinator guidance), or deriving rounds from record order (a new attempt after a review opens the next round), or both with the explicit line winning.
- Roles: parseRole recognises worker/reviewer/researcher/planner/diagnostician from role files or `isswf-<role>` agent names on identity lines. The coordinator-as-writer attempt (I0053/J001 A001) said "Profile path: coordinator acting as writer", which matches nothing. Add `coordinator` (e.g. `.agents/skills/isswf-coordinator/SKILL.md` on an identity line) and say how to state it.
- Usage stays unknown for coordinator-written attempts (no child Run line); keep that honest.
Checks: snapshot tests, `claude plugin test`, check-docs, Linux+Windows CI; bound independent review.
