# Review guidance

Use these two axes for every review. Project standards and the accepted brief take precedence over generic engineering preferences.

## Candidate identity

Identify a committed candidate by its commit SHA. A review may run before commit. Identify an uncommitted candidate by the base commit SHA and a snapshot digest. The retained package contains the exact binary, full-index diff against that base and the exact content bytes of every untracked file. Build a NUL-delimited digest record from the base SHA, the SHA-256 of the diff bytes, then each included path sorted by path bytes with its file mode and SHA-256 of its content. The snapshot ID is the SHA-256 of that record. Preserve the package and manifest so another context can verify the ID and reconstruct the same candidate. Never substitute a branch name, current worktree, or later diff for the identified snapshot.

## Standards

Assess whether the change fits the project's engineering standards and its local context. Read the relevant standards and sources rather than applying a generic checklist. Consider behavior, boundaries, reuse, complexity, ownership, and documentation where the change makes them relevant. Reuse [code quality guidance](code-quality.md), [comment guidance](comments.md), and [verification principles](verification-principles.md); do not restate their full rubrics.

For code changes, use these technical dimensions within Standards when they apply to the diff and its risks:

- **Correctness:** check that the behavior matches its contract, including relevant edge cases and failure paths.
- **Readability:** check whether names, control flow, and local structure make the changed behavior clear.
- **Architecture:** check ownership, module boundaries, reuse, and complexity. When you find a concrete structural problem, name a proportionate alternative that preserves the contract. Do not prescribe a larger redesign without evidence.
- **Security:** inspect trust boundaries, permissions, sensitive data, and external effects when the change touches them. Assess dependency security only when dependencies change.
- **Performance:** investigate a plausible regression or stated performance goal with a relevant probe. Do not require measurement when the change has no performance risk or goal.

These dimensions refine Standards; they do not replace Spec. Assess Spec separately against the accepted objective and each applicable acceptance criterion. Choose evidence and checks that can detect plausible defects in the changed behavior. For tests, look for sufficient assertions of observable results, not test presence alone. Neither axis requires a universal test suite or TDD. Do not certify the author's own change or conflate the implementer's close check with independent review. This mapping adapts the existing reviewer contract rather than adding a reviewer or parallel rubric. See [the Addy and Pstack research](../../../docs/research/adaptacion-pstack-addy.md) and [the agent adaptation map](../../../docs/research/adaptaciones-agentes.md).

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

A blocker needs a demonstrated violation of the accepted objective, project standard, or material user or system risk. Do not block on taste or style without a relevant standard or concrete impact. Keep suggestions and information separate from blockers. The coordinator decides whether to correct, dismiss with a reason, or ask the operator.

Report no findings explicitly only after completing both axes with sufficient evidence. Report an axis as inconclusive when required inputs, checks, or relevant evidence are missing, stale, or failed. A tool failure, model failure, or incomplete review never means clean. The aggregate fails if either axis fails. It is inconclusive if neither axis fails and at least one is inconclusive. It passes only when both axes pass.
