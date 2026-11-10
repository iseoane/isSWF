# Job brief J002 / r2

## Objective and authorization

Implement bounded #255 shared guidance for no-visible-desktop webview journeys. Current trusted operator start: “adelante, coordinador”, following the recovered order #255 → #254 → I0042 and the explicit requirement that application-specific needs belong to the project, not the skill. This supersedes r1 preparation-only for this unit; preserve immutable intake and r1.

Feature-to-PR scope: coordinator owns checkpoints, branch push, PR and exact-head CI in iseoane/isSWF targeting main. No merge, release, installation, host settings changes, cleanup or app-specific driver implementation. J030 remains parked on its original branch; I0014 remains cancelled.

## Workspace and inputs

- Exclusive sequential writer checkout: /home/iseoane/Work/isSWF; branch feat/255-headless-guidance.
- Target code base: 72390daf612e3abd5273c0eea3012d3c2689b63b. Dispatch supplies separate full document-input checkpoint after preparation commit.
- Trusted factory root: /home/iseoane/Work/isSWF, source checkout, not an installed release.
- Worker selection: openai-codex/gpt-6-luna, high. Loaded native role and registry verified; approved portable subscription route, no paid API or provider substitution.
- Budget for this unit: one initial worker, at most two correction cycles and three independent review rounds; maximum six child calls total, each bounded to 20 minutes. No automatic retries/replacement, nested delegation or budget reset. Spent before initial dispatch: zero.
- Worker may edit the two canonical resources below and directly relevant existing tests if useful. Worker may write only its next unused attempt record under .factory/initiatives/I0041/jobs/J002/ using .factory/templates/attempt.md. No worker commits, push, network, installations or other plan/brief edits. Coordinator freezes shared records while worker writes.

## Grounding map

Reopen current bytes before edits:
- .agents/skills/isswf-e2e/SKILL.md, sections 2–5 (approximately lines 27–77): existing driver selection, actual components, permissions and execution limits.
- .agents/skills/isswf-e2e/references/browser.md, Select and start / Evidence and failure: owned browser, profiles, evidence, teardown.
- .agents/skills/isswf-writing/SKILL.md and references/agent-documents.md: agent audience and conditional/blocked paths.
- .agents/roles/worker.md: assignment, scope and return contract.
- docs/en/development.md, Quality checks: focused checks and packaging boundary.
- tests/host-portability.mjs: existing shared skill contract assertions; Codegraph returned mostly unrelated legacy symbols, not a precise Markdown impact map. Direct reads established the two canonical owners. No index rebuild.

## Scope and acceptance

1. Add a concise branch for a no-visible-window/no-desktop-capture constraint: inspect existing application capabilities; select a feasible route or record a concrete technical blocker, without silently skipping E2E consideration or asking the operator to discover a driver.
2. Explain headless browser coverage against the actual frontend with a controlled bridge substitute. Clearly distinguish frontend-only coverage from real bridge/native host/OS E2E, including focus, native dialogs and drag/drop limitations. Browser headless flags do not establish native webview support.
3. Native isolated/off-screen automation requires actual stack/version/platform support and an authorized executed journey before claiming coverage. Do not promise WebView2/pywebview headless support or add app-specific recipes, new drivers, VM/browser installation or a desktop session.
4. The target project owns its adapters, launch/readiness/teardown commands, fixtures and stack-specific investigation. The skill supplies selection criteria and reporting boundaries, not solutions for every project's stack.
5. Preserve disposable fixtures/profiles, owned processes and bounded waits, candidate/driver/platform evidence and missing coverage. Do not capture the operator desktop or use user data.
6. Static walkthrough: ordinary browser, restricted webview with frontend route, restricted native-only criterion with unavailable driver. Cover Pi/Claude and Linux/Windows applicability without claiming live host/platform execution. Report activation, inputs, action and stopping condition for each.

## Methodology considered

- isswf-writing: selected; resources at trusted root .agents/skills/isswf-writing/SKILL.md and references/agent-documents.md. Evidence: concrete changed paths/lines and ordinary/conditional/missing-input static walkthrough, explicitly not an agent adherence evaluation.
- Design principles: not selected; no data shapes, module boundaries or runtime responsibilities change; clarify existing project-versus-skill ownership only.
- Verification principles: selected at .agents/roles/references/verification-principles.md; evidence: acceptance-to-evidence map, honest static versus live limitations.
- TDD: not selected; wording-only guidance has no honest production behavioral RED seam. Static instruction checks are not live behavioral proof.
- E2E execution: not selected; this changes instructions, not a target application suite or critical runtime journey. Required skill .agents/skills/isswf-e2e/SKILL.md and its browser reference are the edit subjects, not permission to launch a journey.
- Researcher: not selected; avoid stack-specific support claims; bounded guidance is grounded in existing canonical constraints, not a new platform feasibility assertion.
- Interview: not selected; operator resolved scope and ownership.

## Verification and stopping condition

Run node tests/host-portability.mjs ., node tooling/quality/check-docs.mjs and git diff --check. Inspect changed bytes and scenario walkthrough. Run any narrowly affected existing test if changed. No new shipped files/manifests or packaging changes planned, so full local quality is not required; CI remains required on exact PR head. Quality inventory: configured lint/tests/dead-code, no separate compile, no duplication tool; do not install or claim unrun checks.

Independent semantic review is warranted because text changes agent decisions and static tests do not establish correct native/frontend distinctions. Tests and E2E cannot fully cover that semantic criterion; supply exact retained candidate, diff, canonical review methodology and selected writing resources to a fresh reviewer, within budget. Do not invent runtime evidence.

Worker returns complete/partial/blocked with attempt path, changed paths, commands/results, resource consumption (observed trace or self-reported), application evidence, risks and remaining gaps. Stop on scope growth or unsupported assumptions; do not broaden into application implementation. Coordinator inspects stopped writer result then handles review and publication.
