# I0016: Bounded corrections and durable delivery closure

Type: enhancement

## J001

- Status: in-progress
- Objective: Resolve #122 with explicit finite correction and review budgets and automatic in-budget correction.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for preparation; independent review and exact-head CI remain required.
- Next step: Native worker implements the bounded instruction/test unit, then returns its report.

### Acceptance

- Define default budget accounting, materialize it before dispatch, correct in-budget FAILs without routine reconfirmation and stop on exhausted or uncovered authority.
- Preserve actor/model/cost limits and adverse verdicts; verify representative scenarios with existing static seams.

### Evidence

- Operator request: "Haz 122 y 129" selects these units and bounded feature-to-PR delivery, not integration or release.

## J002

- Status: pending
- Objective: Resolve #129 with a bounded follow-up checkpoint for later delivery receipts, preserving tested-source and publication identities.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None for preparation; independent review and exact-head CI remain required.
- Next step: Same sequential worker implements a separate functional commit after J001, then returns both outcomes.

### Acceptance

- Retain post-PR/post-merge/post-release receipts under actual grants; distinguish source and receipt commits without self-referential hashes.
- Explain pending records under narrower grants, ownership, affected checks and equivalent Pi/Claude Linux/Windows intent without new runtime machinery.

### Evidence

- #129 triage and current durable-work/feature-delivery contracts inspected at the starting source.
