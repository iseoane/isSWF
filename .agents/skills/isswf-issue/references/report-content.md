# Write a triage-ready report

Use the verified destination's issue template and language. The content should let a maintainer assess the report without access to the original conversation. Keep facts and hypotheses separate and omit irrelevant details. Missing information stays explicit instead of being fabricated to satisfy a form.

## Bug report

Include:

- A title describing observable failure rather than an unproven cause.
- What happened and the condition in which it occurred.
- Expected behavior and its relevant contract or requirement, when known.
- Minimal reproduction steps, or a clear statement that reproduction is unavailable, unsafe, intermittent, or not yet confirmed.
- Relevant version or revision, installation mode, host and environment. Include model and effort only when relevant to the failure; do not guess values.
- Impact, affected scope, and whether the current assignment is blocked.
- Small sanitized evidence and any verified workaround.
- Suspected cause only if useful, clearly labeled as a hypothesis.

For a factory report, name the factory-owned skill, tool, or contract involved rather than relying on private project concepts. Record the actual pinned version when available; the globally installed package may not be the version the project used.

Do not perform a destructive reproduction to complete the report. A report can be ready for triage while investigation remains incomplete.

## Feature or improvement proposal

Include:

- The user need and who benefits.
- What prevents or complicates the task today.
- The desired observable outcome.
- Material scope and exclusions.
- Relevant alternatives or workarounds, when known.
- Observable acceptance examples when the idea is concrete enough, with open decisions explicit.
- Relevant impact or compatibility concerns if supported by evidence.

A proposal need not contain a full technical design or implementation plan. Do not invent approved acceptance criteria, priorities, estimates, or implementation commitments. State suggested criteria as proposals.

## Finishing checks

Confirm that the report is independent of the current assignment or explicitly requested as such, its destination owns the problem, private data is excluded, evidence is accurately described, and remaining questions are useful for triage.

Every new issue uses `needs-triage`. That state means assessment is pending even when the report includes a reproduction or a detailed proposal. Apply labels through the publication procedure, not merely as text in the issue body.
