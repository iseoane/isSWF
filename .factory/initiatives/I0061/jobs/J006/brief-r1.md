# I0061 J006 brief r1

- Authorization: operator, 2026-11-20, "J006 y luego la investigacion". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0061-j006-records-push`. Merge follows the project's standing LOW-risk rule or the operator's go.
- Writer: one isswf-worker (sonnet/medium) in the primary checkout, sole writer, on the feature branch.
- Baseline: origin/main cb3015788a23663469e08dc501678876c6273621.
- Objective and acceptance: [plan.md](../../plan.md) J006.

## Design

1. `tools/isswf-records-push-guard-core.mjs` exports `checkRecordsPush({ command, cwd, git, read })`, shaped like `checkPlanCommit` in `tools/isswf-plan-commit-guard-core.mjs` and reusing the tokenizer and `parseGit` of `tools/isswf-command-core.mjs` (export what it needs). For each `git push` segment whose destination is the base branch (an explicit refspec to `main`/`refs/heads/main`, or no refspec while the current branch is `main`; base is `main` unless `isswf.baseBranch` git config names another):
   - list the paths of `<remote>/<base>..<source>` with `git diff --name-only`;
   - allow when every path is under the selected state directory (`.isswf/`, or legacy `.factory/initiatives/` when `.isswf/` is absent) AND the selected state's `project-setup.md` records the grant line `- Records-only direct push: granted`;
   - otherwise return `{ deny }` naming the first offending path (or the missing grant) and pointing to the PR path.
   Pushes to other branches, non-push commands, deletes and tags are allowed. It fails open on any git or read error, as the plan commit guard does.
2. Wire it next to `checkPlanCommit` in `hooks/register.tsx` (Claude) and `tools/isswf-command-guard-pi-extension.mjs` (Pi).
3. `tests/isswf-records-push-guard.mjs` (temp repo with a bare remote: records-only allowed with grant, refused without grant, mixed paths refused, other branch allowed, git fault allowed) and add it to `tools/check-quality.mjs`.
4. Setup: `.agents/skills/isswf-setup/SKILL.md` offers the separate remote grant "push records-only commits directly to the base branch" and records the grant line in project-setup.md only on the operator's yes; `.factory/templates` if a setup template lists grants.
5. Delivery: `.agents/roles/references/delivery.md` says job and initiative close records use the grant when recorded; code, docs, instructions, templates and tests always keep PR and CI.
6. This repository: add the grant line to `.factory/project-setup.md` (operator stated it on 2026-11-18, see plan Evidence; the existing "no direct-main push" wording in the integration permission is narrowed to non-records changes).
7. Docs: the command-guard section of `docs/en/operations.md` and `docs/es/operations.md`; remove or narrow the "Records-only pushes" entry in both `future-actions.md` only if this job implements it (it does not: plan parsing at push stays a proposal).

## Scope

- In: the files above.
- Out: parsing plans at push time (future-actions proposal), `.github/workflows/**`, any change to the branch or plan commit guards' behavior.

## Checks

`node tests/isswf-records-push-guard.mjs .`, `node tests/isswf-plan-commit-guard.mjs .`, the command-guard tests that exist, `node tooling/quality/check-docs.mjs`, `git diff --check`. Full `check-quality` left to CI. Record wall-clock times.

## Method

TDD for the core. One opus/medium reviewer; budget 1 review round, 1 correction.
