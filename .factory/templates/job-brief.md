# Job brief

## Identity and authorization

- Job ID and brief revision:
- Source issue or request:
- Trusted authorization reference (operator conversation or record ID, or external path; if tracked in Git, full Git SHA):
- Request mode: `<feature-to-PR start | prepare-only | read-only | local-only | other explicit scope>`.
- Repository and permitted side effects:
- Current feature-start or other authorization source; explicit overrides: `<not inferred from setup, labels or this template>`.
- Operation ownership: `<coordinator-owned Git/PR/CI; bounded worker/reviewer operations>`.
- Profile path and applicable skills:
- Coordinator-assigned ID; do not reuse it:

## Objective

- Observable outcome:
- Why this work is needed:

## Scope and acceptance

- Included paths or behavior:
- Explicit exclusions:
- Acceptance criteria:
- Checks and expected evidence:

## Independent review

- Required: yes or no
- Criteria: Standards and Spec criteria the reviewer must assess:
- Constraints: reviewer profile, model and effort, read-only requirement, exact candidate identity, and any excluded areas:

## Inputs and bases

- Document-input checkpoint (full Git SHA):
- Target codebase base (full Git SHA):
- Referenced input paths (relative paths resolve at the input checkpoint by default):
- Initiative spec path and revision, if applicable:
- Current plan path and revision, if applicable:
- Grounding or prior evidence:
- Advisory context, when used: explicit memory project or indexed checkout, selected observation/source references, and current-source verification at the target base:
- Context gaps, when relevant: unavailable or rejected lookup, direct-source fallback, or the specific unresolved decision that blocks this job:

## Dependencies and ownership

- Dependencies:
- Unblock condition for each dependency:
- Exclusive writable checkout or worktree:
- Coordinator owns the plan and this brief revision. The worker owns its attempt artifact.
- Block if an input, authorization, dependency, or checkout is unknown. Do not resolve to latest.

## Execution and checkpoints

- Requested model and effort:
- Effective model and effort, when known:
- Checkpoint cadence or stopping point:
- Setup readiness reference and current preflight evidence; unresolved technical limits:
- Delivery destination: `<repository/remote, integration base, exclusive feature branch; no default direct integration-branch push>`.
- Finite cumulative actor/correction-call and cost limits:
- Commit policy and required checkpoint evidence: `<a feature-to-PR brief carries the already selected coordinator commit/push/PR/CI scope, without a second operator approval>`.
- Concrete wait: `<awaiting-human question and resume answer/grant, or technical blocker and exit condition>`.
- Integration decision: `<awaiting-human for the verified PR; no merge/auto-merge from the feature start>`.
- Do not commit unless this brief explicitly authorizes it.
- Return artifact paths, changed paths, checks and observed results, risks, and blockers.
