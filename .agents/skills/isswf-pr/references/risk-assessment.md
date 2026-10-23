# Assess integration risk

Assess the consequences of integrating the exact change, not the author's confidence or the diff size. Scale detail to plausible failures; a few concrete sentences can cover a bounded change. Inspect relevant behavior and consumers before claiming a restricted impact.

## Required content

Cover these dimensions in prose or a compact table. State why a dimension is not applicable rather than leaving a material gap.

| Dimension | Required reasoning |
| --- | --- |
| Affected parties and scope | Name affected users, consumers, components, data, or operational procedures, including relevant indirect effects. |
| Plausible failure and conditions | Explain what could fail and under what conditions, rather than listing generic hazards. |
| Impact | Describe the consequence and its extent, including security, privacy, data integrity, compatibility, availability, or cost when relevant. |
| Likelihood and uncertainty | Explain what evidence supports the estimate and what remains unknown. Avoid invented probabilities or numerical scores. |
| Mitigation and evidence | Name controls and checks that address the failure. Separate verified controls from proposed or untested mitigations. |
| Detection and recovery | Explain how the failure would be noticed and corrected. Distinguish reverting code from undoing data changes, messages, permissions, published artifacts, or other effects. State recovery limits and whether rollback was tested. |
| Residual risk | Name remaining exposure, missing evidence, and necessary follow-up despite mitigation. |

## Classification

Use the project's required vocabulary if it has one, while retaining this reasoning. Otherwise choose:

- **Low:** impact is bounded and relevant evidence supports sufficient controls for the identified failures.
- **Medium:** a meaningful regression or shared impact remains plausible and requires specific reviewer or operational attention.
- **High:** plausible failures have serious consequences, such as significant data loss, sensitive-data exposure, or major disruption. Name the conditions and remaining exposure even if likelihood is uncertain.
- **Undetermined:** essential information is missing and no defensible classification can yet be made. Name the missing evidence and the smallest useful next check.

State uncertainty separately from the level. Known potentially severe consequences must remain visible; uncertainty is not grounds to hide them behind an undetermined label. Do not average unrelated risks into a lower overall label. Explain the material risk that drives the overall assessment.

Passing tests, a small diff, a documentation-only label, or reversible code alone do not justify low risk. Documentation can change commands, permissions, or operator decisions. Assess those effects when present.

## Evidence and integration boundaries

Missing required checks or review remain explicit blockers under project rules. This assessment can recommend a targeted check or mitigation, but cannot waive an existing gate or certify acceptance. A high-risk candidate can have a useful description without being approved for integration.

Reassess affected risks when the base, candidate, scope, evidence, or relevant deployment assumptions change. Keep assessment and evidence tied to the inspected identity. A static source inspection is not proof of live rollback, provider behavior, or successful deployment.
