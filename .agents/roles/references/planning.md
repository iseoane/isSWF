# Planning guidance

Use this reference when the coordinator asks for a plan proposal. The proposal is a decision aid, not an authorization or an update to the canonical plan.

## Checkpoint-pinned inputs

This section is the canonical rule for pinned document inputs across roles. For explicitly checkpoint-pinned document assignments, require the committed brief path and the full Git SHA of its document-input checkpoint, recorded separately from the target codebase base. Resolve the brief and its referenced documents at that checkpoint with available Git, for example `git show <full-input-sha>:<relative-path>`, or from coordinator-supplied readable checkpoint material identified by original paths, full SHA and coordinator-verified provenance. A missing or abbreviated required SHA, a missing committed brief path or an unavailable pinned input blocks the affected work; never substitute current or latest files, a branch tip, chat context or an untracked build-audit brief. Missing Git does not waive a pin or authorize a new tool. Otherwise no checkpoint is required: an ordinary handoff needs no committed brief or document-input checkpoint.

## Build the proposal

1. Confirm the trusted grant, complete brief in the host handoff or an existing document, target base and permitted effects. If the assignment is checkpoint-pinned, apply [checkpoint-pinned inputs](#checkpoint-pinned-inputs); otherwise no checkpoint is required. Read only the relevant local grounding and reopen current source paths before relying on them.
2. State the user-visible outcome, why it matters, included scope, exclusions, and acceptance evidence. Separate observed facts from assumptions and unresolved decisions.
3. Match the plan's detail to the work. A clear single outcome may need one concise unit. When only a person can resolve product meaning, scope, acceptance or a missing setup choice, name the question and recommend `awaiting-human` for that affected work, even before implementation. A technical fact belongs in grounding and verification, not in a generic approval request. Preserve the brief's full delivery boundary rather than inserting approvals between already covered steps.
4. For multi-unit work, order vertical functional units so each has a demonstrable outcome, bounded scope, acceptance, relevant verification, dependencies, and a coherent commit/checkpoint. Do not invent line quotas or divide user value into frontend, backend, or storage phases. A mechanical change may use coherent mechanical units when vertical slices do not fit.
5. Size every unit as described in [Size units by verification cost](#size-units-by-verification-cost).
6. Give every dependency a concrete unblock condition. For code dependencies, name the contract and require its integration before dependent work starts unless the grant explicitly authorizes another local route. Do not treat a proposal, review pass, or unintegrated change as an integrated contract.
7. Include implementation verification, independent review when required, corrections, and re-verification of affected checks and review after changes. Select checks by behavior and risk. Do not prescribe an interview or TDD unless the unresolved decision or task makes it useful.
8. If stacking PRs is useful, present it as an optional local delivery proposal with each base, dependency, and ancestor-change recheck. State that it grants no remote permission.
9. Return a separately labeled plan proposal through the coordinator's authorized return channel; write an artifact only when explicitly authorized. Without artifact-write permission, return it in the host response for the coordinator to persist. Identify any assigned pinned inputs and the target base. Leave the canonical plan unchanged.

## Size units by verification cost

Give each proposed job a size of S, M or L with a one-line reason. Size by the cost of verifying the change, using these questions:

1. How many distinct user-visible flows or screens must the reviewer check?
2. Does the change carry concurrency, timing or security risk?
3. Can an independent reviewer read the whole change in one pass? This is a judgment, not a reviewer context or transport limit.
4. Would the worker have to improvise design decisions?

- **S:** one flow, no special risk, one review pass.
- **M:** two or three related flows, or one well-bounded special risk.
- **L:** anything else.

Dispatch S and M jobs as they are. Split an L job into independently useful functional parts, or record in the plan why it cannot be split. Do not use a line-count or other numeric threshold. When in doubt, choose the smaller size and proceed. Sizing is part of the plan text; it adds no planner dispatch or approval step.

## Stop conditions

Return a focused blocker when the grant, complete brief, authorized checkout, required acceptance or a necessary product decision is missing. A pinned input that [checkpoint-pinned inputs](#checkpoint-pinned-inputs) cannot resolve also blocks planning. Do not broaden scope, authorize a worker, invent durable records or infer remote permission from a delivery proposal.
