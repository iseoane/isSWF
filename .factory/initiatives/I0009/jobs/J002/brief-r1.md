# J002: Windows external plan grant boundaries (#83)

## Objective and authorization

The operator explicitly requested coordinator-led corrections for #83 and #84, preserving Windows and Linux compatibility. Local code/test/document changes and necessary independent needs-triage reports are authorized. No automatic implementation of new findings, source commit, push, PR, merge, installation or provider-cost increase is inferred. A prior reporting-only boundary is superseded for these two issues only.

## Grounding and implementation unit

Examined base: 809e3b1f05c0acfb9eb2e23bb8fac5c0e7086f3b. Issue #83's observed acceptance is external grants reaching the next validation stage, not unverified complete Windows publication. tools/isswf-plan.mjs canonicalizes the grant with realpath before a relative-path containment test. Replace only the POSIX separator assumption with path.sep. Keep grant schema, permissions, canonicalization and rejection of internal/root grants intact.

One functional unit includes the guard, native external/internal/root/prefix-sibling/canonical-alias regression, portable and native-matrix check wiring, and this evidence. Test proposal validation deliberately stops before durable publication, so directory fsync cannot mask the boundary result. The native pinned-launcher journey separately exercises a valid proposal.

## Execution and verification

The current Windows source has no reconciled activated worker binding and the native isolated lifecycle requires Linux; no worker, alternative dispatcher or provider was used. Coordinator-owned local implementation continued under the explicit request. Verification mode is combined: mechanical boundary/absence assertions and pending independent semantic assessment of authority containment. Native independent review has not been dispatched and must not be presented as passed.

Windows test RED: valid external sibling produced 'grant must be external' instead of the next-stage 'invalid initiative plan'. After repair, Windows and Linux/WSL regressions PASS, including junction/symlink alias checks. Linux's full initiative-plan regression PASS. A clean local candidate feeb89af1a22df9ec711dd5e0c05451dd6a549a0 contains both #83/#84 corrections (test-fixture commit only, not an upstream/source commit). Windows candidate init and locate PASS. Pinned-launcher first-plan publication now reaches and fails directory fsync, retaining plan.md and .plan-write: reported as https://github.com/iseoane/isSWF/issues/85 after duplicate search, with bug/needs-triage and exact sanitized body readback. No #85 fix or claim removal performed.

## Limits and next boundary

No live coordinator-model session, worker, Windows Bun execution, independent reviewer verdict or remote CI result. Syntax and bilingual checks PASS. Linux release-package regression PASS for the combined clean candidate. Full-suite execution under WSL against the Windows filesystem timed out in reviewer-task at the quality runner's 60-second subprocess deadline; this is not evidence of cause or passing suite.

Retained private candidate/logs are in the operator's temporary directory under isswf-83-84-candidate-20261026; the reproduction driver is ignored tooling/.local/windows-83-84/verify.mjs. Inspect the exact candidate before any later commit/publication. #85 is independent reported work, not included implementation. Product acceptance remains pending.
