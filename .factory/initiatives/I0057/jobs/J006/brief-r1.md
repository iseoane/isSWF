# I0057/J006 brief-r1: Plan edit command

## Identity and authorization

- Job and brief revision: I0057/J006, r1.
- Request mode: feature-to-PR, under the operator's standing grant of 2026-11-14 (everything except HIGH risk or a decision only the operator can take). The grant covers integrating the PR after green exact-head CI when its risk is not HIGH. On 2026-11-15 the operator confirmed that advancing the plan's jobs needs no further go-ahead.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes the next attempt record (`jobs/J006/A001.md`, from `.factory/templates/attempt.md`).
  - The coordinator owns the plan, this brief, the review records, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: the coordinator changes plan job fields with a command instead of hand-editing Markdown. Every write is read back with `parsePlan` and is atomic, so a failed edit leaves the plan unchanged and exits nonzero.
- Why: hand-written plan lines (`Brief: None.` in I0055 and I0056, 8566437) broke the contract, and a scripted edit that failed was followed by a commit (plan candidate list).
- Size: S (one flow, no special risk), from the plan.

## Decision on `tools/isswf-plan.mjs`

That tool renders a whole plan from a JSON proposal and requires an external plan-only grant file, a legacy contract that native plans do not use. This job does not change it, and does not reuse its grant. The new command is separate: it edits an existing Markdown plan in place, or creates a new plan, and it reads or enforces no grant. Passing it is not authorization.

## Scope and acceptance

Included paths:

- New `tools/isswf-plan-edit-core.mjs`.
  - No Node imports and no `process`, as in `tools/isswf-plan-core.mjs:1`.
  - Pure functions on plan text that return the new text or throw a coded error. Each result must pass `parsePlan` before it is returned.
- New `tools/isswf-plan-edit.mjs` CLI. Every subcommand takes `--project ABS --initiative ID`. The plan is `<state dir>/initiatives/<ID>/plan.md`, with the state directory resolved as `tools/isswf-status.mjs` resolves it.
  - `set --job J --field Status|Blocker|Next step --value TEXT`
  - `append-evidence --job J --value TEXT`
  - `add-job --job J --objective TEXT --depends-on None|J1,J2 --size TEXT --acceptance TEXT` (repeatable acceptance). This writes Status `pending`, the pending brief reference `[brief-r1.md](jobs/J/brief-r1.md) (pending until prepared)`, Blocker `None.` and a Next step (`--next-step`, required), in the form `parsePlan` accepts.
  - `new-plan --title TEXT --type bug|enhancement|maintenance|research`, plus a first job with the same options as `add-job`. It refuses if the plan exists.
- Writes:
  - Write to a temporary file in the same directory, then rename it over the plan.
  - Refuse when the plan's bytes changed between read and rename (compare SHA-256).
  - Keep the plan's existing line endings.
  - On success, print JSON `{ ok: true, initiative, job, action }` and exit 0.
  - On any failure, print JSON with the error code to stdout, exit 1, and leave the file unchanged.
- Values are one line: refuse control characters and newlines. Field values are written verbatim after `- Field: `.
- Tests: new `tests/isswf-plan-edit.mjs`.
- `tooling/quality/knip.json`: add both new files as entries if Knip needs them. The test imports dynamically, which is why J001 needed `tools/isswf-record-check-core.mjs` listed.
- Docs: `docs/en/operations.md` and `docs/es/operations.md`, where `isswf-status` and `isswf-record-check` are documented. Add a short usage section.
- Coordinator skill pointer, limited to one sentence: in `.agents/skills/isswf-coordinator/SKILL.md`, where plan fields are updated by hand, say the command is the preferred way, and keep the rule that hand edits remain valid.

Exclusions:

- `tools/isswf-plan.mjs`, `tools/factory-package.mjs` (if packaging seems to need it, stop and say so), `hooks/`, Pi extensions, `.claude-plugin/`, `.agents/hosts/**`, `.agents/roles/*.md`.
- Existing records stay unchanged.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance:

1. `set`, `append-evidence`, `add-job` and `new-plan` produce plans that `parsePlan` accepts, with the requested change and no other byte changed outside the edited job, apart from the added job block or file.
2. A request that would produce an invalid plan exits 1 and leaves the plan byte-identical. Examples: an unknown job, an invalid Status, a dependency on an unknown job or a cycle, `completed` without evidence, or a duplicate job ID.
3. A plan changed by another writer between read and write is not overwritten (exit 1, coded error).
4. CRLF and LF plans both keep their line endings, and `\` and `/` project paths both work.
5. Hand edits remain possible: the command does not lock, rename or reformat the plan, and `tools/isswf-record-check.mjs` still validates hand-edited plans.

Checks (the worker runs them and reports the exact commands and results):

- `node tests/isswf-plan-edit.mjs .`, `node tests/plan-records.mjs .`, `node tests/isswf-record-check.mjs .`, `node tests/initiative-status.mjs .`
- `node tooling/quality/check-docs.mjs`, `git diff --check`
- `node tools/check-quality.mjs`
- ESLint and Knip, through the locked install that is already present: `node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs` and `node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress`. Knip failed in CI for J001 because it had not been run locally.

Methodology considered:

- isswf-tdd: selected. For each acceptance item 1-3, give a test-only RED commit with a behavioral assertion failure, then a GREEN commit, naming the command.
- isswf-writing: for the documentation lines only.
- isswf-interview, e2e, security, performance, observability: their triggers do not apply.

Required references:

- `AGENTS.md`, `REVIEW.md`, `.agents/roles/worker.md`, `.agents/skills/isswf-tdd/SKILL.md`, `.agents/roles/references/code-quality.md`, `docs/en/development.md` "Quality checks".

## Independent review

- Required: yes, Standards and Spec. The risks are atomicity, preserving unrelated bytes, and plans the parser accepts.
- Reviewer: `isswf:isswf-reviewer`, opus/medium (preset), unbound, given the exact diff file.

## Inputs and bases

- Target base: main at 591af0372885199977a05dddbbeeaa1540ac41ae (PR327 merged). The document-input checkpoint is the commit that adds this brief; its full SHA is given in the dispatch.
- Plan: `.factory/initiatives/I0057/plan.md`, job J006.
- Reading map: `tools/isswf-plan-core.mjs` (`parsePlan`, `planError`), `tools/isswf-status.mjs` (state directory and argument parsing), `tools/isswf-record-check.mjs` (CLI style), `tools/project-state.mjs`, `tests/isswf-record-check.mjs`.

## Dependencies, ownership and budget

- Depends on J001, whose validator is merged (PR327).
- Checkout: the shared-sequential primary checkout, branch `feat/i0057-j006-plan-edit`, one writer. Another worker runs J001's runtime probes at the same time, outside the repository only. It never edits or commits in this checkout.
- Budget:
  - 1 worker: sonnet/medium (preset, set in the dispatch).
  - Up to 3 review rounds and 2 correction cycles.
  - No automatic retries.
