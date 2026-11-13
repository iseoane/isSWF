# I0052: Initiatives pane accuracy

Type: enhancement

Operator feedback on the Claude Code initiatives pane (hooks/register.tsx, tools/isswf-snapshot-core.mjs), recorded 2026-11-13. Separate from I0014. Planning history of the pane lives in I0046/I0047 on branch plan/i0046-i0047-initiatives-pane.

## J001

- Status: in-review
- Objective: Make the pane show only real activity and an honest outcome for every delegated role.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Operator authorization to push branch feat/i0052-j001-pane-accuracy and open the PR.

### Acceptance

- A round with no records is not drawn.
- Attempt pills of every role show green for a valid finished result, red for failed/blocked/cancelled, dashed while running, grey when unknown.
- Worker, planner, researcher, diagnostician and reviewer roles are recognised; the coordinator records one attempt per delegated actor so it appears.
- An initiative is marked touched only by real record reads/writes, not by an ID or path quoted inside command text.

### Evidence

- 2026-11-13: operator started J001 on its own branch; shared checkout is held by I0014, so a separate worktree is used and the coordinator implements directly (child checkout binding unverified).
- 2026-11-13: operator reported an empty R1 at start, grey worker pills regardless of outcome, missing planner/researcher pills, and I0009 reappearing after a path appeared only in heredoc text.
- 2026-11-13: A001 complete at dac0bd4; bound review V001 FAIL (fixed), V002 PASS on the delta. Checks: snapshot tests, claude plugin test 21/21, check-docs, check-quality PASS.
