# Factory v1 final evidence review

## What changed and why

`acceptance-matrix.json` reconciles all 61 spec IDs with exact evidence hashes, observed scope and limitations. It is not an automatic product PASS.

## Checks and results

`node tests/v1-acceptance.mjs .` verifies coverage, record bytes and negative controls. Independent semantic review and exact publication CI remain separate gates.

## Independent semantic outcome

Three independent audit scopes covered all 61 IDs once. Standards passed; Spec remained **inconclusive**. [The retained reports](semantic-review.json) preserve that result and the corrected stale-acceptance finding. The matrix is a coordinator reconciliation, not a claim that every spec behavior passed independent verification. Operator acceptance does not change the audit verdict.

## Closure and acceptance

The operator explicitly accepted all reported jobs: “Y da todos por aceptados”. The canonical plan records that decision separately from pending technical checks. Shared-store client summaries remain blocked; actual client store/process verification is required before use. No new worker, reboot, deployment or cleanup is authorized.

## Blockers and next action

Complete independent review of this reconciliation's accuracy and guards, then exact PR/main CI. Preserve the inconclusive semantic audit, recorded acceptance and limitations; do not ask for the same acceptance again or mark missing checks as passed.
