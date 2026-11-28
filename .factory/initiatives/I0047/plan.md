# I0047: Pi initiatives sidebar and loopback panel retirement

Type: enhancement

Split from I0046 by the operator on 2026-11-11. Consumes the packaged snapshot from I0046 J004. Same sizing rule as I0046: every job is S or M, never L. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: in-progress
- Objective: Research the supported Pi extension mechanism for a persistent sidebar fed by the snapshot.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None. I0046 J004 completed; operator start 2026-11-28 ("ponte con el I0047").
- Next step: Delta review of the corrected research note.

### Acceptance

- Read-only report naming the Pi API, activation in coordinator sessions, refresh options, Windows/Linux limits and a recommendation or a documented blocker.

### Evidence

- [Research note](jobs/J001/research-note.md); spec review pending.

## J002

- Size: M
- Status: pending
- Objective: Implement a Pi widget above or below the editor that shows a compact summary of the snapshot (operator decision 2026-11-28): one line per active initiative with its open, blocked and next job, plus unopened initiatives.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Awaiting J001 and explicit operator start.
- Next step: Operator starts J002 after reviewing J001.

### Acceptance

- Shared snapshot fixtures render the compact summary, consistent with the Claude pane's counts, within the 10-entry widget cap with an overflow line.
- The widget survives `/reload` and resume in a coordinator session (latch rebuilt from session entries); it is absent when `setWidget` is missing or the project is not trusted.
- Shown only in coordinator sessions; no extra model calls; Linux and Windows evidence; en/es docs updated.

## J003

- Size: M
- Status: pending
- Objective: Retire the loopback panel tools/isswf-panel.mjs once both host views cover its use.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Awaiting J002, I0046 J008 and an operator decision to remove the panel.
- Next step: Compare panel features against both views and list gaps.

### Acceptance

- Gap list reviewed by the operator; no unique capability lost without explicit acceptance.
- Panel code, tests, package entries and en/es docs removed or migrated together; quality checks and CI pass.
