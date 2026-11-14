# I0057/J001 brief-r2: Shared record validator and strict status exit

## Identity and authorization

- Job and brief revision: I0057/J001, r2. r1 was read-only research ([A001](A001.md), [A002](A002.md)).
- Request mode: feature-to-PR start of I0057 on 2026-11-14, under the operator's standing grant of the same day. The grant covers everything except HIGH risk or a decision only the operator can take, and also covers integrating this PR after green exact-head CI when its risk is not HIGH. On 2026-11-14 the operator also asked not to wait for the scheduled resume.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes the next attempt record.
  - The coordinator owns the plan, this brief, the review records, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: a single shared, host-independent validator checks a plan or record file and returns machine-readable violations. A CLI exposes it. `isswf-status` exits nonzero for a plan that does not parse.
- This unit is the first of the two flows in the plan's J001 Size line. Wiring the validator into the Claude `tool.call` hook and a Pi extension waits for a later revision, because it depends on three runtime probes not yet run (A002, Next action). This unit makes the validator usable by the CLI and by tests now, and gives the hooks a single entry point to call later.
- Size: M (two related flows: the strict status exit, and the validator core with its CLI).

## Scope and acceptance

Included paths:

- New `tools/isswf-record-check-core.mjs`.
  - It may not import Node modules or touch `process`, the same constraint as `tools/isswf-snapshot-core.mjs:1-2`.
  - It takes file text and its path, and returns `{ ok, violations: [{ code, field?, line?, message }] }`.
- New `tools/isswf-record-check.mjs`, a Node CLI: `--project ABS --file ABS` (repeatable). It prints JSON and exits 1 when any violation is found.
- `tools/isswf-status.mjs`: the exit code only.
- `tools/isswf-snapshot-core.mjs`: export the existing `Run:` parser, or move it into the new core, so that both use one implementation. Its behavior does not change.
- Tests: a new `tests/isswf-record-check.mjs`, and `tests/plan-records.mjs` or the status tests where an exit-code assertion belongs.
- Packaging allowlists, if a new `tools/` file requires them: `tools/factory-package.mjs` and `tooling/quality/knip.json`. Under REVIEW.md, a change to `tools/factory-package.mjs` needs a person's approval. If it is needed, say so in the hand-back.
- `docs/en/operations.md` or `docs/en/development.md`, with their `docs/es/` mirrors, only where `isswf-status` exit codes or the new CLI are documented.

Exclusions:

- `hooks/`, any Pi extension and `.claude-plugin/`.
- Coordinator skill text (the pointer comes with the hook unit).
- Existing records stay unchanged.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance:

1. `node tools/isswf-status.mjs --project P --initiative I` exits 1 when the result is `status: unknown` with `reason: invalid-or-changing-plan`, and keeps the current JSON, including `planError`. A valid plan keeps exit 0 and identical output. Decide whether `unreadable-or-unsafe-plan` should also be nonzero, and justify the choice in the attempt. Note that outside a Git root it fires even for a valid plan (plan J001 evidence).
2. The core reports these violations, each with a stable `code`:
   - A plan that fails `parsePlan`, with its `planError` code, job, field and line.
   - In attempt and review records, a `Run:` line that the pane's parser would ignore, including trailing notes and `agent=unknown`.
   - A job whose directory holds an attempt or review record while the plan reports it as `pending` or `blocked`. This rule needs the plan plus the job directory listing as input; keep the interface explicit.
   - An attempt or review record missing a required field of its current template, by exact label. The required labels are at least `Process deviations observed:` (J008, if merged at the base), and in review records `Unreviewed areas and evidence limits:` and `Convergence advice:`.
3. One implementation owns each rule. The `Run:` rule reuses the snapshot core's parser, and plan parsing reuses `parsePlan`. A test proves that the pane and the validator agree on the same `Run:` samples.
4. Paths with `\` and `/` both work, which the tests cover.
5. The validator only reports: it never edits files, never grants permission and never starts work.

Checks (the worker runs them and reports the exact commands and results):

- `node tests/isswf-record-check.mjs .`, `node tests/plan-records.mjs .`, `node tests/initiative-snapshot.mjs .`, `node tests/initiative-panel.mjs .`, plus any status test touched.
- `node tooling/quality/check-docs.mjs`, `git diff --check`.
- `node tools/check-quality.mjs`. It is required because new `tools/` files are packaged (`package.json` `files` glob).

Quality inventory (development.md "Quality checks"):

- Lint: ESLint over `tools` and `tests`, run in CI.
- Dead code: Knip, run in CI. A new file needs a Knip entry if it is not reachable from an existing entry point.
- Tests: the focused `node tests/*.mjs`.
- Packaging: `check-quality`.

Methodology considered:

- isswf-tdd: selected. Every violation rule and the exit-code change is behavior with a cheap local regression. For each acceptance item 1-2 rule, report a test-only RED commit, followed by a GREEN commit.
- isswf-writing: only for the documentation lines, if any.
- isswf-interview, e2e, security, performance, observability: the trigger does not apply.

Required references:

- `AGENTS.md`, `REVIEW.md`, `.agents/roles/worker.md`.
- `.agents/skills/isswf-tdd/SKILL.md`.
- `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks".

## Independent review

- Required: yes, Standards and Spec. Shared parser reuse and exit-code compatibility are the risks.
- Reviewer: `isswf:isswf-reviewer`, opus. The reviewer is unbound, so it gets the exact diff file.

## Inputs and bases

- Target base: `0d2ff5d2fc1a53b00bf422d29fc244d2dcee20ba` (main after PR326).
- Document-input checkpoint: the commit that adds this brief. Its SHA is given in the dispatch.
- Plan: `.factory/initiatives/I0057/plan.md`, job J001 (acceptance and evidence).
- Reading map:
  - `tools/isswf-status.mjs:142-185`.
  - `tools/isswf-plan-core.mjs` (`parsePlan`, `planErrorDetail`).
  - `tools/isswf-snapshot-core.mjs` (the `parseRuns` parser near lines 100-140, and `readJob`).
  - `tests/plan-records.mjs`, `tests/initiative-snapshot.mjs`.

## Dependencies, ownership and budget

- Dependencies: none in the plan. J008 should merge first, so its field labels exist at the base.
- Checkout: shared-sequential primary checkout, a new branch `feat/i0057-j001-record-check` from that base, one writer.
- Budget:
  - 1 worker: sonnet, with effort set explicitly in the dispatch.
  - Up to 3 review rounds and 2 correction cycles. The operator extended the review allowance on 2026-11-14 for J008; it is not assumed here.
  - No automatic retries.
