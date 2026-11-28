# I0047: Pi initiatives sidebar and loopback panel retirement

Type: enhancement

Split from I0046 by the operator on 2026-11-11. Consumes the packaged snapshot from I0046 J004. Same sizing rule as I0046: every job is S or M, never L. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: completed
- Objective: Research the supported Pi extension mechanism for a persistent sidebar fed by the snapshot.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None. I0046 J004 completed; operator start 2026-11-28 ("ponte con el I0047").
- Next step: None.

### Acceptance

- Read-only report naming the Pi API, activation in coordinator sessions, refresh options, Windows/Linux limits and a recommendation or a documented blocker.

### Evidence

- [Research note](jobs/J001/research-note.md); spec review [V001](jobs/J001/V001.md) fail, correction [A001](jobs/J001/A001.md), [V002](jobs/J001/V002.md) pass.

## J002

- Size: M
- Status: in-progress
- Objective: Implement `tools/isswf-initiatives-pi-extension.mjs`: a string-array Pi widget below the editor with a compact summary of the snapshot (J001 research note, operator decisions 2026-11-28): one line per started initiative with its blocked count, open count and next job, a line for unopened initiatives and an overflow line, within the 9 of Pi's 10 widget entries.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None. Operator start 2026-11-28 ("Coordinador encárgate de la iniciativa"); integration of tools/factory-package.mjs and tools/build-release.mjs still needs the operator's approval.
- Next step: Dispatch the worker.

### Acceptance

- Fixtures render the compact lines with the Claude pane's counts (blocked; open = neither completed nor blocked) and the next job, within 9 lines with a `+N more initiatives` line and an unopened line.
- The widget is set only when `ctx.mode` is `tui`, `ctx.isProjectTrusted()` is true, `ctx.ui.setWidget` exists and the coordinator is active; otherwise nothing is shown and no project record is read.
- On `session_start` (`/reload`, resume) the latch is rebuilt from `ctx.sessionManager.getBranch()`, matching the stored `<skill name="isswf-coordinator"` block or a `read` tool call of the coordinator `SKILL.md`; entries in the stored form are tested.
- Refresh on `agent_settled`, on a `tool_result` of a mutating tool and every 60 s; the timer is cleared on `session_shutdown`. No model calls.
- Wired in `package.json` `pi.extensions`, `nativePiResources` and the release validators; en/es docs updated; focused test, documentation check and `git diff --check` clean; Linux and Windows evidence stated honestly (no live Pi UI observed).

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
