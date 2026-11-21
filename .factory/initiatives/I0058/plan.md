# I0058: Process improvements observed during I0057

Type: enhancement

On 2026-11-15 the operator asked to move the triage of the I0057 candidates and the initiatives-pane issues into this initiative, ordered from most to least value. Value is how often the problem was observed and what each occurrence cost. The source is the candidate list in [I0057's plan](../I0057/plan.md), as of its J005 close. Each job is either for the factory, shipped to target projects that may use other languages, or for this repository only. The scope line says which.

Rules carried over from I0057:

- A guard only refuses or informs; it never grants permission, starts work or approves an action.
- Shared rules live in one `tools/` module that the Claude plugin hook and the Pi extension both call. A host that cannot support a guard is recorded as a gap.
- When a guard ships, the Markdown rule it enforces is reduced to a pointer in the same PR.
- When closing each job, the coordinator copies the process deviations its records report into the deferred candidates below.

Sizing follows `.agents/roles/references/planning.md`. Each job is planned here; the operator's direction of 2026-11-15 is to advance them under the standing grant.

Deferred candidates (low value; add a job only after another occurrence):

- `gh issue create` without `needs-triage`; `gh pr merge` without `--match-head-commit` or with `--auto`; a warning at the fourth material brief revision; a pre-commit run of `check-docs` and `git diff --check`.
- `isswf-status` outside a Git root reports a generic error; transient `.git/index.lock` errors in the shared checkout (a commit helper could retry once); `runGit` sets `GIT_CONFIG_GLOBAL=NUL`, so a user's `safe.directory` is ignored on Windows; the review template's profile line has commas, so `parseModel` does not read it; a brief path containing a space is stored from after the space; next-ID does not see uncommitted records in other worktrees; `editFile` does not detect a writer between its check and the rename.
- Capability claims in briefs could be checked against the host's tool schema; a brief that records an operator condition could carry it as an acceptance test.
- From I0057 J002 (V003 known limits and coordinator observations): `coverage` reads only each job's latest review, so a latest record whose base line is a delta base or carries trailing text covers too little (S10; union of every V record's range); the package import-closure check misses multi-line, side-effect and dynamic imports (S11); no test for a review without a base or with an unknown base (S12); delta reviews sent with SendMessage to an existing reviewer bypass the dispatch guard's handoff check; `isswf-record-new` and `isswf-record-check` answer a missing flag with a bare `usage` code; the compaction reminder listed a reviewer dispatch with `brief undefined`; the full `check-quality` fails its coverage step at a candidate until the covering review record is committed, so it must run at the head that holds that record.
- From I0062 J002 (test value): once a record shows a new test without justification or a test request without a classification, check mechanically that each test file the diff adds is named in the attempt's test-justification field and that each review finding requesting a test is marked `blocking` or `suggestion`. Per-case checks inside existing files and the quality of a justification stay semantic.

## J001

- Status: in-progress
- Size: M (two related flows: recording a child's reads and commands, and comparing them with its brief)
- Scope: factory.
- Objective: Resource consumption and checks run become observed rather than self-reported, and the initiatives pane shows them without `unknown`.
- Depends on: None
- Brief: [brief-r5.md](jobs/J001/brief-r5.md)
- Blocker: None.
- Next step: Worker adds the commit-SHA record rule and the read-and-edited fix (brief r5).

### Acceptance

- For each child run, the hooks record which files it read and which commands it ran, on Claude Code and Pi, or the gap is recorded per host.
- At attempt close, the brief's selected skills and required references are compared with the observed reads, and a missing one is reported.
- A check that an attempt record reports as run names the commit it ran at, and an observed command run supports it.
- A branch head offered for integration carries a verification stamp: the job-tier checks observed for that commit, recorded by a tool, not typed by the writer; records-only commits on top inherit the stamp below them.
- An integration gate (merge of a branch, push of a non-main branch, PR creation) reads the stamp and has three modes: `off`, `observe` (notes what it would refuse) and `enforce` (refuses an unstamped head). The project setup at the base selects the mode; the default is `observe`.
- The pane's Agents tab names each run's role, distinguishes an unresolved transcript from a run that used nothing, and lists host guides apart from references.

### Evidence

- 2026-11-15: J005 A003 reported `host-portability` as passing, but it was not run at the candidate, where it fails (I0057 J005 V002).
- 2026-11-15: J003 A003 declared no deviations although required references were unread (I0057).
- 2026-11-17: verification practice of the Claude Code team ("stamp and gate commits", observe/enforce modes) adopted as the target for this job by the operator.
- 2026-11-15: the operator saw `unknown` roles, `skills: unknown` and host guides under references in the pane (`tools/isswf-run-usage-core.mjs:152-158`; `hooks/register.tsx` groups by record role).
- 2026-11-21: operator: after closing I0063, do all of I0058 starting with J001; the stamp and commit gate make the per-branch `isswf-verify --tier job` run deterministic (the coordinator skipped it in the I0063 pilot).
- 2026-11-21: research (brief r1, researcher run, read-only) proposed seven units: pane fixes, role source, transcript-based observation, brief comparison, stamp, gate, SHA record rule. Operator chose the stamp at branch integration (batching model). Gate mode default observe.
- 2026-11-21: acceptance reworded from per-commit stamp and commit gate to branch-head stamp and integration gate, per the operator decision (V001 F7).
- 2026-11-21: stamp and integration gate PR #376 merged as dc9b8156a303f1a4593f1f1c566bf33c67c798cf after green CI on 9b88988e047f0f33daee3b7bb8d0642a3c82f96c. Attempt A001 (correction 1). Reviews: V001 inconclusive (F1 mode at HEAD, F2 gh/merge forms, F3 state dir; fixed), V002 inconclusive, resolved by coordinator run of the gate test at 06154b88 (exit 0). Coordinator-observed TDD RED 7c310855 exit 1, GREEN 22d18ef6 exit 0. Known limits: live Pi and Claude hook paths unobserved; V002 N1 HEAD fallback wording, N2 wording. Operator: J001 alone, later work in batches.

## J002

- Status: completed
- Size: S (one flow)
- Scope: factory.
- Objective: When a job closes, the coordinator is told which job to start next.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #348.

### Acceptance

- At a job close, a tool derives the next eligible job from the plan's statuses and dependencies and prints it. A blocked job, a job waiting on an operator-only decision, or an empty result is stated as such.
- The coordinator skill points to it instead of a prose rule.

### Evidence

- 2026-11-15: after a merge the coordinator stopped and asked whether to continue, although the standing grant covered it (operator: "el avanzar con los jobs no es algo que necesite de mi").
- 2026-11-17: merged in #348 (V003 pass after V001/V002 fixes).

## J003

- Status: in-progress
- Size: S (one flow)
- Scope: factory.
- Objective: An in-progress job with a committed brief and no recorded launch is caught before the turn ends.
- Depends on: None
- Brief: [brief-r2.md](jobs/J003/brief-r2.md)
- Blocker: None.
- Next step: Worker implements the turn-end warning (brief r2, batch 2).

### Acceptance

- At turn end, a job that is `in-progress` and has a committed brief, with no attempt record and no accepted dispatch for that brief, produces a warning on Claude Code and Pi, or the gap is recorded per host.

### Evidence

- 2026-11-14: a brief was committed and its job set in-progress, and the turn ended without a dispatch (I0057 candidates).
- 2026-11-21: research (brief r1): Claude `turn.complete` (main loop, `$.ui.status`), Pi `agent_settled` (`ctx.ui.setStatus`); candidate jobs from `parsePlan`, brief committed at HEAD as the dispatch guard checks, attempts by `A###.md`, dispatches from the session assignments (cap 5). Coordinator decisions for r2: only after coordinator activation; per brief revision; once per job-revision per session; skip aborted and error turns. Gaps: live display unobserved on both hosts; dispatches forgotten past the cap or a restart give a false warning.

## J004

- Status: completed
- Size: S (one flow)
- Scope: factory.
- Objective: A read-only child that runs in parallel with a writer reads its pinned base, not the moving working tree.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #377 (b0042ca2, V002). Known limits: base-worktree route documented, not run live; Pi project overrides need setup reconciliation (F5); ES "separado" and "read-only" wording (V002 N1, N2) go to J008 unit 1.

### Acceptance

- The researcher and planner profiles, and their host entries, read sources at the brief's base through the Git evidence tools or an equivalent, when a writer is active in the same checkout.
- A source read from the working tree is reported as such.

### Evidence

- 2026-11-15: I0057 J007 A001 and J002 A001 read the shared checkout while a worker committed, so their sources could differ from their base.
- 2026-11-21: operator accepted the batch distribution: batch 1 J004 and J001 pane; batch 2 J003, J007, J008.

## J005

- Status: completed
- Size: S (one flow)
- Scope: factory.
- Objective: Plan edits are fully scripted and verified before they are committed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #344 (f3d81d2); known limits recorded in Evidence for a follow-up.

### Acceptance

- `tools/isswf-plan-edit.mjs` can set a job's `Brief:` field.
- A commit that changes a plan is refused unless `isswf-status` reads the plan back as `observed`.

### Evidence

- 2026-11-15: every brief revision in I0057 changed the `Brief:` line with `sed`.
- 2026-11-14: a records commit chained after a failed scripted edit still ran (I0057 candidates).
- 2026-11-16: J005 V002 pass (V001 F1 fixed). Known limits deferred to a follow-up: the working-tree mode is chosen too broadly (`cd <repo> && git commit`, other broken plans, untracked new plans, `-qm` clusters), and edits earlier in the same call are not seen; the guard fails open and CI's plan check still runs.

## J006

- Status: completed
- Size: S (guidance only, unless a mechanism exists)
- Scope: factory.
- Objective: Long background work that the host stops under memory pressure is noticed and resumed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #347.

### Acceptance

- The coordinator guide says how to notice and resume a stopped CI wait or full check, or a hook reports it.

### Evidence

- 2026-11-15: Claude Code stopped a worker's full check and the coordinator's CI wait for low memory, and the work waited until someone looked.
- 2026-11-17: merged in #347 (V002 pass). Known limit: a worker's own stopped check is not covered.

## J007

- Status: in-progress
- Size: S (consolidation)
- Scope: factory.
- Objective: Each shared fact has one source in code.
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: Worker consolidates the three shared facts (brief r1, batch 2).

### Acceptance

- The reviewer's model comes from one source for `tools/isswf-review-launch.mjs` and the dispatch guard.
- One record-path classifier replaces `isRecordPath` and `RECORD_PATH`.
- One trusted-Git locator replaces the copies in `tools/isswf-record-new.mjs` and `tools/isswf-review-launch.mjs`.

### Evidence

- 2026-11-15: I0057 J007 A001 and V001, and J002 A001.

## J008

- Status: in-progress
- Size: M (two related flows: one canonical definition per contract field, and a search for old statements)
- Scope: factory.
- Objective: A changed contract leaves no stale statement in any packaged text.
- Depends on: None
- Brief: [brief-r3.md](jobs/J008/brief-r3.md)
- Blocker: None.
- Next step: Worker writes canonical definitions (brief r3, batch 2); unit 2 merged in #377.

### Acceptance

- Each record field's definition has one canonical source, and its key phrases are asserted by a test.
- A change to a documented contract comes with a mechanical search of every packaged text for the old statement.

### Evidence

- 2026-11-14: a wording correction dropped part of a contract definition and the phrase tests passed (I0057 J008 V002 F4).
- 2026-11-14: statements of a tool's old behaviour survived the first correction (I0057 J001 V001 F1, V002 F6).
- 2026-11-21: research (brief r1) found definitions repeated across templates, roles, skills, host guides and docs; split into unit 2 (package-wide stale-statement search, S, now) and unit 1 (canonical definitions, M, after J004: shared files).

## J009

- Status: completed
- Size: S (one flow)
- Objective: A change cannot edit the review rules that judge it: the handoff reads the review guide from the base, not the candidate.
- Depends on: None
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #352.

### Acceptance

- The handoff records REVIEW.md from the base commit, and a candidate that changes REVIEW.md is flagged in the envelope as needing a person.
- The reviewer prompt and docs name the base revision of the guide.

### Evidence

- 2026-11-17: `tools/isswf-handoff.mjs:96` reads `REVIEW.md` at the candidate; the Claude Code team reads it from the base so a change cannot modify its own judge.
- 2026-11-17: J009 V001 pass. Known limits: no handoff test for a guide absent at the base (S3); a delta round reads the guide at its new base, so a round-1 edit is not re-flagged (I1); the copy is UTF-8-decoded (I2); the guard does not require the review-guide line.

## J010

- Status: completed
- Size: S (one flow)
- Objective: A test file that no check runs is caught before review.
- Depends on: None
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #350.

### Acceptance

- check-quality fails when a tests/*.mjs file (outside tests/support/) is run by neither check-quality nor the CI workflow, and names it.
- check-quality runs ESLint and Knip with the CI commands when their tools are installed, or says it skipped them.

### Evidence

- 2026-11-17: I0058 J002 V001 (a new test ran in no check) and V002 (an unused import only CI's ESLint caught).
- 2026-11-17: J010 V001 pass. Known limit: a test mentioned only by another unrun test counts as run (V001-S2).

## J011

- Status: in-progress
- Size: S (one flow)
- Objective: Batch-2 follow-ups: a job's records cannot be written outside its assigned worktree, and missing tests are added.
- Depends on: None
- Brief: [brief-r1.md](jobs/J011/brief-r1.md)
- Blocker: None.
- Next step: Worker adds the record-location guard and missing tests (brief r1).

### Acceptance

- A worker's attempt or review record written in a checkout other than its `checkout:` binding is refused or flagged by a check.
- Tests assert the researcher and planner tools lists lack Write, Edit and Bash; the review launcher's `--project`; the handoff refusing an incomplete first reviewer spelling.

### Evidence

- 2026-11-21: J008 A002, J003 A001 and J007 A001 were written in the primary checkout; J008 V004 N2; J007 V002 F6, F8.
- 2026-11-21: J003 V001-V002, J007 V001-V002 and J008 V003-V004 state a reference-application outcome their reviewers did not report (J012 V002 D1); correct with a coordinator note.

## J012

- Status: completed
- Size: S (one flow)
- Objective: The number of workers running at once is bounded by a per-machine limit that setup asks for.
- Depends on: None
- Brief: [brief-r2.md](jobs/J012/brief-r2.md)
- Blocker: None.
- Next step: None; merged in #379 (V001, V002, V003).

### Acceptance

- Setup asks for the maximum number of parallel workers, default 2, stored with `git config --local isswf.maxParallelWorkers` (never committed, shared by worktrees); absent or invalid means 2.
- The dispatch guard counts open worker entries in a ledger under the Git common directory; `observe` mode (default) allows with a note, `enforce` refuses with `parallel-limit`.

### Evidence

- 2026-11-21: four parallel workers made job-tier verify take 6-7 min, timed out isswf-verify at 180 s and Claude Code stopped background shells for low memory. Operator: default 2, a local per-machine limit.
- 2026-11-21: brief r1 research: Claude background completion is documented (turn.complete with agentId) but unobserved; Pi async completion observed on Linux only; local answers use git config --local. Decision: per-clone limit, observe mode by default.
- 2026-11-21: merged in #379. V002 pass after one correction; V003 passed a CI fix (test registered in check-quality). Known limits: completion events and the Claude rmSync close not observed live; parallel launches can exceed the limit in enforce; reviewers, bound reviews, verify runs and SendMessage continuations are not counted.

## J013

- Status: pending
- Size: S (one flow)
- Objective: isSWF's own Git calls and tests never hold the index lock opportunistically or leave fsmonitor daemons running, and a check keeps it that way.
- Depends on: None
- Brief: [brief-r1.md](jobs/J013/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Write brief r1 after J001 r5 and J011 (2-worker limit).

### Acceptance

- Every Git call made by the hooks, guards and pane (Claude and Pi) runs with `GIT_OPTIONAL_LOCKS=0`, and a test fails when a hook or guard Git runner omits it.
- Test fixture repositories are created with `core.fsmonitor=false` through a shared helper, and a check fails when a test creates a repository without it.
- A Windows check runs the job-tier tests and observes that no new `git fsmonitor--daemon` process is left alive, reporting any it finds.

### Evidence

- 2026-11-21: `index.lock` blocked coordinator commits in the primary checkout four times; global `core.fsmonitor=true`; read-only Git without `GIT_OPTIONAL_LOCKS=0` may refresh the index (only `tools/git-evidence.mjs` sets it). 38 `git fsmonitor--daemon` processes were alive (killed by the operator's go), and Claude Code stopped background shells for low memory. The Engram Stop hook runs Git only in its own repository and is not the cause.
