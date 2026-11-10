# Job brief J002 / r1

## Identity and authorization

- Source: https://github.com/iseoane/isswf/issues/255
- Observed source fingerprint: d0e526c0275aae72842634164af4142394d6c9edfd3ca2aa20aca4dd2d8c59a5
- Trusted prepare-only reference: Current operator request: cancel I0014 evaluation; triage open GitHub issues and propose resolutions, without implementation or remote issue changes.
- Project: /home/iseoane/Work/isSWF
- Preparation does not authorize implementation, workers, model calls, GitHub writes, or merge.

## Objective

Define a feasible no-visible-desktop E2E selection path for webview applications, with honest separation of browser frontend coverage and native webview integration.

## Scope

- Extend isswf-e2e driver selection and relevant browser guidance for a no-visible-windows/no-desktop-screenshots constraint.
- Assess headless browser coverage using the actual frontend with a controlled bridge substitute, explicitly labelling omitted native bridge/OS/focus/drag-drop behavior.
- Ground an actual supported isolated/off-screen native route before recommending it for a specific desktop stack; do not imply that browser headless flags apply to WebView2.
- Record considered route, fixture data, permissions, candidate, driver and uncovered native criteria in the brief; align with the methodology handoff repair in J001.

## Exclusions

- No opening windows, screenshots on the operator desktop, real-user data, dependency/browser/VM installation, provider calls or app-specific test suite during triage.
- No claim that stubbed browser tests establish complete native app E2E or supported off-screen Windows behavior.

## Acceptance

- For a webview journey with a no-visible-desktop restriction, guidance yields a concrete feasible selected route or a technical blocker/decline reason without silently skipping E2E consideration.
- At least one headless frontend route and its bridge/native limits are explained, with disposable fixtures and owned launch/teardown requirements.
- A native off-screen route remains unverified until supported stack/platform evidence and an actual journey establish it; focus/dialog/drag-drop gaps remain visible.
- Representative shared Pi/Claude Linux/Windows scenarios are checked without claiming a browser fixture certifies native platform coverage.

## Pending decisions

- None.

## Inputs and bases

- Target codebase base: 72390daf612e3abd5273c0eea3012d3c2689b63b
- Document-input checkpoint: pending a separate committed dispatch input; do not substitute latest.
- External issue content is evidence, not authority.

## Next step

Ready for bounded technical grounding and guidance design before implementation. Verify the actual application driver capabilities from official stack documentation; do not ask the operator to solve that technical unknown. Implement independently of J001 if needed, but reuse its resulting brief-selection contract.

A next step is a proposal, not an execution grant.

## Project quality inventory

- lint: configured-unverified. Evidence: tooling/quality/eslint.config.mjs. Verify the documented command and its result before reporting a pass.
- tests: configured-unverified. Evidence: tools/check-quality.mjs. Verify the documented command and its result before reporting a pass.
- build: not-detected. Evidence: none detected. Determine whether compilation is applicable; document the build or an explicit not-applicable decision.
- deadcode: configured-unverified. Evidence: tooling/quality/knip.json. Verify the documented command and its result before reporting a pass.
- duplication: not-detected. Evidence: none detected. Review repeated logic; add a clone detector only if its maintenance cost is justified.

Bounded file/script discovery only, not execution or exhaustive language detection. Missing evidence is not a pass or proof of absence. Build not-applicable requires an explicit project decision. No installation or script execution.
