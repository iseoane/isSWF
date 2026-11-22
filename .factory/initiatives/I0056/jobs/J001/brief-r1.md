# I0056 J001 brief r1: research interruption seams for Bun and clearClaim

- Authorization: operator, 2026-11-22, "Coordinador I0056". Standing grant.
- Actor: one read-only isswf-researcher in a detached base worktree. No writes; the findings return to the coordinator, who writes the implementation brief r2.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Questions

1. How does `tests/state-interruption.mjs` pause `moveState` at its three boundaries for the Node launcher (preload via `node --import`)? Cite file:line.
2. Which seams exist to pause or kill the compiled Bun executable (`tools/bun-release.mjs`) at those same boundaries without a production test hook? Consider: filesystem-observable points (polling for a staged file and killing the process), environment the binary already reads, OS-level suspension (Windows `NtSuspendProcess`/`taskkill`, Linux `SIGSTOP`/`SIGKILL`), and Bun's own preload (`BUN_OPTIONS`/`--preload`) support in compiled binaries. State which are evidence-backed in this repository and which are unverified.
3. Where is `clearClaim` and the `.isswf-transition-retired-*` directory handled? What does recovery do today when that directory is retained after `complete.json`? Cite file:line and existing tests.
4. Recommend one approach per acceptance item, with the files a worker would touch and the tests to add, or an evidence-backed reason it cannot be exercised.

## Scope

- In: reading code, tests and docs. Out: edits, builds, running the Bun binary, network.

Report each claim with file:line or mark it unverified.
