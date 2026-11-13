# I0014: Assess retirement of the previous execution engine

Type: maintenance

Scheduling priority: **ultra-low**, started by the operator on 2026-11-13. Do not start further units automatically or expand current I0013. This is an independent future outcome, not another item under I0009.

## J001

- Status: completed
- Objective: Determine whether the previous isSWF execution engine and its model-route configuration remain necessary, and propose a safe bounded retirement if justified.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None
- Next step: Retirement units J002 (U1) and J003 (U2) to be prepared; each needs an explicit start.

### Acceptance

- Distinguish active capabilities and current consumers from historical records; no assumption that any old execution is active or that legacy compatibility must remain forever.
- Assess previous worker/researcher/reviewer/planner/diagnostic callers, models.json routes, installer/package defaults and related docs/tests against native Pi/Claude needs.
- Recommend justified retention or a bounded retirement with compatibility, evidence retention, Linux/Windows and Pi/Claude verification, and separately authorized migration/deletion where necessary.
- Preserve unique work, original pinned inputs, parked executor/PR87 evidence and unrelated operator changes; no automatic cleanup or reactivation.

### Evidence

- 2026-11-13: operator explicitly started I0014 (read-only assessment scope). brief-r2 supersedes brief-r1 for authorization only.
- 2026-11-13: native Claude researcher (parent model inherited, self-reported consumption of role, research, design and execution principles; no trace) returned at a038066: no live legacy runs in repo records; legacy tools have no native consumer; native-recovery is still loaded by isswf.mjs activity() from retained pinned runtimes; .factory/models.json still seeded by init. Recommends bounded retirement U1/U2. Unknowns: external runs stores, other installed projects, docs/review-original-evidence.md.
- 2026-11-13 operator decisions: (1) retire; (2) installed projects must update: migration refuses while legacy attempts are open, which are reconciled under their original pin first (option a, no bridge release); (3) retire the SDK researcher/reviewer/planner/diagnostic callers too unless something outside uses them; (4) finish I0014 first, then realign I0009 (J029/J030) to what was removed.
- Operator explicitly requested registering this future job at ultra-low priority after asking which old executions models.json serves.
- Existing source contains previous execution callers and installer/package consumers; their existence is not proof of active use or continuing product need.
- Current I0013 concerns native model configuration ownership only; this backlog registration does not enlarge its author scope.

## J002

- Status: completed
- Objective: Stop seeding the legacy route file in new installations and block version migration while registered legacy attempts remain unreconciled.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None
- Next step: None; J003 continues the retirement.

### Acceptance

- New installs do not get .isswf/models.json; existing copies are preserved.
- Version migration and inspect block while registered legacy attempts have open effects, pending recovery reviews or unknown state.
- Focused tests with negative controls; EN/ES docs updated; CI green on Linux and Windows.

### Evidence

- 2026-11-13: worker A001 (commits ec3c60f..10b8fc3); review V001 pass; PR #287 head 60c22e1, CI run 43415983829 passed on that exact head (portable checks, package and host discovery on ubuntu and windows).
- 2026-11-13: operator approved; PR #287 merged into main as c8259b9 with expected-head protection.

## J003

- Status: in-progress
- Objective: Remove the legacy executor tools, SDK callers, their tests, package entries and legacy contracts (EN/ES), keeping history retrievable.
- Depends on: J002
- Brief: [brief-r2.md](jobs/J003/brief-r2.md)
- Blocker: None
- Next step: V002 passed; push, PR, exact-head CI. Integration needs operator approval (workflows, packaging, host guides). Then realign I0009 J029/J030.

### Acceptance

- Legacy executor tools, SDK callers, their tests and package entries are removed; launcher, status and migration still work.
- Legacy contracts removed from current EN/ES docs and remain retrievable in Git history.
- CI green on Linux and Windows.
