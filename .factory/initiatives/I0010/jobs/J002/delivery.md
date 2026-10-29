# J002 delivery · Durable native coordination records

## What changed and why

Resolve #92: before first native dispatch, create minimal canonical plan/brief using the trusted factory guide and single active state root. Clarify file-only-role transcription, proportionate research/planning retention, collision-safe ownership and optional source CLI. Inline handoffs supplement records; legacy runtime/grants are not prerequisites. Correct tracking lookup to the selected state root. No new parser or scheduler.

## Checks and results

Functional candidate c818805c06140892c5c57454f36c2c46e3c346f5 against ebb0befdfb10a714e7804e07f28d51f052e8809d. Coordinator docs/diff checks PASS. Native Windows host-portability FAIL on unchanged CRLF frontmatter (#84); new assertions precede failure. Worker LF manual plan parse PASS; current CRLF plan parse FAIL. Full local suite/live adherence unrun; required remote CI pending. Later curated records leave five functional blobs unchanged.

## Independent review

V001: Standards PASS, Spec PASS, aggregate PASS; review 1/2, no blocking findings. Configured native reviewer openai/gpt-6.1-sol MEDIUM; actual identity unexposed. Full pinned methodology and exact Git materialization read; reviewer executed no shell checks. Static walkthrough covers new and legacy state, dual roots, inline task, read-only reports and active writers.

## Scope

Existing shared contracts, static regression and curated I0010 records only. No #84 repair, installation, release, deployment, dispatcher or state migration.

## Integration risk and recovery

LOW. Coordinators on both hosts consume this record lifecycle. Incorrect interpretation could omit evidence, overwrite records or collide with a writer. Explicit conflict refusal, single-state selection, completed pre-dispatch records, frozen ownership and attributed transcription bound those risks; existing execution and publication authority remains unchanged. Semantic review and static assertions support contract consistency, not live adherence. Detect through canonical plan/brief and report provenance; revert the five functional changes if necessary while preserving evidence already written. Revert cannot undo overwritten historical data or external operations; rollback not live-tested. CRLF portability remains a known separate limit; exact-head CI is mandatory.

## Closure and acceptance

Implementation and semantic review complete; PR publication and required CI pending. Apply repository LOW-risk expected-head integration permission only after checks pass. Cleanup of delivered feature branches/worktrees is explicitly authorized, subject to retention and cessation.

## Blockers and next action

Publish and inspect exact-head CI, preserving known local #84 failures. No further review required for unchanged functional blobs plus mechanically checked coordinator receipts.
