# I0062 J001 brief r2

- Authorization: operator, 2026-11-18, "adelante con el I0062 completo". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0062-j001-readonly-dispatch`. Merge needs the operator's go.
- Writer: the coordinator in the primary checkout (sole writer).
- Baseline: origin/main eed7ca63bd1ea9b02e1ea4b33ad8b3bdfc7dc5b3.
- Objective and acceptance: [plan.md](../../plan.md) J001; triage brief [brief-r1.md](brief-r1.md).

## Design

1. A retrospective record lives at `<state>/retrospectives/<name>.md` (`<name>`: letters, digits, `.`, `_`, `-`). The retrospective reference and its template say so.
2. In `tools/isswf-dispatch-guard-core.mjs`, condition 3 accepts, for `isswf-researcher` and `isswf-planner` only (plugin or bare name), a prompt that names no job brief but names a retrospective record path and the full 40-hex checkpoint SHA. The guard then skips conditions 4 (plan) and 5 (brief) and instead checks that the record exists as a file, is tracked, not ignored and committed at the checkpoint (the condition 5 checks applied to the record). Condition 2 (model/effort) is unchanged.
3. Every other role, including the worker and the reviewer, without a job brief is still refused for condition 3. A prompt that names a job brief keeps today's path even for read-only roles.
4. The Claude hook and the Pi extension call the same core, so both hosts get it; their tests cover the core through the shared function and the Pi extension test runs one accepted retrospective call.
5. `.agents/hosts/claude-code.md` and `.agents/hosts/pi.md` point to the exemption in one line each.

## Scope

- In: the files above, `tests/isswf-dispatch-guard.mjs`, the Pi extension test if one covers dispatch, `.agents/roles/references/retrospective.md`, `.factory/templates/retrospective.md`.
- Out: other guard conditions, selection rules, writer roles.

## Method

TDD (RED: a researcher with a committed retrospective record is refused today). One opus/medium reviewer (authorization boundary); budget 2 review rounds, 1 correction.
