# I0055 J002 brief r1: no fsmonitor daemon outlives its worktree

- Authorization: operator, 2026-11-22, "coordinador, I0055". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J002, all three acceptance items.

## Research done by the coordinator

- `tooling/quality/fsmonitor-daemons.mjs` lists `git fsmonitor--daemon` processes on Windows via `Get-CimInstance Win32_Process` and reports new ones after a command; it reports "not applicable" off Windows.
- Cause: global `core.fsmonitor=true` in the operator's `~/.gitconfig`. The operator chose a factory fix; never change global Git config.
- The worktree removal step lives in `.agents/roles/references/worktrees.md` and/or the coordinator skill; find the exact place.

## Changes

1. Removal step: run `git -C <worktree> fsmonitor--daemon stop` (ignore "not running") before `git worktree remove`, in the canonical reference; EN/ES docs if they show the step.
2. Check: list fsmonitor daemons whose worktree directory no longer exists, on Windows (process command line / cwd) and Linux (`/proc/<pid>/cwd` or `ps`). Extend `tooling/quality/fsmonitor-daemons.mjs` or a small tool; it only reads, never kills. Test the parsing with fake process lists.
3. Mechanical guard where checkable: e.g. a stale-statement or command-guard rule so a documented `git worktree remove` step is preceded by the daemon stop. If it cannot be checked mechanically, record why.

## Scope

- In: the reference/skill text, the check and its tests, docs, package lists if a shipped tool changes.
- Out: changing global or user Git config; killing processes automatically.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Touched tests, `node tests/unrun-tests.mjs .`, `node tests/stale-statements.mjs .`, `node tests/release-package.mjs .` if packaging changed.
3. `node tooling/quality/check-docs.mjs`, `git diff --check`.
4. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final code head; report the stamp.
5. Record wall-clock times. Run the new check once live on Windows and report its output.
6. Write and commit A001 with each check naming the full SHA it ran at.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the check parsing. One opus/medium reviewer, 2 rounds, 1 correction.
