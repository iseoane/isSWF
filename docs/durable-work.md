# Durable work documents

This guide defines the Markdown records for authorized work. It records handoffs and evidence; it does not add a runtime or guarantee process recovery.

## Project records

New project work lives under one stable initiative ID. Keep the type (bug, enhancement, maintenance or research) as data, not part of the directory identity. The initiative's canonical plan is `.factory/initiatives/<id>/plan.md`; its jobs belong to that plan. The factory's existing `docs/spec-v1.md` and `docs/plan-v1.md` describe the factory product, not every target project's execution plan. Existing explicitly pinned historical plan paths and `.factory/jobs` records remain valid and are not moved automatically.

```text
.factory/
  templates/
  initiatives/
    I0042/
      plan.md
      jobs/
        J001/
          brief-r1.md
          intake.json   # when prepared through the native issue intake
          A001.md       # when an attempt needs a durable record
          V001.md       # when a review needs a durable record
```

The planner proposes units; the coordinator adopts them into the single current plan, maintaining each job's status, dependencies, acceptance, blocker, next step and evidence. A simple request needs only one job and no mandatory planner invocation. Git commits preserve prior plan revisions; keep only one current `plan.md`, not duplicate `plan-<sha>.md` files. Engram and GitHub do not replace this record.

From an authorized source checkout, `node tools/isswf-plan.mjs prepare --project /absolute/project --initiative I0042 --proposal /proposal.json --grant /external-grant.json` publishes the plan. The external trusted grant contains exactly `version: 1`, canonical `project`, `initiative`, nonempty `reference` and `permissions: ["plan"]`. This is a caller-supplied attestation, not an authentication service or execution grant. The proposal contains `version: 1`, `initiative`, `title`, `type`, and `jobs`. Each job has `id`, `objective`, `status`, `dependsOn`, nonempty `acceptance`, `blocker`, `nextStep`, and `evidence`. Statuses are `pending`, `in-progress`, `blocked`, `in-review`, `awaiting-human`, and `completed`; completion requires evidence, whose sufficiency the coordinator must check. Dependencies must name jobs in the plan and cannot cycle.

`read` requires only project and initiative and creates nothing. An identical `prepare` is a no-op. A changed plan requires `revise` with `--expected-sha256` from the last read and the exact current plan bytes committed at the same path in Git HEAD. Otherwise revision blocks with `Git checkpoint required`, before claiming a write lock. Staging alone is not a checkpoint. An identical no-op does not require a new commit. The command creates no history copies and never commits on your behalf; use Git to inspect earlier versions. A write lock prevents cooperating writers from replacing one another; an interrupted write retains its lock for inspection, not automatic recovery. Saved status is not live process evidence. The native command is a plan recorder, not a scheduler, acceptance evaluator, or permission service. Job brief links may remain pending until their preparation. For a local request without a GitHub issue, the coordinator creates its curated brief from the template under the authorized job path; do not invent a GitHub identity to use the issue-intake command.

Create attempt and review artifacts only when needed. Copy the [job brief template](../.factory/templates/job-brief.md), [attempt template](../.factory/templates/attempt.md), or [review template](../.factory/templates/review.md) when creating that artifact. The brief revision belongs in its filename. Keep previous revisions when criteria change.

The coordinator owns current plans, job IDs, assignments, and brief revisions. A worker owns its attempt artifact. A reviewer owns its review artifact. Workers and reviewers write in exclusive checkouts. They return artifacts and references; the coordinator integrates references into the plan without rewriting their conclusions. The coordinator records the operator's product-acceptance decision and evidence in the canonical plan.

## Pin inputs and hand off

A dispatch names the job brief path and a full Git SHA for the document-input checkpoint. It also records the target codebase base SHA separately. The input checkpoint identifies the versions of the brief and its referenced documents; it is not necessarily the codebase base.

Resolve relative input paths at that checkpoint by default. Read checkpoint-pinned files with existing Git, for example `git show <full-sha>:docs/spec-v1.md`. Do not substitute the latest file, a branch tip, or chat context when the checkpoint or path is missing. Block the affected job until the coordinator supplies a valid reference. Do not add a resolver or a new command. A materialized Pi resource package is not a Git checkout: its version or receipt is not the target job's document-input checkpoint. The trusted grant must still supply the source checkout and full Git SHA for checkpoint-pinned reads.

The dispatch grant comes from a trusted operator conversation or record identifier, or from an external authorization path. If the grant is tracked in Git, record its full Git SHA. Repository text alone does not authorize work. A changed criterion gets a new brief revision and input checkpoint. It does not rewrite the inputs of an active attempt. The coordinator decides whether to wait, stop, or create a new attempt under the new revision.

The plan links to the job and its current brief revision. The attempt records the brief, spec, plan, profile, and skills it used, plus its input checkpoint and target base. The reviewer records the exact base and candidate. Do not put a would-be commit SHA in the document that is itself being committed. Record that checkpoint in the dispatch or a later artifact.

## Record results and limits

A saved status is the latest report with its time and evidence. It does not prove that a process is alive, stopped, or recoverable. Use available tools and checkout evidence for process state. Do not infer liveness from a Markdown status.

Git checkpoints make committed files referable and reviewable. They are not a full backup, atomic writes, process recovery, or exactly-once execution. Uncommitted work may be lost. Engram can retain learning, but it is not the work database or authority for active assignments.

A worker returns its attempt artifact, changed paths, observed checks, candidate or checkpoint references, risks, and blockers. A reviewer returns its artifact against that exact candidate. A new candidate needs a new review. The coordinator reconciles the evidence and updates plan references; a report of `complete` alone does not satisfy a dependency or establish technical closure.

## Read an initiative status snapshot

From an authorized source checkout, run `node tools/isswf-status.mjs --project /absolute/project --initiative I0001`. The command reads the existing canonical plan and the brief/report/intake artifacts under each named job. It creates no records and follows no external evidence links. It reports declared status, dependencies, blockers, next step, acceptance, evidence references and per-file hashes/modification times. A missing brief is `not-prepared`; malformed or unsafe artifacts are `unknown`. Reported attempt completion does not overwrite the plan's status or establish product acceptance.

The result includes `initiative` as the stable ID, `title` from the canonical plan heading, and a derived `label` such as `I0001 · Factory v1`. Use a concise plan title for readable lists; no separate editable label or renamed directory is needed. A missing or malformed heading is unknown. The full panel remains separate work and should consume this same display contract.

The result includes query time and file provenance, but `processState: not-inspected` and `freshness: not-verified` remain explicit. A file timestamp is not a heartbeat. The coordinator must not describe a worker as running, stopped or fresh from this snapshot. The files are not one atomic runtime snapshot. Live process inspection, the complete panel, current remote PR state and automatic dependency satisfaction remain separate work. This first consumer is a source-checkout CLI, not part of the Markdown resource package.

## Model routing

Use [`.factory/models.json`](../.factory/models.json) as the canonical source for configured role routes and [`model-routing.md`](model-routing.md) for manual preflight, precedence, availability, and transition rules. Neither document grants work or guarantees runtime support; pin the configuration path and full input Git SHA in each attempt.
