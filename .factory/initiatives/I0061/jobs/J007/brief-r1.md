# I0061 J007 brief r1

- Authorization: operator, 2026-11-20, "Dale otro job". Feature-to-PR start on `feat/i0061-j007-runner-followups`; merge per the standing rule.
- Writer: one isswf-worker, sole writer in the primary checkout.
- Objective and acceptance: [plan.md](../../plan.md) J007.

## Items (from J001 V001, J002 V002, J005 V002)

1. S1: `tools/isswf-verify.mjs` (around lines 21 and 98): a failed or oversized `git status` must give `dirty: null` (or a refusal), never `false`. Add a test.
2. S2: the npm/npx refusal (around line 17) must test the command basename, case-insensitive, with and without `.cmd`/`.bat`/`.exe`, on every platform (for example `/usr/bin/npm`, `C:\x\npx.cmd`). Add a test.
3. S3: the seeded lint check in `.factory/verification.json` must cover `tooling/quality` like CI (`.github/workflows/quality.yml`). If the file's digest is recorded in `.factory/project-setup.md`, update that record in the same change.
4. S4: docs (`docs/en|es` pages that describe isswf-verify, plus `docs/` root contract if any) list every refusal code the tool emits, state accurately when `durationMs` is present, and `docs/en/architecture.md` and `docs/es/architecture.md` ownership tables name the runner.
5. N1: the missing space before `/^[0-9a-f]{64}$/` at `tools/isswf-verify.mjs:56`.
6. I2: docs that show `--table` without `--base` show `--base HEAD` where the approved file may not be on the base yet, matching the setup skill.

## Scope

- Out: new features, schema changes, refactors beyond the items.

## Checks

`node tests/isswf-verify.mjs .`, `node tooling/quality/check-docs.mjs`, `git diff --check`. Record wall-clock time of each. Full suite to CI. Leave no background shells running.

## Method

Tests first for S1 and S2. One opus/medium reviewer, 2 rounds, 1 correction.
