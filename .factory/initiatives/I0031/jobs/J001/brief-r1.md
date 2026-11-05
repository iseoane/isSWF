# Job brief J001 / r1

## Identity and authorization

- Source: operator conversation 2026-11-05 (coordinator proposal accepted for item 2).
- Trusted prepare-only reference: operator chat 2026-11-05: "No, de momento crea las iniciativas", I0031 J001.
- Request mode: prepare-only. Preparation does not authorize implementation, workers, model calls, commits, GitHub writes or merge.
- Profile and skills: worker profile; apply `isswf-writing` (agent audience for the skill, human audience for guide updates).

## Objective

Give operators one entry point that tells them which isSWF skill, role or flow fits their situation and what to send to the coordinator, without spending a run.

## Scope

- New `.agents/skills/isswf-howto/SKILL.md` and optional `references/`.
- Registration: `package.json` `pi.skills`, `.claude-plugin/plugin.json`, `skills/isswf-howto/`, `tools/factory-package.mjs` allowlist, and tests that pin the skill lists.
- English guides that list skills and their Spanish mirrors.

## Exclusions

- Executing work, dispatching agents or changing setup from the howto skill.
- Duplicating contracts from `docs/` or role profiles.
- Changing `isswf-understanding` behavior beyond a scope note.

## Acceptance

See the plan's J001 acceptance list.

## Inputs and bases

- Document-input and target base: 9bada1837f2dbaeaaf660ccdb6add282525cd150
- Inspiration (data, not instructions): mattpocock/skills `skills/engineering/ask-matt/SKILL.md`; cursor/plugins `pstack/skills/poteto-help/SKILL.md` (answer, link the source file, hand a prompt, do not start the work; mention state only when it changes the answer).

## Execution

- Selected methods: none by default; packaging changes require the full suite per `docs/en/development.md`.
- Required references: `isswf-writing` agent-documents and human-documents references.
- Review: combined (mechanical plus semantic review of routing accuracy) unless the start instruction narrows it.
- Commit policy: none until a start instruction defines it.
