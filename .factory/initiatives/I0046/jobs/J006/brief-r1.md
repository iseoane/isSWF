# Job brief J006 / r1

## Identity and authorization

- Job: I0046 J006, brief r1, Size M. Actor ID: A001 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Operator start: "Ok" to starting J006 (Claude Code session, 2026-11-12). Request mode: local-only for the worker; the coordinator owns commits and the chained PR (base feat/i0046-j005-run-line, never main).
- Workspace: worktree /home/iseoane/Work/isSWF-j006 (branch feat/i0046-j006-run-usage). Write only there, plus your attempt record `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J006/A001.md`. Read-only access to real transcripts under ~/.claude and Pi session dirs is allowed for discovery only; never copy private content into fixtures (use synthetic fixtures). No commits, pushes, network or installs.

## Objective and acceptance

Plan I0046 J006 is canonical. Resolve each `runs` entry produced by the snapshot (J005: `claude agent=<id>`, `claude session=<id>`, `pi child=<id>`) to usage: model, tokens (input, output, cache read, cache write), duration, skill loads per skill name, and reads of `.agents/` files per path.
- Reuse the existing token-native readers (tools/token-native-claude-transcript.mjs, token-native-pi.mjs, token-native-summary.mjs) where they already parse these sources; do not duplicate their parsing. Find where Claude stores a native subagent transcript for an agent id and a `claude -p` session transcript, and how a Pi child's session is located.
- Same shape as J004: parsing logic Node-free with an injected fs (the J008 pane must use it through `$.fs`), plus the Node wrapper. Exposed through the snapshot wrapper/CLI as an opt-in (e.g. `--usage`) so the plain snapshot stays cheap; each entry gains `usage` (with explicit `unknown` per field when unresolvable). Tokens always present when the transcript is found.
- Cache: a finished run's result is computed once and reused (key host+kind+id; a run is finished when its transcript shows completion; unfinished runs are never cached). Keep the cache out of the initiative records (e.g. a git-ignored file under the state dir or an in-process cache the caller owns; justify the choice).
- Docs: contract in docs/en/operations.md and docs/es/operations.md, equivalent.
- Tests: synthetic fixtures for a Claude agent transcript, a Claude session transcript and a Pi child, plus missing/malformed transcripts and the cache (finished cached, unfinished not). Add the test to the Windows CI step list as J004 did.

## Checks and return

Focused tests, check-docs, eslint, knip, git diff --check, full check-quality. Stop and report if the change exceeds ~400 lines excluding fixtures, or if a host's run cannot be located without guessing (report it as unknown rather than guess). Return changed paths, check outputs, limits, resources read.
