# Planning guidance

Use this reference when the coordinator asks for a plan proposal. The proposal is a decision aid, not an authorization or an update to the canonical plan.

## Build the proposal

1. Confirm the trusted grant, durable brief path, full Git SHA for the document-input checkpoint, distinct target base, and permitted effects. Resolve the brief and its references at that checkpoint. An absent or abbreviated checkpoint blocks planning; never substitute the latest files. Read only the relevant local grounding and reopen current source paths before relying on them.
2. State the user-visible outcome, why it matters, included scope, exclusions, and acceptance evidence. Separate observed facts from assumptions and unresolved decisions.
3. Match the plan's detail to the work. A clear single outcome may need one concise unit. Uncertainty that could change product scope or the delivery route belongs with the coordinator; a technical fact belongs in grounding and verification.
4. For multi-unit work, order vertical functional units so each has a demonstrable outcome, bounded scope, acceptance, relevant verification, dependencies, and a coherent commit/checkpoint. Do not invent line quotas or divide user value into frontend, backend, or storage phases. A mechanical change may use coherent mechanical units when vertical slices do not fit.
5. Give every dependency a concrete unblock condition. For code dependencies, name the contract and require its integration before dependent work starts unless the grant explicitly authorizes another local route. Do not treat a proposal, review pass, or unintegrated change as an integrated contract.
6. Include implementation verification, independent review when required, corrections, and re-verification of affected checks and review after changes. Select checks by behavior and risk. Do not prescribe an interview or TDD unless the unresolved decision or task makes it useful.
7. If stacking PRs is useful, present it as an optional local delivery proposal with each base, dependency, and ancestor-change recheck. State that it grants no remote permission.
8. Return the proposal as a separate artifact in the location assigned by the coordinator. Identify every pinned input and the target base. Leave the canonical plan unchanged.

## Stop conditions

Return a focused blocker when the grant, durable brief path, full-SHA document-input checkpoint, pinned inputs, exclusive checkout, required acceptance, or a necessary product decision is missing. Do not resolve the brief or its references from latest files when the checkpoint is absent or abbreviated. Do not broaden scope, authorize a worker, or infer remote permission from a delivery proposal.
