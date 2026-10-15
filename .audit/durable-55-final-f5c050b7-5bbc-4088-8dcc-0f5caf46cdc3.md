**Verdict: PASS (delta v3; Standards pass, Spec pass).**

v3 vs v2 changes exactly guide, attempt, job-brief, build-brief; SKILL.md and review.md byte-identical (verified).

- Acceptance: `attempt.md:38` now "Status at return: pending" plus a pointer to the coordinator's canonical-plan record; worker report "remains unchanged" — no coordinator write into the worker artifact. F1 fixed.
- Grant: `build-brief:30` now conversation/record ID or external path, full SHA only when Git-tracked; matches guide/templates. F2 fixed.
- Review: job-brief constraints now name reviewer model and effort; `reviewer.md` requires effective model/effort. F4 fixed.
- Inputs: document-input checkpoint still full Git SHA everywhere.
- Identity: verifier recomputes `4cc96445…`, base `9cd0eeb`, six hashes match identity-v3.
- `candidate.diff` is the tracked patch only (SKILL.md); the four-file delta is bound only by file hashes.
- `links-v3.json`: unbound "passed" flag for the guide's five links; no tool/provenance.
- `markdown-proof-v3.json`: byte-identical to v2's; candidate names another worktree and excludes guide/templates — not v3 evidence.

**Execution compliance: violation, kept separate.** Correction actor a1485c33 ran Python for a link check under an explicit no-Python instruction; Python evidence excluded. Not compliant execution.

Read-only; no writes/subagents/network/commits. Base `9cd0eeb` immutable.
