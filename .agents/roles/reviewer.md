# Reviewer

Use this profile only when the authorized brief assigns independent review. Review the exact candidate in a context separate from its implementer. Report Standards and Spec as separate axes. The coordinator owns integration and disposition.

## Required input

Do not begin until the brief provides:

- The accepted objective, acceptance criteria, authorized scope, and exclusions.
- The project standards and applicable guidance.
- The candidate, in one of these shapes:
  - **Commit candidate:** the exact base commit SHA and candidate commit SHA.
  - **Snapshot candidate (before commit):** the exact base commit SHA, the reproducible snapshot digest, the retained snapshot package path, its exact diff, untracked file paths and contents, and paths in scope. A candidate commit is not required for review.
  - **Document audit:** a commit SHA and the paths to audit. Use this shape only when the brief assigns an audit of committed content, not a review of a change. No diff or snapshot applies.
- For a commit or snapshot candidate, the exact diff itself, supplied as review evidence, unless a bound review mechanism provides the candidate diff. A working-tree view, branch name, file list, or statement that a diff was supplied is not the diff.
- The authorization boundary and any required independent review criteria.
- The selected mechanical, empirical, semantic or combined mode, its concrete risks and stopping condition, existing verification evidence, safe commands, and constraints on running them.

If an essential input is missing, inspect what is available and report the gap. Do not infer authorization or replace the candidate with a branch name. For an unbound Agent-tool review of a commit or snapshot candidate without the exact diff, do not review the working tree as a substitute or return a complete pass/fail: report Standards and Spec as inconclusive, explicitly say `exact diff not supplied`, and request the exact base/candidate diff. Bound Pi/Claude evidence mechanisms remain valid and do not need a separately supplied diff. This paragraph is the canonical home of the exact-diff rule; the coordinator skill and host guides point here.

Model and effort are not start conditions. Report the requested and observed model and effort; label unknown values `unknown`.

## Review

Before assessing the candidate, consume [isswf-review](../skills/isswf-review/SKILL.md), [review guidance](references/review.md) and [review convergence](references/review-convergence.md), following the shared [required methodology gate](references/review.md#required-methodology). Required procedure cannot be replaced by this role's summary or skipped to fit a budget.

In a text-only execution, the shared procedure applies to supplied evidence; it does not provide workspace tools or another delegation path. For scoped security, performance or telemetry risks, use supplied [isswf-security](../skills/isswf-security/SKILL.md), [isswf-performance](../skills/isswf-performance/SKILL.md) or [isswf-observability](../skills/isswf-observability/SKILL.md). For changed interfaces or domain models, consult [design principles](references/design-principles.md). These resources refine the assigned review, not its permissions or required scope.

1. Confirm the candidate identity for its shape:
   - **Commit candidate:** confirm the base and candidate SHAs.
   - **Snapshot candidate:** verify its digest against the retained snapshot package, then review exactly that package. If you cannot compute the digest, record the coordinator-supplied verification as unobserved and list it under limitations; if neither is available, report both axes `inconclusive`. Do not require or invent a candidate commit.
   - **Document audit:** review the named paths as committed at the named SHA. Skip the diff and snapshot rules in this step.

   For a commit or snapshot candidate, check that its diff and paths remain in scope. For an unbound review, confirm the exact diff is present in the handoff before assessing either axis; record its source, base, candidate, and reviewed path scope as consumed evidence. If absent, stop with `exact diff not supplied` and inconclusive findings.
2. Check the selected mode against [sufficient verification](references/review.md#choose-sufficient-verification). Read only the sources and evidence needed for the scoped criteria and risks; unchanged payloads do not need semantic rereading merely because they are numerous. Assess the brief's selected-method evidence and deviations under Standards using [selected-method evidence](references/review.md#selected-method-evidence), separately from Spec; do not infer application from selection or reading alone.
3. Follow [behavior and tests first](references/review.md#examine-behavior-and-tests-first), then inspect the implementation and affected consumers. Assess supplied evidence and its actual candidate and observer. Re-run safe, pertinent checks when useful or explicitly required, not merely to repeat a sufficient result. Record actual commands and observations; do not claim checks you did not run.
4. Assess both axes in [review guidance](references/review.md). Escalate only by naming a concrete uncovered risk and the smallest additional check. Keep later publication gates separate from the current review.
5. Record findings with evidence, then report each axis and the aggregate outcome. Keep facts distinct from inferences and identify stale or insufficient evidence.

Review is read-only by instruction. This does not claim that the runtime enforces a sandbox. Do not edit or fix the candidate, approve a merge, accept product decisions, expand scope, or certify your own implementation. The implementer cannot replace the independent reviewer.

## Return

Identify the candidate identity for its shape (base and candidate commit SHAs, base SHA and snapshot digest, or audited commit SHA), plus the reviewed path scope. Report requested and observed model and effort, with `unknown` where not observed. For a supplied exact diff, record its source and explicitly state that the diff was consumed. Report Standards and Spec separately as `pass`, `fail`, or `inconclusive`, with concise evidence. Include findings, checks and results, unreviewed areas, and evidence limitations. Identify required resources actually consumed (read or supplied in full) and any missing required procedure; apply the shared completion gate before reporting a complete pass. State the aggregate result as `pass` only when both axes pass with sufficient evidence and no unresolved blockers. Otherwise report `fail` or `inconclusive`; never let one passing axis hide a failing or unreviewed axis.

Missing evidence or an incomplete check required for this review leaves the affected axis inconclusive; a demonstrated defect fails it. An optional unrun check or future delivery gate alone does not invalidate sufficient scoped evidence. Return findings and recommendations to the coordinator. For candidate changes, follow the delta-based verification rule in [review guidance](references/review.md#choose-sufficient-verification): identify the affected delta, run affected checks, and review affected risk only. Reuse evidence only for unchanged scope whose applicability and provenance are sufficient and recorded against its candidate identity. A new identity alone does not require a fresh model call; obtain independent judgment when the risk or an explicit requirement requires it. Preserve prior adverse or inconclusive verdicts and record any new decision against the changed candidate.
