# Execution principles

Load this reference for parallel work, migrations, retries, delegation, or repeatable changes; apply only the relevant parts.

## Ownership before parallelism
**Trigger:** actors might write the same checkout, branch, file, state, or external effect. **Action:** assign ownership and exclusive workspaces; parallelize independent units and collect results through a shared sequence. If a canonical resource must be shared, serialize it structurally. **Limit:** instructions are not concurrency control; separate files do not prevent collisions in remote effects. Do not declare a resource free until its writer is confirmed to have stopped.

For compatible jobs, the coordinator may use distinct logical job references and attempt IDs through the normal entry, with a separate derived workspace for each writer. Concurrent capacity and cumulative worker authorization are separate limits; neither is inferred from the number of checkouts. Same-workspace overlap is refused even when proposed file scopes differ. Keep an uncertain writer's slot occupied until its cessation is confirmed. Do not release its durable admission or authorize a replacement automatically.

Keep the waiting reason and exit condition in the existing plan or brief: dependency (the named contract integrated at a verified target base), capacity (an execution slot becomes available within the grant), operator decision (the named answer), or cycle (the conflicting dependency edges are resolved). A stopped job awaiting human acceptance can free an execution slot without satisfying an integration dependency or resetting its total worker budget. A successful process or reviewed draft PR is not integration. Unrelated authorized work may continue when its ownership, capacity, and dependencies are known; one blocked job does not cancel another.

These are caller decisions, not a native dependency scheduler, global lock, or new queue. The normal entry's exclusive claims and derived workspaces protect cooperative use within its fixed private store; they do not control arbitrary external writers or other stores.

## Autonomy within the assignment
**Trigger:** the next step is clear and covered by the current assignment. **Action:** continue without routine permission requests and report status, evidence, and pending items concisely. Keep useful slots available: consume completions and results as they arrive instead of leaving them unattended until the user's next prompt. In a feature-to-PR assignment, this includes the covered coordinator-owned branch commits, push, PR and CI actions; a prepare-only helper returning is not a workflow stop. **Limit:** preserve each actor's actual capabilities and finite grant; setup policy or a label alone grants nothing. Do not claim model quota without measurement. Record `awaiting-human` for a concrete product, scope, permission or integration decision, and a technical blocker for an unresolved runtime/resource condition. Integration into the base branch, auto-merge, deployment and release remain separate human decisions.

## Reconcile before retrying
**Trigger:** resumption, partial failure, or an external effect with an uncertain response. **Action:** inspect existing state and effects before repeating; reconcile, retry convergently, or block with concrete evidence. **Limit:** do not promise exactly-once execution or blindly repeat remote operations. Cancellation is a request until cessation is verified; it does not reverse effects or guarantee descendants stop.

## Migrate contracts carefully
**Trigger:** replacing an internal API whose consumers are known. **Action:** migrate internal callers and remove the old API in the same verifiable unit. **Limit:** public APIs, persisted formats, and external integrations need compatibility or versioning policy and authorization; a temporary adapter with a defined removal point may be necessary.

## Automate and encode when justified
**Trigger:** a procedure repeats or manual verification leaves insufficient evidence. **Action:** create the smallest tool or check that justifies its cost and can be rerun. Encode recurring mechanical mistakes in structure or checks; keep judgment, exceptions, and proportionate context in instructions. **Limit:** do not add scripts, frameworks, types, or lints as a ritual or turn a contextual rule into a universal mandate.

## Operational risk

For sensitive work, identify access, permissions, data, loss risks, migration, resources, and cancellation strategy before execution. Use runtime boundaries only when observed. Do not publish secrets or client data. If the system cannot enforce an authorized boundary, block that step with the concrete missing fact.
