# I0030: Interview proposes alternatives for open gaps

Type: enhancement

## Objective and authority

When an interview gap has no clear answer, `isswf-interview` offers two or three alternatives with trade-offs and one recommendation, instead of a single recommended answer. The interview stays convergent: each gap still ends as a confirmed decision or a recorded assumption. Operator request 2026-11-05 ("lo de la propuesta de ideas recomendada me gusta"; "de momento crea las iniciativas"). Start authorized 2026-11-06 (feature-to-PR, no merge).

## Decisions

- confirmed by operator: alternatives are offered only for open gaps, not for every question.
- confirmed by operator: grilling-style batched rounds and frontier are rejected; one question at a time stays.

## J001

- Status: completed
- Objective: Add an alternatives branch for open gaps to isswf-interview.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Operator integration decision on the PR.

### Acceptance

- `.agents/skills/isswf-interview/SKILL.md` defines an open gap (no answer derivable from sources, or the operator is undecided) and requires two or three alternatives with trade-offs and one recommendation for it.
- Questions with a clear recommended answer keep the current single-recommendation format.
- The outcome rule is unchanged: a chosen alternative is recorded as `confirmed by operator`; an unanswered one as an `assumption` with the recommended alternative.
- Batched rounds are not introduced; one question at a time remains.
- Affected English guides and their Spanish mirrors stay consistent; `check-docs` and interview-related tests pass.

### Evidence

- Worker commits 3341937 and 265bb77 (correction cycle 1). Independent semantic review round 1: pass/pass with S1-S3; round 2 (operator-authorized) on delta 265bb77: pass/pass.
- Coordinator rerun on the closing candidate: check-docs, host-portability and git diff --check exit 0. Static review only; no agent interview evaluation ran.
