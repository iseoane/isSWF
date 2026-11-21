# I0064: Follow-ups from closing I0058

Type: enhancement

On 2026-11-21 the operator asked for jobs to resolve the three process problems recorded when I0058 closed ("prepara jobs para resolver los 3 hallazgos"). The source is the deferred candidates in [I0058's plan](../I0058/plan.md). All three jobs are for the factory and ship to target projects.

Sizing follows `.agents/roles/references/planning.md`. Advance the jobs under the standing grant, with at most 2 workers in parallel.

## J001

- Status: completed
- Size: S (one flow)
- Objective: `isswf-handoff coverage` keeps a job's review chain intact when the job branch merges the main branch, so a delta review after the merge can use its true diff base.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: None; merged in #382.

### Acceptance

- A review whose base is a merge of the main branch into the job branch chains to the earlier review when the merge's other parent is already on the main branch, and the commits that merge brings in count as covered.
- A test reproduces I0058 J013, with a V002 candidate, a records commit, a merge of main, a fix commit and a V003 based on the merge, and coverage reports ok.
- A merge that brings in commits not on the main branch still breaks the chain.

### Evidence

- 2026-11-21, I0058 J013: coverage reported `unreviewed-commits` for every earlier commit after V003 took the merge `1e5f1b09` as its base. The coordinator set V003's base to the V002 candidate as a workaround.

## J002

- Status: completed
- Size: S (one flow)
- Objective: The coordinator can create a worker's record skeleton in the worker's checkout without first copying the brief or plan onto the job branch.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None; merged in #382.

### Acceptance

- `isswf-record-new create --project <worker checkout>` reads the brief and the plan's job status from the committed main-branch checkpoint named by `--checkpoint` when the worker's tree lacks them or has an older plan. The skeleton is still written in the worker's checkout.
- When neither the tree nor the checkpoint has the brief, the command still refuses with `brief-not-found`.
- The Record creation precondition text in EN and ES describes the new behavior, and the old precondition is added to the stale phrases.

### Evidence

- 2026-11-21, I0058 J011: brief r2 had to be copied onto the branch before `create` and `isswf-handoff review` would accept it (J011 V002 N1).

## J003

- Status: in-progress
- Size: S (one flow)
- Objective: A CI wait or full check stopped by the host under memory pressure does not leave the coordinator without a result.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Worker implements brief r1.

### Acceptance

- The coordinator guide for both hosts says how to wait on CI with a short, bounded foreground check instead of a long background watch, and what to do when a background command is reported as stopped.
- A small tool, or an option on an existing one, reports the current CI state of a pull request's exact head in one call and exits, so a stopped watcher can be replaced without a restart loop.
- The guide's rule is checked by an existing stale-phrase or methodology test where it can be checked mechanically, or the reason is recorded.

### Evidence

- 2026-11-21: Claude Code stopped two `gh pr checks --watch` background commands under memory pressure during I0058, and an earlier one in I0057 (2026-11-15).
