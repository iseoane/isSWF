# I0030: Interview proposes alternatives for open gaps

Type: enhancement

## Objective and authority

When an interview gap has no clear answer, `isswf-interview` offers two or three alternatives with trade-offs and one recommendation, instead of a single recommended answer. The interview stays convergent: each gap still ends as a confirmed decision or a recorded assumption. Operator request 2026-11-05 ("lo de la propuesta de ideas recomendada me gusta"; "de momento crea las iniciativas"). This plan records preparation only.

## Decisions

- confirmed by operator: alternatives are offered only for open gaps, not for every question.
- confirmed by operator: grilling-style batched rounds and frontier are rejected; one question at a time stays.

## J001

- Status: pending
- Objective: Add an alternatives branch for open gaps to isswf-interview.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Awaiting an explicit operator start instruction; preparation only.
- Next step: Operator starts implementation, for example with a feature-to-PR start.

### Acceptance

- `.agents/skills/isswf-interview/SKILL.md` defines an open gap (no answer derivable from sources, or the operator is undecided) and requires two or three alternatives with trade-offs and one recommendation for it.
- Questions with a clear recommended answer keep the current single-recommendation format.
- The outcome rule is unchanged: a chosen alternative is recorded as `confirmed by operator`; an unanswered one as an `assumption` with the recommended alternative.
- Batched rounds are not introduced; one question at a time remains.
- Affected English guides and their Spanish mirrors stay consistent; `check-docs` and interview-related tests pass.

### Evidence

- None.
