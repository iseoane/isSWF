# #55 Candidate A: durable Markdown work tree

Status: design candidate, not an accepted runtime contract. Grounded at `9cd0eeb`. This file proposes only project artifacts and the behavior a future coordinator should follow. It does not add a process manager, claim runtime persistence, or change the v1 contract.

## Decision

Keep one project-local tree under `.factory/work/`. Put the desired project spec and coordinator-owned current plan beside stable work IDs. Give each job one brief and dependency list. Store attempts and review evidence as separate, immutable references. Delegation starts with `J001@revision`, which resolves to the job brief and only its linked context, never a conversation dump or a second hand-built giant prompt.

This follows the existing contract that delegation takes a work reference and resolves profile/configuration, while the agent opens its brief and linked references (`docs/spec-v1.md:25-34, 44-48`). `.factory/` is a proposal, not yet an accepted location (`docs/vision.md:126-132`; `docs/plan-v1.md:22-28`).

```text
.factory/work/F001/
  spec.md                         # desired project behavior, coordinator/operator owned
  plan.md                         # current coordinator-owned plan and dependency map
  jobs/J001/brief.md              # authorized bounded unit; immutable revisions
  jobs/J001/attempts/A001.md      # attempt record and pinned input references
  jobs/J001/results/R001.md       # worker return, artifacts, checks, uncertainty
  jobs/J001/reviews/V001.md       # independent review of exact candidate
  jobs/J002/...
```

F001/J001/A001/R001/V001 are readable identifiers, not database keys. The coordinator allocates them once and never reuses them. A revision is explicit in a path or heading and has a content digest recorded in its referencing artifact. Markdown remains the canonical record. No JSON database, SQLite, or new required runtime/tool.

## Caller experience

The coordinator prepares the job and then dispatches one reference:

```text
dispatch(profile=.agents/roles/worker.md, job=.factory/work/F001/jobs/J001@r2)
```

The dispatch contract says: open the referenced brief; follow only its explicit linked context; check the checkout/base and authorization; report the attempt ID and resulting artifact references. The runtime arguments above illustrate the caller's intent, not a proposed CLI/API signature. The profile remains a role instruction, not proof of a native Pi role or runtime capability (`.agents/skills/isswf-coordinator/SKILL.md:55-59`; `.agents/roles/worker.md:3,10-14`).

A missing ID or revision is a hard resolution error before dispatch. No “closest job”, latest revision, or fallback to chat context. If a linked artifact is absent or its recorded digest differs, the coordinator reconciles it and creates a corrected revision before dispatch; it does not silently reconstruct lost intent.

## Ownership and lifecycle

- **Operator/coordinator own `spec.md`.** Spec is desired behavior and authorization boundary, not a mirror of what code currently does. A material objective change is an operator decision, then a new spec revision.
- **Coordinator alone owns current `plan.md`.** It links jobs, result criteria, dependencies, checkpoints and next decisions. A delegated planner may return a proposed plan artifact, never write the current plan. This matches the coordinator's ownership of priorities and plan (`docs/vision.md:53-57`).
- **Coordinator owns job brief revisions and assignments.** Each brief names objective, scope/exclusions, authorization, base, writable checkout, inputs, dependencies, verification and checkpoint, as required by the current worker contract (`.agents/roles/worker.md:10-14`).
- **One worker owns one exclusive writable checkout per active attempt.** Keep different jobs in separate worktrees when concurrent. A handoff or retry does not release ownership until the prior writer is confirmed stopped and its effects inspected (`.agents/skills/isswf-coordinator/SKILL.md:59-66`; `.agents/roles/worker.md:30-33`).
- **Worker owns attempt result artifacts, not plan/spec/job scope.** The worker returns paths and evidence. Coordinator reconciles result, updates plan and decides transition.
- **Reviewer owns a review artifact for one exact candidate snapshot.** It does not edit the candidate or replace the worker. Retain the candidate identity, base, digest/package references and separate Standards/Spec outcomes (`.agents/roles/reviewer.md:3,10-12,20-32`). Do not review while a writer may still be changing the candidate.

A saved status such as `in-progress` or `blocked` describes the last recorded state, not proof that a process is active, stopped, or recoverable. Consult the live tool and checkout before retrying. Markdown cannot guarantee isolation, atomic writes, durable process execution, recovery, or exactly-once effects. Git checkpoints help recover committed work but are not a full backup and do not make uncommitted files durable (`docs/spec-v1.md:21,96-100,209`).

## Artifact contracts

`spec.md` records desired outcomes, explicit non-goals and unresolved product decisions. `plan.md` records the current coordinator plan and links to job revisions. It is not a second spec and not a worker-updated progress log.

A job brief revision contains stable job ID, revision, objective, acceptance, scope/exclusions, authorization, project/base identity, exclusive checkout, dependencies with unblock conditions, input refs with digests, verification, checkpoint/commit policy, and approved profile/model/effort policy. It contains enough context to act without chat history, but links to source files and research rather than copying them.

An attempt record pins the exact job revision, spec revision, plan revision, profile/skill revisions, base SHA, checkout/worktree, requested model+effort, effective model+effort, attempt ID and authorized side effects. “Requested” and “effective” are separate fields; the effective values come from observed dispatch/result, not an assumed fallback. A future planner/researcher route may request GLM high and use Luna medium only as an explicitly approved, compatibility-checked alternate recorded for that attempt. No silent downgrade or fallback.

A result is append-only evidence: outcome (`complete`, `partial`, or `blocked`), changed paths, commits/checkpoints, commands and observed results, artifact references, risks, unresolved questions, and next action. An uncommitted candidate is identified with an exact retained snapshot/digest, including untracked paths/content, if it will be reviewed. A review artifact pins that exact candidate and base, returns Standards and Spec separately, and records findings/disposition references. A changed candidate requires a new review; old results remain readable, not overwritten.

## Worked handoff

1. Coordinator grounds the request and writes desired behavior to `spec.md`; code remains the source of current behavior. It writes `plan.md` with J001 and J002, where J002 depends on J001's specified result/checkpoint. A second independent J003 may proceed in its own checkout.
2. Coordinator creates J001 revision r1 with authorization, base, ownership, criteria and grounding links. It dispatches `J001@r1`; the worker resolves that reference, reads linked materials and returns A001/R001 with evidence and Git checkpoint.
3. A read-only research job may return a map artifact with reviewed revision, real paths, symbols/ranges, tests, consumers and reasons. Worker references it, then reopens source against its own base. This preserves the existing grounding contract (`docs/spec-v1.md:58-66`; `.agents/skills/isswf-coordinator/SKILL.md:29-33`).
4. While J001's worker is still active, the operator changes an acceptance criterion. Coordinator records a new spec/job revision and marks it pending reconciliation. It does not mutate A001's pinned input or tell the active worker its contract silently changed. The coordinator waits for/observes the writer and decides whether to continue, stop, or reconcile; no second writer is dispatched into that checkout.
5. After the worker is confirmed stopped, coordinator inspects its partial files/commits/effects. It reconciles J001 against the new criterion, creates r2, and either assigns a fresh authorized attempt or blocks pending a decision. It preserves A001/R001 as history, does not infer failure from a missing chat, and does not treat a saved status as live process state.
6. Once the candidate is stable, coordinator retains its exact snapshot and dispatches the independently authorized reviewer. V001 links the snapshot and evidence. If corrections change the candidate, a new review is required. J002 stays blocked until its declared dependency condition is actually satisfied; a commit or “complete” report alone does not imply technical closure or integration.

## Minimal documentation slice

If accepted, the first implementation slice should add only:

- `docs/durable-work.md`: short contract, tree, reference-resolution/handoff procedure, recovery limits, and links to templates.
- `docs/templates/work-spec.md`, `plan.md`, `job-brief.md`, `attempt.md`, `result.md`, and `review.md`: concise copyable Markdown shapes with required IDs, ownership, revisions, refs, status semantics, and evidence fields.
- A pointer from `docs/vision.md` / `docs/plan-v1.md` only after the location and contract are accepted. Keep `.agents/roles/worker.md`, reviewer, and coordinator changes for a separately authorized follow-up slice; this candidate proposes their required references, not edits.

No planner/researcher profile is created here. Their future work follows the sequenced plan and only starts after current spec, plan and job references are reconciled (`docs/vision.md:126-127`).

## Verification and open limits

Before implementation, add a small file-tree fixture and behavior-level tests that invoke the same reference-resolution/handoff path a coordinator uses. Assert exact resolved brief and linked refs for `J001@r1`, and rejection for missing job, missing revision, missing linked artifact and digest mismatch. Assert that after an active attempt's pinned r1 and a later coordinator r2 exist, reading `J001@r1` still yields the original objective while `J001@r2` yields the revised objective; assert that the reviewer artifact identifies the exact candidate snapshot. Tests must assert visible values, not merely successful parsing.

The Markdown contract alone cannot enforce write ownership, active-process status, immutability, atomicity, authorization, or model availability. Those require future runtime checks or explicit human/tool procedure. A Git commit is a checkpoint, not complete backup, rollback, or proof of atomic persistence. If the system cannot verify the previous writer stopped, preserve its checkout reservation and block replacement. If a reference cannot be reconciled, block only the affected job and retain independent work.

## Grounding at HEAD `9cd0eeb`

- `docs/vision.md:15,53-57,87-97,126-132` establishes durable work as desired, coordinator-owned plan, contextual Markdown roles and the proposed `.factory/` location. It explicitly says chat-independent recovery is not implemented.
- `docs/plan-v1.md:22-28,66-83` sequences #55 before planner/researcher profiles and distinguishes checkpoints from verified outcomes.
- `docs/spec-v1.md:17-48,58-66,82-100,194-219` sets the reference-first delegation contract, current behavior vs desired behavior, evidence-based delivery, checkpoints and effective per-attempt config.
- `GLOSSARY.md:11-37` defines Encargo, Trabajo, Slice, Brief, Grounding, Worker, Revisor, Candidato, Evidencia, Cierre técnico, Aceptación and Bloqueo. Use these terms; `F001` is a proposed filesystem key, not a new domain concept.
- `.agents/skills/isswf-coordinator/SKILL.md:29-33,55-72,82-87` owns grounding, exact references, dispatch, reconciliation and candidate retention.
- `.agents/roles/worker.md:10-14,21-26,30-38` requires scoped authorization, exclusive checkout, pinned grounding, explicit checkpoint and truthful return.
- `.agents/roles/reviewer.md:10-12,20-32` requires exact candidate identity, separate context and two review axes.
