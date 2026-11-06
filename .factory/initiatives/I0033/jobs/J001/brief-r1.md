# Job brief J001 / r1

## Identity and authorization

- Source: operator conversation, 2026-11-06.
- Authorization: local implementation and local commits on branch `feat/e2e-verification-practices`. No push, PR, merge or integration into `main`.
- Profile: worker.

## Objective

Make journeys produced with `isswf-e2e` more trustworthy by adding the pstack verification practices it lacks.

## Scope

- `.agents/skills/isswf-e2e/SKILL.md` and `.agents/skills/isswf-e2e/references/{browser,cli-and-api,test-quality}.md`.

## Exclusions

- No new skill, generator, agent manual or feature directory. No Cursor paths. No changes to other skills, tests or tools unless a check requires it.

## Gap analysis (coordinator, base b1161ad)

Already covered, do not restate: readiness means usable (browser.md "Select and start", cli-and-api.md "Services"); kill only owned processes (cli-and-api.md "Ownership"); evidence survives cleanup (browser.md last section, cli-and-api.md "Ownership"); never weaken a journey (browser.md "Evidence and failure", test-quality.md); cover promised entry points (SKILL.md step 2); real user path, no internal setters (browser.md); mocks only at boundaries (SKILL.md step 4).

Gaps to add, each concise and placed in the most specific existing file:

1. Preflight ("doctor"): before driving, a read-only check that the instance is the expected candidate/build, the port and data are owned by this run, and auth/fixtures are valid, so environment failures are separated from product regressions.
2. Starting state from empty: launch must reach a usable state from an empty data dir, including migrations and seed data.
3. Unbuildable base: if the checkout does not build or start as-is, report that precisely (or fix within grant) before writing journeys; scaffolding for an irrelevant missing asset is marked as test scaffolding and removed at teardown.
4. Isolation impossible: if two instances cannot run side by side, say so and refuse to drive a shared/user instance rather than risk corrupting it.
5. Dry-run or test modes: verify what they actually skip by observing files, network and git refs instead of trusting the name.
6. Missing precondition: a journey whose seed data lacks a precondition reports a failure, and the reason is recorded in the map (add a known-gotchas/limits note to the journey map fields if the existing Coverage limit field does not express it).
7. Stand-in environments: when proven in a stand-in (container instead of VM, local stack instead of remote), list each setup step the stand-in did that the real target will not; those stay unverified.

## Acceptance

See plan J001. Keep wording in the skill's existing style (imperative, English, no marketing).

## Checks

- `node tests/host-portability.mjs`
- `node tooling/quality/check-docs.mjs`
- `git diff --check`

## Execution

- Work in `C:\0-BackupVF\WorkSpace\isSWF` on branch `feat/e2e-verification-practices` (base b1161ad).
- One commit, conventional (`docs:` or `feat:`), no AI attribution lines.
- Report: per gap, file/section where added or "already covered at …"; checks run with results.
