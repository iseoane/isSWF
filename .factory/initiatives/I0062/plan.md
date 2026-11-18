# I0062: Triaged issues #355 and #354

Type: enhancement

On 2026-11-18 the operator asked to triage the new issues and authorized labels and an initiative with one job per issue.

## J001

- Status: in-progress
- Size: S (one flow)
- Scope: factory.
- Objective: A read-only role can be dispatched for a retrospective or other non-job analysis without a job brief, while writers keep the brief requirement (#355).
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Implementation brief; recommended substitute evidence is a committed retrospective record path, which the guard can verify in Git.

### Acceptance

- A dispatch of `isswf:isswf-researcher` with the selected model and effort and no job brief, naming the substitute evidence, is accepted on Claude Code and Pi, or the gap is recorded per host.
- A worker dispatch without a job brief is still refused.

### Evidence

- 2026-11-18: three successive refusals while dispatching researchers for a retrospective (#355); `tools/isswf-dispatch-guard-core.mjs:103` requires the brief for every role.

## J002

- Status: pending
- Size: S (methodology text)
- Scope: factory.
- Objective: TDD and review weigh each proposed test's value against its cost (#354).
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: Operator product decisions recorded as brief questions.
- Next step: Operator answers the brief questions.

### Acceptance

- To be set after the operator's decisions.

### Evidence

- 2026-11-18: downstream suite growth and a duplicated parametrized test reported in #354; `.agents/roles/references/tdd.md:3` has only a ritual warning.
