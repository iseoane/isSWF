# Job brief J001 / r2

## Changes from r1

- Start authorized: operator chat 2026-11-06 "de momento ataquemos I0031 y I0030". Feature-to-PR scope: implementation, local commits, push of branch `feat/interview-alternatives`, PR and exact-head CI. No merge.
- Review reclassified from mechanical to semantic, one independent round: the change is methodology text, which `.agents/roles/references/review.md` (I0033) assigns to semantic review; no test or journey can show the interview asks the right question.
- Target base: 2a9341d39f672d5d02dc55a4dc13e389719b30bb.

## Unchanged

Objective, scope, exclusions and acceptance as in [brief-r1.md](brief-r1.md) and the plan.

## Execution

- Worker reads `.agents/roles/worker.md`, `.agents/skills/isswf-writing/SKILL.md` and its agent-documents reference, and `.agents/skills/isswf-interview/SKILL.md` in full before editing.
- Locate guides that describe the interview format with grep in `docs/en` and `docs/es`; change only where the description changes, in both languages.
- Checks: `node tooling/quality/check-docs.mjs`, `node tests/host-portability.mjs`, any test that greps interview wording, `git diff --check`.
- One conventional commit, no AI attribution lines. Budget: 1 worker, 1 review round, 1 correction cycle.
