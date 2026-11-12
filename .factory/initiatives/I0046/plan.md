# I0046: Initiatives side pane mod for Claude Code

Type: enhancement

Design approved by the operator on 2026-11-11 in the Claude Code session (mockup artifact since deleted; local copy outside the repo). Roadmap: Claude Code mod, shared host-neutral snapshot, plugin integration. The Pi sidebar and loopback panel retirement live in I0047. Sizing rule: each job is one concern, about 30-45 worker minutes and a diff a reviewer can assess in one sitting (roughly 300 changed lines or less, excluding fixtures). Supersedes I0032 (earlier unstarted plan for the same mod, removed 2026-11-12 by operator decision; retrievable from commit b1161ad). Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Status: completed
- Objective: Write a host-independent reader that turns initiative records into one JSON snapshot, inside the prototype mod folder outside the isSWF repository.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None for J001. J002 needs an explicit operator start.

### Acceptance

- Snapshot lists non-completed initiatives with id, name, jobs (status, issue/PR from delivery records), rounds R1..Rn per job and one entry per A/V record with role and verdict (passed, changes requested, running).
- Data comes only from records regardless of when or in which session the work ran; no transcript or launch-event correlation; reads .isswf/ and legacy .factory/ without writing.
- Values the records do not state are explicit unknown, never inferred.
- Pure module with no Claude or Pi dependency; fixture tests built from real I0045 records pass.

### Evidence

- Worker A001 (native isswf-worker, model inherited, effort not observed) wrote lib/snapshot.mjs, bin/snapshot.mjs and node:test fixtures (real I0045, I0009 J029/J030; synthetic in-progress, unopened, malformed) in the session dev-mods isswf-pane folder outside the repository; no repository writes.
- Coordinator rerun on Linux 2026-11-12: node --test 12/12 pass; CLI against this repository lists I0009 and I0046 as open and I0014, I0032, I0047 as unopened, I0045 excluded.
- Limits: model/role often unknown because records lack labelled lines (addressed by J004/J005); Windows not run; 1 MB skip untested; no A001 record written because the brief forbade state writes, report transcribed here.

## J002

- Status: pending
- Objective: Render the J001 snapshot as the Claude Code mod pane, shown only in coordinator sessions.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Awaiting J001 and explicit operator start.
- Next step: Operator starts J002 after J001.

### Acceptance

- One card per active initiative (touched by the coordinator in this session, plus `/initiatives pin`) with dot, total time, closed/total jobs, pending count; coordinator row; rounds with pills; one card for unopened initiatives by number and name; completed initiatives hidden.
- Hover detail shows whatever the snapshot carries and unknown otherwise; hover is style-only, so all values are precomputed.
- Appears only after the isswf-coordinator skill loads; no prompt/context change, no model calls; event-driven refresh with debounce and a slow fallback timer.
- `claude plugin validate` and `claude plugin test` pass; no writes to the isSWF repository or state directories.

## J003

- Status: pending
- Objective: Move the snapshot reader into isSWF as a packaged host-neutral tool with a versioned JSON contract.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Awaiting J002 and explicit operator start.
- Next step: Decide from J001-J002 findings whether it extends isswf-status or is a separate tool.

### Acceptance

- Documented snapshot contract with schema version; unknown or malformed records degrade to explicit unknown fields.
- Focused tests with fixtures pass on Linux and Windows CI; packaging allowlist and en/es docs updated together.

## J004

- Status: pending
- Objective: Make the coordinator record one fixed `Run:` line with the host launch identity in each A/V record.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: Awaiting J003 and explicit operator start.
- Next step: Operator starts J004.

### Acceptance

- Coordinator skill and Pi/Claude host guides state the line (`claude agent=<id>`, `claude session=<id>`, `pi child=<id>`), copied literally from the launch tool result; no interpretation or extra model calls.
- Snapshot reader parses the line; records without it keep working with unknown usage.
- en/es docs equivalent; check-docs and focused tests pass.

## J005

- Status: pending
- Objective: Resolve `Run:` identities to usage with the existing token-native readers, including cost in USD.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: Awaiting J003 and explicit operator start.
- Next step: Operator starts J005; may run in parallel with J004 in an exclusive workspace.

### Acceptance

- Readers report model, tokens, duration and counts of skill loads and `.agents/` reads per run; results cached once per finished run.
- USD from a versioned price table with source and date; unpriced models show unknown; tokens always shown.
- Fixture tests for Claude and Pi inputs pass on Linux and Windows CI.

## J006

- Status: pending
- Objective: Ship the Claude Code pane inside the isswf plugin as an opt-in view consuming the packaged snapshot.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: Awaiting J003 and explicit operator start.
- Next step: Define the opt-in setting.

### Acceptance

- Opt-in per installation; disabled state has no reads, timers or UI.
- Packaged at the plugin release version; validate/test pass; Windows path handling verified; en/es docs updated.
