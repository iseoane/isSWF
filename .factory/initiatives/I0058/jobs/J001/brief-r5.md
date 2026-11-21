# I0058 J001 brief r5: checks named by commit, and the read-and-edited fix

- Authorization: operator, 2026-11-21, "Dale" (J001 r5 and J011 in parallel, within the 2-worker limit). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001, the third acceptance item ("A check that an attempt record reports as run names the commit it ran at, and an observed command run supports it"). It also closes V006 S2. The stamp and gate (#376), pane (#377) and observed reads (#378) are merged.

## Changes

1. **Record rule.** In `tools/isswf-record-check.mjs` and its core, each check an attempt record reports as run must name a full 40-hex commit SHA.
   - Scope: entries in the attempt template's checks field (find the field name in `.factory/templates/`).
   - A check reported as not run, or as skipped with a reason, needs no SHA.
   - The rule applies to new records only. Use the same base-relative "new record" test the resolution rule uses; historical records stay valid.
2. **Support from observed commands.** When the attempt's child run is resolvable (`tools/isswf-run-usage-core.mjs` `commands`), add a non-blocking note for each reported check whose command does not appear among the observed commands.
   - Match on the command's script path, for example `tests/x.mjs` or `isswf-verify`.
   - If the transcript is unavailable, say so in the note instead of guessing.
3. **V006 S2.** In `compareBrief`, remove edited paths from the named set, not from the read set: `named.filter(p => !edited.some(e => same(p, e)))`. A file that was both read and edited must count as read.
4. **Docs and skills.**
   - Update the attempt template's check-field definition (its canonical home, per J008) and the EN/ES operations section on attempt close.
   - Update the worker profile line that says how to report checks.
   - Add a stale phrase if the old wording could return.

## Scope

- In: the rule, the note, the S2 fix, tests (Linux and Windows paths, new versus historical records, a not-run check, a transcript that is unavailable), the template, the docs and the worker profile.
- Out: blocking on the observed-command note; changing the stamp or the gate; the J011 record-location guard.

## Checks

1. In a new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Run the touched tests, including `node tests/run-usage.mjs .` and the record-check tests.
3. Run `node tooling/quality/check-docs.mjs` and `git diff --check`.
4. Check that every new test is registered in `tools/check-quality.mjs` or in CI; `node tests/unrun-tests.mjs .` must exit 0.
5. On the final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report the stamp path.
6. If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`.
7. Record wall-clock times.
8. Write and commit A004 in your checkout, with full SHAs.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the rule and the S2 fix. One opus/medium reviewer, 2 rounds, 1 correction.
