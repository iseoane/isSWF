# I0063 J002 brief r2: rule update from the pilot

- Authorization: operator, 2026-11-21: batched PRs and records-only CI skip in J002 scope ("si por favor"); per-branch `isswf-verify --tier job` and ESLint at the job tier ("si no??"); close I0063 ("llevar a cierre la I0063"). Host-guide change approved in scope under the standing grant (REVIEW.md person approval, not HIGH risk). Merge per the standing rule.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J002, second acceptance item. r1 covered the pilot run; this revision covers only the rule update.

## Observed in the pilot (evidence to write from; do not overstate)

- Claude Code 2.1.330, Windows 11, 2026-11-21: two background `isswf:isswf-worker` children ran concurrently in coordinator-created worktrees under `isswf.worktreeRoot`. A live probe from the J004 child, `git -C <J005 worktree> commit --dry-run`, was refused by the branch guard naming its assigned checkout and branch. Foreground children are not bound. Pi is not observed. Linux is not observed live (unit tests only).
- Each job ran its own review chain on its branch. The coordinator merged the reviewed branches into one batch branch with merge commits (no rebase), added one fix-forward branch (coverage chain fix) and opened one PR (#374): CI 5.3 min for three units, against 3.7 and 5.4 min for single-job PRs. `push main` runs were 44 in the last 60 runs (22 cancelled, 131 min), the main cost J004 removes.
- A records-only push to main (b729cf5a) started no Quality run after J004.
- The coordinator ran focused tests per branch, not `isswf-verify --tier job` (deviation from `.agents/skills/isswf-coordinator/SKILL.md:170`). `check-docs` is `linux` only in `.factory/verification.json` because I0061 J001 seeded platforms from where CI runs a check, not where it works; it passes on Windows. ESLint passes on Windows in 5 s.
- A finished child's shell can hold the worktree directory, so `git worktree remove` may leave an empty directory on Windows.

## Changes

1. `.agents/hosts/claude-code.md`, "Parallel-writer capability disclosure" and "Selected writing-workspace policy": separate-worktree mode is observed for background workers through the `checkout:`/`branch:` binding (state version, platform and date; foreground, Pi and live Linux not observed). Remove the claim that the binding is "not yet observed live". Keep every limit the guard states.
2. `.agents/skills/isswf-coordinator/SKILL.md`: a short parallel flow: independent jobs only, one worktree and branch each, background dispatch with `checkout:`/`branch:`, per-branch `isswf-verify --tier job` plus the focused tests of the change, review per job, then either one PR per job or one batched PR (merge commits, fix forward on a new branch, never rewrite a reviewed branch), coverage on the batch, worktree removal after merge. A delta review's base should be the earlier candidate. Keep it short; link instead of copying.
3. `docs/en/operations.md` and `docs/es/operations.md`: the same, for operators, mirrored.
4. `.factory/verification.json`: `check-docs` platforms `linux` and `win32`; `lint` cost `job`, platforms `linux` and `win32`. Leave `dead-code` and `check-quality` as they are. Refresh `derivedFrom` only as the guard requires. Update `.factory/project-setup.md` where it records the binding as unverified (line 32) and the verification digest (line 24) if it changes.

## Scope

- Out: new tools or guards (I0058 J001 adds the stamp and commit gate), Pi changes, workflow changes.

## Checks

`node tools/isswf-verify.mjs --project <checkout> --tier job` (record each result), the tests that read the edited skill and guide (find them with grep), `git diff --check`. Record wall-clock times. Write A001 with full SHAs. Leave no background shells. Commit only in your assigned checkout and branch.

## Method

One opus/medium reviewer, 2 rounds, 1 correction.
