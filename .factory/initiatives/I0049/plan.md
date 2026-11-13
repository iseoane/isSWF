# I0049: Proportional verification by workers and coordinator

Type: enhancement

Source: operator observation during I0046 (Claude Code session, 2026-11-12): workers rerun the full suite repeatedly, invent mutation experiments and add tests that add no value. Wanted as a factory improvement for every project and host, not only for I0046. Related, already completed: I0048 (job sizing). Every job is S or M, never L. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: S
- Status: completed
- Objective: Make workers run only the checks their change affects and leave the full suite to the coordinator once, when needed.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: None. Merged into main through PR #283 by operator decision 2026-11-13.

### Acceptance

- Worker profile and coordinator brief guidance link the existing rule in docs/en/development.md (focused tests and check-docs locally; full suite only when packaging is touched) instead of copying it.
- Worker reports name the checks not run; the coordinator runs the full suite at most once on the final candidate, only when the rule requires it, and otherwise relies on PR CI.
- Same outcome for Pi and Claude Code; en/es docs equivalent if user guides change; check-docs and focused methodology tests pass.

### Evidence

- Review R1 (native isswf-reviewer, model inherited, diff 91196e8..1ed3414 without `.factory`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking.
- Coordinator applied S1 (no documented rule or no CI: run the full suite once or report it as not run), S2 (a selected skill may also ask for a sensitivity experiment), I1 (Status passage keeps Blocker/Next step fields) and I2 (J003 brief r2 records the operator start).
- Focused checks after corrections: check-docs, host-portability, worker-method-evidence, worker-methodology, review-guidance, reviewer-task, diagnostic-task. Full suite left to PR CI.

## J002

- Size: S
- Status: completed
- Objective: Make new tests and mutation experiments earn their place.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: None.
- Next step: None. Merged into main through PR #283 by operator decision 2026-11-13.

### Acceptance

- A new test must cover a behavior or risk named in the acceptance criteria or brief; duplicate or self-referential tests are not added.
- Mutation experiments run only when the brief asks or a reviewer proposes one for a concrete doubt (review.md); workers do not add them on their own.
- Coordinator briefs name the risks to test rather than only listing cases; Pi and Claude Code parity; check-docs and focused methodology tests pass.

### Evidence

- Review R1 (native isswf-reviewer, model inherited, diff 91196e8..1ed3414 without `.factory`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking.
- Coordinator applied S1 (no documented rule or no CI: run the full suite once or report it as not run), S2 (a selected skill may also ask for a sensitivity experiment), I1 (Status passage keeps Blocker/Next step fields) and I2 (J003 brief r2 records the operator start).
- Focused checks after corrections: check-docs, host-portability, worker-method-evidence, worker-methodology, review-guidance, reviewer-task, diagnostic-task. Full suite left to PR CI.

## J003

- Size: S
- Status: completed
- Objective: Fix review findings in proportion to their likelihood and impact.
- Depends on: J002
- Brief: [brief-r2.md](jobs/J003/brief-r2.md)
- Blocker: None.
- Next step: None. Merged into main through PR #283 by operator decision 2026-11-13.

### Acceptance

- Independent review stays as selected today; it is not removed or weakened.
- Findings in extremely unlikely cases with low impact are recorded as known limits, not turned into corrections; acceptance criteria are written proportionally (no absolutes such as "always" for edge cases) — operator decision 2026-11-12 after I0046 J006 needed three rounds for oversized transcripts.
- Pi and Claude Code parity; check-docs and focused methodology tests pass.

### Evidence

- Review R1 (native isswf-reviewer, model inherited, diff 91196e8..1ed3414 without `.factory`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking.
- Coordinator applied S1 (no documented rule or no CI: run the full suite once or report it as not run), S2 (a selected skill may also ask for a sensitivity experiment), I1 (Status passage keeps Blocker/Next step fields) and I2 (J003 brief r2 records the operator start).
- Focused checks after corrections: check-docs, host-portability, worker-method-evidence, worker-methodology, review-guidance, reviewer-task, diagnostic-task. Full suite left to PR CI.
- Review R2 (native isswf-reviewer, model inherited, delta 1ed3414..8700760 supplied inline, post-merge at operator request): Aggregate PASS; R1 findings S1, S2, I1, I2 resolved. N1 (information): the no-rule/no-CI exception followed the instruction it overrides; the coordinator rewrote the sentence with its conditions first in the I0050 PR, operator decision 2026-11-13.
