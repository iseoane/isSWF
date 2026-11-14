# I0055: Initiatives pane responsiveness

Type: enhancement

Operator feedback 2026-11-14 on Windows: every press in the Claude Code initiatives pane (hooks/register.tsx) takes noticeably long before the pane reacts. Scheduled after I0009.

## J001

- Status: pending
- Objective: A press that only changes pane view state (fold, unfold, record detail, tab) redraws without re-reading the project's state records; the snapshot is re-read only when records may have changed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Start after I0009, on operator request.

### Acceptance

- Measure press-to-redraw latency and snapshot fs calls before and after on native Windows, and check Linux; report numbers, not impressions.
- View-only presses perform no state-record reads; plan or record changes still appear within the existing refresh bounds, with no stale-state claims.
- Unparseable plans, missing state and the pinned/touched rules behave as today; focused pane tests cover the cache invalidation.

### Evidence

- 2026-11-14: every ui.render calls readSnapshot over the whole state (hooks/register.tsx:546). On this Windows checkout (50 initiatives, 632 Markdown records) one direct Node read takes about 700 ms and 987 fs calls; the pane routes each call through the host engine, adding per-call overhead not yet measured. Linux not measured.
- 2026-11-14 operator idea: avoid reading closed initiatives at all, for example through a prior index of live versus closed initiatives. Coordinator note: readSnapshot already discards fully completed initiatives, but only after reading every job directory and record (tools/isswf-snapshot-core.mjs:233-236). Compare two options: decide from plan.md alone before opening job directories (no new persisted state), or a persisted index (a second status store that can drift from the plans, which AGENTS.md discourages). Measure both against the cache.
