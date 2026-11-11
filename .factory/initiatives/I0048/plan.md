# I0048: Job sizing by verification cost

Type: enhancement

Source: https://github.com/iseoane/isSWF/issues/270. Operator decisions on 2026-11-11: "fits in one review pass" stays a judgment (no tie to reviewer context or transport limits); the S/M/L size and its reason live in plan/brief text, with no plan-schema change. Size of J001 itself: S (one methodology flow, docs-only, one review pass).

## J001

- Status: pending
- Objective: Planner and coordinator classify each job S/M/L by verification cost with a one-line reason, split or justify L jobs, and the retrospective records sizing misses.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Dispatch a native worker on branch feat/i0048-job-sizing.

### Acceptance

- Planner role and coordinator unit-definition/re-plan guidance require an S/M/L size with a one-line reason per job, using the four verification-cost questions; no numeric or line-of-code threshold; when in doubt choose the smaller size.
- An L job is split into independently useful functional parts or carries a recorded justification for not splitting.
- The retrospective can record a sizing miss from more than one correction round or partial review coverage.
- Templates/guides that show a plan or brief example mention the size line where applicable, with Spanish mirrors kept equivalent; check-docs and focused tests pass; no new mandatory planner dispatch.

### Evidence

- Triage verified: roles/planner.md forbids LOC quotas without asking for size; coordinator re-plan treats signals as "not thresholds"; retrospective has no sizing evidence. No duplicate among closed issues.
