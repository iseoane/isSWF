# I0061 J001 brief r2 (implementation)

- Authorization: operator, 2026-11-20, "Ok" to the research recommendations below (r1 research, reported in conversation). Feature-to-PR start on `feat/i0061-j001-verification`; merge per the standing rule (review pass, green CI, not HIGH risk).
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J001.

## Approved decisions

1. File `<selected-state>/verification.json`, tracked in Git, `schemaVersion: 1`, fields `derivedFrom[{path, sha256}]` and `checks[{id, argv, platforms, cost, covers, timeoutSeconds}]`.
2. `argv` arrays, no shell; `node` maps to `process.execPath`; `.cmd`/`.bat` launchers (npm, npx) are refused with a message to call `node <cli.js>`.
3. `cost`: `job | initiative | ci`. Platforms: `process.platform` names.
4. The runner reads the approved file from the base ref (`--base <ref>`, default the merge base with `origin/main`), never the candidate, following `tools/isswf-handoff.mjs:92-95`.
5. Runner `tools/isswf-verify.mjs`: `--tier job|initiative`, `--only <id>`; prints JSON with one result per check: `checkId, status (passed|failed|timeout|refused|unavailable|not run), exitCode, durationMs, platform, argvSha256, candidate, dirty, verificationSha256`. A check not listed for the current platform is `not run`, never passed. Bounded output (tails only).
6. Register the tool where tools are listed: `tools/factory-package.mjs` `installedToolNames`, `tests/factory-tools-install.mjs`, `tests/release-package.mjs`, `tools/bun-release.mjs` if it lists tool names.
7. This repository gets its own `.factory/verification.json` seeded from `tools/check-quality.mjs` and `.github/workflows/quality.yml`, with platforms only where CI runs them.
8. The skill side is minimal: `isswf-setup` proposes the file from the existing quality inventory (`tools/project-quality.mjs`) and writes it only on the operator's approval; the approved digest is recorded in project-setup.md.
9. CI: add `tests/isswf-verify.mjs` to the Windows matrix in `.github/workflows/quality.yml` (only that test), and to `tools/check-quality.mjs`.

## Out of scope

Workflow detection (J005), refresh triggers and inventory replacement in briefs (J002), changes to `project-quality.mjs` detection.

## Checks

`node tests/isswf-verify.mjs .`, the touched package tests, `node tooling/quality/check-docs.mjs`, `git diff --check`; docs EN+ES for the runner in `docs/en/operations.md` and `docs/es/operations.md`. Full suite to CI.

## Method

TDD for the runner. One opus/medium reviewer, budget 2 rounds, 1 correction.
