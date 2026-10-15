# Durable job documents, design B

**Status.** Design proposal only. It does not change the v1 spec or authorize implementation.

## Problem and grounding

#55 needs durable project-local Markdown for initiative specs, plans, and jobs, with per-attempt snapshots and Git checkpoints. It excludes a runtime process and a full backup. The current proposal leaves `.factory/` unconfirmed and does not choose a layout (`docs/plan-v1.md:20-28`, `docs/vision.md:124-132`).

The product already separates the authorized assignment from bounded work and its brief (`GLOSSARY.md:15-26`). The coordinator owns priorities and authorization (`docs/vision.md:51-57`); the worker requires an exclusive checkout and returns evidence (`.agents/roles/worker.md:3-14,30-38`); the reviewer judges an exact candidate separately (`.agents/roles/reviewer.md:3-12,20-32`). The coordinator instructions live in `.agents/skills/isswf-coordinator/SKILL.md:1-6,82-85`, not in a coordinator role file.

The spec expects a small job-reference handoff, referenced Markdown inputs, durable outputs, and distinct process, technical, and product outcomes (`docs/spec-v1.md:15-42,259-269`). It also requires per-project separation, one writer per checkout, and no secret material in artifacts (`docs/spec-v1.md:293-319`). These are design requirements, not existing runtime guarantees.

## Recommendation: flat job records

Keep initiative documents where they already live. `docs/spec-v1.md` and `docs/plan-v1.md` remain the source Markdown for the initiative; a new initiative can use its own spec and plan paths. Do not copy either document into every job.

Use `.factory/jobs/<job-id>.md` for each bounded job. The job ID is a stable, project-unique random identifier, checked for collision when created. It does not depend on a title, parent feature, or path. The filename is its stable project path. Discover jobs by listing this one directory; do not add a generated registry or configuration layer.

Each job document holds the current brief, dependencies, owner, reported status, latest plan/spec references, artifact handoffs, and a short attempt history. A dispatch checkpoint records the exact Git revision plus paths for its brief, plan, spec, profile, and required skills. The attempt also records its base commit, candidate or result references, requested model and effort, effective model and effort, evidence, and outcome. Git history preserves earlier versions of the document; the job's current section points to the latest state.

The caller passes one reference, for example `run("job:J-7f31@<full-git-sha>")`. Resolve it to the job document at that Git revision, then read only the referenced inputs. The revision is required for dispatch and handoff; a bare job ID means the latest job document and is for coordination, not an implicit execution baseline. Keep the eventual command syntax open until implementation, but do not grow the call into a list of brief, model, checkout, and policy parameters.

**Ownership.** The coordinator is the only writer of canonical job documents and current plans. Parallel workers receive separate writable checkouts for assigned code and return candidate commits, artifact paths, evidence, and blockers. The coordinator reconciles those returns into canonical documents. A reviewer reads the exact candidate and does not edit it. Never let two workers or the coordinator share a mutable checkout.

**Plan changes.** The latest plan can change while a job is active. A started attempt keeps its recorded plan, spec, brief, profile, and skill revisions. A criteria change creates a new plan revision; it cannot rewrite the attempt's baseline. The coordinator then pauses the affected job, starts a new attempt, or records an explicit decision to continue under the old criteria. A downstream job remains blocked until its referenced handoff exists and its dependency condition is met.

**Status and evidence.** Store reported work status separately from observed process state. For example, `reported: running` does not establish `process: alive`; record process checks with their result, time, and evidence. Unknown process identity or an absent handoff blocks re-dispatch or dependency release. A Markdown report saying `complete` is not a process check, technical closure, or operator acceptance.

## Two-job example

`J-10a2` is a read-only research job. Its brief pins the approved objective and source revisions. Its result links a research note and a map of paths, symbols, line ranges, and reasons. The approved research destination is GLM with high effort, with Luna at medium as the alternative; neither is currently configured. The record stores requested and effective destinations, and dispatch remains blocked until the chosen destination is available and explicitly recorded.

`J-20b4` depends on the research handoff. Its worker gets a separate checkout and uses that map to re-open current code before editing. The attempt pins the then-current plan and acceptance criteria. A reviewer evaluates the exact returned candidate in a separate context. Research, worker, and review are steps and handoffs, not a feature-folder tree. If criteria change during the work, the old attempt remains attributable to its old plan revision; the coordinator reconciles before another attempt or closure.

## Alternatives

**Feature-first tree.** A feature directory containing spec, plan, jobs, and attempts groups by product topic, but each reader must navigate through the feature parent and decide which copy or child owns current state. It also invites duplicating initiative documents. It is the wrong organizing key for independent jobs and does not match the existing plan/spec files.

**Job-first directories with plan links.** A folder per job with separate brief, status, attempt, model, and result files makes each record look atomic, but creates several files before a job has meaningful history and makes readers open more paths to answer one question. Use it only if one Markdown job record becomes too large in real use; do not pre-create empty per-job files or config layers.

The flat record wins because job ownership and attempt history stay together, while shared initiative plans remain one source. It keeps navigation to one job file plus only the referenced documents a reader needs.

## Checkpoints, storage, and limits

Git revisions pin document state and provide reviewable checkpoints. A Git checkpoint is not a backup, does not make writes atomic, and does not prove exactly-once execution. Keep artifacts in the project-local repository and link to them from the job record. Do not use Engram or a runtime operational store as the job database. Do not put credentials or secrets in Markdown, diffs, or published artifacts.

## Verification plan, not implementation

Use a disposable documentation fixture to check that a fresh context can resolve a job reference and its pinned plan/spec, and that a missing reference blocks handoff. Change criteria after an attempt starts and verify that the recorded revision still resolves to the old text while the job's latest view points to the new text. Exercise two jobs with a dependency, a missing research artifact, a returned candidate, and a separate reviewer result. Verify that reported status alone never counts as a process check.

Use only existing Node.js and built-in modules for any optional fixture audit. Do not add Python, SQLite, runtime code, installs, dependencies, or a reusable factory tool for this design check. Do not implement #55 in this task.

## Source map

- `docs/vision.md:51-57,87-97,124-132` for planning ownership, Markdown-first delegation, and #55 limits.
- `docs/plan-v1.md:20-28,47-83` for sequence, `.factory/` uncertainty, and the separation between a plan and demonstrated behavior.
- `docs/spec-v1.md:15-42,259-269,293-319,330-332` for job references, result identity, recovery, authority, and the coordinator's plan role.
- `GLOSSARY.md:15-42` for Encargo, Trabajo, Brief, Worker, Revisor, and Candidato.
- `.agents/skills/isswf-coordinator/SKILL.md:1-6,82-85`, `.agents/roles/worker.md:3-14,21-38`, and `.agents/roles/reviewer.md:3-12,20-32` for the current coordinator, worker, and reviewer contracts.
- Grounded at `9cd0eebfea8ecf79043a42b4cfcf560bf299936f`.
