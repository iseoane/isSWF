# I0057/J005 brief-r3: Keep the coordinator's assignment and skill across a compaction

## Identity and authorization

- Job and brief revision: I0057/J005, r3. r1 and r2 were probes ([A001](A001.md), [A002](A002.md)).
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The merge needs the operator's approval, because the change touches `.agents/hosts/**`.
- Operation ownership:
  - The worker edits the paths below, commits on the feature branch and completes its attempt record `jobs/J005/A003.md`, whose skeleton the coordinator creates with `tools/isswf-record-new.mjs`.
  - The coordinator owns the plan, this brief, the reviews, the push, the PR, CI and the merge.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: when a session in which the coordinator skill was activated compacts, the summary keeps the assignment, and the first turn after it tells the model to reload the coordinator skill and the methodology in use, on Claude Code and Pi. Sessions that never activated the coordinator are unaffected.
- Size: M, from the plan.

## Coordinator decisions (from A001 and A002)

1. **Activation flag, unconditional.** Claude: the `skill.prompt` hook in `hooks/register.tsx` sets a session flag when the skill name ends in `isswf-coordinator`, independent of the `initiativesPane` option. Today the flag is set only when the pane is enabled (`hooks/register.tsx:568-575`). Keep the pane behaviour unchanged. Pi: the equivalent flag when the coordinator skill is loaded; find the supported signal (a `/skill:isswf-coordinator` input or a skill-load event) and say which you used and why.
2. **Claude summary steering.** In `session.compact`, when the flag is set, add instructions that the summary must keep: the active initiative and job, child agent IDs and their roles, the current candidate SHA, the remaining review and correction budgets, the open operator decisions, and the version-advisory marker. A001 observed that these instructions steer the summary.
3. **Claude post-compaction reminder.** Through the plugin's `classic.SessionStart` hook with source `compact`, returning `additionalContext` (observed to reach the model in A002), when the flag is set: a short reminder to reload the coordinator skill (`/isswf:isswf-coordinator`) and the methodology the next step requires, and to reconcile the records before acting. Do not use `$.session.append` (A002: not observed) or hook-returned messages after `/compact` (A001: not observed).
4. **Assignment memory in the hooks, both hosts.** The dispatch guard already parses initiative, job, brief, checkpoint and base from each accepted dispatch (`checkReferences` in `tools/isswf-dispatch-guard-core.mjs`). Keep the last few accepted dispatches per session (initiative, job, brief path, checkpoint, base, subagent type, and the run ID when the host returns it) and include them in the post-compaction reminder. This gives Pi, whose summarizer cannot be steered (A001), the assignment identity without the summary. Bound the stored list and state the bound.
5. **Pi post-compaction reminder.** On the first `before_agent_start` after a compaction, when the flag is set, add the same reminder and assignment memory as a message (A001: observed possible). Detect the compaction through `session_before_compact` or the compaction event Pi exposes, and cite it. Pi's summary itself stays unsteered: the candidate SHA, budgets and open decisions are not guaranteed after a Pi compaction. Document that limit; the operator accepts or rejects it at acceptance.
6. **Fail open.** Any error in these hooks leaves the host behaviour unchanged, as the other guards do.
7. **Pointers.** `.agents/hosts/claude-code.md:113` and `.agents/hosts/pi.md:155` keep the operator-facing handoff rule, but reduce "reload the coordinator skill ..." to a pointer to the reminder and its limits in `docs/{en,es}/operations.md`. Keep the "reconcile the records" requirement.

## Scope and acceptance

Included:

- Claude:
  - `hooks/register.tsx`, its types if needed, and `hooks/register.test.tsx`.
  - A core module in `tools/` if the logic is non-trivial, without Node imports where practical.
- Pi:
  - A Pi extension under `tools/` in the style of `tools/isswf-dispatch-guard-pi-extension.mjs`, or an extension of it.
  - Its registration in the Pi package manifest and discovery.
  - Tests with the Pi event shapes.
- Shared: the assignment-memory logic, in one place used by both hosts.
- Docs:
  - `docs/{en,es}/operations.md`: a "Compaction" section covering what is kept, the reminder and the Pi limit.
  - `docs/{en,es}/architecture.md`: the new files.
- Packaging:
  - Any new file in `tools/factory-package.mjs` and the Pi manifest.
  - Knip entries.
  - `tools/check-quality.mjs` runs the new tests.

Exclusions:

- The session-handoff mode, which belongs to J002 or a later job.
- Changing Pi's automatic compaction settings.
- User or project settings, `.github/workflows/**`, existing records and `.factory/models.json`.
- Never stage the untracked `.agents/skills/project-release/`.

Acceptance (plan J005):

1. When a session in which the coordinator skill is active compacts:
   - in Claude Code, the summary instructions keep the active initiative and job, child agent IDs, candidate SHA, remaining budgets and the version-advisory marker;
   - in Pi, the assignment identity reaches the model through the reminder, with the summary limit documented for the operator.
2. The first turn after that compaction receives a reminder to reload the coordinator skill and the methodology in use.
3. Sessions that never activated the coordinator are not affected, tested on both hosts.
4. The host guides' reload-after-compaction instruction is reduced to a pointer.

Checks (the worker runs them and reports the exact commands and results):

- **Focused tests:** for every changed file, plus `isswf-dispatch-guard`, `isswf-branch-guard`, `isswf-command-guard`, `package-metadata`, `release-package`, `host-portability` and the hooks tests.
- **One live Claude check:** a headless haiku session with this source plugin loaded through `--plugin-dir`. It activates the coordinator skill, runs `/compact`, and quotes the reminder from the first turn after it. Add a control session without the skill that shows no reminder.
  - Follow the A002 constraints: a probe directory outside the repository, no settings changes, `MSYS_NO_PATHCONV=1`, bounded staged turns, and at most 2 invocations.
  - Delete the probe directory and its transcripts afterwards.
- **Live Pi run:** do one if Pi is available; otherwise say so.
- **Other checks:** `node tooling/quality/check-docs.mjs`, `git diff --check`, and local ESLint and Knip.
- Do not run the full `node tools/check-quality.mjs`; the coordinator runs it.
- Use node, not python, for any scripting.

Methodology:

- **isswf-tdd:** selected for the flag, the summary instructions, the reminder, the assignment memory and the unaffected-session cases. Use test-only RED commits, then GREEN commits, and confirm that each RED fails on the intended assertion.
- **isswf-writing:** selected for the docs and the host-guide pointers. Load it before editing them.

Required references (read each in full and report consumption honestly):

- `AGENTS.md`, `REVIEW.md`, `GLOSSARY.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`.
- `.agents/skills/isswf-tdd/SKILL.md`, `.agents/skills/isswf-writing/SKILL.md`, `.agents/roles/references/code-quality.md`.
- `docs/en/development.md` "Quality checks".
- `jobs/J005/A001.md` and `jobs/J005/A002.md`.
- The plan's J004 and J009 sections, for the hook patterns, fail-open behaviour and `$.state`.

## Independent review

- Required: yes, Standards and Spec, with a lens on unaffected sessions, fail-open behaviour, and parity between Claude and Pi.
- Reviewer: `isswf:isswf-reviewer`, with the selection file's model and effort, unbound, given the exact diff file.

## Inputs and bases

- Target base: d1d3ded10f8eb6a203c93d43bfd2919a8c889bcf (main after the J007 merge).
- Document-input checkpoint: the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J005.

## Dependencies, ownership and budget

- J004, J007 and J009 are merged. The J002 research runs in parallel and is read-only.
- Checkout: the shared-sequential primary checkout, branch `feat/i0057-j005-compaction`, one writer.
- Budget: 1 worker, with the selection file's model and effort. Up to 3 review rounds and 2 correction cycles. No automatic retries.
