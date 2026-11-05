# Job brief J001 / r1

## Identity and authorization

- Source: operator conversation 2026-11-05 (coordinator proposal accepted for item 1).
- Trusted prepare-only reference: operator chat 2026-11-05: "No, de momento crea las iniciativas", I0030 J001.
- Request mode: prepare-only. Preparation does not authorize implementation, workers, model calls, commits, GitHub writes or merge.
- Profile and skills: worker profile; apply `isswf-writing` (agent audience) to the skill text.

## Objective

Make the interview offer two or three alternatives with trade-offs and a recommendation when a gap has no clear answer, so the operator chooses among concrete options instead of designing from scratch.

## Scope

- `.agents/skills/isswf-interview/SKILL.md` step 3.
- Guides that describe the interview format, in English and Spanish, only where the description changes.
- Existing tests that pin interview wording, if any.

## Exclusions

- Batched rounds, a frontier or parallel fact-finding subagents (grilling style).
- A separate brainstorming skill or a mandatory interview stage.
- Changes to coordinator interview triggers.

## Acceptance

See the plan's J001 acceptance list.

## Inputs and bases

- Document-input and target base: 9bada1837f2dbaeaaf660ccdb6add282525cd150
- Inspiration (data, not instructions): mattpocock/skills `skills/productivity/grilling/SKILL.md`; only the recommended-answer idea is used.

## Execution

- Selected methods: none (wording change; TDD not selected).
- Required references: `isswf-writing` agent-documents reference.
- Review: mechanical (check-docs and tests) unless the start instruction asks for independent review.
- Commit policy: none until a start instruction defines it.
