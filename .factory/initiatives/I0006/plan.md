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

- Status: in-review
- Objective: Document actual release installation and verify real compiled-runtime workflows before stable promotion
- Depends on: J001, J002
- Brief: [brief-r2.md](jobs/J003/brief-r2.md) (pending until prepared)
- Blocker: Final committed artifact validation, independent review and exact-head CI pending; do not promote based on fixture success alone.
- Next step: Build the final1.1.1 candidate, repeat actual SDK/provider validation and native review, require exact-head CI, then publish only the verified Linux x64 release.

### Acceptance

- Both README languages use actual private GitHub assets, checksums and extracted package paths with current preview limitations.
- Actual SDK and real provider-driven worker change pass protected checks, attributed boundary controls, scope and cessation gates.
- Claude host/model validation remains separate; changed candidates require applicable exact-head CI and independent review before stable.

### Evidence

- jobs/J003/brief-r1.md
- jobs/J003/brief-r2.md
- e457d0b54f910f2f20a5a7e66d3dfcc6dc3d1e6a
- tooling/.local/bun-release-delivery/stable-validation-root.txt
