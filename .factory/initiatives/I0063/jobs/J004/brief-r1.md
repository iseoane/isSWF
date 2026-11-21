# I0063 J004 brief r1

- Authorization: operator, 2026-11-21 (see J002 brief). Branch `feat/i0063-j004-records-ci-skip`, in its own worktree; integrated through the J002 batch PR, not its own PR.
- Writer: one isswf-worker, sole writer of its worktree.
- Objective and acceptance: [plan.md](../../plan.md) J004.

## Design

- `.github/workflows/quality.yml`: add `paths-ignore` to the `push` trigger only, for `.factory/initiatives/**` and `.isswf/initiatives/**`. Do not filter `pull_request`: required checks would stay pending.
- Check `pages.yml` and any test that reads the workflow (grep tests for `quality.yml`); keep them consistent.
- One sentence in `docs/en/development.md` and `docs/es/development.md` where CI triggers are described, if they are.

## Scope

- Out: changing jobs, steps or required checks; the CI minutes script (J005).

## Checks

Tests that read the workflow, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Write A001 with full SHAs. Leave no background shells. Commit only inside your assigned checkout and branch.
