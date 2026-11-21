# I0058 J008 brief r2: stale-statement search over the package

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; parallel work accepted. Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines. Runs in parallel with J001 pane and J004; integrated in batch 1.
- Objective and acceptance: [plan.md](../../plan.md) J008, second acceptance item. Unit 1 (canonical definitions) follows after J004 merges, since both touch `researcher.md`, `planner.md` and the host guides.

## Observed (research r1 at c7ba4fbc)

- `tooling/quality/check-docs.mjs:58` checks three forbidden phrases over `docs/*.md` only; `tests/host-portability.mjs:66-70` has hand-written negatives per file.
- Package sets: Pi `payloadPaths`, conditional sets and `taskPayloadPaths` (`tools/factory-package.mjs:24-115`, `:290`); plugin/release `releaseFiles` (`:123`, not exported).
- I0057 J001 V002 F6: an old statement survived because the search skipped `.agents/skills/`.

## Changes

1. Export the packaged file set (union of the Pi payload and the release files) from `tools/factory-package.mjs` without changing what is packaged.
2. A committed phrase list (for example `tooling/quality/stale-statements.json`: entries with `phrase`, optional `scope` glob, `reason`, `since` initiative/job) and a test that scans exactly the packaged text files for each phrase, normalizing CRLF, excluding `.factory/initiatives/**`, with a small allowlist for the test and fixture files themselves. Seed the list with the I0057 cases already closed ("exits 0 even" and the three `check-docs` phrases, moved or referenced so there is one list).
3. Register the test in `tools/check-quality.mjs` and `.factory/verification.json` (job tier, linux and win32), refresh the setup digest, and a short paragraph in docs/en|es development.md and the coordinator skill line: a contract change adds its old statement to the list in the same change.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. Then the new test (with a mutation: a seeded phrase in a packaged file fails it), `tests/documentation.mjs`, `tests/platform-package.mjs`, `node tooling/quality/check-docs.mjs`, `git diff --check`, and `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final head (writes the stamp). Record wall-clock times. Write A001 inside your checkout with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD. One opus/medium reviewer, 2 rounds, 1 correction.
