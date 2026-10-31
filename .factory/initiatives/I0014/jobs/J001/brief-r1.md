# I0014/J001: Assess and potentially retire the previous execution engine

## Request and scheduling

Operator asks to register this work for some future time at **ultra-low priority**. Preparation/backlog only: no start, agents, implementation, remote publication, installation, migration, deletion or cleanup authorized. Current I0013 work continues unchanged. Reuse the sole existing .factory state; never create another active root.

## Future outcome

Establish whether native Pi/Claude delegation makes the previous isSWF executors and their separate model-route configuration unnecessary. If evidence supports retirement, prepare a coherent bounded removal or migration proposal; otherwise document the concrete remaining need rather than preserving compatibility indefinitely by label alone.

## Initial grounding, to reverify when started

Potential consumers: tools/isswf-job.mjs, researcher-task.mjs, reviewer-task.mjs, planner-task.mjs, diagnostic-task.mjs; pinned models.json SHA/digest inputs; tools/isswf.mjs initialization and managed paths; package/release allowlists; routing/lifecycle/install docs and relevant tests. Native hosts use different supported mechanisms. No old execution has been established active by this registration. Existing I0009/PR87 retained evidence and historical pins do not grant resumption or deletion.

## Future acceptance and boundaries

- Inventory actual callers, consumers, platform/host dependencies, installed compatibility commitments and any live/unknown actor state before deciding scope.
- Separate executable code/defaults that can be retired from historical evidence that must remain retrievable at original checkpoints. Follow docs/durable-work.md and docs/installation.md where applicable.
- Retain unique work/backups, exact pinned bytes, original paths and operator edits. Unknown writer state blocks destructive replacement/cleanup.
- Propose justified deletion/consolidation only, with affected tests/docs/package behavior and supported Pi/Claude Linux/Windows verification. Do not create a new execution engine, dispatcher or configuration layer as a substitute.
- Any migration, destructive cleanup or remote write needs its own applicable current authorization. Recording this brief grants none.
- No mandatory live model calls or actors now; finite roles/budgets and exact baseline/checkpoint must be established if explicitly started later.

## Next boundary

Wait for explicit future selection by the operator. This record is not an execution queue, grant, or commitment to a schedule.
