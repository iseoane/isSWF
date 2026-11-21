# I0058 J004 brief r1: read-only children read their pinned base

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; batch distribution accepted ("me parece bien la distribucion"). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines. Runs in parallel with I0058 J001 pane (disjoint files); integrated in one batched PR.
- Objective and acceptance: [plan.md](../../plan.md) J004.

## Observed (starting points)

- Claude: the reviewer already has `mcp__plugin_isswf_isswf_git_evidence__identity|diff|content` (`agents/isswf-reviewer.md:4`); researcher and planner have Read/Grep/Glob only (`agents/isswf-researcher.md:4`, `agents/isswf-planner.md:4`).
- Pi: the reviewer loads the git-evidence extension (`.agents/hosts/pi/agents/isswf-reviewer.md:5`); researcher and planner load none (`tools: read, grep, find, ls`).
- I0057 J007 A001 and J002 A001 read the shared checkout while a worker committed.

## Changes

1. Give the researcher and planner the same Git evidence read tools on both hosts (Claude agent `tools:` lines; Pi agent extension line), read-only.
2. Researcher and planner profiles (`.agents/roles/researcher.md`, `planner.md`) and the host guides' child-context sections: when the assignment names a base and a writer may be active in the same checkout, read sources at the base through the Git evidence tools; a source read from the working tree is named as such in the report (one line in the report format).
3. Update the tests that pin agent tool lists and host entries (find them with grep: `claude-reviewer-tools`, `host-native-delegation`, `host-discovery`, `platform-package`) and the docs that list child tools, EN/ES.

## Scope

- Out: hooks, the pane, changing the reviewer, new tools.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund` (and `npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund` if a host test needs it). Then the touched tests, `node tooling/quality/check-docs.mjs`, `git diff --check`, and `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final head (writes the stamp). Record wall-clock times. Write A001 inside your checkout with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

One opus/medium reviewer, 2 rounds, 1 correction. Host-guide and agent-tool changes are approved in scope under the standing grant.
