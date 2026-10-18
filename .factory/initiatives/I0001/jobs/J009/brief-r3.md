# I0001 / J009 / r3

## Objective

Allow a local browser session to submit a bounded note from a job card to a durable coordinator inbox. Recording a note is not applying a decision, accepting work or granting execution.

## Inputs and authority

Operator explicitly requested starting implementation after PR39/40 delivered readonly project navigation. Source base 07af9c178b98adae1e1ec4a129526d883cd6ae2d. No real model call, extra dependency, global service or automatic runtime effects are authorized.

## Acceptance for this cut

- Job cards with readable brief and delivery state offer a bounded note form. Notes retain displayed plan, brief and optional delivery hashes, job identity and timestamp.
- Exact local Origin, existing Host/site restrictions and a private process-session token are required. Notes use a dedicated POST form route; other action routes remain denied.
- Changed displayed hashes or unavailable evidence reject before recording. Invalid/oversized notes and duplicate fields reject. Responses are append-only exclusive per-ID files, never overwriting another response.
- Coordinator status and cards expose recorded notes with explicit unverified-author and not-applied semantics. No status, acceptance, grant, dispatch or model execution follows automatically.
- Tests exercise real local HTTP token/origin/stale/body/unsafe-file/replay/concurrent-post boundaries and preserve canonical plan and prior records. Inspect the actual form and confirmation in Chromium with a synthetic project, not a fabricated own-project acceptance.

## Limits

Loopback/session token is not operator identity authentication or protection against hostile local processes. Notes are plaintext evidence suitable for display, not secrets. No automatic consumer polling, coordinator wakeup, job-state transition, runtime liveness, full J009 or client-use security claim. A failed/partial write requires inspection, not automatic retry.

## Checks and integration

Portable quality, public HTTP regression, ESLint/Knip, actual browser test, one independent exact-candidate review, English PR and exact-head CI before authorized guarded merge.
