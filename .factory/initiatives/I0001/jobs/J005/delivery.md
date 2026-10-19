# J005 capacity, dependencies and review-panel delivery

## What changed and why

Participating native callers share one explicitly granted finite pool. Original workers verify task and tool cessation before releasing capacity; prerequisite admission distinguishes decisions, graph errors and unintegrated code before claiming execution. The final public test verifies successive review-panel slots using the existing runtime, not a scheduler.

## Visual summary

```text
pool limit 2: planner + reviewer P1
planner completes → P2 enters
P1 completes, verdict still inconclusive → P3 enters
P2 + P3 complete → unrelated work proceeds
```

## Scope

PR62–66 contain the SDK-role, worker and dependency cuts. This final unit adds fixture-only panel verification and quality wiring. All participating grants must name the same pool and policy. Legacy/unbound callers are outside that guarantee; this is not a machine-wide provider quota or authenticated identity service.

## Checks and results

- `node tests/review-panel-capacity.mjs .`: three distinct reviewers, two shared slots, refused admissions consume zero attempts, successive progress, unrelated progress, replay refusal and distinct session IDs.
- `node tests/worker-dependencies.mjs .`: decisions, missing evidence, cycles and wrong ancestry block before execution claims; grafts cannot fake integration.
- `node tests/worker-capacity.mjs . <existing-SDK-directory>`: synthetic-auth offline native workers verify isolation, integrated dependency execution, cessation-based release and conservative retention. No worker provider prompts.
- Aggregate quality, ESLint and Knip are separate checks. Exact candidate observations and review are retained in `panel-verification.json`; no live-provider panel is claimed.

## Independent review

Consult `panel-verification.json` for the exact candidate, observed checks and native review status. A synthetic participant's inconclusive report is test data, not an independent product review. Earlier source reviews remain in the existing per-cut verification records, with their original scope and limitations.

## Closure and acceptance

Technical delivery requires the required native review and exact PR/main CI gates. This card does not record operator acceptance. Acceptance concerns the disclosed cooperative, explicitly bound scope, not arbitrary callers or a live-provider five-role panel. J006 continuity, J007 context/security, J013 retention policy and whole-v1 acceptance remain separate.

## Integration risk and recovery

This final unit adds tests and their registration, not production execution behavior. Unknown or partial reservations remain occupied; no cleanup or replay is inferred. Existing original-worker-only dependency and capacity boundaries remain.

## Blockers and next action

Finish the exact-candidate independent review and publication gates. Then present this evidence for J005 acceptance and continue independent remaining jobs. A controlled reboot still needs its own explicit authorization.
