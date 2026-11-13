# Job brief J006 / r2

## Identity and authorization

- Job: I0046 J006, brief r2 (correction 1 of 1). Actor ID: A002 (do not reuse). Role: isswf-worker.
- Operator decisions (2026-11-12): approved the factory-package, CI workflow and token-native changes; for B1 chose partial sums.
- Workspace: worktree /home/iseoane/Work/isSWF-j006, branch feat/i0046-j006-run-usage, HEAD = candidate r1 3e37f83 plus a plan commit. Write only there plus `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J006/A002.md`. No commits, pushes, network or installs.

## Required changes (review V001)

1. B1, operator choice (b): for a found transcript that has malformed lines or exceeds the size limit, sum the valid entries and mark `tokensPartial: true` with the `reason`; unreadable stays `tokens: 'unknown'`. Do not change the strict behavior of the existing token-native-claude-transcript CLI. Update en/es docs and the `broken` test.
2. S1: create `TextEncoder` lazily and encode only when `line.length * 3 > MAX_LINE`; behavior unchanged.
3. S2: a later user/assistant entry clears a previous `cost-state` for finished detection.
4. S3: export the shared usage keys, integer check and `single` from token-native-transcript-core.mjs instead of duplicating.

## Checks and return

Run only what the change affects: tests/run-usage.mjs, tests/initiative-snapshot.mjs, the token-native tests, check-docs, eslint, knip, git diff --check. Do not run the full check-quality (the coordinator runs it once on the final candidate). Add tests only for B1 (partial) and S2 (resumed session); no mutation experiments. Return changed paths, check outputs, limits.
