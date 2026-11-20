# I0061: Project verification

Type: enhancement

## J001

- Status: completed
- Size: M (skill and runner)
- Objective: A skill decides which checks a target project needs and writes them to a project verification file that a factory runner executes deterministically.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: None. Merged through PR #365 (V001 pass, CI green); suggestions in J007.

### Acceptance

- A versioned verification file lists each check's command, platforms and cost class, written by the skill and approved by the operator.
- A factory runner executes it identically on Linux and Windows and prints a per-check result usable as I0058 J001's verification stamp.

### Evidence

- 2026-11-17: operator proposal after reviewing the Claude Code team's verification practices; the operator asked that the skill not depend only on the user remembering to run it.

## J002

- Status: completed
- Size: S (one flow)
- Objective: The verification file is refreshed by mechanical triggers, not by memory.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None. Merged through PR #367 (V002 pass, CI green).

### Acceptance

- The file stores hashes of the manifests it was derived from; when one changes the runner reports stale, and brief preparation and the commit gate require a refresh.
- A CI failure that the local run did not report is recorded as a miss that requires a refresh.

### Evidence

- 2026-11-20: PR #367; V001 fail (base/working-tree staleness mismatch, path regex) fixed, V002 pass. Known limit: an uncommitted working-tree verification.json counts as refreshed.

## J003

- Status: pending
- Size: M (recipe and runner)
- Objective: A change is verified by running it, through a declared recipe rather than model judgment.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Research which project types to support first.

### Acceptance

- The verification file can declare a run recipe: start, readiness probe, smoke steps with expected output, stop.
- The runner executes the recipe and stamps the result; the model only writes and maintains the recipe.

### Evidence

- None.

## J004

- Status: completed
- Size: M (research)
- Objective: Reviewer and check quality are measured against the defects that mattered.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None. Operator accepted the recommendations on 2026-11-20: misses table in the retrospective now (J008), recorded when observed, closed resolution vocabulary as J009; derived tool, model evals and rule pruning deferred.

### Acceptance

- A study proposes how to track misses (reverts, CI-only failures, later bug reports), incident-based evals and rule pruning, and recommends where it lives.

### Evidence

- 2026-11-20: research report (miss signals, retrospective Misses table, deferred derived tool and evals) delivered in conversation; operator accepted.

## J005

- Status: completed
- Size: M (coordinator default, setup proposal and CI guide; split 2026-11-20 into J005, J010, J011)
- Objective: Jobs run only their focused tier locally and setup proposes a path-keyed check rule the operator chooses, so repeated full runs stop.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J005/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Without a project check rule, when the project's CI runs the full suite, a job runs locally only the focused checks and those of affected consumers, and leaves the full suite to CI; the full suite runs locally only when there is neither a rule nor such CI.
- Setup proposes a check rule for the project's AGENTS.md from the detected test commands and their cost class. When the project already has check rules, setup shows a side-by-side comparison of the existing rules and the factory proposal and the operator chooses the existing rules, the proposal, or a merge they edit; nothing is written without that choice, and the chosen rule then overrides the factory default.
- A guide describes tiered CI for private repositories: a fast tier per PR with path filters and cancel-in-progress, the full tier on main, manual dispatch or schedule, and the runner-minute multipliers of Windows and macOS.
- The proposed check rule is a table keyed by the paths a change touches (code, tests, E2E harness, packaging or CI, docs or records only, initiative close) giving the tests and build each requires, so the selection is derivable from the diff.

### Evidence

- 2026-11-18: operator report: in a factory-driven project about 15 of a 30-minute job is repeated full-suite and E2E runs locally and again in CI; private-repo CI minutes are limited. Operator accepted the tiers and asked to keep project rules ahead of factory defaults. Operator then asked that setup not simply keep existing project rules but compare them with the factory proposal and let the operator choose either or a merge. 2026-11-18: operator asked to adopt three practices observed in a private factory-driven project: a path-keyed check table, checks in a pinned worktree while the next worker continues, and a manually dispatched close-suite workflow.
- 2026-11-20: PR #368 merged as fdae6080 (isswf-verify --table, coordinator focused-tier default, setup check-rule proposal, tiered CI guide en/es); review V001 fail fixed, V002 pass; CI green on 0deb5f94.

## J006

- Status: completed
- Size: S (setup grant, path guard, delivery step)
- Objective: Records-only commits (triage, plans, briefs, attempt and review records, job and initiative close) go directly to the base branch when the operator grants it, so record bookkeeping does not cost a PR and a CI run.
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md)
- Blocker: None.
- Next step: None. Merged through PR #364 (V003 pass, CI green).

### Acceptance

- Setup offers a separate remote grant, "push records-only commits directly to the base branch", recorded in project-setup.md; without it the PR path stays.
- A mechanical guard allows the direct push only when every path in the pushed commits is under the selected state directory (`.isswf/` or legacy `.factory/initiatives/`); any other path refuses and points to the PR path.
- The delivery flow uses the grant for job and initiative close records; code, docs, agent instructions, templates and tests always keep PR and CI.

### Evidence

- 2026-11-18: operator, after a plan-only edit was sent through PR #360: "esto es una locura... pensaba que ya habíamos dicho que estas cosas iban directas a origin main"; asked that the factory apply the same in the projects it runs.

## J007

- Status: completed
- Size: S (follow-ups)
- Objective: The verification runner reports only what it observed and its docs match its output.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J007/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- A failed or oversized `git status` yields `dirty: null` or a refusal, never `false` (V001 S1).
- The npm/npx refusal tests the command basename on every platform (S2).
- The seeded lint check covers `tooling/quality` like CI (S3).
- Docs list every refusal code, state `durationMs` presence accurately, and the architecture ownership table names the runner in EN and ES (S4).

### Evidence

- 2026-11-20: J001 V001 suggestions, deferred to keep J001 within the session quota.
- 2026-11-20: J002 V002 N1 (missing space at tools/isswf-verify.mjs:56) and J005 V002 I2 (docs show --table without --base HEAD).
- 2026-11-20: PR #369 merged (dirty null, basename launcher refusal, lint covers tooling/quality, docs refusal codes and durationMs); review V001 pass; CI green on 4f6a5a44. Known limit: lint lists tooling/quality files explicitly.

## J008

- Status: completed
- Size: S (template and procedure)
- Objective: Every observed miss is recorded with its attribution when it is found, and the retrospective collects them.
- Depends on: J004
- Brief: [brief-r1.md](jobs/J008/brief-r1.md)
- Blocker: None.
- Next step: None. Merged through PR #366 (V001 pass, CI green); suggestions in J009.

### Acceptance

- The retrospective template has a Misses section with the J004 miss shape.
- The coordinator procedure records a miss block when a CI-only failure or revert is observed, without editing reviewer verdicts.

### Evidence

- 2026-11-20: J004 research; operator ok.

## J009

- Status: completed
- Size: S (template)
- Objective: Review finding resolutions use a closed vocabulary with the rule or check that produced each finding, so dismissed findings and silent rules can be counted.
- Depends on: J008
- Brief: [brief-r1.md](jobs/J009/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The review template resolution line accepts only fixed, wrong, known-limit, not-material or dismissed, each with a reason, and findings carry a rule or check ID when one applies; the record check enforces the vocabulary on new records only.

### Evidence

- 2026-11-20: J004 research; operator ok.
- 2026-11-20: also fold J008 V001 S1 (name the review record location exactly) and S2 (retrospective may add a late-recorded miss) into .agents/roles/references/retrospective.md.
- 2026-11-20: PR #370 merged (closed resolution vocabulary, record-check --base on new reviews, coordinator runs it, retrospective wording); review V001 fail fixed, V002 pass; CI green on 2692c73a.

## J010

- Status: completed
- Size: M (close gate and optional CI dispatch)
- Objective: An initiative closes only after the full suite and E2E ran at its closing head.
- Depends on: J005
- Brief: [brief-r1.md](jobs/J010/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- The full suite and E2E run once at initiative close (or on merge to main) as an integration gate, and the close is refused until that run is recorded at the closing head.
- Setup offers, as an operator choice, running the initiative-close full suite as a manually dispatched CI workflow instead of locally; the per-PR fast tier stays automatic unless the operator decides otherwise.

### Evidence

- 2026-11-20: split from J005.
- 2026-11-20: J005 V001 S2: the --table initiative-close row omits ci-cost checks (E2E may be ci cost); revisit here.
- 2026-11-20: J007 V001 F4: the tier-required message omits --stale.
- 2026-11-20: J009 V002 N1 (assert the template resolution line exists in tests/isswf-record-check.mjs) and N2 (review.md record-check command lacks <factory-root>/).
- 2026-11-20: J010 V002 known limits: the close gate in working-tree mode does not see an untracked file staged by a chained git add (N1); a filesystem read fault on the close record refuses instead of failing open (N2); a rebase or merge after the close commit is not re-checked.
- 2026-11-20: PR #371 merged (close record via isswf-verify --record, plan commit close gate, setup CI close-suite option, deferred small items); review V001 inconclusive with correction 1, V002 pass; CI green on 4d859baf.

## J011

- Status: pending
- Size: M (pinned worktree checks)
- Objective: A job's checks run on its pinned candidate while the next independent worker continues.
- Depends on: J010
- Brief: [brief-r1.md](jobs/J011/brief-r1.md) (pending until prepared)
- Blocker: Claude per-child checkout binding is unverified (project-setup.md).
- Next step: Deferred; revisit after J010.

### Acceptance

- The coordinator runs a job's checks in a disposable worktree pinned to the exact candidate SHA while the next independent job's worker continues; a job integrates only when its checks and review are green, and dependent jobs do not run in parallel.

### Evidence

- 2026-11-20: split from J005.
