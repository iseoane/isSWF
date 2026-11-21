# I0063: Parallel jobs in worktrees

Type: enhancement

## J001

- Status: completed
- Size: S (guard)
- Objective: A worker's commits are refused outside the worktree and branch the coordinator assigned to it, so parallel writers cannot mix changes.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None; J002 confirms live binding.

### Acceptance

- The branch guard refuses a worker's commit whose checkout or branch differs from its assignment, on Claude and Pi, Linux and Windows; the coordinator's own commits are unaffected.

### Evidence

- 2026-11-20: operator: the real problem is no parallel development; asked why a job cannot open a worktree, develop and test there until integration, then remove it. Coordinator found the blocker is the host-guide rule `.agents/hosts/claude-code.md:28` (binding by instruction not accepted), not a Git limit; operator accepted a guard plus pilot.
- 2026-11-20: PR #373 merged as efdff44f5ef676aa6cf83a50e97977484e3215b1 after green CI on 9a28aac13241d0bf87c36018ada71eeb6a328854. Attempts A001, A002. Reviews: V001 fail (Windows case compare, overstated docs; F1-F4 fixed), V002 fail (N1 fixed: out-of-scope project-release copy removed; N2, N3 fixed), V003 pass. Operator approved the host-guide change. Known limits: unit tests with a stubbed host only, live binding unobserved; background Claude workers only; Pi unobserved.

## J002

- Status: completed
- Size: M (pilot and rule update)
- Objective: Two independent jobs run in parallel, each in its own worktree and branch through test and review, are integrated together in one batched PR with one CI run, and the worktrees are removed after integration.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A pilot runs two independent jobs concurrently in coordinator-created worktrees (or the host's automatic worktree isolation if it fits), each integrated only when its checks and review are green, dependent jobs never in parallel, and each worktree removed after merge.
- The two reviewed job branches reach main through one batched PR whose full CI runs once on the batch head; a CI failure is fixed forward on a new branch added to the batch, and reviewed branches are not rewritten. `isswf-handoff coverage` passes on the batch.
- CI minutes per job are measured for the pilot with J005's script and compared with the last single-PR jobs (I0063 J001, J003).
- The host guide worktree rule and docs/en|es are updated to the observed, guarded behavior, including checks on the pinned candidate while the next worker continues (former I0061 J011).

### Evidence

- 2026-11-20: moved from I0061 J011 (pinned worktree checks), operator decision.
- 2026-11-21: pilot run: J004 and J005 in parallel worktrees, live branch-guard refusal observed, batched PR #374 merged as c57f55d731dfc3cbfd8217e6fdb8a95031b8bd1a with a coverage-chain fix forward (V001 pass); records-only push b729cf5a started no CI; worktrees removed. CI: batch 5.3 min for three units, single PRs 3.7 and 5.4 min, push main 131 min over 44 runs.
- 2026-11-21: operator added batched PRs (per-branch light checks and review, one heavier CI per batch, fix forward) and skipping CI for records-only pushes to the scope, after a public post on batching branches. Reason: about 4-5 min of CI per run and several runs per job, against jobs of about 30 min of worker and review. #278 was checked and is already implemented (I0050 J001, J002; V record verdict field), so the pilot uses J004 and J005.
- 2026-11-21: rule update PR #375 merged as 78cf507790e3585515ae0a66292f0e889878523b after green CI on f7ed2b46de7a337227b870dbe7de6cce0c949693. Attempt A001 (with correction 1). Reviews: V002 fail (F1: lint at job tier needs npm ci in a new worktree; F2-F4 wording), V003 pass (D1 optional wording). Known limit (V002 F5): checks on the pinned candidate while the next worker continues are covered only by the per-branch job tier in separate worktrees; no extra mechanism. Deviation: in the pilot the coordinator ran focused tests instead of the job tier; I0058 J001 adds the stamp and gate. Close record from push CI run 44881552927 on 78cf5077.

## J003

- Status: completed
- Size: S (close gate fix)
- Objective: An initiative close is refused when any check in its close record did not run, so a platform-limited full suite cannot be skipped silently.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The plan commit guard refuses a close whose record has any check not passed, including `not run`; the refusal names those checks and points to a CI record or a platform that runs them; `isswf-verify --record` reports the same outcome; EN/ES docs match.

### Evidence

- 2026-11-20: I0061 close: a local --record on Windows passed 6 checks and left check-docs, check-quality, lint and dead-code not run (Linux-only); the gate accepted such a record by design (J010: at least one passed). Closed with a source ci record instead (Quality run 44796797130 at 66f83049). Operator asked to fix it first in I0063.
- 2026-11-20: PR #372 merged (close record needs every check passed; --record exits 1 on not-run); review V001 pass; coordinator observed focused tests; CI green on 09d272a8.

## J004

- Status: completed
- Size: S
- Objective: A push to main that changes only initiative records does not start the Quality workflow.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The Quality workflow's push trigger ignores commits whose changed paths are all under `.factory/initiatives/` or `.isswf/initiatives/`; pull requests, `ci/**` pushes and mixed commits still run it, and required PR checks are unaffected.

### Evidence

- 2026-11-21: operator approved, see J002.
- 2026-11-21: merged through batched PR #374 as c57f55d731dfc3cbfd8217e6fdb8a95031b8bd1a, CI green on 886edb8214264259ffddfa0f7651669f96de8f55. Worker in worktree i0063-j004 (A001, A002). V001 fail (F1 ci/** wording fixed; F2 deviation recorded; F3, F4 not-material), V002 pass. Live skip observed on the push of this close commit (see J002).

## J005

- Status: completed
- Size: S
- Objective: A development script reports CI wall-clock minutes per job from GitHub run data, so the pilot can compare batched and single-PR delivery.
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Given runs as `gh run list --json` output, the script groups them by pull request branch and by push to main, and prints run count, cancelled count and total minutes per group; it is tested with fixture data, without network.

### Evidence

- 2026-11-21: operator approved, see J002.
- 2026-11-21: merged through batched PR #374 as c57f55d731dfc3cbfd8217e6fdb8a95031b8bd1a. Worker in worktree i0063-j005, TDD RED 1f3750a3 exit 1, GREEN exit 0 (A001, A002). V001 fail (F1 Spanish mirror order fixed; F2 fixed; F3 not-material), V002 pass.
