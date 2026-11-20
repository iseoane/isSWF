# I0061 J002 brief r1

- Authorization: operator, 2026-11-20, "Dale!" to J002. Feature-to-PR start on `feat/i0061-j002-verification-stale`; merge per the standing rule (review pass, green CI, not HIGH risk).
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J002. Builds on J001 (`tools/isswf-verify.mjs`, `.factory/verification.json`).

## Design

1. Staleness in the runner: `tools/isswf-verify.mjs` hashes each `derivedFrom` path in the candidate working tree and reports `stale: [{path, recorded, current}]` (a missing file is stale with `current: null`). When stale is non-empty it exits with a distinct code and a `stale` refusal unless `--allow-stale` is passed; results still print. A `--stale` mode prints only the staleness verdict without running checks (cheap, for gates).
2. Commit gate: a guard core `tools/isswf-verification-guard-core.mjs`, shaped like `tools/isswf-plan-commit-guard-core.mjs` and wired next to it in `hooks/register.tsx` and `tools/isswf-command-guard-pi-extension.mjs`. On `git commit`, when the committed content (index, or working tree with `-a`/pathspec, reusing the plan guard's mode logic) changes a path listed in the selected state's `verification.json` `derivedFrom` and does not also change `verification.json`, refuse naming the manifest and the refresh step. Fail open on errors; no verification file means allow.
3. Brief preparation: the coordinator skill (`.agents/skills/isswf-coordinator/SKILL.md`, step 4 brief preparation, one sentence) runs `isswf-verify --stale` and refreshes the file before a brief when stale. 
4. CI-only miss: `.agents/roles/references/retrospective.md` Misses procedure adds that a `ci-only` miss also requires a verification refresh (the missing check is added or its platforms corrected) before the next job's brief.
5. Docs EN + ES `operations.md` runner section: stale reporting, `--stale`, `--allow-stale`, the commit guard.

## Scope

- Out: setup proposal changes, workflow detection (J005), J007 fixes.

## Checks

`node tests/isswf-verify.mjs .`, a new `tests/isswf-verification-guard.mjs` (added to `tools/check-quality.mjs`), `node tests/isswf-plan-commit-guard.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`, knip if a new tool file is added. Full suite to CI.

## Method

TDD for runner staleness and the guard. One opus/medium reviewer, 2 rounds, 1 correction.
