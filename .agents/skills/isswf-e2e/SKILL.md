---
name: isswf-e2e
description: Create, run, or maintain end-to-end tests for critical user journeys through real application interfaces. Use for E2E suites, browser tests with Playwright when suitable, or CLI and API journeys prepared for CI.
---

# Verify complete user journeys

Use this utility in any project. Follow the target's language, test conventions, permissions and execution limits. It does not require factory activation, create agents, or authorize installation, provider calls or publication. The result is a runnable test suite, not just instructions for an agent to manually inspect the application.

## 1. Select the requested outcome

- **Create or extend:** identify missing journeys and add executable tests using the workflow below.
- **Run:** use the existing suite unchanged, record the first result and preserve failures. A request to run tests does not authorize repairing production code or rewriting assertions.
- **Maintain or audit:** compare journeys with current interfaces and requirements. Repair authorized drift while preserving coverage; report product regressions separately instead of weakening expectations. An audit alone remains read-only.

For an audit-only request, inspect the existing suite and driver in steps 2 and 3 without changing files or launching resources, then report using step 6. Running tests needs a current execution grant.

A request with clear scope needs no new interview. Ask only for unresolved product expectations, unavailable accounts/test data, or permissions that affect the chosen journey. Ordinary unit-test changes do not activate this workflow merely because they are tests.

This step ends with the requested outcome and permitted changes identified.

## 2. Inspect the real entry points

Read the relevant implementation, usage guide, test configuration and CI. Identify what users actually invoke, the supported platforms, and existing launch, readiness, fixture and teardown commands. Reuse the project's harness before introducing another one.

Choose a small set of journeys from the assignment's risk and user value. Record each journey's starting state, public actions, expected visible result or forbidden effect, and whether external dependencies are real, isolated test instances or substitutes. Use the nearest useful unit or integration check for behavior that does not need a complete journey.

Keep the journey map with the existing suite documentation. If none exists, use a short README beside the new tests, not a second project plan. A useful row names the journey, test file, preconditions, expected result and known coverage limits. Cover the entry points the requirement promises, not just the easiest path.

This step ends when the selected journeys have observable expectations and a feasible driver, or the affected journey has a concrete blocker.

## 3. Choose a driver for each surface

| User interface | Driver selection |
| --- | --- |
| Browser UI | Reuse the browser harness. Choose Playwright when suitable and available; an existing supported framework does not need replacing. Read [browser journeys](references/browser.md). |
| CLI, interactive terminal or API | Exercise the real executable, PTY or HTTP interface. Read [CLI and API journeys](references/cli-and-api.md). |
| Desktop or mobile | Use an existing automation interface supported by the actual application. Report unavailable driver/platform support rather than claiming browser tests cover it. |
| Several interfaces | Follow the real transitions and resulting state. Keep observations tied to the same isolated journey instance. |

Installing a framework, browser binary or service needs a current installation/network grant. Show what is missing and continue independent authorized work if that grant is absent. A browser MCP inspection may help diagnose a problem, but it does not replace the committed executable test or establish CI coverage.

This step ends with an existing driver or an approved addition and an exact execution command.

## 4. Build isolated, meaningful tests

Read [test design and delivery](references/test-quality.md) when creating, changing or retaining a journey. Use disposable data, distinct ports/profiles and bounded waits. Launch from a documented starting state, verify readiness at the user boundary, perform the public actions, and assert the resulting behavior.

Use real application components wherever the journey claims coverage. A stub at an external boundary narrows that claim; record it. Keep provider-enabled or destructive journeys separate and opt-in. Authentication, spending and external writes require their own grant. Protect credentials in fixtures, traces and logs.

For a new test, demonstrate sensitivity to a relevant wrong result when feasible, using a controlled fixture or disposable copy. A setup failure is not a regression demonstration. Existing working behavior need not be broken in the production checkout merely to claim TDD; report sensitivity checks that were not performed.

This step ends with independently runnable tests and their fixtures. If the user requested execution only, keep the existing suite and proceed to the next step.

## 5. Execute and prepare CI

Run the exact retained tests against the identified candidate and actual target environment. Record commands, versions, platform, exit status, external substitutions and evidence paths. Capture the action and outcome, including relevant side effects, not just a final screenshot or a server's successful startup.

When CI changes are authorized, reuse the existing workflow and add the narrow command, setup, timeout and evidence retention it needs. Keep unsupported platforms and optional provider journeys explicit. A skipped or unavailable required journey is pending coverage, not a passing E2E result. Diagnose flaky timing or shared state rather than hiding the first failure with retries.

Clean up only processes and resources this run created, using their exact ownership identity. Keep the proof artifacts after teardown. A leftover process, failed test or missing environment remains visible.

This step ends when the selected tests have observed results and owned resources are reconciled. Generated tests that were not executed are a draft, not verified coverage.

## 6. Report the result

Return the suite/map paths, execution command, covered journeys and their limits, actual results and retained evidence, cleanup state, and any remaining decision or CI boundary. Distinguish generated tests, passing local tests, passing CI and successful real-provider journeys. Future maintenance reuses this workflow and the same journey map; do not add a mandatory interview or a new verification state store.
