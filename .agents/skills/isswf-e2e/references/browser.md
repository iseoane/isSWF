# Browser journeys

Use this reference for a real browser surface. Prefer its existing supported harness. Playwright is an option, not a dependency of every E2E suite.

## Select and start

Inspect the installed framework version, configuration, existing specs and application commands before choosing APIs. Reuse the configured browsers and test runner. If Playwright fits a new suite, propose the smallest required setup and obtain any missing dependency/browser installation grant before writing commands that assume it exists.

Use a disposable browser context and test account, never the person's daily authenticated profile. Keep credentials out of versioned storage state, screenshots, traces and reports. A localhost URL does not by itself prove that the backend uses test data or cannot send external messages.

Start an owned application instance on a distinct port or use a separately authorized test environment. Verify the actual expected screen and readiness conditions, not just that the port accepts a connection. Keep its identity and teardown command.

## Drive the user interface

- Use accessible roles, names, labels or the project's stable test IDs. Avoid positional selectors, generated CSS classes and screen coordinates when a semantic handle exists.
- Perform the user's public actions. Opening a route, submitting a form and observing the resulting state is a journey; assigning internal component state to produce the final screen is not.
- Assert the expected text, navigation, enabled/disabled actions, persisted state or forbidden effect. Do not use screenshots as the only assertion for a functional workflow.
- Wait for meaningful conditions with bounded framework assertions. Fixed sleeps and larger timeouts do not repair a missing readiness contract.
- Keep tests independent and safe in parallel with unique accounts, data and contexts. Scope shared-state tests explicitly instead of relying on execution order.
- Validate the result of relevant server interactions as well as the UI when the contract promises persistence or another external effect. Use public readback or an explicitly appropriate observation boundary.

Use an external stub only where it is an intentional system boundary. A mocked API response means the test does not verify the real backend operation; label that limitation. Keep unexpected application errors and failed requests visible rather than silencing all console/network events.

## Evidence and failure

Use the existing runner's report, trace, screenshot and video settings proportionately. Prefer failure traces and captures tied to the exact test and candidate over recording every successful interaction indefinitely. A trace can contain credentials or personal data: use test identities and review retention/access before publishing it.

When a journey fails, keep the first meaningful failure and its evidence. Distinguish application regressions, locator drift, environment failures and races. A retry that succeeds does not erase flakiness. Do not change the expected product result or omit a mapped step merely to obtain green output.

After running, close only the contexts, browser and application process owned by the test. Verify that the reports survive cleanup. Claim only the browsers and platforms actually exercised.
