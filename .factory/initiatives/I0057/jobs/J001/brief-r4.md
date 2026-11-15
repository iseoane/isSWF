# I0057/J001 brief-r4: Record validation after a write, in Claude Code and Pi

## Identity and authorization

- Job and brief revision: I0057/J001, r4.
  - r2 (the validator, its CLI and the strict status exit) is merged in PR327.
  - r3 was the runtime probes ([A006](A006.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant of 2026-11-14. On 2026-11-15 the operator confirmed that advancing the plan's jobs needs no further go-ahead.
- Integration gate: this unit edits `.agents/hosts/pi/agents/*.md`, a REVIEW.md path that "Always needs a person". The coordinator asks the operator before the merge. Nothing else here needs a person.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and writes the next attempt record (`jobs/J001/A007.md`).
  - The coordinator owns the plan, this brief, the review records, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: after an Edit or Write to an initiative plan, brief, attempt or review record under `.isswf/` or `.factory/`, J001's validator runs. Any violation reaches the model in the same turn, without changing or withholding the tool result. This holds in Claude Code and Pi, for the main session and for delegated children.
- Size: M (one flow on two hosts, with one bounded risk: a guard failure must never break the write).

## Evidence this rests on

- **Claude (A006, observed on Windows, Claude Code 2.1.325):**
  - A plugin `tool.call` handler that awaits `next(e)` and returns `{ ...ran, context: [text] }` reaches the model in the same turn, and the tool result is unchanged.
  - The parent's handler also fires for an Agent-tool child's calls; the event carries `agentId`.
  - A hooks module has no Node built-ins: use `$.fs.read` and `$.fs.list` (`.claude-plugin/types/claude-code/index.d.ts` near 3475 and 7641-7656).
- **Pi 1.5.2:**
  - `tool_result` can modify the result with a partial patch (`docs/extensions.md:1040-1075`). Replacing `content` without `structuredContent` drops the structured content.
  - Main-session extensions are declared in the package's `pi.extensions` (`docs/packages.md`).
  - Children do not load the parent's extensions. A child extension is declared through `subagentOnlyExtensions` (A002 item 2), as `.agents/hosts/pi/agents/isswf-reviewer.md:5` already does for the git-evidence extension.

## Scope and acceptance

Included paths:

- A new shared module, for example `tools/isswf-record-guard-core.mjs`, with no Node imports and no `process`. It decides whether a path is a checked record and builds the feedback text from `checkRecord` violations, so that both hosts use one implementation. It reuses `tools/isswf-record-check-core.mjs` and does not re-implement any rule.
- `hooks/register.tsx`:
  - Register the guard whatever the `initiativesPane` option is. Today `register` returns early when the pane is off (`:475`). The pane stays opt-in, and the guard does not depend on the coordinator skill being active.
  - For Edit, Write and MultiEdit (the tools present in the types), after `await next(e)`, read the file and the job directory listing through `$.fs`. Run the guard, and on any violation return `{ ...ran, context: [text] }`.
  - Wrap the guard in try/catch so that any failure returns `ran` unchanged, as the existing observation handler does (`:497-509`).
- A new Pi extension, for example `tools/isswf-record-guard-pi-extension.mjs`, on `tool_result` for Pi's edit and write tools. It appends one text content item with the feedback and keeps `structuredContent` and `details`. A failure returns nothing, so the result is unchanged.
  - Main session: declare it in `package.json` `pi.extensions`.
  - Children: add it to `subagentOnlyExtensions` in `.agents/hosts/pi/agents/isswf-worker.md` and `isswf-planner.md`, and keep the reviewer's existing entry. The researcher stays read-only. A settings override replaces the list, it does not merge (A002 item 2), so state that in the hand-back.
- Packaging: whatever the release package checks need for the new files: `package.json` `files` or `pi`, and the `tests/release-package.mjs` and `tests/package-metadata.mjs` expectations. `tools/factory-package.mjs` is a "needs a person" path: if it must change, say so in the hand-back.
- Tests:
  - New `tests/isswf-record-guard.mjs` for the shared module and the Pi extension, driven with a fake `pi` object and fake events.
  - Run the Claude handler logic through the shared module, and keep the `.tsx` glue thin.
  - Add the new test to `tools/check-quality.mjs` so that CI runs it. `hooks/register.test.tsx` is not run by any check (A002 item 1). If a guard case belongs there, also add a runner that CI executes. Otherwise state the limit.
- Docs:
  - `docs/en/operations.md` and `docs/es/operations.md`: one short paragraph on the automatic check, what it reports, and that it only reports.
  - `docs/en/architecture.md` and its mirror: list the new files.
- Coordinator skill: reduce the plan read-back instruction to a pointer to the automatic check (plan J001 acceptance 5). Keep the `isswf-status` read-back before a commit.

Exclusions:

- `tools/isswf-record-check-core.mjs` rules, except a bug fix that the hand-back explains.
- `.agents/hosts/*.md` guides, `.github/workflows/**`, `tools/factory-package.mjs` and existing records.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance:

1. In Claude Code, an Edit or Write that leaves a plan or record with a violation returns the unchanged tool result plus context naming each violation (code, field, line). A clean write adds nothing. Writes outside the initiatives paths are untouched. A child's write is covered by the same handler.
2. In Pi, the same behaviour holds through `tool_result`, in the main session (package extension) and in worker and planner children (`subagentOnlyExtensions`).
3. A guard error (unreadable file, unexpected event shape) never changes, withholds or repeats the tool result.
4. One shared module owns the path matching and the message. Neither host duplicates a validator rule.
5. Paths with `\` and `/` both match, and the tests cover both.
6. The guard only reports. It never edits files, blocks a write, grants permission or starts work.

Checks (the worker runs them and reports the exact commands and results):

- The focused tests: `node tests/isswf-record-guard.mjs .`, `node tests/isswf-record-check.mjs .`, `node tests/release-package.mjs .`, `node tests/package-metadata.mjs .` and `node tests/host-portability.mjs .`, plus any test the change touches.
- `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tools/check-quality.mjs`.
- Local ESLint and Knip (the commands in brief-r1 of J006).
- One live Claude check, outside the repository, as in A006: a `claude -p --plugin-dir <this checkout> --model haiku` session in a temporary project with a `.factory/initiatives/I0001/plan.md`. A Write that breaks the plan must show the guard context in the model's reply. Use at most 2 invocations. Do not change settings or registration, and delete the temporary project afterwards.
- A live Pi check is optional. If Pi can load the extension with `-e` in a temporary project without changing any settings, run one session. Otherwise state the limit.

Methodology considered:

- isswf-tdd: selected for the shared module and the Pi extension (acceptance 1-5): test-only RED commits, then GREEN.
- isswf-security: not selected. The guard reads only paths the tool call just wrote, and only reports.
- isswf-writing: for the documentation lines.

Required references:

- `AGENTS.md`, `REVIEW.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks" and "Keep this source checkout separate from an installed release".
- `jobs/J001/A002.md` and `A006.md`.

## Independent review

- Required: yes, Standards and Spec. The risks are never breaking a write, host parity, and packaging.
- Reviewer: `isswf:isswf-reviewer`, opus/medium, unbound, given the exact diff file.

## Inputs and bases

- Target base: main at dd02e1d9dd6ae68af12e64f5566aecb77e265c61 (PR328 merged). The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J001.

## Dependencies, ownership and budget

- Checkout: the shared-sequential primary checkout, a new branch `feat/i0057-j001-record-guard`, one writer.
- Budget:
  - 1 worker: sonnet/medium.
  - Up to 3 review rounds and 2 correction cycles.
  - The live checks are limited as stated above.
  - No automatic retries.
