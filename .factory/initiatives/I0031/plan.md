# I0031: isswf-howto help router

Type: enhancement

## Objective and authority

Add an operator-invoked `isswf-howto` skill that answers "how do I ... with isSWF" questions. It routes to the right skill, role or guide, links the canonical file, checks the project state that changes the answer, and hands the operator a prompt to send to the coordinator without starting the work. Inspired by mattpocock `ask-matt` and Cursor pstack `poteto-help`. Operator request 2026-11-05 ("2. Ok"; "de momento crea las iniciativas"). Start authorized 2026-11-06 (feature-to-PR, no merge).

## Decisions

- confirmed by operator (2026-11-06): when a routed skill's own text supports direct use, the answer also offers its direct invocation (`/skill:isswf-<name>` in Pi, `/isswf:isswf-<name>` in Claude Code); the coordinator prompt stays the default ending.
- confirmed by operator (2026-11-06): a second review round and a second correction cycle were authorized.

## J001

- Status: completed
- Objective: Create and register the isswf-howto skill for Pi and Claude Code.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: Operator integration decision on the PR (REVIEW.md: touches tools/factory-package.mjs and tools/build-release.mjs).

### Acceptance

- `.agents/skills/isswf-howto/SKILL.md` exists with an operator-invoked description; it answers help questions without starting work, and treats a request for work as a coordinator task.
- It maps situations to the existing `isswf-*` skills, roles and the feature-to-PR flow, links each canonical file and reads a file before quoting it; it does not copy contracts.
- It checks state that changes the answer (active `.isswf/` or `.factory/` directory, setup record, installed pin) and mentions it only when relevant.
- Each answer ends with a ready-to-send prompt for the coordinator.
- Its scope is distinct from `isswf-understanding` (explaining a topic), stated where needed.
- The skill is registered for Pi (`package.json` `pi.skills`), Claude Code (`.claude-plugin/plugin.json` and a thin `skills/isswf-howto` entry) and the package allowlist; host-portability and release-package tests pass on Linux and Windows.
- User guides that list the skills mention it in English and Spanish; `check-docs` passes.

### Evidence

- Worker commits 8655090 (rebased to 4c2fb6e), 93d9b35 (cycle 1: installed-package links, real pin check, triage row, direct use) and 5679c33 (cycle 2: setup and interview direct use).
- Independent semantic review: round 1 fail (F1 unpackaged routes, F2 empty pin check); round 2 fail (R2-F3 setup/interview exclusion); narrow check on 5679c33 pass/pass.
- Full suite exit 0 on 93d9b35 (worker); check-docs, host-portability and git diff --check exit 0 on 5679c33 (coordinator). Coordinator found 0 missing relative links from the skill directory.
