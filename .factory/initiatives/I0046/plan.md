# I0046: Initiatives side pane mod for Claude Code

Type: enhancement

Design approved by the operator on 2026-11-11 in the Claude Code session (mockup artifact since deleted; local copy outside the repo). Roadmap: Claude Code mod, shared host-neutral snapshot, plugin integration. The Pi sidebar and loopback panel retirement live in I0047. Sizing rule: each job has a Size line. S = up to about 20 worker minutes and 100 changed lines; M = about 30-45 minutes and up to 300 changed lines (fixtures excluded). L is not allowed: a job estimated L is split before start, and a job that grows past M during work stops and is re-planned. Supersedes I0032 (earlier unstarted plan for the same mod, removed 2026-11-12 by operator decision; retrievable from commit b1161ad). Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: M
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

- Size: S
- Status: completed
- Objective: Render the J001 snapshot as a Claude Code mod pane with static layout: one card per open initiative, rounds with pills, one card for unopened initiatives.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None. Layout accepted by the operator 2026-11-12; follow-ups moved to J003.

### Acceptance

- Cards, jobs, rounds and pills (passed, changes requested, running, unknown) match the approved mockup; completed initiatives hidden; unopened listed by number and name.
- Hover detail shows whatever the snapshot carries and unknown otherwise; hover is style-only, so all values are precomputed.
- `claude plugin validate` and `claude plugin test` pass; no model calls, no prompt/context change, no writes to the repository or state directories.

### Evidence

- Worker A001 (native isswf-worker, model inherited, effort not observed) added .claude-plugin/plugin.json, hooks/hooks.json, hooks/register.tsx, hooks/register.test.tsx and lib/node-fs.mjs; reader now async over an injected file interface. About 280 lines; no repository writes.
- Coordinator rerun on Linux 2026-11-12: claude plugin validate passed with catalog-only warnings; claude plugin test 3/3; node --test 12/12.
- Limits: Windows not run; live hover not observed; usage always unknown until J006; re-reads records on each redraw until J003.

## J003

- Size: M
- Status: awaiting-human
- Objective: Show the pane only in coordinator sessions, give cards only to active initiatives, group the rest, compact completed jobs and refresh on events.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Operator reloads the coordinator skill (or opens a new session) and accepts the live pane or asks for changes.

### Acceptance

- Pane appears only after the isswf-coordinator skill loads in the session.
- Active initiatives (dot) are those whose records the session touched, plus `/initiatives pin <ID>` and unpin.
- Refresh on relevant tool results with debounce and a slow fallback timer; plugin tests cover activation and pin.
- Bottom card "No activas" lists non-active initiatives: started ones with a distinct mark and a short blocked/pending count, unopened ones with number and name only.
- Completed jobs inside a card collapse to one summary line with their count, so a long initiative does not fill the pane.

### Evidence

- Worker A001 (native isswf-worker, model inherited, effort not observed) changed hooks/register.tsx, hooks/register.test.tsx, hooks/hooks.json, .claude-plugin/plugin.json and added types/index.d.ts; about 187 lines; no repository writes.
- Coordinator rerun on Linux 2026-11-12: claude plugin validate passed with catalog-only warnings; claude plugin test 4/4 (gating, touched initiative and grouping, pin/unpin, no state dir); node --test 12/12.
- Limits: not observed live; Windows not run; pin and touch share one list (a later touch re-activates an unpinned ID); blocked count from Status only; records re-read on each redraw.

## J004

- Size: M
- Status: pending
- Objective: Move the snapshot reader into isSWF as a packaged host-neutral tool with a versioned JSON contract.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: Awaiting J003 and explicit operator start.
- Next step: Operator starts J004.

### Acceptance

- Documented snapshot contract with schema version; unknown or malformed records degrade to explicit unknown fields.
- Focused tests with fixtures pass on Linux and Windows CI; packaging allowlist and en/es docs updated together.

## J005

- Size: S
- Status: pending
- Objective: Make the coordinator record one fixed `Run:` line with the host launch identity in each A/V record.
- Depends on: J004
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: Awaiting J004 and explicit operator start.
- Next step: Operator starts J005.

### Acceptance

- Coordinator skill and Pi/Claude host guides state the line (`claude agent=<id>`, `claude session=<id>`, `pi child=<id>`), copied literally from the launch tool result; no interpretation or extra model calls.
- Snapshot reader parses the line; records without it keep working with unknown usage; en/es docs equivalent; check-docs and focused tests pass.

## J006

- Size: M
- Status: pending
- Objective: Resolve `Run:` identities to model, tokens, duration and counts of skill loads and `.agents/` reads with the existing token-native readers.
- Depends on: J005
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: Awaiting J005 and explicit operator start.
- Next step: Operator starts J006.

### Acceptance

- Per-run results cached once per finished run; tokens always shown.
- Fixture tests for Claude and Pi inputs pass on Linux and Windows CI.

## J007

- Size: S
- Status: pending
- Objective: Add cost in USD from a versioned price table.
- Depends on: J006
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: Awaiting J006 and explicit operator start.
- Next step: Operator starts J007.

### Acceptance

- Price table records source and date; unpriced models show unknown.
- Focused tests pass; en/es docs updated.

## J008

- Size: M
- Status: pending
- Objective: Ship the Claude Code pane inside the isswf plugin as an opt-in view consuming the packaged snapshot.
- Depends on: J004
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: Awaiting J004 and explicit operator start.
- Next step: Operator starts J008.

### Acceptance

- Opt-in per installation; disabled state has no reads, timers or UI.
- Packaged at the plugin release version; validate/test pass; Windows path handling verified; en/es docs updated.
