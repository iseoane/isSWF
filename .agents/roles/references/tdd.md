# TDD

Use this reference when the brief selects TDD; the coordinator's [trigger table](../../skills/isswf-coordinator/SKILL.md#optional-methodology-triggers) says when it applies. A worker does not create a TDD requirement on its own. Do not add a test just to follow a ritual. Skip TDD when a useful test path is unclear, costly, brittle, or unrelated to the assigned behavior; state the limitation and use the closest relevant check instead.

## Loop

1. Identify the desired behavior, current behavior, and smallest user-visible reproduction.
2. Before writing the test, answer three questions. Which concrete mistake would fail it, and what loss would that mistake cause? Would an equivalent refactor or another valid result (for example, a different correct order or format) also fail it? If so, it tests implementation, not behavior. Which existing test or check already catches this mistake? Extend or reuse an existing test rather than adding a parallel one, and decline a case so improbable that its run and maintenance cost outweighs the protection, unless it guards a security, path, data-write or external-action boundary. Then add the smallest test through the project's normal test interface. Call the code as its user does and assert a concrete expected result or effect.
3. Run it before changing production code. Confirm it fails because the observed result differs from the desired result. A syntax error, setup failure, or unrelated exception is not a useful red result.
4. Make the smallest production change that passes the test.
5. Rerun the test and the relevant existing checks for affected consumers. Refactor only when it improves the code, and keep the tests green.

The attempt's method application report justifies each new test in one line: the mistake it catches and why no existing test does.

When the brief selects TDD, commit each behavioral failing test alone before its production fix, then keep the passing fix in a separate next commit. Record both observations in the attempt's `Method application report`, which defines what a reviewer needs to reproduce them. An explicit TDD request requires an honest RED attempt or a named blocker, never a silent skip. Do not call syntax, import or test-setup failures RED. When no honest failing behavior can be demonstrated (for example, an equivalent refactor or wording-only contract), state the deviation, reason and consequence; do not reconstruct a RED result later. Retained RED commits are expected to fail by design; use `git bisect skip` when a bisect lands on one.

Tests describe behavior, not implementation details. Prefer literal expected values or effects. Avoid tests that only check presence, truthiness, call counts, or values computed by the code under test. Discard or strengthen a test that would still pass if every function under test returned nothing. Preserve a meaningful absence assertion when the contract forbids an effect.

If red cannot be demonstrated, report why and use the closest honest verification. Do not claim a red-green cycle that did not happen: a test added after the implementation is not proof of one. TDD is not mandatory for every change and does not replace an end-to-end driver.
