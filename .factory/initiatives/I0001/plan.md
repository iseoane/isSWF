# I0001: Complete the remaining factory v1 features

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: awaiting-human
- Objective: Expose a read-only initiative/job status view
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: First read-only CLI cut integrated in PR31; operator product acceptance pending. The complete v1 panel is tracked separately in J009.
- Next step: Operator can accept the bounded CLI or report corrections; no worker remains active for this cut.

### Acceptance

- One command summarizes the existing plan and job records with provenance, blockers and unavailable or stale evidence, without mutating records.

### Evidence

- https://github.com/iseoane/isSWF/pull/31
- 018fa69f5b774c26ccf280df499fb02582f22343
- .factory/initiatives/I0001/jobs/J001/A001.md
- .factory/initiatives/I0001/jobs/J001/V001.md
- .audit/status-84-proof.json

## J002

- Status: in-progress
- Objective: Reconcile changed intake and duplicate requests
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: Explicit reconciliation first cut in preparation; duplicate linking remains part of the remaining J002 criteria.
- Next step: Implement and verify predecessor-bound reconciliation offline; preserve r1 records and require explicit plan adoption.

### Acceptance

- An explicit reconciled revision preserves prior inputs; duplicates link evidence without authorizing another writer.

### Evidence

- .audit/intake-86-grounding-final.json

## J003

- Status: pending
- Objective: Validate a real ambiguous idea through delivery
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: No implementation assigned yet; ordering is priority, not an invented code dependency.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- Necessary product decisions lead to approved functional jobs and verified delivery without forcing an interview for clear work.

### Evidence

- None.

## J004

- Status: pending
- Objective: Validate retrospective proposals without duplicates
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md) (pending until prepared)
- Blocker: No implementation assigned yet; ordering is priority, not an invented code dependency.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- A supported finding becomes a proposal; repeating the analysis links the existing proposal and does not alter active work.

### Evidence

- None.

## J005

- Status: pending
- Objective: Complete capacity, dependencies and panel slot guarantees
- Depends on: None
- Brief: [brief-r1.md](jobs/J005/brief-r1.md) (pending until prepared)
- Blocker: No implementation assigned yet; ordering is priority, not an invented code dependency.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- The v1 admission and slot criteria are checked without introducing a broader scheduler by default.

### Evidence

- None.

## J006

- Status: pending
- Objective: Validate machine-restart recovery and remaining continuity cases
- Depends on: None
- Brief: [brief-r1.md](jobs/J006/brief-r1.md) (pending until prepared)
- Blocker: No authorization for reboot or new runtime calls.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- A separately authorized controlled case preserves evidence and blocks uncertain writers/effects; no reboot is granted by this plan.

### Evidence

- None.

## J007

- Status: pending
- Objective: Complete optional context and security boundary evidence
- Depends on: None
- Brief: [brief-r1.md](jobs/J007/brief-r1.md) (pending until prepared)
- Blocker: No implementation assigned yet; ordering is priority, not an invented code dependency.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- Project separation, explicit degradation and capability/effect boundaries are verified before client use.

### Evidence

- None.

## J008

- Status: pending
- Objective: Review complete v1 evidence and obtain operator acceptance
- Depends on: J001, J002, J003, J004, J005, J006, J007, J009, J010
- Brief: [brief-r1.md](jobs/J008/brief-r1.md) (pending until prepared)
- Blocker: All v1 evidence and operator acceptance are pending.
- Next step: Ground and authorize the bounded implementation/checks before starting.

### Acceptance

- Remaining spec criteria are reconciled with exact evidence and limitations; only the operator accepts the complete product.

### Evidence

- None.

## J009

- Status: pending
- Objective: Complete the v1 local observation panel beyond the CLI first cut
- Depends on: J001
- Brief: [brief-r1.md](jobs/J009/brief-r1.md) (pending until prepared)
- Blocker: The CLI first cut is not the full v1 panel. Define the bounded panel interaction and its security checks before implementation.
- Next step: Ground the smallest panel using the integrated PR31 read-only contract; no separate writable state store.

### Acceptance

- The panel and coordinator consume the same canonical records, distinguish unknown/stale/runtime evidence and keep commands behind the coordinator boundary.

### Evidence

- docs/spec-v1.md
- https://github.com/iseoane/isSWF/pull/31

## J010

- Status: awaiting-human
- Objective: Remove redundant plan snapshots and use guarded Git history
- Depends on: None
- Brief: [brief-r1.md](jobs/J010/brief-r1.md) (pending until prepared)
- Blocker: Integrated in PR32 with exact-head CI green; operator product acceptance pending.
- Next step: Operator can accept the bounded Git-only history behavior or report corrections; no worker remains active.

### Acceptance

- A changed revise requires exact prior bytes committed at HEAD, keeps expected-SHA guards, creates no plan-hash copy and preserves existing snapshot bytes in Git before removal.

### Evidence

- .audit/plan-85-retention.json
- .audit/plan-85-red.stderr
- .audit/plan-85-green.txt
- https://github.com/iseoane/isSWF/pull/32
- ad85a9ddec07895ca6d91955cf7cc3b92135eaab
- .audit/plan-85-proof.json
