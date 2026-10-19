# I0001 / J005 / r3

## Objective and authority

Extend the existing explicit shared execution pool to diagnostician and researcher callers. The operator authorized autonomous remaining-job implementation and necessary native reviews. This revision grants no live worker call, reboot, cleanup, client access or additional API cost.

## Scope

Reuse `tools/execution-capacity.mjs` and each normal caller. Diagnostic admission precedes probes and provider work. Researcher admission holds one reservation across the existing logical call, including approved retries and quota fallback. Routes, attempt budgets and permanent invocation claims remain unchanged.

A full pool blocks with zero provider attempts and no permanent attempt record. Known complete matching responses archive the caller's reservation. Blocked, uncertain and incomplete outcomes retain capacity. Legacy calls without a capacity grant remain outside the shared guarantee.

## Acceptance for this cut

- An occupied shared pool blocks the normal diagnostic caller before probes and provider work.
- A planner reservation blocks a researcher in a separate result store, without a provider attempt. Later admission uses the freed slot without replaying an invocation.
- Researcher retries and fallback retain the same reservation and session. Their existing attempt and quota rules still apply.
- Successful calls archive capacity, uncertain calls retain it, and wrong helper or policy hashes fail before execution.
- Durable capacity metadata identifies its role and logical job. Diagnostic readback rejects inconsistent metadata.
- Public tests, installed-SDK synthetic transport, relevant sandbox checks, aggregate quality and static checks pass. Review exact source independently before publication.

## Grounding and delivery

Diagnostic source is delivered by PR63 at main `6f24a68294e43700f66ff129afacdeff1c8adcd6`. Researcher source checkpoint is `5f570cfb0567843a1376bdd28c18431e3de21024`; a checkpoint is not publication or acceptance.

Read the normal callers in `tools/diagnostic-task.mjs` and `tools/researcher-task.mjs`, their public tests, the shared pool helper and `docs/model-routing.md`. The existing research caller advances its approved route only through its current quota and temporary-unavailability rules. No new fallback classifier or memory service is introduced.

## Remaining J005 acceptance

Worker admission, verified descendant cessation, dependency and cycle reasons, code-integration gates and complete cross-role multi-agent review-panel coverage remain pending. The HTML dashboard is not that review panel. Capacity is separate from provider budgets and operator acceptance. J005 stays in progress.
