# Job brief J001 / r1 — Verify capabilities and reproduce blocking

## Identity and authorization

- Initiative: I0024; coordinator-assigned job: J001; revision: r1.
- Source: recovered local operator conversation; no GitHub issue.
- Request mode: prepare-only, local records only. Current request explicitly excludes implementation.
- Coordinator owns canonical plan and briefs. No worker/reviewer launched or allocated; execution/model/correction budget currently zero. No commits or remote writes authorized.

## Objective

Inspect coordinator and both native hosts; reproduce a slow task blocking conversation and select the minimum functional unit.

## Scope and acceptance

Scope is this functional unit in the recovered four-job plan, not a new runtime or dispatcher. Both native hosts and Linux/Windows remain within the intended outcome; a limitation is a blocker, not permission to silently narrow scope.

- Inspect agent, review, CI and publication waits; distinguish host limitations from avoidable flow decisions.
- Retain a bounded reproduction with a slow task and an operator question, identifying actual host/version and observer.
- Record mechanisms, limits and minimum alternatives for Pi and Claude Code on Linux and Windows; unsupported capabilities remain explicit blockers.
- Select a small complete unit, expected benefit versus model/check/CI cost and finite budgets before any writer dispatch.

## Inputs and grounding

- Canonical plan: [I0024 plan](../../plan.md); dependency: None.
- Examined registration base: `57439126ac32f7a4294f586a5aab6defcbfb19bb`. This is not a future implementation pin.
- Document-input checkpoint: not committed; establish a full Git checkpoint before any authorized dispatch.
- Read before execution: `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/hosts/pi.md`, `.agents/hosts/claude-code.md`, `docs/durable-work.md` and the affected current tests/code. Reopen at the future target base and add verified path/symbol/line references after J001 grounding.
- Registration inspected coordinator, Pi host and durable-record contracts only; Pi currently documents foreground `async: false` as normal initial path. Actual asynchronous capability, Claude mechanisms and OS equivalence have not been verified here.
- Provenance: original session and proposal are recorded in the canonical plan; memory observation 4285 is advisory preference evidence only.

## Quality inventory and verification

- Lint: configured in `tooling/quality/eslint.config.mjs`; not run for implementation.
- Tests: portable entry `tools/check-quality.mjs`; no behavior tests run for this proposal.
- Build: applicability depends on any demonstrated code gap; no build selected or run.
- Dead code: configured in `tooling/quality/knip.json`; not run for implementation.
- Duplication: inspect existing canonical owners first; no clone detector selected or installed.
- Select methods proportionately after grounding. Writing applies to instruction/guide changes, with static ordinary/conditional/missing-input walkthroughs explicitly labelled static. Select behavioral regression/TDD only for a real executable contract and record its required evidence before implementation; no fabricated retrospective RED.
- J004 requires independent exact-candidate Standards/Spec review; the author cannot supply independent judgment. Record resource consumption as observed or self-reported, checks, identities and limitations without retaining private transcripts.

## Dependencies, execution and stopping boundary

- Dependency: None; unblock only after the preceding unit's accepted evidence is retained, not merely a commit or status label.
- No checkout, model/effort, actor budget or delivery branch has been assigned. Resolve approved native configuration, actual actor state, exclusive writer ownership and finite cumulative limits before dispatch; waiting/resumption never resets them.
- Each unit must deliver its functional outcome with affected tests, canonical documentation and an identifiable commit point under future commit authority. J004 is final integrated verification, not permission to defer J002/J003's own checks.
- Missing start instruction: explicitly authorize beginning this initiative or a bounded job. Until then keep pending and do not reproduce, dispatch or implement.
- After a future start, name the exact retained candidate, relevant checks, dependency closure and next authorized boundary. PR integration, release, installation and cleanup remain separate grants.
