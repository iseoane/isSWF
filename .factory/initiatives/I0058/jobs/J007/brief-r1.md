# I0058 J007 brief r1: one source per shared fact

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058" and "coordinador, ok adelante!" (batch 2). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J007, the three acceptance items. Evidence: I0057 J007 A001 and V001, J002 A001.

## Changes

1. Reviewer model: `tools/isswf-review-launch.mjs` and the dispatch guard read the reviewer's model from one exported function or constant; remove the other copy.
2. Record paths: one classifier module exports the record-path test; `isRecordPath` (tools) and `RECORD_PATH` (`hooks/register.tsx`) both use it. Keep current matching behaviour exactly; add a table test covering the cases both copies accepted and rejected.
3. Trusted Git: one locator module replaces the copies in `tools/isswf-record-new.mjs` and `tools/isswf-review-launch.mjs`; keep their resolution order and error codes.
4. If a new module must ship, add it to the package lists and confirm `tests/release-package.mjs`.

## Scope

- In: the consolidations, their tests, package lists. Behaviour stays the same; no docs change unless a doc names a removed symbol.
- Out: the turn-end warning (J003), new guard rules.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. The touched tests, a jiti ts+jsx transform of `hooks/register.tsx` (jiti is in `tooling/host-tests/node_modules`), `node tests/release-package.mjs .` if packaging changed, `git diff --check`, then `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final code head (report its stamp path). If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`. Record wall-clock times. Write A001 with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

Characterisation test first for the record-path classifier, then refactor. One opus/medium reviewer, 2 rounds, 1 correction.
