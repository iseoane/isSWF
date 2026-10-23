# I0006: Bun executable distribution

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: completed
- Objective: Build a Bun executable package for Pi and Claude while preserving Node+mjs development and installed version/integrity/isolation contracts
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None for the bounded prerelease unit; stable workflows are tracked separately in J003.
- Next step: Retain exact prerelease evidence; do not claim stable workflow validation.

### Acceptance

- A committed-source Bun build exposes bin/isswf and compiled tool dispatch without requiring system Node or Bun
- Preserve receipts, source provenance, retained runtimes and explicit project pin selection
- Synthetic isolated worker accepts denied-write error semantics without accepting successful writes
- Native Linux artifact tests and portable regression checks pass; untested targets and live SDK limits remain explicit

### Evidence

- aea8dc7f0d4f901534d9fae61e025a69c94eb6e1
- https://github.com/iseoane/isSWF/pull/82
- https://github.com/iseoane/isSWF/actions/runs/39747142149
- jobs/J001/brief-r1.md
- 62c52118cb0cf94951997b9b99896dd17478a85d
- https://github.com/iseoane/isSWF/actions/runs/39841389833
- https://github.com/iseoane/isSWF/pull/82#issuecomment-6349955011
- https://github.com/iseoane/isSWF/releases/tag/v1.1.0

## J002

- Status: completed
- Objective: Admit complete coherent native-review evidence under explicit bounded grants without changing route, independence or cost controls
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None for the bounded prerelease unit; stable workflows are tracked separately in J003.
- Next step: Retain exact prerelease evidence; do not claim stable workflow validation.

### Acceptance

- Defaults stay20 files/64KiB; explicit grants cap64 files/1MiB
- Complete larger evidence persists and reads back without truncation; invalid budgets and replay refuse
- Import-only SDK metadata resolves without executing entrypoints; actual SDK synthetic controls pass
- Final exact candidate receives native review and applicable CI before Linux prerelease

### Evidence

- jobs/J002/brief-r1.md
- tooling/.local/bun-release-delivery/reviewer-capacity-tests.log
- tooling/.local/bun-release-delivery/reviewer-preflight.json
- 62c52118cb0cf94951997b9b99896dd17478a85d
- https://github.com/iseoane/isSWF/actions/runs/39841389833
- https://github.com/iseoane/isSWF/pull/82#issuecomment-6349955011
- https://github.com/iseoane/isSWF/releases/tag/v1.1.0

## J003

- Status: completed
- Objective: Document actual release installation and verify real compiled-runtime workflows before stable promotion
- Depends on: J001, J002
- Brief: [brief-r2.md](jobs/J003/brief-r2.md) (pending until prepared)
- Blocker: None for the stable Linux x64 reference Pi scope; native Claude contract validation is J004.
- Next step: Preserve exact release/tag/artifact evidence; do not infer native Claude parity.

### Acceptance

- Both README languages use actual private GitHub assets, checksums and extracted package paths with current preview limitations.
- Actual SDK and real provider-driven worker change pass protected checks, attributed boundary controls, scope and cessation gates.
- Claude host/model validation remains separate; changed candidates require applicable exact-head CI and independent review before stable.

### Evidence

- jobs/J003/brief-r2.md
- 9114a60d1a86c5599dc354adaa3facbe15fd9af0
- https://github.com/iseoane/isSWF/actions/runs/39850271143
- https://github.com/iseoane/isSWF/pull/82#issuecomment-6350824148
- https://github.com/iseoane/isSWF/pull/82#issuecomment-6350856505
- https://github.com/iseoane/isSWF/releases/tag/v1.1.1

## J004

- Status: completed
- Objective: Validate native Claude repair/review and correct the reported runtime/document handoff defects in an isolated source fixture
- Depends on: J003
- Brief: [brief-r2.md](jobs/J004/brief-r2.md) (pending until prepared)
- Blocker: None for the bounded handoff correction; publication and broader host guarantees are separate.
- Next step: Retain actual trace/audit and prior failures; distribute source corrections only through a separately gated new release, without replacing published1.1.1.

### Acceptance

- Observe actual approved Claude model and plugin with exactly one native writer and readonly reviewer, not a Pi or advisory substitute.
- Preserve exact candidate, original protected checks and nonmutable hashes; verify complete pinned-root/receipt and plan-path handoff.
- Keep failures and host limitations visible; no unapproved actor retry, global install, permission bypass or Pi isolation/recovery equivalence claim.

### Evidence

- jobs/J004/brief-r1.md
- jobs/J004/brief-r2.md
- 95251d6c40ce9fd3cfd77d0ddf1e4cde7b7179e5
- b2b2b437493ebaa3044b830bd5c7b2212a55fb77 (unpublished corrected-source fixture)
- tooling/.local/bun-release-delivery/claude-handoff-live-root.txt
- tooling/.local/bun-release-delivery/claude-handoff-fix-root.txt

## J005

- Status: in-review
- Objective: Publish aligned Linux x64 release1.1.2 containing the verified Claude context-handoff corrections
- Depends on: J004
- Brief: [brief-r1.md](jobs/J005/brief-r1.md) (pending until prepared)
- Blocker: Exact-candidate artifact/host validation, independent source review and CI required before publication.
- Next step: Commit and verify the retained1.1.2 candidate, then publish only verified new assets without moving main or changing prior releases.

### Acceptance

- Package/core/plugin1.1.2 aligned and conditional bilingual download instructions accurate.
- Exact artifact passes relevant mechanical/real Pi and Claude checks with complete handoff evidence and preserved scope.
- Sufficient native independent Standards/Spec review and exact-head CI pass before tag/draft/assets verification and stable publication.

### Evidence

- jobs/J005/brief-r1.md
- tooling/.local/bun-release-delivery/release-1.1.2-root.txt
