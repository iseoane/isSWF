# Job brief J004 / r3

## Identity and authorization

- Job: I0046 J004, brief r3 (operator-requested non-blocking improvements from V002). Actor ID: A003 (do not reuse). Role: isswf-worker.
- Operator: approved the tools/factory-package.mjs change and asked for the V002 suggestions before push ("3 haz las mejoras antes de la 2", 2026-11-12).
- Workspace: worktree /home/iseoane/Work/isSWF-j004, branch feat/i0046-j004-snapshot, HEAD e9b186a. Write only there plus your attempt record `.factory/initiatives/I0046/jobs/J004/A003.md` in /home/iseoane/Work/isSWF. No commits, pushes, network or installs.

## Required changes (V002 S1-S3)

1. S1: tests for the wrapper guard in tests/initiative-snapshot.mjs: `.factory` as a symlink -> /Regular directory required/ (skip on win32); wrapper given a memory fs claiming `.isswf` over an on-disk project with `.factory` -> /disagrees/.
2. S2: make the Node-free check robust: load both cores in `node:vm` with no Node globals if feasible without experimental flags; otherwise a static check capturing every `import`/`export ... from` specifier with any quote style, bare `import '...'`, and forbidding `process`, `globalThis.process`, `Buffer`, `require(`.
3. S3: add `tools/isswf-plan-core.mjs` (and snapshot core if missing) to the architecture tables in docs/en and docs/es.

## Checks and return

Focused tests, check-docs, eslint, knip, git diff --check, full check-quality. Return changed paths, check outputs, limits.
