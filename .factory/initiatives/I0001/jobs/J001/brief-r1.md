# Job brief I0001 / J001 / r1

## Identity and authorization

- Source: operator request to use factory jobs for the remaining v1 features.
- Scope: own repository iseoane/isSWF; parent implementation and offline checks only.
- Trusted reference: current operator conversation approving the v1 jobs and prior authorized reviewed PR/CI/merge workflow.
- No new paid worker/provider calls, reboot, deployment, dependency installation or client-project access are authorized.

## Objective

Provide a read-only status view over existing initiative plans and job records so the operator does not reconstruct progress from logs.

## Scope and acceptance

- Read one authorized project's canonical initiative plan and existing job artifacts.
- Show declared status, dependencies, blockers, next action, evidence and record provenance.
- Distinguish reported progress from process liveness and unknown/unavailable records.
- Read operations do not create, update or repair records.
- Include public CLI fixtures for normal, absent, malformed and unsafe paths.
- Exclude a web panel, scheduler, new writable status store and automatic remote synchronization from this first cut. Those exclusions do not remove the full v1 panel requirement.

## Inputs and bases

- Target codebase base: 55c1ac8c7ca0019adc5893cf34dbc0671c17523a.
- Document-input checkpoint: pending commit and separate dispatch; do not substitute the base as the checkpoint for these new records.
- Product roadmap: docs/plan-v1.md.
- Current execution plan: .factory/initiatives/I0001/plan.md.
- Record contract: docs/durable-work.md.
- Existing implementations: tools/isswf-plan.mjs and tools/isswf-intake.mjs.

## Ownership and review

- Coordinator owns plan and brief revisions; workers/reviewers do not rewrite their conclusions into another status database.
- Parent writes source; one independent read-only review covers the exact candidate and affected checks.
- Preserve prior issue21 records and unrelated untracked artifacts.
- Product acceptance is distinct from technical completion and merge.

## Quality discovery

- lint: configured-unverified; evidence: tooling/quality/eslint.config.mjs. Verify the documented command and its result before reporting a pass.
- tests: configured-unverified; evidence: tools/check-quality.mjs. Verify the documented command and its result before reporting a pass.
- build: not-detected; evidence: not detected. Determine whether compilation is applicable; document the build or an explicit not-applicable decision.
- deadcode: configured-unverified; evidence: tooling/quality/knip.json. Verify the documented command and its result before reporting a pass.
- duplication: not-detected; evidence: not detected. Review repeated logic; add a clone detector only if its maintenance cost is justified.

Bounded file/script discovery only, not execution or exhaustive language detection. Missing evidence is not a pass or proof of absence. Build not-applicable requires an explicit project decision. No installation or script execution.

## Next step

Inspect the native record shapes, choose the smallest read-only consumer, then implement and test it within this scope. A native worker dispatch still needs its own concrete grant and committed input checkpoint.
