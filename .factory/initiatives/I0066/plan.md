# I0066: Deterministic run-identity control and retrospective follow-ups

Type: enhancement

On 2026-11-22 the operator saw that the Claude Code initiatives panel showed no worker runs for I0065. The panel counts a run only from a `- Run: claude agent=<id>` line in an attempt or review record. The coordinator did not pass the launch identity the host returned, so every I0065 worker record and the J001-J003 review records have no such line. `isswf-record-check` reports a malformed `Run:` line but not a missing one. The operator decided that this must be a deterministic control, not a retrospective note, and asked for a new initiative. It also holds a retrospective of the work done on 2026-11-21 and 2026-11-22; the operator decides which of its findings become further jobs here.

Order: starts after I0065 closes. Execution order (2026-11-26, at most two in parallel, paired so they do not touch the same files): done J001 + J007, J003 + J006; now J016 + J005 (both touch isswf-integrate; J005 rebases after J016); J005 now with J004 (Windows speed, operator 2026-11-26); J008 after J005; J017 after J005; J009 + J013; J010; the panel jobs J014, J011, J015 one at a time (all touch hooks/register.tsx and the panel), each paired with a non-panel job left; J012 only if needed.

## J001

- Status: completed
- Objective: An attempt or review record for a host launch that returned a run identity cannot be completed or pass the record check without the matching `Run:` line, and the coordinator gets a refusal that names the missing line.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Completing (`isswf-record-new complete`) or checking an attempt or review record for a brief with a recorded accepted launch that has a run identity fails when the record has no matching `Run:` line. Records from a coordinator acting as writer, and launches whose identity the host did not return, are not refused.
- Tests cover both refusal cases and the two exceptions.
- It works on Windows and Linux in Claude Code. Pi equivalence is checked, or its absence is recorded as an explicit limit.
- If the panel does not show runs whose records are only in a linked worktree, that is either fixed here or recorded as a separate job (recorded as J015).
- Operator decision 2026-11-26: the refusal applies at `complete`, not `create`, because a worker creates its record before the coordinator knows its run identity.

### Evidence

- PR #405 merged as cca6e752c8bfccb6df94649131fda974ce906262, CI green on head d99dd3b5. Reviews V001 inconclusive (no blockers), V002 pass. Known limits: Pi keeps no dispatch notes; notes keep the last 5 dispatches per session and are not project-scoped; the refusal may name an earlier record launch; the shared message names --run, which only isswf-record-new complete accepts. Panel in linked worktrees: J015.

## J002

- Status: completed
- Objective: A retrospective of the work done on 2026-11-21 and 2026-11-22 (I0055, I0056, I0064, I0065 and their releases) gives evidence-backed improvement drafts for the operator to choose from.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Each finding cites its evidence (record, commit, transcript or guard output) and says whether it can be checked mechanically.
- The operator chooses which findings become jobs in this initiative. Each chosen finding becomes a job with its own acceptance criteria.

### Evidence

- Retrospective `.factory/retrospectives/2026-11-22-session-close.md` (2026-11-22). Operator chose all proposals: J005-J008 added, P5 folded into J003.

## J003

- Status: completed
- Objective: The coordinator integrates a reviewed job through one host-neutral command in `tools/`, called from the coordinator skill, driven by an explicit delivery-lifecycle state machine.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- An integration command checks review coverage and exact-head CI success, merges with the head pinned, records the job close in the plan, pushes that records-only commit, and removes the job worktree and branch. It refuses with a named reason when a check fails, and changes nothing in that case.
- Risk and operator-acceptance judgment stay with the coordinator; the commands never decide them.
- The delivery lifecycle (brief, attempt, review, covered, ci-green, merged, closed) is an explicit state machine in one module. Each command checks the job's current state and refuses an illegal transition with a named reason. The state is derived from the records and Git, not stored separately.
- Tests cover success and each refusal. Works on Windows and Linux; Pi and Claude Code both use it through the skill.

### Evidence

- PR #407 merged as c95b14bbe0740b6158cc9c2ef612a19bb8115708 with operator approval (2026-11-26, grant code under REVIEW.md), CI green on head 56faebe4. Reviews V001 fail (B1-B3), V002 pass, V003 pass (Knip delta). Coordinator ran tests/isswf-integrate.mjs on win32 (124 s). Known limits: closing the last job stays manual; a rerun after a failed push refuses primary-diverged; gh pr merge exit 0 is trusted (merge queues); last-job check not repeated after the merge; rerun docs and the primary-diverged gloss need narrowing; real gh untested.

## J004

- Status: completed
- Objective: The Windows CI job and the local initiative-tier verification on Windows take measurably less time, based on a per-step timing breakdown.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A recorded breakdown names the slowest steps and tests on Windows, compared with Linux.
- Changes cut the Windows wall-clock time without dropping any check or platform coverage; before and after times are recorded.

### Evidence

- PR #412 merged after CI green (portable, ubuntu, windows). Reviews V001 fail, V002 pass at e3e73844. Windows CI (run 45896858512) job 387 s -> 323 s, state-interruption step 98 s -> 60 s, platform-package step 68 s -> 45 s. Local isswf-verify --tier initiative 339.7 s -> 140 s with --jobs (default min(4, CPUs)). Known limits: default-path test needs 2+ CPUs; PID reuse window in state-interruption; isswf-integration-gate git spawn cost left as is.

## J005

- Status: completed
- Objective: A ci-only failure on a reviewed head cannot be integrated without a recorded miss block, and review coverage runs before a candidate is pushed.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- When CI fails on a head that a passing review covered, the integration command refuses until the job records hold a `- Kind: ci-only` miss block for it.
- Review coverage (`isswf-handoff coverage`) runs before push in the coordinator flow, and its failure stops the push.
- Tests cover the refusal and the recorded case.

### Evidence

- PR #410 merged after CI green (portable, ubuntu, windows); reviews V001 fail, V002 fail, V003 pass at dd18b510; push-time coverage on both hosts deferred to J017 (incl. V003 F11 wording)

## J006

- Status: completed
- Objective: On Windows, the initiative close points straight to a passing CI record instead of a local run that cannot pass.
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `isswf-verify --tier initiative` on win32 reports before running that `check-quality` and `dead-code` will be "not run" and that the close gate needs a `source: "ci"` record, and how to write it.
- The plan commit guard refusal names the CI record route first on win32.
- Tests cover both messages.

### Evidence

- PR #406 merged as 57b498a60ff436a8c461a442c7c4afa5e28c8a43, CI green on head 84629b19. Reviews V001 fail (Node global in a hook core, false win32 wording), V002 pass; coordinator ran the verify and guard tests and the hook suite (unchanged versus main). Known limits: job-cost checks limited to other platforms are not in the notice; the OS lookup shares the guards try; no hook test for the win32 wording.

## J007

- Status: completed
- Objective: The plan commit guard checks a newly added plan the same way as a changed one.
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Committing a new plan that `isswf-status` cannot parse is refused.
- Regression test with a new plan file holding an unsafe Brief field.

### Evidence

- PR #404 merged as 6f7c60e1c75d1222cd1a5be9d95e194dd007eb9d, CI green on head f8bfea09. Reviews V001 fail (F1 over-refusal), V002 pass after the coordinator ran the guard test (RED cf292e2f fails, candidate 3ce6785d PASS 38 s). Known limit: any earlier git add lists all untracked plans.

## J008

- Status: completed
- Objective: Planning guidance sizes a semantic rewrite of user-facing pages by its review cost.
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `.agents/roles/references/planning.md` states, with an example, that a rewrite whose review is semantic across two languages is sized L and split.
- Spanish mirrors and glossary unchanged unless a term requires it.

### Evidence

- PR #411 merged after CI green (portable, ubuntu, windows); review V001 pass at d2576bfb (S1, S2 wording not-material)

## J009

- Status: completed
- Objective: The job status reported by `isswf-status` is derived from one shared state machine, and the plan stores only the states no record can reveal.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- One shared module defines the job states and their transitions; `tools/isswf-plan-core.mjs` and `tools/isswf-status.mjs` use it instead of their own string lists.
- `in-progress` and `in-review` are derived from attempt and review records; existing plans with any current value still parse.
- Tests cover each derived state and a plan using every legacy value.

### Evidence

- PR #414 merged; reviews V001 fail, V002-V005 pass; CI green incl. Knip at 3509a6b0

## J010

- Status: completed
- Objective: Each review record declares its round and candidate, and a new round requires a correction attempt after a fail verdict.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `isswf-record-check` refuses a review record whose round does not follow a fail verdict and a correction attempt, or whose candidate does not match that attempt.
- Existing records keep parsing; the panel shows the same rounds for completed initiatives.
- Tests cover the legal sequence and each refusal.

### Evidence

- PR #416 merged; V001 fail (operator chose wide round reading), V002 pass; CI green at 356e7b8f

## J011

- Status: in-progress
- Size: S
- Objective: The panel AutoWakeUp is one explicit state (off, armed, waiting for reset, fired) instead of separate variables.
- Depends on: None
- Brief: [brief-r1.md](jobs/J011/brief-r1.md)
- Blocker: None.
- Next step: Size S (local hook refactor). Ground the variables in `hooks/register.tsx` (resumeOn, resumeTimer, resumeFor, resumeAtMs, noReset).

### Acceptance

- A single state value drives the timer and the label; an invalid combination cannot be represented.
- Behavior is unchanged: 90% threshold, reset +5 min, toggle cancels.
- Tests cover each transition, including cancel and no reset.

## J012

- Status: pending
- Size: M
- Objective: A state migration records its phase in the journal, and recovery reads that phase instead of inferring it from directory names.
- Depends on: None
- Brief: [brief-r1.md](jobs/J012/brief-r1.md)
- Blocker: None.
- Next step: Size M (phase recovery on two platforms). Ground the stage, retired and pending directories in `tools/state-migration.mjs` and the journal in `tools/isswf.mjs`. Lowest priority: do only if an observed failure or J009 needs it.

### Acceptance

- The journal records the phases staged, swapped, retired and done; recovery from each phase is tested.
- Existing interrupted-migration fixtures still recover.
- Works on Windows and Linux.

## J013

- Status: completed
- Objective: A review dispatch is prepared through one host-neutral command in `tools/`, called from the coordinator skill.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J013/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The command generates the handoff, creates the review record with the run identity when known, and prints the prompt lines including the brief path, so the dispatch guard's reference condition is met.
- The review template no longer turns a filled "None." into "None.." (retrospective P5), or the parser tolerates it.
- Tests cover success and each refusal. Works on Windows and Linux; Pi and Claude Code both use it through the skill.

### Evidence

- PR #413 merged after CI green (portable incl. Knip, ubuntu, windows). Reviews V001 fail, V002 pass at 2885f59e. The new command prepared its own V001 and V002. .agents/hosts/** change approved under the operator's standing merge authorization (not HIGH risk: doc reference to the new command). Known limits: RED 00a307d6 was a missing-file failure (disclosed); the attempt template placeholder still ends in a period.

## J014

- Status: completed
- Size: S
- Objective: The Claude Code panel (`tools/isswf-panel.mjs`, `hooks/register.tsx`) shows job status from the J009 shared state machine.
- Depends on: J009
- Brief: [brief-r1.md](jobs/J014/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The panel and hook use the shared module instead of their own status lists.
- Completed initiatives render as before.
- Each job line shows its size after the ID, for example `J005(S) (in-progress) ...`, read from the plan (operator request 2026-11-26); a job without a size shows no suffix.
- Tests cover the derived states in the panel snapshot.

### Evidence

- PR #418 merged after CI green; V001 fail, V002 pass at 5d016c9d; claude plugin test 72/0

## J015

- Status: in-progress
- Size: S
- Objective: The Claude Code initiatives panel shows worker and reviewer runs whose attempt or review records exist only in a linked worktree that has not been integrated yet.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J015/brief-r1.md)
- Blocker: None.
- Next step: Size S. Ground how `tools/isswf-panel.mjs` reads records and how it can find linked worktrees (`git worktree list --porcelain`) without reading unrelated checkouts. Operator split it out of J001 on 2026-11-26.

### Acceptance

- A run recorded only in a linked worktree of the same repository appears in the panel; after integration it is not counted twice.
- Tests cover a record in a linked worktree and the same record after integration.
- It works on Windows and Linux.

## J016

- Status: completed
- Objective: The small follow-ups left by the J001, J003 and J006 reviews are fixed, so their refusals and messages are accurate and their guards cannot be switched off by an unrelated lookup.
- Depends on: J003
- Brief: [brief-r1.md](jobs/J016/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `hooks/register.tsx` reads `OS` so that a failing lookup cannot skip the plan-commit, verification, records-push or integration guards; a hook test with `OS=Windows_NT` sees the CI record route first in the refusal.
- The `run-line-missing` message names `--run` only for `isswf-record-new complete`, not for `isswf-record-check` (EN and ES docs match).
- `isswf-integrate` confirms the pull request is merged (state or ancestry) after `gh pr merge` exits 0, before editing the plan, and refuses with a named reason otherwise; tested.
- The operations guide (EN and ES) describes rerun recovery and `primary-diverged` as the code behaves.
- Tests cover each changed behaviour; Windows and Linux.

### Evidence

- PR #408 merged after CI green (portable, ubuntu, windows); review V001 pass at 96edc459 (F1 plan-step rerun wording known-limit deferred to J005, F2 not-material); operator approved grant-code change 2026-11-26


## J017

- Status: completed
- Objective: The integration gate checks review coverage at `git push` time on both Pi and Claude Code, through a pure coverage core that packaged hooks can import.
- Depends on: J005
- Brief: [brief-r1.md](jobs/J017/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- On Claude Code and Pi, a `git push` of a job branch with commits after the last reviewed candidate is noted in observe mode and refused in enforce mode; a covered push passes; a coverage fault allows the push.
- Every module the hook and the Pi extension import is in the package resources (`tests/package-metadata.mjs` passes).
- The operations guide (EN and ES) no longer describes the push-time check as pending.
- Tests cover both hosts' wiring; Windows and Linux.

### Evidence

- PR #415 merged; reviews V001-V004 pass; CI green at e319faa2

## J018

- Status: completed
- Size: S
- Objective: The Claude Code pane tests in `hooks/register.test.tsx` run on the current Claude Code release, so panel changes can be verified with `claude plugin test .`.
- Depends on: None
- Brief: [brief-r1.md](jobs/J018/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- `claude plugin test .` passes the 39 tests that fail today with `fs.read hook was skipped: test: ENOENT`, on Windows.
- Only test scaffolding changes; production hook behavior is unchanged.
- The cause is recorded in the attempt report.

### Evidence

- PR #417 merged after CI green; V001 inconclusive (AC1 then coordinator-observed claude plugin test 70/0), V002 pass at 8482315f
