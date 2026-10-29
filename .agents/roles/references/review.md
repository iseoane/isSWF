# Review guidance

Use these two axes for every review. Project standards and the accepted brief take precedence over generic engineering preferences.

## Required methodology

For an assigned isSWF review, consume the canonical [isswf-review skill](../../skills/isswf-review/SKILL.md) and this guide before assessing the candidate, together with any additional methodology explicitly required by the brief or applicable project standards. Read the identified source paths, or use their full canonical contents supplied through a trusted handoff or verified native context. A role summary or a link is not the full procedure. Preserve assigned document checkpoints; never substitute latest material for a required pin.

| Required procedure coverage | Completion condition |
| --- | --- |
| Consumed from identified sources or supplied in full | Continue the scoped review; this alone does not establish a passing verdict. |
| Any required procedure skipped, unreadable or not supplied | Review is incomplete. Mark Standards as inconclusive unless a demonstrated violation already fails it; preserve supported findings on either axis. The aggregate cannot pass. |
| Only an optional reference, tool or check is unavailable | Its absence does not invalidate otherwise sufficient scoped evidence. Name a concrete uncovered risk before escalating. |

Limited budget or access does not waive required methodology or authorize another actor. Report the missing resource and stop the affected review; do not attach the omission as a harmless limitation to a complete pass. State which required resources were actually consumed, whether read or supplied in full, and which remain missing. Do not infer content loading from a configured skill name or invocation alone, or demand a transcript of every internal action.

## Choose sufficient verification

Before dispatch, the coordinator records the review mode, concrete risks, checks and stopping condition in the existing brief. Choose the least costly mode that covers the acceptance criteria and affected behavior:

- **Mechanical:** deterministic preservation or transformation, such as unchanged-content moves, generated indexes or link replacements. Verify exact scope, bytes/hashes, modes, references and relevant checks. Inspect the transformation procedure separately if it adds logic; a mechanical result does not make new code automatically safe. Large file counts alone do not require semantic rereading of unchanged payloads.
- **Semantic:** changes to behavior, product decisions, trust boundaries, permissions or shared contracts, or claims that deterministic checks cannot establish. Review the affected sources and consumers, using relevant tests as evidence. Select depth by the concrete risk, not a default exhaustive audit.
- **Combined:** judge the changed procedure or contract semantically and verify its generated output mechanically. Keep those conclusions distinct rather than repeating a deep review of every generated artifact.

Mechanical verification may close a covered change without a model call when no explicit requirement mandates independent judgment. If independence is required, use an independent check or reviewer with the necessary capability; do not treat implementer checks as independent. Existing operator grants, mandatory project checks and publication gates still apply. A weaker mode cannot be chosen merely to bypass a failed required check or adverse finding.

A reviewer first assesses whether the chosen mode covers the risk. Escalation names the uncovered criterion or plausible failure, why existing evidence cannot detect it, and the smallest additional check needed. An unavailable optional tool, inability to personally rerun a sufficient check, or missing future CI is not by itself a source-review blocker. Attribute supplied evidence to its actual observer and candidate; require more when provenance is inadequate for the concrete risk. Keep future delivery gates pending separately.

For each changed candidate, compare its delta with the exact prior candidate and identify which criteria, checks, and judgments that delta affects. Run affected checks and obtain affected independent judgment when the changed risk requires it or an explicit requirement mandates independence. Do not repeat checks or request a fresh model review merely because the candidate identity changed: reuse prior evidence only for scope shown unchanged and sufficiently applicable, with its candidate identity, provenance, and limits recorded. New evidence must identify the changed candidate. Preserve prior adverse or inconclusive verdicts; do not erase or relabel them as passing because a later delta is mechanical. Record a new decision for the delta and retain the prior result.

Stop when the scoped criteria are covered and required checks pass. Record limitations outside that scope without turning them into new acceptance criteria. A genuine uncovered risk or changed acceptance requires an explicit revised scope; it does not justify identical model retries. Preserve prior verdicts when correcting an overbroad review requirement, and record the new decision rather than relabeling an inconclusive report as pass.

## Candidate identity

Identify a committed candidate by its commit SHA. A review may run before commit. Identify an uncommitted candidate by the base commit SHA and a snapshot digest. The retained package contains the exact binary, full-index diff against that base and the exact content bytes of every untracked file. Build a NUL-delimited digest record from the base SHA, the SHA-256 of the diff bytes, then each included path sorted by path bytes with its file mode and SHA-256 of its content. The snapshot ID is the SHA-256 of that record. Preserve the package and manifest so another context can verify the ID and reconstruct the same candidate. Never substitute a branch name, current worktree, or later diff for the identified snapshot.

## Examine behavior and tests first

After confirming the objective, candidate and review mode, read the applicable acceptance criteria and relevant tests before the implementation. Map each changed behavior to the observable result and failure path the tests protect. For documentation or deterministic transformations, use the relevant contract and preservation checks instead of inventing a test requirement.

Then trace the implementation and affected consumers. A passing test is evidence only for the assertions and conditions it exercises. Identify a concrete missed failure rather than asking for more coverage in the abstract.

### Targeted detection experiments

When a material test gap is uncertain and a cheap experiment can distinguish it, propose one plausible behavioral fault, the focused command expected to detect it, and the relevant assertion. Choose a fault tied to the changed contract, rather than arbitrary edits selected to make a test fail. This is conditional evidence gathering, not a mandatory mutation stage or a project-wide mutation score.

Run the experiment only when authorized and supported, in a disposable copy reconstructed from the retained candidate. Keep the reviewed candidate and its package read-only. Record the original candidate identity, exact injected change, baseline and mutated command results, and the unchanged candidate check. A surviving mutation is a coverage finding only if it changes behavior required by the contract; equivalent mutations and setup failures do not prove a test defect. Distinguish that coverage gap from an actual defect in the unmodified candidate.

A text-only reviewer cannot execute this experiment. Assess supplied pinned observations, or recommend the smallest missing check to the coordinator. Existing read-only probes do not authorize mutation. Missing optional experiment access alone is not a blocker; missing evidence necessary for the selected review scope leaves the affected axis inconclusive.

## Standards

Assess whether the change fits the project's engineering standards and its local context. Read the relevant standards and sources rather than applying a generic checklist. Consider behavior, boundaries, reuse, complexity, ownership, and documentation where the change makes them relevant. Reuse [code quality guidance](code-quality.md), [comment guidance](comments.md), and [verification principles](verification-principles.md); do not restate their full rubrics.

### Selected-method evidence

When the brief selects a method, assess its application under **Standards**, separately from **Spec**. The brief must state proportionate evidence requirements grounded in that method's canonical skill; skill selection or reading alone does not prove application. Attribute supplied evidence to its observer, command/action and result, exact candidate or attempt provenance where applicable. Assess any disclosed deviation against the accepted requirement and its stated consequence; disclosure is not a waiver and does not retrospectively satisfy evidence requirements. If required evidence is missing and no deviation is declared, do not silently pass: report a supported finding or mark the affected Standards assessment inconclusive, explaining what evidence is missing. Preserve adverse evidence. Do not impose evidence for unselected methods, blanket red-artifact requirements, universal TDD, mandatory E2E, or new review actors. Use the selected skill's requirements rather than inventing a second rubric.

For code changes, use these technical dimensions within Standards when they apply to the diff and its risks:

- **Correctness:** check that the behavior matches its contract, including relevant edge cases and failure paths.
- **Readability:** check whether names, control flow, and local structure make the changed behavior clear.
- **Architecture:** inspect the resulting module and affected consumers, not only the added lines. Check ownership, module boundaries, reuse, and the concepts, branches or layers needed to follow the behavior. Distinguish reduced complexity from merely relocated complexity. File size and branch growth are investigation signals, not automatic blockers or fixed line limits. When a change demonstrably worsens structure, name the concrete impact and the smallest remedy that removes unnecessary moving parts while preserving the contract. Do not prescribe a larger redesign without evidence.
- **Security:** inspect trust boundaries, permissions, sensitive data, and external effects when the change touches them. Assess dependency security only when dependencies change.
- **Performance:** investigate a plausible regression or stated performance goal with a relevant probe. Do not require measurement when the change has no performance risk or goal.

These dimensions refine Standards; they do not replace Spec. Assess Spec separately against the accepted objective and each applicable acceptance criterion. Choose evidence and checks that can detect plausible defects in the changed behavior. For tests, look for sufficient assertions of observable results, not test presence alone. Neither axis requires a universal test suite or TDD. When independent judgment is required, do not certify the author's own change or conflate the implementer's close check with independent review. This mapping adapts the existing reviewer contract rather than adding a reviewer or parallel rubric.

### Changed dependencies

When a manifest, lockfile or dependency policy changes, locate the owning installation boundary and review the exact direct and transitive changes together. Read the affected release notes or migration guidance; a patch version is not proof of unchanged behavior. Check compatibility with actual consumers, licence constraints, provenance and maintenance signals, security advisory reachability, and introduced or changed lifecycle scripts when relevant. Separate verified facts from unavailable external information. Keep independent dependency groups distinguishable so a regression can be attributed and reversed; related updates need not be split mechanically.

Use the project's pinned package manager and existing authorized checks. Review scripts before executing them; an ordinary install or audit with network access is not implicitly authorized by review. Report the applicable lockfile, changelog, checks and limitations. Unchanged dependencies do not trigger a general dependency audit. Missing information becomes a blocker only when it is necessary to resolve a concrete material risk.

## Spec

Assess whether the candidate meets the accepted product objective and each applicable acceptance criterion. Compare the delivered user-visible result with the brief. Passing tests or sound code alone does not establish product fit. Treat a new product choice as a question for the coordinator, not a reviewer decision.

## Risk-based probes

Choose probes based on changed behavior, affected users, and plausible impact. Do not run every probe for every change.

- For data, permissions, secrets, or external input, examine access boundaries, privacy, validation, and data-loss paths.
- For shared contracts, concurrency, or integration, trace affected consumers, compatibility, ownership, and relevant invariants.
- For UI behavior, inspect the real user result and relevant accessibility behavior.
- For performance, measure only when the objective or risk calls for it. State conditions and limits; do not infer a regression or improvement without evidence.
- For structural or documentation changes, check whether the result remains maintainable and whether affected docs and terms match the behavior.

Use safe checks named by the brief or already documented by the project. A failed or unavailable check is a limitation, not a pass. Do not add a broad test or tool requirement without a risk-based reason.

## Findings and outcome

Each finding names the exact path and line range, the concrete condition and supporting evidence, its impact, confidence, and a recommended action. Distinguish observed facts from inferences. Use functional severities `blocking`, `suggestion`, or `information`.

Order findings by material impact, with correctness and security failures before structural regressions and optional polish. Prefer a few well-supported findings to speculative volume. Group comments that share one cause and remedy. Confidence is the strength of the evidence, not a substitute for impact; an unconfirmed suspicion calls for a discriminating check, not an asserted defect. Keep stylistic preferences optional unless a project standard makes them required. A review need not invent praise, nits or findings to fill a template.

A blocker needs a demonstrated violation of the accepted objective, project standard, or material user or system risk. Do not block on taste or style without a relevant standard or concrete impact. Keep suggestions and information separate from blockers. The coordinator decides whether to correct, dismiss with a reason, or ask the operator.

Report no findings explicitly only after completing both axes with sufficient evidence. Report an axis as inconclusive when inputs, checks or evidence necessary for the selected scope are unavailable or stale; a demonstrated violation fails the affected axis. A failed required tool or incomplete required review never means clean. Optional unrun checks and explicitly separate future delivery gates remain limitations, not automatic reasons to make a supported source-review axis inconclusive. The aggregate fails if either axis fails. It is inconclusive if neither axis fails and at least one is inconclusive. It passes only when both axes pass.
