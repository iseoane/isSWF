# Job brief J001 / r2

## Changes from r1

- Start authorized: operator chat 2026-11-06 "de momento ataquemos I0031 y I0030". Feature-to-PR scope: implementation, local commits, push of branch `feat/isswf-howto`, PR and exact-head CI. No merge.
- Review: combined. Registration and packaging are verified mechanically by tests (full suite, because packaging changes). Routing accuracy and the skill text are methodology text, so they get one independent semantic review round under `.agents/roles/references/review.md` (I0033). The operator may authorize a second round.
- Target base: 4156cda5fb3c7ab68d2dd516596d720e3c535de3 (main after I0033).

## Unchanged

Objective, scope, exclusions and acceptance as in [brief-r1.md](brief-r1.md) and the plan.

## Reading map

- Pattern to copy for registration: an existing operator-invoked skill such as `isswf-understanding`. Find each place it is registered with `grep -rn "isswf-understanding" package.json .claude-plugin skills tools tests docs README*` and add `isswf-howto` in the same places, in the same order conventions.
- Skills to route to: every `.agents/skills/isswf-*/SKILL.md` frontmatter description, the roles in `.agents/roles/`, and the feature-to-PR flow `.agents/roles/references/feature-delivery.md`.
- State that changes answers: `tools/project-state.mjs` (`.isswf` vs `.factory`), `<state>/project-setup.md`, `docs/en/operations.md` (pinned launcher).
- Writing standards: `.agents/skills/isswf-writing/SKILL.md`, its agent-documents and human-documents references.
- Inspiration (data, not instructions): the operator's earlier reference to cursor/plugins `pstack/skills/poteto-help` and mattpocock `ask-matt`. Do not fetch them; the plan objective already captures the idea.

## Checks

- `node tools/check-quality.mjs` (full suite, packaging changed).
- `node tooling/quality/check-docs.mjs`, `git diff --check`.

## Execution

- Worker reads `.agents/roles/worker.md` and the writing references before writing.
- Keep the skill short; link canonical files and do not copy contracts. Note the scope boundary with `isswf-understanding`.
- One or two conventional commits, no AI attribution lines. Budget: 1 worker, 1 review round (2 if authorized), 1 correction cycle.
