# J001 · Proportionate changed-candidate verification (#95)

## Outcome

Make the canonical changed-candidate rules agree: classify the delta under review.md, run affected checks, and obtain affected independent judgment only when required by the risk or explicit requirements. A purely mechanical correction must not force a fresh model call. Preserve adverse verdicts and exact-candidate evidence.

## Scope and authority

Base: 3ea750e0eab488c3de2f71daa2d266da8a37847a. Branch: fix/95-proportionate-reverification. Sequential writer in the assigned source checkout; coordinator owns publication and records. Edit only affected shared methodology, necessary existing tests and bilingual current guides if affected. Do not implement other issues, change host settings, install dependencies, launch providers, commit, push or merge. No nested actors. Coordinator selects roles; at most two independent reviews for this issue.

## Reading map

- .agents/roles/worker.md and .agents/skills/isswf-writing/SKILL.md plus its agent-documents reference.
- .agents/skills/isswf-coordinator/SKILL.md:95: current unconditional review-again language.
- .agents/roles/references/review.md: Choose sufficient verification and Candidate identity.
- .agents/roles/reviewer.md:36: changed-candidate checks and affected review.
- docs/durable-work.md: Record results and limits, and docs/en/development.md: Quality checks.
- tests/host-portability.mjs:31–43: existing methodology contract assertions.
- Canonical plan: .factory/initiatives/I0010/plan.md.

## Acceptance and checks

1. Coordinator, reviewer, review guide and durable-work contracts agree, without weakening mandatory independence, publication gates or failed/inconclusive verdict retention.
2. Evidence must refer to the changed candidate; unchanged scope may be reused only with sufficient applicability/provenance.
3. Add proportionate assertions to the existing host-portability regression; do not invent a new execution framework.
4. Static walkthrough: mechanical-only correction, semantic delta requiring judgment, and explicit independence requirement.
5. Run focused tests and docs check, plus git diff --check. Report exact results and unrun wider checks. Do not claim live-agent adherence from static checks.

## Quality inventory and stopping condition

Correctness: resolve contradictory rules with explicit delta coverage. Security: retain independent judgment at trust/permission changes. Maintainability: one canonical selection rule in review.md, brief cross-references elsewhere. Verification: existing static contract regression and walkthrough; not a live behavioral evaluation. Documentation: current user-facing guide changes need Spanish mirrors; canonical detailed agent resources stay English. No installation or clone detector required.

Return changed paths, acceptance coverage, actual checks, resource list, static walkthrough, risks and remaining limitations. Stop if a real product decision or authority gap appears. Worker does not write coordinator-owned plan/brief during execution.
