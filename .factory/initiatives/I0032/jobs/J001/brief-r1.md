# Job brief J001 / r1

## Identity and authorization

- Source: operator conversation and interview, 2026-11-05.
- Trusted prepare-only reference: operator chat 2026-11-05 (interview answers recorded in the I0032 plan Decisions).
- Request mode: prepare-only. Preparation does not authorize implementation, workers, model calls, commits, GitHub writes or merge.
- Profile and skills: worker profile; Claude Code `plugin-authoring` skill for mod mechanics.

## Objective

Give the operator a collapsible view of open initiatives and slices beside the chat, with the current session's initiative on top.

## Scope

- A source-checkout-only Claude Code mod reading existing `isswf-status` data from the active state directory.
- Session-initiative derivation from session tool activity, plus a manual override.

## Exclusions

- Live transcript details (J002), `attempt.md` changes (J003), packaging (J004).
- Pi extension, `isswf-panel` changes or removal.
- Any model call, state write or new status store.

## Acceptance

See the plan's J001 acceptance list. Layout and visual design are accepted by the operator through iteration.

## Inputs and bases

- Document-input and target base: 9bada1837f2dbaeaaf660ccdb6add282525cd150
- Data source: `tools/isswf-status.mjs` (`initiatives()` and per-initiative `jobs[].reportedStatus`).

## Execution

- Design step (operator request 2026-11-05): before implementation, iterate a visual mockup with the Claude artifact design skill or Design artifact type until the operator accepts it; then implement it with `plugin-authoring` within the mod's actual rendering limits.
- Selected methods: none by default; TDD may be selected for status grouping logic if extracted into a testable module.
- Required references: `.agents/roles/references/comments.md`, `.agents/roles/references/code-quality.md`.
- Review: mechanical plus operator acceptance of the design.
- Commit policy: none until a start instruction defines it.
