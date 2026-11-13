# I0014/J001 r2: Assess the previous execution engine (started)

Supersedes brief-r1 for scheduling and authorization only; r1 grounding and boundaries still apply.

## Authorization (2026-11-13)

Operator explicit start in Claude Code: "coordinador nos ponemos con la I0014". Scope selected by the coordinator from the job objective: **read-only assessment and recommendation**. Authorized: reading this repository at baseline `a038066` (main), one native Claude researcher child (background, parent model inherited), coordinator updates to this initiative's records. Not authorized: code/doc/package edits, deletion, migration, cleanup, branch/push/PR, installation, live legacy executor runs. Any retirement implementation is a separate job needing its own explicit start.

## Task

Inventory the previous execution engine and answer: is it still needed now that Pi/Claude native delegation exists?

- Callers/consumers of tools/isswf-job.mjs, researcher-task.mjs, reviewer-task.mjs, planner-task.mjs, diagnostic-task.mjs and their shared modules; .factory/models.json routes and SHA/digest pins; tools/isswf.mjs init/managed paths; package/release allowlists; routing/lifecycle/install docs (EN/ES); tests.
- Classify each item: needed by current native flow / only legacy executor / historical evidence that must stay retrievable at original checkpoints / unknown.
- Check for live or unknown legacy actor state in .factory records (read-only).
- Recommend retention or a bounded retirement: proposed units, affected tests/docs/package behavior, compatibility for installed projects with existing legacy jobs, Linux/Windows and Pi/Claude verification, evidence retention per docs/durable-work.md and docs/installation.md.

## Methodology considered

- Researcher role: selected.
- design-principles: selected (module boundaries/contracts are in question).
- execution-principles: selected (migration of installed state).
- isswf-writing, tdd, e2e, security, performance, observability, interview: not triggered (no edits; objective clear).

## Budget and review

One researcher child, no corrections round inside this job. Result is a recommendation consumed by the coordinator and the operator; no independent review needed for a read-only proposal (operator decides).
