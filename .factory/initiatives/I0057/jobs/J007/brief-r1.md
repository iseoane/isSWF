# I0057/J007 brief-r1: Research for generated attempt and review records

## Identity and authorization

- Job and brief revision: I0057/J007, r1. This is read-only research; the implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
- Role: `.agents/roles/researcher.md`, read-only. The coordinator writes the findings to `jobs/J007/A001.md`.

## Objective

Settle the design inputs for J007 (plan acceptance), so that r2 can be a single implementation brief.

- Size: S (read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified and what is inferred, and the open limits.

1. **Field inventory.** For every field in `.factory/templates/attempt.md` and `.factory/templates/review.md`, classify it as: (a) derivable from the launch data the coordinator has at dispatch (job, attempt or review ID, round, agent run ID, brief path and revision, checkpoint SHA, base SHA, checkout, branch, requested model and effort); (b) derivable from Git at completion (changed paths, commits `base..candidate`, candidate SHA); (c) semantic, left for the author. Name the exact source for each (a) and (b) field. Note fields whose meaning differs between attempts and reviews.
2. **Existing tooling.** Which existing tools already parse or write these records or their fields: `tools/isswf-record-check-core.mjs`, `tools/isswf-record-guard-core.mjs`, `tools/isswf-plan-edit-core.mjs` (J006 durable writes), `tools/isswf-status.mjs`, `tools/isswf-snapshot.mjs`, the pane's `Run:` parsing in `hooks/register.tsx`? Which helpers (atomic write, durable directory sync, path containment, record-name patterns) should a new command reuse instead of duplicating?
3. **Next unused ID.** How should the command choose the next `A<nnn>` or `V<nnn>` and refuse a conflict, given records committed on other branches and the shared-sequential checkout? Which existing code defines the record-name pattern?
4. **Launch identity.** Where does the coordinator get the agent run ID on each host at dispatch time (Claude Agent tool result; Pi `subagent` result)? Can the record be created before the run ID exists and completed after? How does J004's dispatch guard, which already parses the brief path, checkpoint and base from the prompt, relate: could the same parsed data feed record creation?
5. **Completion fill.** Which Git commands give the changed paths and commits for `base..candidate` portably on Linux and Windows, and how should the command treat records commits that sit between code commits (records under `.factory/initiatives/` or `.isswf/initiatives/`)?
6. **Interface.** Propose the command shape (for example `tools/isswf-record-new.mjs create|complete ...`), its JSON output, and how the coordinator skill and the worker and reviewer profiles would call it, keeping semantic fields for the author. Name which docs and packaging files r2 would touch, and which of them `REVIEW.md` lists as needing a person.

## Sources

- `.factory/templates/attempt.md`, `.factory/templates/review.md`, and recent real records: `jobs/J003/A003.md`, `jobs/J003/V001.md`, `jobs/J009/A003.md`.
- The tools named above, `tools/isswf-dispatch-guard-core.mjs`, `tools/project-state.mjs`.
- `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/roles/worker.md`, `.agents/roles/reviewer.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `REVIEW.md`, `docs/durable-work.md`.
- The plan's J001, J006 and J008 sections for the record contract already shipped.
- The working tree is on branch `feat/i0057-j009-branch-guard`; another job's review is active, so do not depend on files that J009 changes (`hooks/register.tsx`, `tools/isswf-command-core.mjs`).

## Inputs and bases

- Target base: main at 204d70770be511fd060cec22d47d24121d8ca3a4. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J007.

## Budget and limits

- One researcher call: `isswf:isswf-researcher` with the selection file's model and effort. No retries.
- Read-only: no edits and no shell. If a question cannot be answered from these sources, say so and name the evidence that would settle it.
