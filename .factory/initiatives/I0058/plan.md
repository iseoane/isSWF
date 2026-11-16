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
- Repository only: a `tests/*.mjs` file that no check runs; ESLint and Knip outside `check-quality`.
- From I0057 J002 (V003 known limits and coordinator observations): `coverage` reads only each job's latest review, so a latest record whose base line is a delta base or carries trailing text covers too little (S10; union of every V record's range); the package import-closure check misses multi-line, side-effect and dynamic imports (S11); no test for a review without a base or with an unknown base (S12); delta reviews sent with SendMessage to an existing reviewer bypass the dispatch guard's handoff check; `isswf-record-new` and `isswf-record-check` answer a missing flag with a bare `usage` code; the compaction reminder listed a reviewer dispatch with `brief undefined`; the full `check-quality` fails its coverage step at a candidate until the covering review record is committed, so it must run at the head that holds that record.

## J001

- Status: pending
- Size: M (two related flows: recording a child's reads and commands, and comparing them with its brief)
- Scope: factory.
- Objective: Resource consumption and checks run become observed rather than self-reported, and the initiatives pane shows them without `unknown`.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research why the worker's transcripts are not resolved for the pane, and what each host exposes about a child's file reads and commands.

### Acceptance

- For each child run, the hooks record which files it read and which commands it ran, on Claude Code and Pi, or the gap is recorded per host.
- At attempt close, the brief's selected skills and required references are compared with the observed reads, and a missing one is reported.
- A check that an attempt record reports as run names the commit it ran at, and an observed command run supports it.
- The pane's Agents tab names each run's role, distinguishes an unresolved transcript from a run that used nothing, and lists host guides apart from references.

### Evidence

- 2026-11-15: J005 A003 reported `host-portability` as passing, but it was not run at the candidate, where it fails (I0057 J005 V002).
- 2026-11-15: J003 A003 declared no deviations although required references were unread (I0057).
- 2026-11-15: the operator saw `unknown` roles, `skills: unknown` and host guides under references in the pane (`tools/isswf-run-usage-core.mjs:152-158`; `hooks/register.tsx` groups by record role).

## J002

- Status: pending
- Size: S (one flow)
- Scope: factory.
- Objective: When a job closes, the coordinator is told which job to start next.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Implementation brief.

### Acceptance

- At a job close, a tool derives the next eligible job from the plan's statuses and dependencies and prints it. A blocked job, a job waiting on an operator-only decision, or an empty result is stated as such.
- The coordinator skill points to it instead of a prose rule.

### Evidence

- 2026-11-15: after a merge the coordinator stopped and asked whether to continue, although the standing grant covered it (operator: "el avanzar con los jobs no es algo que necesite de mi").

## J003

- Status: pending
- Size: S (one flow)
- Scope: factory.
- Objective: An in-progress job with a committed brief and no recorded launch is caught before the turn ends.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research the turn-end hook on each host.

### Acceptance

- At turn end, a job that is `in-progress` and has a committed brief, with no attempt record and no accepted dispatch for that brief, produces a warning on Claude Code and Pi, or the gap is recorded per host.

### Evidence

- 2026-11-14: a brief was committed and its job set in-progress, and the turn ended without a dispatch (I0057 candidates).

## J004

- Status: pending
- Size: S (one flow)
- Scope: factory.
- Objective: A read-only child that runs in parallel with a writer reads its pinned base, not the moving working tree.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Implementation brief.

### Acceptance

- The researcher and planner profiles, and their host entries, read sources at the brief's base through the Git evidence tools or an equivalent, when a writer is active in the same checkout.
- A source read from the working tree is reported as such.

### Evidence

- 2026-11-15: I0057 J007 A001 and J002 A001 read the shared checkout while a worker committed, so their sources could differ from their base.

## J005

- Status: in-progress
- Size: S (one flow)
- Scope: factory.
- Objective: Plan edits are fully scripted and verified before they are committed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: Implement under brief r1 (operator start 2026-11-16).

### Acceptance

- `tools/isswf-plan-edit.mjs` can set a job's `Brief:` field.
- A commit that changes a plan is refused unless `isswf-status` reads the plan back as `observed`.

### Evidence

- 2026-11-15: every brief revision in I0057 changed the `Brief:` line with `sed`.
- 2026-11-14: a records commit chained after a failed scripted edit still ran (I0057 candidates).

## J006

- Status: pending
- Size: S (guidance only, unless a mechanism exists)
- Scope: factory.
- Objective: Long background work that the host stops under memory pressure is noticed and resumed.
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research what each host reports when it stops a background command.

### Acceptance

- The coordinator guide says how to notice and resume a stopped CI wait or full check, or a hook reports it.

### Evidence

- 2026-11-15: Claude Code stopped a worker's full check and the coordinator's CI wait for low memory, and the work waited until someone looked.

## J007

- Status: pending
- Size: S (consolidation)
- Scope: factory.
- Objective: Each shared fact has one source in code.
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Implementation brief.

### Acceptance

- The reviewer's model comes from one source for `tools/isswf-review-launch.mjs` and the dispatch guard.
- One record-path classifier replaces `isRecordPath` and `RECORD_PATH`.
- One trusted-Git locator replaces the copies in `tools/isswf-record-new.mjs` and `tools/isswf-review-launch.mjs`.

### Evidence

- 2026-11-15: I0057 J007 A001 and V001, and J002 A001.

## J008

- Status: pending
- Size: M (two related flows: one canonical definition per contract field, and a search for old statements)
- Scope: factory.
- Objective: A changed contract leaves no stale statement in any packaged text.
- Depends on: None
- Brief: [brief-r1.md](jobs/J008/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research where record-field definitions are repeated.

### Acceptance

- Each record field's definition has one canonical source, and its key phrases are asserted by a test.
- A change to a documented contract comes with a mechanical search of every packaged text for the old statement.

### Evidence

- 2026-11-14: a wording correction dropped part of a contract definition and the phrase tests passed (I0057 J008 V002 F4).
- 2026-11-14: statements of a tool's old behaviour survived the first correction (I0057 J001 V001 F1, V002 F6).
