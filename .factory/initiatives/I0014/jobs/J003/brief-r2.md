# I0014/J003 r2: Remove the legacy executor (started)

Supersedes brief-r1 (prepared). 

## Authorization (2026-11-13)

Operator explicit start in Claude Code ("si claro!") for J003 with the same flow as J002: implementation in the primary checkout on branch `feat/i0014-j003-legacy-removal` (shared-sequential, single writer), focused and full checks, independent review and corrections within budget, commits, push of that branch, PR to `main`, exact-head CI wait. Not covered: merge, installation, release, edits to other initiatives' records.

## Objective

The legacy execution engine is no longer shipped, tested or documented as current, while installed projects with retained pinned runtimes keep their migration/inspection gate working.

## Acceptance

1. Removed from source, launcher (`tools/isswf.mjs` executable tool list and worker registration paths that only serve `isswf-job run`), `tools/bun-release.mjs` and the package: `tools/isswf-job.mjs`, `pi-worker-task.mjs`, `worker-lifecycle.mjs`, `researcher-task.mjs`, `reviewer-task.mjs`, `planner-task.mjs`, `diagnostic-task.mjs`, and modules used only by them (verify each: e.g. `diagnostic-probes`, `execution-capacity`, `job-successor`, `recovery-review`, `external-effect-journal`, `native-recovery`). A module stays if any remaining current code needs it; note: `activity()` loads `native-recovery` and `external-effect-journal` from the project's retained pinned runtime, not from current source, so their source copies are removable unless something else imports them. Keep `activity()` gate behaviour from J002 intact.
2. `.factory/models.json` no longer packaged (`package.json` files, `factory-package.mjs`, `build-release.mjs`); `managedPaths` still handles existing `.isswf/models.json`. Decide whether the repository's own `.factory/models.json` stays as historical state (it is this checkout's legacy state root; do not rewrite history; removing the file from the package is required, deleting it from the repo is optional and must be justified).
3. Their tests, `tools/check-quality.mjs` entries, `tooling/quality/knip.json`, and the `REVIEW.md` line about execution-capacity removed or updated; remaining tests that only asserted legacy shipping updated. Release/package tests prove the legacy tools are absent from the package (negative control).
4. Docs: delete root contracts `docs/model-routing.md` and `docs/local-worker-lifecycle.md` (retrievable in Git history) and fix every current link to them; update `docs/en|es/architecture.md`, `reference.md`, `operations.md`, `docs/diagrams/workflow.json` and the generated `docs/en|es/workflow.html` (regenerate with the repo tool if one exists), `.agents/hosts/*.md` legacy sections, `.agents/skills/isswf-setup/SKILL.md` and coordinator `SKILL.md` legacy paragraphs, `AGENTS.md` references. Keep a short statement that existing legacy attempts are reconciled with their original pinned runtime before migrating. Historical initiative records are not edited. `docs/review-original-evidence.md`: decide from its content whether it describes a current native need; keep or remove with a reason.
5. `node tools/check-quality.mjs`, `node tooling/quality/check-docs.mjs`, `git diff --check` pass; CI on Linux and Windows.

## Methodology considered

- design-principles, execution-principles: selected (module boundaries; installed-project compatibility).
- verification-principles: selected (negative controls for package absence).
- isswf-writing: selected (EN/ES docs and agent instructions).
- tdd, e2e, security, performance, observability, interview: not triggered.

## Budget and review

Worker: 1 actor (parent model inherited). Review: combined, independent; max 3 rounds, 2 correction cycles. Spent: 0. Coordinator supplies the exact diff to the reviewer.
