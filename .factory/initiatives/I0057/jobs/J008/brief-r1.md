# I0057/J008 brief-r1 — Process deviations and per-round reviewer limits in records

## Identity and authorization

- Job ID and brief revision: I0057/J008, r1.
- Source: operator request of 2026-11-14 to observe worker and reviewer runs for steps that could become deterministic, and the J030 reviewer suggestion (I0009/J030/V006.md, round 4) that review records always carry the reviewer's limits.
- Request mode: feature-to-PR start ("arranca la I0057", 2026-11-14). Standing operator grant of the same day: everything except HIGH risk or a decision only the operator can take. That grant covers integrating this PR after green exact-head CI when its risk is not HIGH.
- Operation ownership: the worker edits the paths below, commits on the feature branch and writes A001. The coordinator owns the plan, this brief, the review records, push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: every new attempt and review record has a place for process deviations, and every review round, including an appended delta round, has the reviewer's limits and convergence advice. Neither depends on the coordinator remembering to add them.
- Why: see the plan's J008 evidence. The review template already has `Unreviewed areas and evidence limits:`, but only 4 of 135 review records use that section.
- Size: M (two related flows: the deviations field in both templates, and per-round reviewer limits in review records).

## Scope and acceptance

Included paths:

- `.factory/templates/attempt.md`, `.factory/templates/review.md`.
- `.agents/roles/worker.md` (Return), `.agents/roles/reviewer.md` (Return), and `.agents/roles/references/review-convergence.md` (Review rounds), only where the return or round contract must name the new fields.
- `docs/durable-work.md`, only if it describes the record fields.
- Tests that assert template or role text: `tests/worker-methodology.mjs`, `tests/worker-method-evidence.mjs`, `tests/initiative-snapshot.mjs`, `tests/host-portability.mjs`. Update an assertion only where the new text breaks it; add assertions for the new fields.
- `.factory/initiatives/I0057/jobs/J008/A001.md`.

Exclusions: existing records stay unchanged; no validator code (that is J001); nothing in `tools/` or `hooks/`. Untracked `.agents/skills/project-release/` is never staged.

Acceptance:

1. The attempt and review templates carry a required `Process deviations observed:` field. Its value is `None.`, or one entry per deviation: a written rule that was not followed, or mechanical data copied by hand that could have been derived. The template text tells it apart from the attempt template's existing `Deviations from required procedure and consequence:` field: the existing field is the author's own departures from this assignment's procedure, while the new field covers process observations by any actor, the coordinator's handoff included.
2. The review template states that each review round records the reviewer's limits (unreviewed areas, evidence not observed, approvals the reviewer cannot give) and its convergence advice. This includes a delta round appended to an existing record. The value is `None.` when there are none. Reuse the existing `Unreviewed areas and evidence limits:` field and add `Convergence advice:` beside it; do not create a parallel section.
3. The worker and reviewer Return sections ask for these fields; the review-rounds reference says that a delta round repeats them.
4. Both fields are described as self-reported, not as observed evidence.
5. Focused tests assert the new template fields and role wording, and every existing test touched still passes.

Checks (worker runs them and reports exact commands and results):

- `node tests/worker-methodology.mjs .`, `node tests/worker-method-evidence.mjs .`, `node tests/initiative-snapshot.mjs .`, `node tests/host-portability.mjs .`
- `node tooling/quality/check-docs.mjs`, `git diff --check`
- `node tools/check-quality.mjs`: required locally because packaged templates and role files change (`tools/factory-package.mjs:54-56`).

Quality inventory (development.md "Quality checks"): lint is ESLint through the locked `tooling/quality` tools, run in CI; tests are the focused `node tests/*.mjs`; build and packaging run through `tools/check-quality.mjs`; Knip covers dead code in CI; no clone detector is configured, and the wording reuse in acceptance 2 is checked by review.

Methodology considered:

- isswf-writing: selected. The change revises agent instructions and templates; apply its agent-document guidance.
- isswf-tdd: not selected. This is a wording and template change; the new assertions are added alongside it, with no behavioral RED.
- isswf-interview: not selected. The fields and their meaning are fixed by the plan and this brief.
- isswf-e2e, security, performance, observability: trigger does not apply.

Required references: `AGENTS.md`, `REVIEW.md` (if present), `.agents/roles/worker.md`, `.agents/skills/isswf-writing/SKILL.md` and its agent-document reference, `docs/en/development.md` "Quality checks". Report each one as consumed or missing, and self-reported.

## Independent review

- Required: yes. Semantic review, Standards and Spec. Existing tests check phrases, not whether the instructions are clear and unambiguous to an agent. That is the risk of this change, and earlier methodology units had defects that only semantic review found.
- Reviewer: `isswf:isswf-reviewer`, model opus. It is unbound, so it receives the exact `base..candidate` diff file with its byte count and SHA-256. Round 1, no prior reviews.

## Inputs and bases

- Target base: `7b4b682f05a5d841556dacd97a9eeb5dd0eec3d8` (main after PR325).
- Document-input checkpoint: the commit that adds this brief on `feat/i0057-j008-record-fields`. Its full SHA is given in the dispatch.
- Plan: `.factory/initiatives/I0057/plan.md`, job J008.
- Reading map: `.factory/templates/attempt.md:39-48` (Technical result), `.factory/templates/review.md:42-48` (Limits and return), `.agents/roles/worker.md:56-60`, `.agents/roles/reviewer.md:42-46`, `.agents/roles/references/review-convergence.md:29-35`, `tests/worker-methodology.mjs:9-10`, `tests/worker-method-evidence.mjs:10-11`, `tests/initiative-snapshot.mjs:179`.

## Dependencies, ownership and budget

- Dependencies: none.
- Checkout: shared-sequential, primary checkout `C:/0-BackupVF/WorkSpace/isSWF`, branch `feat/i0057-j008-record-fields`, one writer. A read-only researcher for J001 may run at the same time; it writes nothing.
- Budget: 1 worker (sonnet, effort not settable through the Agent tool, recorded as unknown), up to 3 review rounds and 2 correction cycles (project-setup.md review allowance), no automatic retries.
- Session permission mode: bypass permissions, set by the operator for this session, so worker edits do not prompt. The path scope above is enforced by this brief only.
