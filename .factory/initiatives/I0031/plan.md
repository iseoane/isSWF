# I0031: isswf-howto help router

Type: enhancement

## Objective and authority

Add an operator-invoked `isswf-howto` skill that answers "how do I ... with isSWF" questions. It routes to the right skill, role or guide, links the canonical file, checks the project state that changes the answer, and hands the operator a prompt to send to the coordinator without starting the work. Inspired by mattpocock `ask-matt` and Cursor pstack `poteto-help`. Operator request 2026-11-05 ("2. Ok"; "de momento crea las iniciativas"). Start authorized 2026-11-06 (feature-to-PR, no merge).

## J001

- Status: in-progress
- Objective: Create and register the isswf-howto skill for Pi and Claude Code.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Worker implements; full suite; one semantic review round; PR and CI.

### Acceptance

- `.agents/skills/isswf-howto/SKILL.md` exists with an operator-invoked description; it answers help questions without starting work, and treats a request for work as a coordinator task.
- It maps situations to the existing `isswf-*` skills, roles and the feature-to-PR flow, links each canonical file and reads a file before quoting it; it does not copy contracts.
- It checks state that changes the answer (active `.isswf/` or `.factory/` directory, setup record, installed pin) and mentions it only when relevant.
- Each answer ends with a ready-to-send prompt for the coordinator.
- Its scope is distinct from `isswf-understanding` (explaining a topic), stated where needed.
- The skill is registered for Pi (`package.json` `pi.skills`), Claude Code (`.claude-plugin/plugin.json` and a thin `skills/isswf-howto` entry) and the package allowlist; host-portability and release-package tests pass on Linux and Windows.
- User guides that list the skills mention it in English and Spanish; `check-docs` passes.

### Evidence

- None.
