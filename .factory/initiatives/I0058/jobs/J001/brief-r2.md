# I0058 J001 brief r2: verification stamp and integration gate

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058"; the stamp is required when a branch is integrated, as in the batching model the operator chose ("En que momento lo hace kun che?": light checks once per finished branch, before it enters the batch). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001, the stamp and commit-gate items. Research: brief r1 report (summarized below). The pane, observed reads and brief comparison follow in later briefs.

## Design (decided)

1. Stamp: `isswf-verify --tier job` (and `--tier initiative`) on a clean tree writes, after the run, one stamp per HEAD commit to a local store under `git rev-parse --git-common-dir` (shared by all worktrees), for example `<common-dir>/isswf/verification-stamps/<sha>.json` with `candidate`, `tree`, `platform`, `tier`, `verificationSha256` and per-check `{id, status}`. Not written when the tree is dirty, with `--only`, or when any selected check failed or did not run for a reason other than platform. stdout output stays unchanged.
2. Gate: a shared core (`tools/isswf-integration-gate-core.mjs` or similar) used by both hosts' existing shell-command hooks, after the verification guard. It applies to integration commands: `git merge <branch>` into another branch, `git push` of a non-main branch, and `gh pr create`. It resolves the branch head being integrated and looks up its stamp. Records-only heads (every path under `<state>/initiatives/`) need no stamp of their own when an ancestor reached only through records-only commits is stamped (reuse the `chainsTo` idea in `tools/isswf-handoff.mjs`).
3. Modes `off|observe|enforce`, read from `<state>/project-setup.md` at `HEAD` (pattern of `tools/isswf-records-push-guard-core.mjs:73-83`); missing line means `observe`. `observe` allows and adds a post-run note naming the unstamped head and the command to run; `enforce` refuses with the same message. Any git lookup fault allows, like the other guards. Do not change this repository's mode (stays `observe`).
4. Read-only git only in the gate; `write-tree` is not needed because the stamp keys by commit.

## Scope

- In: the stamp writer in `tools/isswf-verify.mjs`, the gate core, wiring in `hooks/register.tsx` and `tools/isswf-command-guard-pi-extension.mjs`, tests (Linux and Windows paths, worktree sharing, records-only chain, the three modes), docs/en|es operations (verify and guard sections), coordinator skill one line ("the gate expects a job-tier stamp on each branch head before integration").
- Out: the pane, transcripts, brief comparison, record-check rule for SHAs, changing CI.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. Then `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final head (this also must write your own stamp; report its path), the new and touched tests, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock times. Write A001 with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD for the gate core (cheap, local). One opus/medium reviewer, 2 rounds, 1 correction.
