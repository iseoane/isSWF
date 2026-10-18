# I0001 / J002 / r2

## Objective

Complete the explicit duplicate-request link after the revision cut delivered in PR33. Preserve r1 and earlier reports.

## Authority and inputs

- Operator approved continuing v1 with factory jobs and reviewed integration.
- Source base: 5056f58e603e2e409e7f53f6758e6dc606850c39.
- Document checkpoint: pending commit, not a dispatched worker input.
- Parent performs implementation and offline checks. No native worker/provider call is granted.

## Acceptance

- An explicit external operator decision binds the source intake, a different existing target intake revision, explanation and evidence.
- Link publication preserves all existing briefs and intake records; repeat is idempotent and conflicts block.
- Read/prepare/reconcile show the duplicate disposition. Preparation/reconciliation cannot silently continue linked work as a new implementation.
- Missing authority/evidence, stale target/source and unsafe references block. No title-based matching or automatic latest selection.
- Public CLI tests prove immutable preservation and existing source/target reads; status shows the linked disposition without changing plan-owned job status.

## Limits

No global registry, cross-scope identity census, semantic duplicate detector, scheduler, remote effects or automatic execution. A link records a decision, not proof that all possible duplicate jobs have been found. No claim that source text or an external file alone authenticates the operator.

## Checks and delivery

Targeted CLI tests, portable quality, ESLint and Knip; one independent review; exact-head CI before guarded merge. Final acceptance remains the operator's.
