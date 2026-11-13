# Job brief J006 / r3

## Identity and authorization

- Job: I0046 J006, brief r3 (operator-authorized second correction, 2026-11-12: "Si ... Completa el j006"). Actor ID: A003 (do not reuse). Role: isswf-worker.
- Workspace: worktree /home/iseoane/Work/isSWF-j006, branch feat/i0046-j006-run-usage, HEAD 497e735 (candidate r2). Write only there plus `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J006/A003.md`. No commits, pushes, network or installs.

## Required changes (review V002)

1. B2: for a transcript over the size limit, decide `finished` from the full text already in memory and sum tokens only from the truncated prefix, so a finished run is reported finished and cached once.
2. I6: fix en/es docs for `finished` (a `cost-state` with no later user/assistant entry; agent final `end_turn`; Pi `exitCode`), and say "first 64 MB" is approximate if needed (I5).
3. One test: an injected fs whose `stat` reports a size over `LIMITS.file` for a finished session -> `finished: true`, `tokensPartial: true`, read once across two resolutions.

## Checks and return

Only what the change affects: tests/run-usage.mjs, the token-native tests, check-docs, eslint, knip, git diff --check. No full check-quality, no mutation experiments, no other new tests. Return changed paths, check outputs, limits.
