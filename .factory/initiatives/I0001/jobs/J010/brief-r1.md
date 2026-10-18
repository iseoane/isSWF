# Job brief I0001 / J010 / r1

## Objective and authorization

Keep one current plan.md and use Git for history. The operator explicitly approved this simplification after observing redundant plan-hash files while using I0001. Own-repository source changes and the existing reviewed PR/CI/authorized merge workflow only. No provider call, paid worker, reboot, dependency installation, unrelated cleanup or client-project access.

## Scope and acceptance

- Stop automatic plan-hash snapshot generation.
- Before a changed revision, require exact current plan bytes at its path in Git HEAD; staging alone is insufficient.
- Block before claiming a lock if a checkpoint is predictably missing; retain expected-SHA and cooperating writer guards.
- Preserve existing tracked snapshot bytes in Git before removing only the redundant I0001 snapshot from the current tree.
- No-op preparation remains a no-op; read remains read-only.
- Run public RED/GREEN controls, full portable quality, ESLint and Knip; independent review and exact-head GitHub CI precede authorized merge.

## Inputs and ownership

- Target codebase base: f13b9c9ed511f1d6a18fa2bfe96d3ae2ff140933.
- Document-input checkpoint: pending commit for this new brief; no native worker dispatched.
- Contract: docs/durable-work.md. Implementation: tools/isswf-plan.mjs.
- Finding source: operator conversation and J001/A001.md.
- Coordinator owns the current plan; old attempt/review conclusions are not rewritten.
- Existing snapshot retention proof: .audit/plan-85-retention.json.

## Next step

Complete the independent candidate gate and publication checks. Product acceptance is not granted by this brief.
