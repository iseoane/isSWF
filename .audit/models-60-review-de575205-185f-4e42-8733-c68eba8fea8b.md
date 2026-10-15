## Standards — FAIL
- **Hard gate failure:** `.audit/models-60-core-v1.json` records an `ENOENT` for `docs/model-routing.md` in the isolated review package. Per the reported cause, worker/coordinator links to root docs should be coded paths, not Markdown links that require those docs to be staged.
- The candidate diff alone does not include the routing guide, so I could not verify its exact preflight wording.

## Spec — BLOCKED
- `.audit/models-60-decision.md` says unknown or incompatible destinations block, while quota exhaustion or compatible-destination unavailability may advance within an approved route. It doesn’t clearly distinguish a **known compatible alternate** from one whose availability is unknown or failed verification. Clarify that only the former permits fallback; otherwise block. Test failure and review findings must remain non-fallback reasons.
- No full PASS: the recorded core check failed, and the guide needed to resolve this ambiguity was unavailable in the frozen diff.

**Gate result: FAIL / unresolved; do not accept as passing.**
