# I0055: Initiatives pane responsiveness

Type: enhancement

Operator feedback 2026-11-14 on Windows: every press in the Claude Code initiatives pane (hooks/register.tsx) takes noticeably long before the pane reacts. Scheduled after I0009.

## J001

- Status: completed
- Objective: A press that only changes pane view state (fold, unfold, record detail, tab) redraws without re-reading the project's state records; the snapshot is re-read only when records may have changed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Measure press-to-redraw latency and snapshot fs calls before and after on native Windows, and check Linux; report numbers, not impressions.
- View-only presses perform no state-record reads; plan or record changes still appear within the existing refresh bounds, with no stale-state claims.
- Unparseable plans, missing state and the pinned/touched rules behave as today; focused pane tests cover the cache invalidation.

### Evidence

- 2026-11-22: merged in PR #385 (0298ab157a9746781b8c81f00321c553956d632c) after review V001 pass and CI success on head 290e78352d0436cd08fae3ec883ae5352ffd1d48. Windows direct read 1156 ms / 1481 fs calls before, 226 ms / 138 after; press 814-1308 ms before, 12-17 ms after. Linux latency not measured. Docs clause (V001 F1) in PR #387.
- 2026-11-14: every ui.render calls readSnapshot over the whole state (hooks/register.tsx:546). On this Windows checkout (50 initiatives, 632 Markdown records) one direct Node read takes about 700 ms and 987 fs calls; the pane routes each call through the host engine, adding per-call overhead not yet measured. Linux not measured.
- 2026-11-14 operator idea: avoid reading closed initiatives at all, for example through a prior index of live versus closed initiatives. Coordinator note: readSnapshot already discards fully completed initiatives, but only after reading every job directory and record (tools/isswf-snapshot-core.mjs:233-236). Compare two options: decide from plan.md alone before opening job directories (no new persisted state), or a persisted index (a second status store that can drift from the plans, which AGENTS.md discourages). Measure both against the cache.

## J002

- Status: completed
- Size: S (one flow)
- Objective: Removing a job worktree leaves no fsmonitor daemon running for it, and a check reports any daemon left behind for a worktree that no longer exists.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The coordinator's worktree removal step, in the coordinator skill or the worktrees reference, runs `git -C <worktree> fsmonitor--daemon stop` before `git worktree remove`. A guard or tool enforces it where that can be checked mechanically.
- A check lists `git fsmonitor--daemon` processes whose worktree is missing, on Windows and Linux. Reuse `tooling/quality/fsmonitor-daemons.mjs` where possible.
- The user's global Git configuration is never changed.

### Evidence

- 2026-11-22: merged in PR #386 (ee8c0e951a5b0d67053c5e5ffea6a94cac47e218) after reviews V001 (changes required: Linux cwd), V002 pass and V003 pass (coordinator digest line, a third round beyond the brief budget, disclosed), with CI success on head af6587c2cd90313b241ec25d9399e1f78e476970. Known limits: Linux path not observed live; relative gitdir or socket paths.
- 2026-11-22: four orphaned `git fsmonitor--daemon run --detach` processes were found and killed. They were created at 21:22, 21:23, 23:31 and 01:37, which matches the I0064 J001, J002 and J003 worktrees. The cause is a global `core.fsmonitor=true` in the operator's `~/.gitconfig`. I0058 J013 covered test fixtures only, not coordinator worktrees.
- 2026-11-22: the operator chose to fix this in the factory, not by changing the global config, and asked for it in the next initiative.

## Close

- Closed 2026-11-22. J001 merged in #385, J002 in #386, the J001 docs clause (V001 F1) in #387 (main 10863944b48a6b267d1632e035689e6ee2b83b8f).
- Full check: `node tools/check-quality.mjs` exit 0 in 1113 s at 10863944b48a6b267d1632e035689e6ee2b83b8f. `node tooling/quality/host-checks.mjs`: host-prerequisites PASS; source-host-isolation SKIPPED locally (host-tests dependencies not installed), covered by CI.
- Known limits carried forward:
  - J001: Linux latency not measured; a change made outside a session tool call can appear up to 60 s late.
  - J002: the Linux orphan lookup is tested with fake `/proc` data only; relative `gitdir` or socket paths can mislead it (V002 N1, N2).
- Process notes: J002 took a third, coordinator-applied review round for a missed `verification.json` digest in `project-setup.md`, beyond the brief's two-round budget. Neither reviewer caught the digest; a check that compares that digest with the file would prevent it.
