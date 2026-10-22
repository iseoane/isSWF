# I0006: Bun executable distribution

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: in-review
- Objective: Build a Bun executable package for Pi and Claude while preserving Node+mjs development and installed version/integrity/isolation contracts
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: Independent review pending; native evidence extension in progress. No release or merge before sufficient review and exact-head CI.
- Next step: Review the complete final candidate using the native caller, then publish only the gated Linux x64 prerelease.

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

## J002

- Status: in-progress
- Objective: Admit complete coherent native-review evidence under explicit bounded grants without changing route, independence or cost controls
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: Final checks and exact-candidate native invocation pending
- Next step: Commit and verify the bounded extension, then prepare and inspect one independent review package

### Acceptance

- Defaults stay20 files/64KiB; explicit grants cap64 files/1MiB
- Complete larger evidence persists and reads back without truncation; invalid budgets and replay refuse
- Import-only SDK metadata resolves without executing entrypoints; actual SDK synthetic controls pass
- Final exact candidate receives native review and applicable CI before Linux prerelease

### Evidence

- jobs/J002/brief-r1.md
- tooling/.local/bun-release-delivery/reviewer-capacity-tests.log
- tooling/.local/bun-release-delivery/reviewer-preflight.json
