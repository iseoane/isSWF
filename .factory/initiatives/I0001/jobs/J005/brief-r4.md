# I0001 / J005 / r4

## Objective and authority

Add optional worker participation to the existing explicit shared execution pool. The operator authorized remaining-job implementation and necessary native reviews, not live worker provider calls, reboot or cleanup.

## Scope and acceptance for this cut

- The normal original-worker CLI accepts a separate external capacity grant bound to the exact input, runtime, job, attempt, pool policy and helper hash.
- Acquire execution capacity before permanent writer admission or task preparation. A full pool blocks without consuming an attempt or creating a permanent writer claim.
- If atomic admission loses a race, only its same-process reservation owner may cancel, after checking that neither its attempt directory nor job binding exists. Preserve an archival cancellation receipt.
- Successful worker release requires matching private job and dispatch bindings, successful terminal output, and verified kernel cessation of the task and every recorded tool PID namespace. Terminal JSON alone is insufficient.
- Failed, partial, live, mismatched and uncertain executions retain capacity. Reading status never releases a reservation. Permanent logical admission remains non-reusable.
- Public portable tests, actual sandbox API tests and normal CLI installed-SDK synthetic-auth offline controls cover admission, concurrency, release, retention and replay. No worker provider prompt is authorized or required.
- Independent native review assesses exact source and runtime evidence before publication; exact PR and main CI must pass.

## Grounding and delivery boundaries

Researcher participation is delivered by PR64 at main `f54311f8c8bdd0a1774827a276f0276787ba0ba1`, following reviewer/planner PR62 and diagnostic PR63. Worker source checkpoint `663ab1bc3d8901768cb2b972c0de13a5adad27c6` has a passing native affected review; this checkpoint alone is not publication or operator acceptance.

The completion helper and recovery module are pinned into the private lifecycle attempt. This is a cooperative operator-owned record boundary, not protection against malicious rewriting by that operator. Capacity grants do not authorize provider spending. Legacy callers without capacity remain outside the shared guarantee. Capacity with successor admission is explicitly unsupported in this cut.

## Remaining J005 acceptance

Dependency and cycle reasons, code-integration gates and complete cross-role multi-agent review-panel coverage remain pending. The HTML dashboard is not that review panel. J005 stays in progress; J006 reboot remains unauthorized.
