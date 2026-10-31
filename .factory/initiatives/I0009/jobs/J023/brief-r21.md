# J023: Scope reduction and closure path

Operator decision (2026-10-31), after coordinator value assessment:

- Finish the in-flight Claude route correction (brief-r20) and one review round on its candidate; then PR, exact-head CI, integration on operator approval.
- **Status operation removed from J023 scope.** Not planned under J023; may be proposed later in docs/en/future-actions.md only if a concrete need appears.
- **Actual tool use is no longer a mandatory acceptance gate** for every review, nor the deferred Pi closure condition (brief-r17). The tools remain available and optional. Already observed: Claude actual use (V009). Pi actual use: not observed; recorded as not required, not as passed.
- Default review evidence: coordinator-generated exact `git diff --binary base..candidate` file with SHA-256, read by the reviewer; the bound tools are an option when convenient.
- Rationale: reviewers' Read/Grep/Glob already reach any repository file, so narrowing Git access gives little containment; the binding is coordinator-chosen; host-specific costs (separate `claude -p`, output truncation/saving) are high relative to completeness benefits that a coordinator digest already provides.
- After integration J023 closes with this reduced acceptance; next per operator order is J032.
