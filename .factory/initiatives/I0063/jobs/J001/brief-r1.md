# I0063 J001 brief r1

- Authorization: operator, 2026-11-20, "Dale" to I0063 J001. Feature-to-PR start on `feat/i0063-j001-worktree-binding`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Design (extend existing pieces)

1. Assignment: a worker dispatch prompt may carry `checkout: <absolute path>` and `branch: <name>` lines. When a role-agent dispatch is accepted, the Claude hook already stores the dispatch with the returned `runId` (`hooks/register.tsx` around lines 591-597, `rememberDispatch` in `tools/isswf-compaction-core.mjs`). Store the assigned checkout and branch with it (or in the branch-guard store keyed by run id).
2. Guard: the branch guard (`tools/isswf-branch-guard-core.mjs` `checkBranch`, keyed by `loop` = `e.agentId ?? 'main'`) refuses a `git commit` from a loop that has an assignment when the commit's repository top (`observe(dir).top`, normalized with `resolveDir`/`keyOf`) is not the assigned checkout or its branch is not the assigned branch. Loops without an assignment (the coordinator, unassigned children) behave exactly as today. Fail open like the rest of the guard.
3. Pi parity: wire the same core in `tools/isswf-command-guard-pi-extension.mjs`. First find whether Pi exposes a child identity and the dispatch prompt to the extension. If it does not, implement Claude only and report the Pi gap explicitly as a blocker (do not fake parity).
4. Coordinator skill and host guide: one sentence each saying a worker in a coordinator-created worktree gets `checkout:` and `branch:` lines in its prompt and the guard refuses commits elsewhere. Do not change the host guide's worktree rule yet (J002 decides it from the pilot).

If the hook cannot see the child's run id on its shell calls, stop and report.

## Scope

- Out: creating or removing worktrees, the pilot (J002), parallel dispatch.

## Checks

TDD (test-only RED, then GREEN): `tests/isswf-branch-guard.mjs`, `tests/isswf-compaction.mjs`, `tests/isswf-command-guard.mjs` if wiring changes, tests that read the edited skill/guide, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Full suite to CI. Write A001 with full SHAs. Leave no background shells.

## Method

TDD. One opus/medium reviewer, 2 rounds, 1 correction.
