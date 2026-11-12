# Job brief J008 / r3

- Same job and authorization as [brief-r1.md](brief-r1.md) and [brief-r2.md](brief-r2.md). Actor ID: A003 (do not reuse). Workspace /home/iseoane/Work/isSWF-j008, HEAD b7d208f (candidate r2). Write only there plus `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J008/A003.md`. No commits.
- Operator decision (2026-11-12, after seeing the floating hover card cover the card and lose its first line): replace the hover card with click-to-expand. Each agent pill is a `Button` (plain) that toggles its detail; the detail renders in normal flow directly below that round's row, inside the card (no `position="absolute"`, no hover), pushing later content down; clicking again collapses. Several pills may be open at once. Reuse the existing `EXPANDED` state with keys `<initiative>-<job>-<entry>`; keep the same detail lines (id · kind, model, effort, verdict, usage).
- Update the hover test into a click test (expand, collapse). No other new tests, no mutation experiments.
- Checks: claude plugin validate and test on the worktree, eslint, knip, git diff --check. Return changed paths, check outputs, limits.
