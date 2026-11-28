# I0067 J001 design note: recovery paths, uncovered interruptions and proposed jobs

- Base and document checkpoint: 93fdbfec69e9f57bf6e10dae2cc06a73e136e31d (detached base worktree, read-only researcher).
- Method: every cited line was read at the base; coverage comes from reading test assertions; no test or check was run. "Untested" means no assertion was found under `tests/`.
- Out of scope: the state-migration phase gap is closed by I0067 J002 (PR #427) and is not proposed again.

## 1. Summary

- Recovered today, with tests: install and migration transactions (dead-owner recovery, bootstrap claims, live-owner refusal), state moves (kill at three boundaries, then recover), integrate reruns after a lost merge response.
- Recovered by code reading only: reboot. The boot-identity branches exist, but no test changes the boot identity.
- Fail-closed and manual by design: plan-write and tools-install claims stay refused until a person deletes the claim.
- Most consequential gap: an interrupted `exec` (Ctrl-C of the installed panel, or a reboot) leaves a lease that blocks `recover`, new initialization, migrate and rollback until someone deletes a file.
- Integrate: failures after the push and after cleanup have no automatic resume; the guide documents manual steps and the rerun path is untested.
- Not handled: nothing ages out parallel-worker ledger entries, and nothing tracks a child process that outlives its launcher.

## 2. Recovery paths in the current code

| # | Path | Covers | Code | Test |
|---|---|---|---|---|
| R1 | Install/migration transaction journal | Crash before the journal record (bootstrap claim), during apply, or before completion; refuses a live owner | `tools/isswf.mjs:267-298`, `:367-393`, `:175-190`, `:169-174` | `tests/release-package.mjs:302-313`, `:316-319`, `:323-326`, `:329-331` |
| R2 | Owner liveness (`ceased`) | Process exit (PID gone or start time changed) and boot change, Linux and Windows | `tools/isswf.mjs:153-168`, `:133-152` | Dead-PID fixtures `tests/release-package.mjs:307`; boot branch untested |
| R3 | Execution lease for `exec` | Normal child exit only; unlinked only on a signal-free exit (`:417`) | `tools/isswf.mjs:399-405`, `:413`, `:211-238`, `:239-242`, `:378`, `:280` | `tests/release-package.mjs:286-290` (lease deleted by hand); interrupted `exec` untested |
| R4 | Inspect blockers | Leases and workers listed as blockers | `tools/isswf.mjs:324-333` | Through R3 |
| R5 | State-move journal and claim | Kill at claim, record or after rename | `tools/state-migration.mjs:50-132`; gate `tools/isswf.mjs:437` | `tests/state-interruption.mjs:56-83`; `tests/release-package.mjs:385-399` |
| R6 | Legacy move guards | Refuses a move during plan-write, tools-install, operation or leases; requires a clean `.factory` | `tools/state-migration.mjs:23-43`, `:92-96` | `tests/release-package.mjs:286-290`, `:402` |
| R7 | Integrate state derivation and resume | State derived on every call; a merged PR resumes; close steps repeat up to the first failure | `tools/isswf-integrate.mjs:91-138`, `:141-196`, `:157-159` | `tests/isswf-integrate.mjs:218-226`, `:227-241`, `:243-253`, `:157`, `:196-212` |
| R8 | Lost merge response | A failed or timed-out merge is followed by a PR re-read | `tools/isswf-integrate.mjs:172-175`, `:25-32` | `tests/isswf-integrate.mjs:227-241` |
| R9 | Lost CI result | Stateless re-read; an error makes `ciGreen` false | `tools/isswf-integrate.mjs:124-135` | Not read (`tests/isswf-ci-state.mjs` exists) |
| R10 | Plan-write claim (fail-closed) | Refuses while `.plan-write` exists | `tools/isswf-plan.mjs:66-96` | `tests/plan-publication.mjs:42-85`; `tests/initiative-plan.mjs:44, 57`; `tests/platform-package.mjs:110-113` |
| R11 | Plan edit | Synced temp file, SHA check, rename; directory sync on Linux only | `tools/isswf-plan-edit.mjs:18-57` | `tests/isswf-plan-edit.mjs` (assertions not read) |
| R12 | Tools-install claim (fail-closed) | Refuses a held `.tools-install` | `tools/factory-package.mjs:538-548` | `tests/factory-tools-install.mjs:21` |
| R13 | Parallel-worker ledger | Opened before the child, settled on return, closed on `turn.complete` | `tools/isswf-parallel-workers-core.mjs:91-130`; `hooks/register.tsx:614-624, 727, 743, 748, 834-838` | `tests/isswf-parallel-workers.mjs:71-106`; `tests/isswf-dispatch-guard.mjs:113-119, 620` |
| R14 | Dispatch memory and Run identity | Last five accepted dispatches per session persisted to a note | `tools/isswf-compaction-core.mjs:6-66`; `tools/isswf-launch-notes.mjs:7-13`; `hooks/register.tsx:299-305, 749-758` | `tests/isswf-compaction.mjs:29-50, 201-205` |
| R15 | Post-compaction reminder and undispatched warning | Reminder after compaction; warning for an in-progress job with no attempt or dispatch | `tools/isswf-compaction-core.mjs:88-101`; `tools/isswf-undispatched-core.mjs:20-58`; `hooks/register.tsx:842` | `tests/isswf-compaction.mjs:95-104, 172` |
| R16 | Record guards | Report-only, fail-open on fault; `run-line-missing` | `tools/isswf-record-guard-core.mjs:40-76`; `tools/isswf-record-check-core.mjs:54-63` | `tests/isswf-record-guard.mjs:87-101`; `tests/isswf-record-check.mjs:308-309, 338` |
| R17 | Bound-review trace | `.launch.json` before spawn; record derived from the stream | `tools/isswf-review-launch.mjs:75-144` | `tests/isswf-review-launch.mjs:143-155`; truncated trace untested |
| R18 | Retained legacy recovery | Runs under the retained runtime, absent from the package | `tools/isswf.mjs:191-238` | `tests/release-package.mjs:36` |

## 3. Interruptions not covered, or covered only by hand

| # | Interruption | Realistic trigger | Consequence today |
|---|---|---|---|
| U1 | Launcher killed during `exec` | Ctrl-C on `isswf exec -- isswf-panel`, or a reboot while a tool runs | The lease stays; `recover` refuses at `tools/isswf.mjs:378`, and initialization, migrate and rollback refuse at `:280`. The only remedy is deleting `.isswf/local/leases/<id>.json`; there is no signal handler. |
| U2 | Tool child outlives its launcher | Same trigger; the child can be a writer (`isswf-plan`, `isswf-response`, `isswf-intake`) | The lease records only the launcher identity (`:405`), so isSWF cannot tell whether the writer lives. Reclaim needs decision D1. Inferred, not observed. |
| U3 | Reboot during an install or state transaction | Power loss after the claim | By code a boot change makes `ceased` true (`:158`, `:164`); Windows Fast Startup is inferred to be caught by the process-absent branch. No reboot test. |
| U4 | Reboot or kill inside a plan write or tools install | Between `tools/isswf-plan.mjs:73` and `:94`, or `tools/factory-package.mjs:539` and `:548` | Plan prepare and revise refuse until the claim is deleted by hand; `install-tools` fails with a raw EEXIST outside its try. No data loss (publication by rename). |
| U5 | Integrate push failed or its response was lost | The remote base moved between fetch (`tools/isswf-integrate.mjs:96`) and push (`:186`), or a network drop | Unpushed close commit: `state` still says merged and a rerun refuses `primary-diverged` (`:162`); pushed: `already-closed`. Both need manual git. Rerun untested. |
| U6 | Worktree or branch removal failed after push | Crash after push, or a Windows lock on the worktree | Rerun answers `already-closed`; the worktree and branch remain; manual cleanup. Untested. |
| U7 | Merge accepted but unconfirmed, or merged then killed before the close | Merge queue or auto-merge (`:175`), or a kill between `:172` and `:186` | The plan stays in-progress; status does not read PR state and the undispatched warning skips jobs with an attempt. Only an `integrate` or `state` rerun surfaces it. Merged-then-killed untested. |
| U8 | Bound review killed mid-stream | Kill or reboot during `claude -p` | A partial last trace line makes `record()` throw (`tools/isswf-review-launch.mjs:114`): no complete flag, no Run identity; the child PID is not recorded. |
| U9 | Parallel-worker entry never closed | Session killed during a background worker, or a missed `turn.complete` | The entry counts against the limit; `startedAt` never ages it; manual `clear`. |
| U10 | Pi restart during a subagent | Pi restarts between `tool_call` and `tool_result` | The in-memory map loses the entry, which stays open; Pi dispatches never reach a note, so `run-line-missing` cannot apply to Pi records. |
| U11 | Fresh Claude session after a crash | New session with no prior note | No reminder and no undispatched warning; the coordinator must reload and reconcile. Documented, manual. |
| U12 | More than five dispatches before compaction | Long session | The reminder lists five; older IDs survive in notes and records. Low. |
| U13 | Kill during the plan-edit temp write | Between `tools/isswf-plan-edit.mjs:50` and `:54` | Stray temp file; plan untouched; no sweep. Low. |
| U14 | Damaged lease or worker record | Partial write | `activity()` parses outside its try (`tools/isswf.mjs:218`), so `inspect`, `idle` and `recover` fail with a parse error, not a named blocker. Low. |
| U15 | Power loss on Windows | Hard stop after rename | No directory flush on Windows; documented limit (`docs/durable-work.md:31`). Decision D6. |
| U16 | Guard fault | Exception in a record or parallel-limit guard | Fail-open by design. Decision D7. |

## 4. Proposed jobs, ranked by impact and cost

| Rank | Job | Gaps | Impact | Size | Decision needed |
|---|---|---|---|---|---|
| 1 | P1: an `exec` lease reflects a live tool, not only the launcher | U1, U2 | High | S | No; reclaim is D1 |
| 2 | P2: test the reboot branch of the ownership checks | U3 | Medium | S | No |
| 3 | P3: tested and visible integrate rerun outcomes | U5, U6 | Medium | S | No; automatic push is D2 |
| 4 | P4: stale claims carry an owner verdict (diagnostic only) | U4 | Low to medium | S (M if the identity helper is extracted) | No |
| 5 | P5: tolerate a truncated bound-review trace and record the child PID | U8 | Low to medium | S | No |
| 6 | P6: age the parallel-worker ledger | U9 | Low | S | No; no automatic removal |
| 7 | P7: durable merge intent before `gh pr merge` | U7 | Medium | M | Yes, D3 |

- P1: record the child PID and tool name in the lease (`tools/isswf.mjs:399-405`); a SIGINT handler waits for the child before removing the lease; `activity()` tolerates parse errors and reports each lease with the owner's `ceased` verdict without clearing it. Acceptance: `inspect` shows a ceased owner's verdict; `recover` refuses with a named reason; an interrupted `exec` whose child honours the signal leaves no lease. Windows handles SIGINT only and needs a console check.
- P2: fixtures with a live PID but a different boot identity; assert `ceased` is true and `recover` and `recover-state` proceed; a fabricated boot time on Windows. Land after J002 or keep to the `ceased` boundary.
- P3: reruns after a failed push (`primary-diverged`) and a failed removal (`already-closed`); `state` reports merged with a local-divergence reason; refusals name the exact manual step. No automatic push.
- P4: write the owner identity into the `.plan-write` and `.tools-install` claims; `read` and the refusal report the ceased verdict; claims are never cleared.
- P5: parse the trace per line, flag a partial last line, keep the run identity from the init event, and write the child PID into `.launch.json`. Acceptance: a partial last line gives `complete: false`, `truncated: true` and the run identity.
- P6: show the `startedAt` age in `list` and the limit note, and mark old entries as possibly stale. No automatic removal.
- P7 (after D3): write a local `merge-requested` intent before `gh pr merge`, clear it on close, and let `state` show "merge requested, outcome unconfirmed"; status makes no GitHub call.

## 5. Decisions for the operator (no job proposed)

- D1. Reclaim of a stale `exec` lease whose launcher ceased but whose tool may still run: never reclaim (the operator deletes it after checking); reclaim only when a recorded child identity has ceased (after P1); or an explicit operator-confirmed command.
- D2. Automatic push on an integrate rerun: keep manual (P3 only), or allow it when the commit equals the one the plan edit produced.
- D3. A durable merge intent visible in status (P7), with no GitHub call.
- D4. Durability of Pi dispatch memory across restarts, or documented host-memory-only behaviour.
- D5. Process supervision (a child registry or kill path for `claude -p`, `exec` children and background workers). This is a new runtime; `docs/durable-work.md:3` adds no process-recovery guarantee.
- D6. Windows power-loss durability: accept the documented limit or require another publication mechanism.
- D7. Fail-open advisory guards: keep fail-open or fail closed for record writes.

Not proposed: pollers or timers for merge queues (`docs/durable-work.md:103`), and the compaction bound of five (U12).

## 6. Limits

- No test or check was executed; coverage is from reading assertions. Not read: `tests/isswf-undispatched.mjs`, `tests/isswf-plan-edit.mjs`, `tests/isswf-ci-state.mjs`, `tests/state-migration-publication.mjs`.
- Reboot behaviour, child survival and Windows Fast Startup come from code reading and Node semantics; none was observed.
- The inventory covers the brief's paths plus those found while tracing them; it is not an exhaustive audit.
- Researcher: Claude Code `isswf:isswf-researcher`, requested `haiku`/`high`, self-reported model claude-haiku-5-5; run a6df5208bca6fd527.
