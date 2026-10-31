# Job brief

## Identity and authorization

- Job ID and brief revision:
- Source issue or request:
- Trusted authorization reference (operator conversation or record ID, or external path; if tracked in Git, full Git SHA):
- Request mode: `<feature-to-PR start | prepare-only | read-only | local-only | other explicit scope>`. A new dispatch requires a trusted explicit start and bounded action scope; record actual dispatch only after the host tool reports it. Do not infer actor liveness or dispatch from this brief or plan status.
- Repository and permitted side effects:
- Current explicit start or other authorization source; bounded action scope and explicit overrides: `<a design choice or brief approval alone is preparation, not start authority; do not infer permission from setup, labels or this template>`. If start is absent/ambiguous, record the exact missing instruction in the plan's existing blocker/next step and keep the job prepared, not started.
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
- Selected methods and required evidence: `<list only methods selected for this job; resolve each canonical skill and required reference at the pinned checkpoint. For each method, state the observable evidence needed to assess application and its provenance, or state that no method is selected. For selected TDD, require a test-only RED commit before the production change and the following GREEN commit for each behavioral contract; this is the TDD red result before implementation. Name the command and failing assertion so a reviewer can rerun both commits. When honest RED is impossible, require the reason and consequence as a declared deviation; disclosure does not waive acceptance. Examples for other methods: debug reproduction and discriminating causal check; E2E journey/surface and sensitivity or boundary evidence required by that skill. Do not create universal TDD/E2E requirements or require blanket evidence for unselected methods>`.
- Required engineering references and application evidence: `<list only references required for this task. For each, require reference → concrete application in the candidate (path/line or commit), or “not applicable / deliberately not applied” with a reason. Reviewer records “observed in candidate”, “claimed, not visible”, or “not applicable accepted”; this is not a per-line checklist>`.
- Required-resource consumption evidence: `<for each required resource, report consumed or missing and observed (host trace) or self-reported; trace unavailability leaves consumption self-reported>`.

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
- Finite cumulative actor/correction-call and cost limits: `<materialize before dispatch; default ceiling per functional unit is two independent review rounds total including initial review, and one correction cycle total. Bundle first-review findings into the cycle; repeat affected checks and required review after correction. This is a ceiling, not a mandatory second review. Explicit tighter grants, including zero, and lower combined-assignment ceilings prevail. Name actor/model/effort, calls, time and cost; account spent budget on resume without reset. Technical failures consume applicable attempts; no automatic retry or substitution>`
- Commit policy and required checkpoint evidence: `<a feature-to-PR brief carries the already selected coordinator commit/push/PR/CI scope, without a second operator approval>`.
- Concrete wait: `<awaiting-human question and resume answer/grant, or technical blocker and exit condition>`.
- Integration decision: `<awaiting-human for the verified PR; no merge/auto-merge from the feature start>`.
- Do not commit unless this brief explicitly authorizes it.
- Return artifact paths, changed paths, checks and observed results, risks, and blockers.
