# I0014: Assess retirement of the previous execution engine

Type: maintenance

Scheduling priority: **ultra-low**. Backlog only; do not start automatically, consume agents or expand current I0013. This is an independent future outcome, not another item under I0009.

## J001

- Status: pending
- Objective: Determine whether the previous isSWF execution engine and its model-route configuration remain necessary, and propose a safe bounded retirement if justified.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: Deferred by the operator at ultra-low priority; no implementation or actor allocation authorized.
- Next step: Wait for an explicit future start; then inspect actual consumers, pins, ownership and retained evidence before proposing deletion or migration.

### Acceptance

- Distinguish active capabilities and current consumers from historical records; no assumption that any old execution is active or that legacy compatibility must remain forever.
- Assess previous worker/researcher/reviewer/planner/diagnostic callers, models.json routes, installer/package defaults and related docs/tests against native Pi/Claude needs.
- Recommend justified retention or a bounded retirement with compatibility, evidence retention, Linux/Windows and Pi/Claude verification, and separately authorized migration/deletion where necessary.
- Preserve unique work, original pinned inputs, parked executor/PR87 evidence and unrelated operator changes; no automatic cleanup or reactivation.

### Evidence

- Operator explicitly requested registering this future job at ultra-low priority after asking which old executions models.json serves.
- Existing source contains previous execution callers and installer/package consumers; their existence is not proof of active use or continuing product need.
- Current I0013 concerns native model configuration ownership only; this backlog registration does not enlarge its author scope.
