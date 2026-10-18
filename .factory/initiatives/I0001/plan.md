# I0001: Factory v1

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

- Status: awaiting-human
- Objective: Reconcile changed intake and duplicate requests
- Depends on: None
- Brief: [brief-r2.md](jobs/J002/brief-r2.md) (pending until prepared)
- Blocker: Revision and duplicate-link cuts integrated in PR33 and PR35; operator functional acceptance pending.
- Next step: Show the actual revision and duplicate-link outcomes to the operator; do not infer acceptance from CI.

### Acceptance

- An explicit reconciled revision preserves prior inputs; duplicates link evidence without authorizing another writer.

### Evidence

- .audit/intake-86-grounding-final.json
- https://github.com/iseoane/isSWF/pull/33
- https://github.com/iseoane/isSWF/pull/35
- f43b685ec20429f8a21a96836a4bfb4be4dab0b6
- .factory/initiatives/I0001/jobs/J002/A002.md
- .factory/initiatives/I0001/jobs/J002/V002.md

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
- Depends on: J001, J002, J003, J004, J005, J006, J007, J009, J010, J011, J012, J013, J014
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

## J011

- Status: in-progress
- Objective: Replace Pstack delegation with native factory agents
- Depends on: None
- Brief: [brief-r1.md](jobs/J011/brief-r1.md) (pending until prepared)
- Blocker: Native reviewer delegation seam is being grounded; no real runtime call or expanded worker route is authorized.
- Next step: Implement the smallest role-specific native delegation cut, prove offline safety and retain explicit gaps before any real-call request.

### Acceptance

- Coordinator grounding, implementation and independent review use native factory delegation with pinned own-role instructions, explicit grants and durable results, without requiring Pstack launchers.
- An end-to-end controlled case verifies the actual delegation boundary; Markdown-only role adaptation is not proof of runtime independence.

### Evidence

- None.

## J012

- Status: awaiting-human
- Objective: Show short descriptive initiative labels alongside stable IDs
- Depends on: None
- Brief: [brief-r1.md](jobs/J012/brief-r1.md) (pending until prepared)
- Blocker: Canonical title/label contract integrated in PR36; operator functional acceptance pending. Full panel remains J009.
- Next step: Use the actual status label and report corrections or accept the bounded display contract.

### Acceptance

- Lists, status and panel show a concise label such as I0001 · Factory v1, derived from one canonical initiative title.
- Stable IDs and paths remain unchanged; no duplicate editable plan or title state is introduced.

### Evidence

- https://github.com/iseoane/isSWF/pull/36
- 840c0eba2525b8559c17d96ac3c8c9844cc2f09c
- .factory/initiatives/I0001/jobs/J012/A001.md
- .factory/initiatives/I0001/jobs/J012/V001.md

## J013

- Status: pending
- Objective: Review audit retention and distribution before v1 closure
- Depends on: None
- Brief: [brief-r1.md](jobs/J013/brief-r1.md) (pending until prepared)
- Blocker: Operator explicitly requires careful audit review before v1 closure; no bulk cleanup authorized.
- Next step: Inventory dependencies and propose retention choices before moving or deleting evidence.

### Acceptance

- Review tracked audit evidence, references and reproducibility needs; distinguish durable job evidence from temporary logs and CI artifacts.
- Agree and apply a bounded retention policy before accepting v1, without indiscriminate deletion or rewriting history.

### Evidence

- None.

## J014

- Status: pending
- Objective: Keep target-installed factory executables under .factory/tools
- Depends on: None
- Brief: [brief-r1.md](jobs/J014/brief-r1.md) (pending until prepared)
- Blocker: Current Markdown package and source-checkout runtime are separate; the target executable distribution cut is not implemented.
- Next step: Ground the smallest distribution change without moving source files indiscriminately or copying development dependencies.

### Acceptance

- Executables actually installed in target projects live under .factory/tools with coherent imports and activation references.
- Development tooling and historical audit archives are not copied to target projects; installation and source-checkout use are distinguished and tested.

### Evidence

- None.
