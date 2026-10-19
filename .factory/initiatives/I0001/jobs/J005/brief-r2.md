# I0001 / J005 / r2

## Objective and authority

Implement the first finite-capacity admission cut through normal native reviewer and planner callers. The operator requested autonomous completion of remaining v1 jobs and authorized necessary native calls. This brief adds no worker invocation, reboot, cleanup, client access or extra API-cost grant.

## Scope

Use one explicit operator-owned immutable pool policy and exact helper hash in each participating external grant. Distinguish temporary execution slots from permanent logical-job admission and total actor/provider budgets. Reuse the existing callers, not a daemon, generic scheduler or new role framework.

An atomic slot claim precedes probes/provider work. Known complete matching native responses free their own capacity while preserving completed reservations. Uncertain, blocked or partial claims remain occupied without interpreting an external cessation boolean. A full pool blocks before provider work and leaves no permanent attempt claim.

## Acceptance for this cut

- Reviewer and planner executions in separate result stores share one finite pool, with two compatible synthetic executions admitted and a third refused with zero provider attempts.
- A later review-panel entry uses freed capacity through a distinct attempt/result store, without recycling a completed invocation.
- Failed/uncertain outcomes retain capacity; wrong helper or policy hashes fail before execution.
- Legacy calls without a pool remain explicitly outside the shared-capacity guarantee.
- Existing caller and SDK tests, aggregate quality, lint and dead-code checks pass. Review the exact candidate independently before publication.

## Remaining J005 acceptance

OPS-07–09 and MOD-07 remain authoritative. Worker/researcher/diagnostic admission, actual worker descendant-cessation proof, dependency integration/cycle reasons, and complete cross-role review-panel coverage are not satisfied by this first cut. No HTML-dashboard scheduling is implied. The initial approved concurrency limit is two, configurable, not a provider-call budget.

## Grounding and checkpoints

Examined source base: `a6f96cb929da25c4cc02d172da6c613991b7c06e`. Read `tools/reviewer-task.mjs` and `tools/planner-task.mjs` preparation, exclusive attempt creation, response classification and result publication; `.agents/skills/isswf-coordinator/SKILL.md` step 5; `tools/worker-lifecycle.mjs` terminal/descendant limits; and `tools/native-recovery.mjs` identity-bound cessation checks. Own planner proposal is retained in [A002.md](A002.md), including coordinator corrections. Its proposed scope is not automatic authority.

The retained failing-before caller test observed a third execution completing instead of being capacity-blocked. The implementation checkpoint must identify actual source bytes, not a future invented SHA. The coordinator owns adoption and delivery; the operator owns product acceptance.
