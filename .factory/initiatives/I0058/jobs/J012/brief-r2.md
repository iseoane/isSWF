# I0058 J012 brief r2: per-clone parallel-worker limit

- Authorization: operator, 2026-11-21, "Si y adelante con el j012"; local limit, default 2 ("debe ser un límite local"). Standing grant; merge unless HIGH risk. Host-guide and setup-skill edits approved in scope (REVIEW.md person approval under the standing grant).
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J012. Research: brief r1 report (completion events per host, `git config --local`, common-dir store).

## Design (decided)

1. **Limit:** `git config --local isswf.maxParallelWorkers` (a positive integer).
   - Absent or invalid means 2.
   - It is local to the clone, shared by its worktrees and never committed.
   - Setup asks for it in the local-question section of `.agents/skills/isswf-setup/SKILL.md`, default 2.
2. **Ledger:** one file per counted worker at `<git-common-dir>/isswf/parallel-workers/<token>.json`.
   - Fields: `agent`, `job`, `brief`, `host`, `startedAt`, and the run id once the worker has launched.
   - Only `isswf-worker` dispatches count.
3. **Open and close:**
   - Open: the dispatch guard (`tools/isswf-dispatch-guard-core.mjs`) adds a count check for worker calls.
   - Close, Claude foreground: after the call returns.
   - Close, Claude background: on `turn.complete` carrying the child's `agentId`.
   - Close, Pi: on the subagent result (sync) or on `subagent:async-complete` (async).
   - Where an event is not observed live, say so in the docs.
4. **Mode:** `git config --local isswf.parallelWorkersMode` is `observe` (default) or `enforce`.
   - `observe` allows the dispatch and notes the open entries and the clear command.
   - `enforce` refuses the dispatch.
   - The default is `observe` because completion events are not yet observed live on both hosts. Do not change this clone's mode.
5. **Clear:** `node tools/isswf-parallel-workers.mjs list|clear [--token <t>]` lists or removes ledger entries. It is the operator's command for stale entries after a crash.
   - In `observe` mode, any ledger or Git fault allows the dispatch.

## Scope

- **In:**
  - the core, the guard wiring on both hosts, the close hooks and the clear tool;
  - the setup question;
  - tests: Linux and Windows paths, limit absent or invalid, at the limit in both modes, close removes the entry, clear;
  - docs/en|es operations (guards section), with the per-host gaps;
  - package lists, if a new tool ships.
- **Out:**
  - Counting reviewers, bound `claude -p` reviews, verify runs and `SendMessage` continuations. Document these as known limits.
  - A per-machine store outside the clone.

## Checks

1. In a new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Run the new and touched tests.
3. Run a jiti ts+jsx transform of `hooks/register.tsx`; jiti is in `tooling/quality/node_modules`.
4. If packaging changed, run `node tests/release-package.mjs .`.
5. Run `node tooling/quality/check-docs.mjs` and `git diff --check`.
6. On your final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report its stamp path.
7. If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`.
8. Record wall-clock times.
9. Write A001 with full SHAs, in your checkout.

Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD for the core. One opus/medium reviewer, 2 rounds, 1 correction.
