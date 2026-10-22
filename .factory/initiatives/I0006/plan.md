# I0006: Bun executable distribution

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: in-progress
- Objective: Build a Bun executable package for Pi and Claude while preserving Node+mjs development and installed version/integrity/isolation contracts
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: No independent review or non-Linux execution evidence yet
- Next step: Implement a committed-source compile stage and verify the real packed artifact

### Acceptance

- A committed-source Bun build exposes bin/isswf and compiled tool dispatch without requiring system Node or Bun
- Preserve receipts, source provenance, retained runtimes and explicit project pin selection
- Synthetic isolated worker accepts denied-write error semantics without accepting successful writes
- Native Linux artifact tests and portable regression checks pass; untested targets and live SDK limits remain explicit

### Evidence

- docs/en/future-actions.md
- tooling/.local/binary-evaluation/results.json
