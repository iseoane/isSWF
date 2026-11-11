# I0048: Job sizing by verification cost

Type: enhancement

Source: https://github.com/iseoane/isSWF/issues/270. Operator decisions on 2026-11-11: "fits in one review pass" stays a judgment (no tie to reviewer context or transport limits); the S/M/L size and its reason live in plan/brief text, with no plan-schema change. Size of J001 itself: S (one methodology flow, docs-only, one review pass).

## J001

- Status: completed
- Objective: Planner and coordinator classify each job S/M/L by verification cost with a one-line reason, split or justify L jobs, and the retrospective records sizing misses.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- Planner role and coordinator unit-definition/re-plan guidance require an S/M/L size with a one-line reason per job, using the four verification-cost questions; no numeric or line-of-code threshold; when in doubt choose the smaller size.
- An L job is split into independently useful functional parts or carries a recorded justification for not splitting.
- The retrospective can record a sizing miss from more than one correction round or partial review coverage.
- Templates/guides that show a plan or brief example mention the size line where applicable, with Spanish mirrors kept equivalent; check-docs and focused tests pass; no new mandatory planner dispatch.

### Evidence

- Triage verified: roles/planner.md forbids LOC quotas without asking for size; coordinator re-plan treats signals as "not thresholds"; retrospective has no sizing evidence. No duplicate among closed issues.
- Worker commit 1d9a0d3 (planner.md, planning.md, retrospective.md, coordinator SKILL.md, job-brief template, docs en/es reference). Coordinator-observed on 1d9a0d3: check-docs PASS; host-portability, worker-method-evidence, worker-methodology, planner-task, release-package exit 0; diff check clean.
- Independent semantic review round 1 on supplied exact diff c4d25f4..1d9a0d3: PASS, 0 blocking, 2 non-blocking suggestions (retrospective template hint; brief size line copied from plan). Role-profile change needs operator approval before merge per REVIEW.md.
- Receipt: PR271 head bdf8ff81e2bb20c70b9cbb4434e548cf03957f9f, exact-head Quality SUCCESS 3/3 incl. Windows; operator-approved ("aplícalo") expected-head merge 3182141 on 2026-11-11; issue #270 closed.
- Release: PR272 version bump merged fa584c3fc331233cb5c32224281a14ec8e945200; main Quality run 43082554475 SUCCESS 3/3; v1.8.5 published with Linux/Windows archives, evidence and SHA256SUMS, re-downloaded and checksum-verified.

## J002

- Status: in-review
- Objective: Apply the two non-blocking J001 review suggestions: a sizing-miss prompt in the retrospective template, and the brief size line naming the plan as its source.
- Size: S (two template lines, one review pass, no special risk).
- Depends on: J001
- Brief: Small local request; this plan entry is the curated brief (operator request 2026-11-11: apply both suggestions, close everything, patch release).
- Blocker: None.
- Next step: PR exact-head CI, merge, patch release v1.8.6.

### Acceptance

- `.factory/templates/retrospective.md` findings section prompts for a sizing miss (recorded size vs correction rounds or review coverage).
- `.factory/templates/job-brief.md` size line states it is copied from the plan, which is the source.
- check-docs and focused template tests pass; no other scope.

### Evidence

- Worker commit dd0197e (two template lines). Worker self-reported it did not read its required role profiles; compensated by independent review, recorded here as a method deviation.
- Coordinator-observed on dd0197e: check-docs PASS; worker-method-evidence, worker-methodology, host-portability, release-package exit 0; diff check clean.
- Independent semantic review round 1 on supplied exact diff 08c209b..dd0197e: PASS, no findings.
