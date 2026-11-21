# I0058 J013 brief r1: no opportunistic index locks, no leftover fsmonitor daemons

- Authorization: operator, 2026-11-21, "Ok a matar lo daemon pero esto es algo que debemos comprobar que no siga pasando". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J013, all three acceptance items. Evidence is in the plan.

## Changes

1. **Optional locks off.**
   - Every Git child process spawned by hooks, guards and the pane must set `GIT_OPTIONAL_LOCKS=0` in its environment. This covers `hooks/`, `tools/isswf-*-guard*`, the pane and their shared runners; find them with codegraph.
   - Prefer one shared helper (`tools/git-evidence.mjs` already sets it) over per-call edits.
   - Add a test that scans those sources and fails when a Git spawn does not go through the helper or set the variable.
2. **Fixture repositories.**
   - Add a shared test helper that runs `git init` with `-c core.fsmonitor=false` and writes `core.fsmonitor=false` into the new repository's local config.
   - Move test fixture creation onto that helper.
   - Add a check, registered in `tools/check-quality.mjs`, that fails when a test creates a repository (`git init` or `git clone`) without the helper.
3. **Daemon check.** Add a Windows-only check that:
   - counts `git fsmonitor--daemon` processes before and after the job-tier tests;
   - reports any new ones by PID.

   Wire it so the job tier, or a documented command, runs it. On Linux it reports "not applicable". It must not kill processes.
4. **Small follow-ups from batch 3 reviews.**
   - J011 V002 N1: the "Record creation" EN/ES text says the worker's checkout must already contain the current brief and the plan job marked `in-progress` before `create`, or the coordinator copies them onto the branch first.
   - J001 V008 N1: the attempt template's checks line, and the matching `worker.md` line, say that a not-run or skipped reason must not use an outcome word ("pass", "fail", "exit N").

## Scope

- **In:** the helper and env change, the fixture helper and its check, the daemon check, the EN/ES docs (development quality checks and operations), and the two follow-ups.
- **Out:**
  - Changing the operator's global Git config.
  - Killing processes.
  - Rewriting unrelated test logic.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Run the touched and new tests.
3. Run `node tests/unrun-tests.mjs .`, `node tooling/quality/check-docs.mjs` and `git diff --check`.
4. Run a jiti transform of `hooks/register.tsx` if it changed.
5. If packaging changed, run `node tests/release-package.mjs .`.
6. On the final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report the stamp and the daemon-check result.
7. If `.factory/verification.json` changes, refresh its digest in `.factory/project-setup.md`.
8. Record wall-clock times.
9. Write and commit A001 in your checkout, with full SHAs.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the two scan checks. One opus/medium reviewer, 2 rounds, 1 correction.
