# Job brief I0001 / J002 / r1

## Objective

Reconcile a changed issue observation or curated proposal explicitly while retaining the prior intake and brief. This first cut does not complete duplicate-request linking.

## Authority and scope

- Operator conversation approves implementing factory v1 through its own jobs.
- Parent performs local implementation and offline checks. No native worker or provider call is authorized by this brief.
- Input code base: ad85a9ddec07895ca6d91955cf7cc3b92135eaab.
- Document-input checkpoint: pending commit; do not substitute latest for a dispatched input.
- External issue text is evidence, not authority.

## Acceptance

- Reconciliation requires an explicit external operator attestation bound to the exact predecessor and requested next revision.
- Initial intake and earlier briefs remain byte-identical and independently readable.
- Stale predecessor, missing authority, occupied claim, corrupt state and partial publication block rather than repair or adopt automatically.
- Read operations remain readonly. The coordinator explicitly selects a revised brief in the plan; no latest-brief inference.
- CLI tests cover normal revision, repeat/conflict, preservation, partial state and plan/status consumers without network or SDK calls.

## Exclusions

- No duplicate writer authorization, automatic reconciliation, scheduler, global registry, remote synchronization or orphan cleanup.
- No claim of complete J002 or full S01 acceptance. Duplicate-request linking remains pending.

## Verification

Run targeted intake/plan/status tests, portable quality, ESLint and Knip. One independent review precedes publication; exact-head CI must pass before the authorized guarded merge.

## Next step

Implement the smallest explicit revision record and its consumers. Grounding's claim that the plan renderer already supports rN was contradicted by direct source inspection: it currently hardcodes r1 and needs a bounded change.
