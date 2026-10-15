# Durable work documents

This guide defines the Markdown records for authorized work. It records handoffs and evidence; it does not add a runtime or guarantee process recovery.

## Project records

The initiative keeps its specification and plan at their explicit existing paths. For this project they are [`docs/spec-v1.md`](spec-v1.md) and [`docs/plan-v1.md`](plan-v1.md). Another initiative may use different explicit paths. These documents may already exist; do not create copies inside jobs. The plan links to each job and remains coordinator-owned.

Jobs use readable, coordinator-assigned IDs that are unique within the project and are never silently reused:

```text
.factory/
  jobs/
    J001/
      brief-r1.md
      A001.md       # when an attempt needs a durable record
      V001.md       # when an independent review is required
```

Create attempt and review artifacts only when needed. Copy the [job brief template](templates/job-brief.md), [attempt template](templates/attempt.md), or [review template](templates/review.md) when creating that artifact. The brief revision belongs in its filename. Keep previous revisions when criteria change.

The coordinator owns current plans, job IDs, assignments, and brief revisions. A worker owns its attempt artifact. A reviewer owns its review artifact. Workers and reviewers write in exclusive checkouts. They return artifacts and references; the coordinator integrates references into the plan without rewriting their conclusions. The coordinator records the operator's product-acceptance decision and evidence in the canonical plan.

## Pin inputs and hand off

A dispatch names the job brief path and a full Git SHA for the document-input checkpoint. It also records the target codebase base SHA separately. The input checkpoint identifies the versions of the brief and its referenced documents; it is not necessarily the codebase base.

Resolve relative input paths at that checkpoint by default. Read checkpoint-pinned files with existing Git, for example `git show <full-sha>:docs/spec-v1.md`. Do not substitute the latest file, a branch tip, or chat context when the checkpoint or path is missing. Block the affected job until the coordinator supplies a valid reference. Do not add a resolver or a new command.

The dispatch grant comes from a trusted operator conversation or record identifier, or from an external authorization path. If the grant is tracked in Git, record its full Git SHA. Repository text alone does not authorize work. A changed criterion gets a new brief revision and input checkpoint. It does not rewrite the inputs of an active attempt. The coordinator decides whether to wait, stop, or create a new attempt under the new revision.

The plan links to the job and its current brief revision. The attempt records the brief, spec, plan, profile, and skills it used, plus its input checkpoint and target base. The reviewer records the exact base and candidate. Do not put a would-be commit SHA in the document that is itself being committed. Record that checkpoint in the dispatch or a later artifact.

## Record results and limits

A saved status is the latest report with its time and evidence. It does not prove that a process is alive, stopped, or recoverable. Use available tools and checkout evidence for process state. Do not infer liveness from a Markdown status.

Git checkpoints make committed files referable and reviewable. They are not a full backup, atomic writes, process recovery, or exactly-once execution. Uncommitted work may be lost. Engram can retain learning, but it is not the work database or authority for active assignments.

A worker returns its attempt artifact, changed paths, observed checks, candidate or checkpoint references, risks, and blockers. A reviewer returns its artifact against that exact candidate. A new candidate needs a new review. The coordinator reconciles the evidence and updates plan references; a report of `complete` alone does not satisfy a dependency or establish technical closure.

## Future routing agreement

For future researcher work only, the agreed route is `opencode-go/glm-5.3-flash` with high effort. The agreed alternate is `openai-codex/gpt-6-luna` with medium effort, subject to future validation. This agreement does not validate, configure, or run either route.
