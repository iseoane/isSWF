# Job brief J004 / r2

## Identity and authorization

- Job: I0046 J004, brief r2 (correction 1 of 1). Actor ID: A002 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Same authorization and workspace as brief r1: worktree /home/iseoane/Work/isSWF-j004, branch feat/i0046-j004-snapshot, HEAD 6338f7f (candidate r1). Write only there. No commits, pushes, network or installs.

## Required changes (review V001, finding F1)

Coordinator decision: option (a), two modules.
1. `tools/isswf-snapshot-core.mjs`: pure, loadable with no Node built-ins and no `process` access at load. Exports `readSnapshot(project, fs)` (fs required) and `SCHEMA_VERSION`. Joins paths by string (accept `/` and `\` input; use the separator found in `project`). Selects the state directory through the injected fs with the same rules as `stateDirectory` (`.isswf` or `.factory`; both is an error; none is an error). No `lstat`: the symlink/regular-directory guard stays in the Node wrapper.
2. Move `parsePlan` (and only what it needs) into a Node-free module, e.g. `tools/isswf-plan-core.mjs`, re-exported unchanged from `tools/isswf-plan.mjs` so existing callers keep working.
3. `tools/isswf-snapshot.mjs` becomes the Node wrapper: `nodeFs`, the CLI (keep the main-guard form that `tools/bun-release.mjs:7` recognises), and before delegating it calls `stateDirectory` for the regular-directory guard and checks it agrees.
4. Add new modules to `installedToolNames`, `tests/factory-tools-install.mjs` and knip as needed.
5. Tests: a purely in-memory fs over a project absent from disk gives the expected snapshot and the "Both" error; assert the core (and plan core) load in `node:vm` without `process`/imports of `node:` (or a static import check). Keep existing cases.
6. Fix the comment and en/es docs to match real behaviour (core vs wrapper).

## Checks and return

Same as r1 (focused tests incl. tests/initiative-plan.mjs, check-docs, eslint, knip, git diff --check, full check-quality). Also, read-only: run `claude plugin test /home/iseoane/Work/isswf-pane` is NOT required; do not edit the prototype. Stop if the change exceeds ~250 lines beyond r1. Return changed paths, check outputs, limits, resources read.
