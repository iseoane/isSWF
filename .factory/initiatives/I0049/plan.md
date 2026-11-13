# I0049: Proportional verification by workers and coordinator

Type: enhancement

Source: operator observation during I0046 (Claude Code session, 2026-11-12): workers rerun the full suite repeatedly, invent mutation experiments and add tests that add no value. Wanted as a factory improvement for every project and host, not only for I0046. Related, already completed: I0048 (job sizing). Every job is S or M, never L. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: in-review
- Objective: Make workers run only the checks their change affects and leave the full suite to the coordinator once, when needed.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Semantic review of the whole I0049 candidate after J003.

### Acceptance

- Worker profile and coordinator brief guidance link the existing rule in docs/en/development.md (focused tests and check-docs locally; full suite only when packaging is touched) instead of copying it.
- Worker reports name the checks not run; the coordinator runs the full suite at most once on the final candidate, only when the rule requires it, and otherwise relies on PR CI.
- Same outcome for Pi and Claude Code; en/es docs equivalent if user guides change; check-docs and focused methodology tests pass.

## J002

- Size: S
- Status: in-review
- Objective: Make new tests and mutation experiments earn their place.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: None.
- Next step: Semantic review of the whole I0049 candidate after J003. Worker A001 was blocked by auto-mode no-verdict on .agents edits; the coordinator applied its prepared edits with operator authorization 2026-11-13 after reading isswf-writing.

### Acceptance

- A new test must cover a behavior or risk named in the acceptance criteria or brief; duplicate or self-referential tests are not added.
- Mutation experiments run only when the brief asks or a reviewer proposes one for a concrete doubt (review.md); workers do not add them on their own.
- Coordinator briefs name the risks to test rather than only listing cases; Pi and Claude Code parity; check-docs and focused methodology tests pass.

## J003

- Size: S
- Status: in-progress
- Objective: Fix review findings in proportion to their likelihood and impact.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: Coordinator applies r1 (operator start 2026-11-13); pilot from I0046 becomes the default rule.

### Acceptance

- Independent review stays as selected today; it is not removed or weakened.
- Findings in extremely unlikely cases with low impact are recorded as known limits, not turned into corrections; acceptance criteria are written proportionally (no absolutes such as "always" for edge cases) — operator decision 2026-11-12 after I0046 J006 needed three rounds for oversized transcripts.
- Pi and Claude Code parity; check-docs and focused methodology tests pass.
