# I0007: Evidence-led code review guidance

Type: enhancement

This coordinator-owned plan records reported progress, not execution permission or process liveness.

## J001

- Status: awaiting-human
- Objective: Improve proportionate review guidance and validate known-defect and valid-control cases without changing caller permissions
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: No local verification blocker. Independent review of the methodology, source commit, remote CI and publication have not been performed or newly authorized.
- Next step: Operator reviews the pending source change and the bounded evaluation; obtain any later checkpoint or publication authorization separately.

### Acceptance

- Behavior and relevant tests precede implementation; documentation uses appropriate preservation checks
- Optional detection experiments preserve readonly candidate identity and require an authorized disposable copy
- Review resulting structure and changed dependencies proportionately, with material findings prioritized
- Pinned reference transport, portable package checks, ESLint, Knip and bilingual documentation checks pass
- Bounded native comparison retains both defect detection and false-alarm outcomes without an unsupported improvement claim

### Evidence

- jobs/J001/brief-r1.md
- jobs/J001/evaluation.md
- tooling/.local/review-guidance-eval/quality-final.log
- tooling/.local/review-guidance-eval/summary.json
