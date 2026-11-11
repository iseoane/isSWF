# I0047: Pi initiatives sidebar and loopback panel retirement

Type: enhancement

Split from I0046 by the operator on 2026-11-11. Consumes the packaged snapshot from I0046 J003. Same sizing rule: one concern, about 30-45 worker minutes, reviewable in one sitting. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Status: pending
- Objective: Research the supported Pi extension mechanism for a persistent sidebar fed by the snapshot.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Awaiting I0046 J003 (packaged snapshot) and explicit operator start.
- Next step: Assign a read-only researcher.

### Acceptance

- Read-only report naming the Pi API, activation in coordinator sessions, refresh options, Windows/Linux limits and a recommendation or a documented blocker.

## J002

- Status: pending
- Objective: Implement the Pi sidebar rendering the snapshot with the same information as the I0046 Claude pane.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Awaiting J001 and explicit operator start.
- Next step: Operator starts J002 after reviewing J001.

### Acceptance

- Shared snapshot fixtures render equivalent content in the Pi and Claude views.
- Shown only in coordinator sessions; no extra model calls; Linux and Windows evidence; en/es docs updated.

## J003

- Status: pending
- Objective: Retire the loopback panel tools/isswf-panel.mjs once both host views cover its use.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Awaiting J002, I0046 J006 and an operator decision to remove the panel.
- Next step: Compare panel features against both views and list gaps.

### Acceptance

- Gap list reviewed by the operator; no unique capability lost without explicit acceptance.
- Panel code, tests, package entries and en/es docs removed or migrated together; quality checks and CI pass.
