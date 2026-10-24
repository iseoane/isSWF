---
name: isswf-security
description: Assess security risks or implement authorized hardening for trust boundaries, access control, sensitive data, agent tools, or dependency changes. Use for threat modeling, scoped security reviews, and abuse-case verification.
---

# Assess and harden a bounded surface

Use this utility in any project, directly or through an assigned role. Follow the target's instructions and current grant. It does not require factory activation, create a security specialist or provide scanning tools. A clean scanner result is not proof that the system is secure.

## 1. Establish the mode and boundary

Choose the requested outcome: threat-model proposal, read-only assessment, or implementation of an explicitly authorized hardening change. Identify the exact candidate, assets, relevant consumers, environment and permitted observations. An assessment alone does not authorize fixes, dependency installation, network scans or exploitation.

Inspect the real entry points and existing controls. Map who can supply each value, including files, configuration, process metadata, dependencies, model output and tool arguments; local origin does not make data trusted. Record assets and the boundaries crossed. Ask only for missing product decisions or access that cannot be established from authorized sources.

This step ends with a bounded surface and permitted actions, or a concrete blocker.

## 2. Model plausible abuse

For each relevant boundary, name the actor, precondition, abuse path, asset at risk and expected denial or containment. Consider impersonation, tampering, loss of accountability, disclosure, resource exhaustion and privilege escalation where applicable. Distinguish observed weaknesses from hypotheses needing a probe.

Select controls for that surface rather than applying a universal web checklist:

- **Identity and access:** distinguish authentication from permission to act on the particular resource or tenant. Check session/token lifetime and revocation where relevant.
- **Input and output:** validate external data at boundaries, constrain size and resource consumption, parameterize queries/commands and encode output for its destination. Review redirect and server-side fetch destinations where present.
- **Files and processes:** inspect path containment, symlink/hardlink behavior, ownership, check/use races and process identity when these affect authorization or destructive operations. A path marker or saved status is not authenticated authority.
- **Sensitive data:** minimize collection and exposure in responses, logs, traces, fixtures, prompts and artifacts. Check retention, deletion and backup boundaries when required. Do not echo real credentials to demonstrate a leak.
- **Agents and tools:** treat retrieved text and model output as untrusted data. Enforce permissions, tenant separation, finite budgets and destructive-action boundaries in runtime code, not only prompts. A skill or profile is not a sandbox.
- **Dependencies:** when the graph or installation policy changes, inspect the owning manifest/lockfile boundary, provenance, relevant advisories, transitives and lifecycle scripts. Follow the dependency section of [review guidance](../../roles/references/review.md#changed-dependencies); unchanged dependencies do not trigger a blanket audit.

This step ends with evidence-linked risks and the smallest useful verification for each material uncertainty.

## 3. Verify safely and change only when assigned

Prefer existing tests, static inspection and controlled abuse cases using disposable data. Show both the intended allowed behavior and the forbidden effect for access controls. Record exact commands, candidate identity, substitutions and outcomes. A fixture narrows the claim to the boundary it exercises.

Active scans, production access, external requests, real credentials and data-changing probes require their own applicable permission and bounded impact. Never run a destructive probe merely because it is called a security test. If a necessary probe is unavailable, leave the affected conclusion inconclusive and name the missing evidence.

For authorized hardening, fix the confirmed mechanism at its owning boundary. Preserve legitimate use, add a meaningful regression check where feasible, and rerun affected checks on the new candidate. Do not weaken a failing test, claim a hypothesis confirmed, or widen the assignment to obtain a clean report.

## 4. Return a decision package

Report mode, scope and candidate; trust boundaries and assets; findings with paths, conditions, evidence, impact, confidence and recommended controls; actual checks and their observer; residual risks, missing evidence and next action. Separate confirmed defects, open hypotheses and cleared risks. Use [isswf-review](../isswf-review/SKILL.md) when independent Standards/Spec judgment is assigned; an author's hardening check is not that review.

A text-only or restricted execution assesses only supplied pinned sources and observations. It cannot install a scanner, inspect an unseen environment or inherit parent integrations. Report unavailable capability instead of inventing verification. No result grants publication, deployment, certification or a compliance guarantee.
