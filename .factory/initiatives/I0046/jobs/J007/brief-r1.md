# Job brief J007 / r1

## Identity and authorization

- Job: I0046 J007, brief r1, Size S. Actor ID: A001 (do not reuse). Role: isswf-worker.
- Operator start: "adelante con el siguiente job" (Claude Code session, 2026-11-12). Coordinator owns commits and the chained PR (base feat/i0046-j006-run-usage, never main).
- Workspace: worktree /home/iseoane/Work/isSWF-j007 (branch feat/i0046-j007-usd). Write only there plus `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J007/A001.md`. No commits, pushes, network or installs.

## Objective and acceptance

Plan I0046 J007 is canonical: add `costUsd` to each resolved usage from a versioned price table.
- Table: a small JSON data file shipped with the tools (e.g. `tools/isswf-prices.json`) with `version`, `source`, `date`, and per-model USD per million tokens: input, output, cacheWrite, cacheRead. Use exactly these coordinator-supplied values (source: Anthropic first-party API prices as listed in Claude Code's claude-api reference, cached 2026-11-03; cache write = 1.25x input for 5-minute writes, cache read = 0.1x input unless listed):
  - claude-fable-5-2: 8 / 40, cacheRead 0.20
  - claude-fable-5-1, claude-fable-5: 10 / 50
  - claude-opus-5-5: 4 / 20, cacheRead 0.20
  - claude-opus-5, claude-opus-4-8, claude-opus-4-7, claude-opus-4-6: 5 / 25
  - claude-sonnet-5-5: 2 / 10, cacheRead 0.10
  - claude-sonnet-5: 2 / 10
  - claude-sonnet-4-6: 3 / 15
  - claude-haiku-5-5: 0.10 / 0.50 (prompts up to 100K tokens; note it)
  - claude-haiku-4-5: 1 / 5
- Match the model string exactly (allow a trailing `[1m]` or date suffix only if real records show it). Any other model, including non-Anthropic and Pi models, gives `costUsd: 'unknown'`. Partial tokens give a cost marked partial too.
- The cost logic must stay Node-free (the pane loads it); the table reaches it as data (import with a JSON import is not allowed in the Node-free cores; pass it in or inline it as a module exporting an object).
- Docs: en/es operations.md, one short paragraph (source, date, how unknown arises).

## Checks and return

Only what the change affects: the run-usage test, check-docs, eslint, knip, git diff --check. One focused test for a priced model, an unpriced model and a partial run; no mutation experiments, no other new tests. Do not run the full check-quality. Return changed paths, check outputs, limits.
