# TDD

Use this reference when the operator or brief explicitly requests TDD, when a bug has a cheap local regression check, or when a focused behavioral test is a practical improvement for meaningful logic. A worker does not create a TDD requirement on its own. Do not add a test just to follow a ritual. Skip TDD when a useful test path is unclear, costly, brittle, or unrelated to the assigned behavior; use the closest relevant check instead.

## Loop

1. Identify the desired behavior, current behavior, and smallest user-visible reproduction.
2. Add the smallest test through the project's normal test interface. Call the code as its user does and assert a concrete expected result or effect.
3. Run it before changing production code. Confirm it fails because the observed result differs from the desired result. A syntax error, setup failure, or unrelated exception is not a useful red result.
4. Make the smallest production change that passes the test.
5. Rerun the test. Refactor only when it improves the code, and keep the tests green.

When the brief selects TDD, commit each behavioral failing test alone before its production fix, then keep the passing fix in a separate next commit. Record the full commit IDs, exact focused command, and failing assertion so a reviewer can reproduce both observations. Do not call syntax, import or test-setup failures RED. When no honest failing behavior can be demonstrated (for example, an equivalent refactor or wording-only contract), state the deviation, reason and consequence; do not reconstruct a RED result later. Retained RED commits are expected to fail by design; use `git bisect skip` when a bisect lands on one.

Tests describe behavior, not implementation details. Prefer literal expected values or effects. Avoid tests that only check presence, truthiness, call counts, or values computed by the code under test. Preserve a meaningful absence assertion when the contract forbids an effect.

If red cannot be demonstrated, report why and use the closest honest verification. Do not claim a red-green cycle that did not happen.
