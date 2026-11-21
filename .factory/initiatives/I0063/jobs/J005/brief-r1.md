# I0063 J005 brief r1

- Authorization: operator, 2026-11-21 (see J002 brief). Branch `feat/i0063-j005-ci-minutes`, in its own worktree; integrated through the J002 batch PR, not its own PR.
- Writer: one isswf-worker, sole writer of its worktree.
- Objective and acceptance: [plan.md](../../plan.md) J005.

## Design

- `tooling/maintenance/ci-minutes.mjs` (development-only, never packaged): reads JSON from `gh run list --json event,headBranch,conclusion,createdAt,updatedAt,databaseId` on stdin or from a file argument; groups by `pull_request <branch>` and `push <branch>`; prints per group the run count, cancelled count and total minutes (updatedAt minus createdAt), and a grand total. Export a pure function for tests. No network inside the script.
- `tests/ci-minutes.mjs` with a fixture; register it wherever other tests are listed (check `tools/check-quality.mjs` and the Knip config).
- A short usage line in `docs/en/development.md` and `docs/es/development.md`.

## Scope

- Out: workflow changes (J004), calling the GitHub API.

## Checks

TDD: `node tests/ci-minutes.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, and the package allowlist test if one checks `tooling/`. Record wall-clock times. Write A001 with full SHAs. Leave no background shells. Commit only inside your assigned checkout and branch.
