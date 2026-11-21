# I0064 J003 brief r1: a CI result that survives a stopped watcher

- Authorization: operator, 2026-11-21, "Coordinador I0064, release patch, ...". Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J003, all three acceptance items.

## Research done by the coordinator

- **Claude Code.** A background Bash command reports by task notification. Under memory pressure the host has stopped `gh pr checks --watch` with no result, three times: I0057 on 2026-11-15, and twice in I0058 on 2026-11-21.
- **Command guard.** `tools/isswf-command-core.mjs:276-290` already refuses continuous CI loops. It allows a native completion event (`--watch`), or one bounded deferred check: a single sleep of at most 900 s followed by one `gh pr checks`.
- **Pi.** It has `bg_*` background tools with completion notifications (`.agents/hosts/pi.md:75`). Whether Pi reports a stopped background command is unverified. Check the installed Pi docs or source, and state what you find; do not guess.

## Changes

1. **One-call CI state.** Add `tools/isswf-ci-state.mjs --pr <n> [--repo <owner/name>]`.
   - It reads the PR's head SHA and the check runs for that exact head, through `gh pr view --json headRefOid,statusCheckRollup` or `gh api`, in one call, and exits.
   - Output is JSON: `head`, `state` (`success`, `failure` or `pending`), and each check's name and conclusion.
   - Exit codes: 0 for success, 1 for failure, 2 for pending, 3 when the state cannot be read.
   - It never waits, sleeps or loops.
   - Put the logic in a core module so it can be tested with a fake `gh` result. Ship the tool in the package lists if tools are listed there.
2. **Command guard.** The bounded deferred check must also accept this tool in place of `gh pr checks`: one sleep of at most 900 s, then one `node tools/isswf-ci-state.mjs`. Loops stay refused. Add tests for both cases.
3. **Guides.**
   - In `.agents/hosts/claude-code.md` and `.agents/hosts/pi.md`, and in `.agents/roles/references/feature-delivery.md` step 5:
     - Prefer a short bounded foreground check with the new tool.
     - A background `--watch` is optional.
     - When the host reports a background watcher as stopped, killed or failed without a result, run the tool once. Do not restart the watcher in a loop.
   - Update the EN and ES operations guard text.
4. **Mechanical check.** Add a stale-phrase entry for wording that makes the background watch the only way to wait, if the old wording is stable enough to match. Otherwise record why it cannot be checked.

## Scope

- In: the tool and core, the guard change, the tests (Linux and Windows paths, with a fake `gh`), the guides, the docs and the package lists.
- Out: changing CI workflows; automatic retries; any network call in tests.

## Checks

1. In the new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Run the touched tests, `node tests/unrun-tests.mjs .` (register every new test), `node tests/stale-statements.mjs .`, and `node tests/release-package.mjs .` if packaging changed.
3. Run `node tooling/quality/check-docs.mjs` and `git diff --check`.
4. Run `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final code head, and report the stamp.
5. Record wall-clock times.
6. Write and commit A001 with each check naming the full SHA it ran at.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the core and the guard. One opus/medium reviewer, 2 rounds, 1 correction.
