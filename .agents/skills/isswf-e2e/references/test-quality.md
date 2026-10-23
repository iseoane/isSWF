# Test design and delivery

Use this reference to create or change a journey suite, audit its value, or prepare its CI command. The map describes user behavior and evidence, not a second implementation plan.

## Select useful coverage

Choose journeys for critical outcomes, changed boundaries and realistic failure risks. Prefer a small number of independent, meaningful journeys over a large matrix of low-value permutations. Unit and integration tests remain the cheaper place for behavior that does not depend on the complete route.

For each selected journey record:

| Field | Required meaning |
| --- | --- |
| Starting state | Supported version/platform, fixtures, authentication and dependency assumptions. |
| Public actions | The interface sequence a user actually follows. |
| Expected result | A concrete visible state, durable effect or meaningful absence. |
| Driver and command | Existing harness and the exact local/CI invocation. |
| Test and evidence | The executable test path and where its results are captured. |
| Coverage limit | Any stubbed boundary, unsupported platform or unexecuted optional stage. |

Keep this information with the project's test documentation, following its conventions. A run request needs no new map if the existing suite is sufficient.

## Avoid false confidence

A useful assertion fails when the promised behavior is wrong and survives unrelated internal refactoring. Do not merely assert that a file or command exists, that a response is truthy, or that an output matches a value derived from the same output. Presence checks can establish discovery or packaging, but do not establish the behavior of the discovered feature.

Where feasible, demonstrate a relevant negative control in a disposable copy or fixture. Confirm failure occurs at the behavioral assertion, not because the executable is missing, authentication failed or setup crashed. Do not weaken a failing control. Label unperformed controls instead of claiming sensitivity by inspection alone.

Keep the declared layer honest. A real installed host listing a skill verifies installation/discovery, not that a model will select it or execute a task correctly. A synthetic provider does not verify the real service. An agent manually navigating a browser is useful evidence, but not a replacement for a runnable regression suite.

## Make the suite usable without an agent

Use the repository's established test files, fixtures and commands. Document any new prerequisites and how to obtain them within the applicable grants. A test runner must be able to launch or connect, seed, drive, assert and clean up without interactive instructions to an AI agent.

Make timing and state ownership explicit. Tests should work from a clean environment and in their documented parallel mode. Keep first failures visible; retries and a green second attempt do not prove a race is repaired. Use the smallest subset that verifies the assigned change, plus the broader checks its shared boundaries require.

When adding authorized CI coverage, use the actual installed runtime and supported platforms, pin tools according to the project policy, bound time/output, and retain necessary failure artifacts. Keep credentials out of untrusted PR jobs. Use separately authorized opt-in jobs for real accounts, external mutations or provider costs. Preserve existing required checks and their meaningful failure conditions.

## State what happened

Report generated-but-unrun tests as draft coverage. For executed tests state the candidate, command, environment, result, evidence and cleanup. A local pass is not remote CI, cross-platform support or independent review. Retain failures and missing prerequisites. A new candidate invalidates affected observations; rerun those checks before declaring the revised suite verified.
