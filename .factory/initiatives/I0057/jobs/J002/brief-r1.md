# I0057/J002 brief-r1: Research for the isswf-handoff skill (review mode) and the unreviewed-commit check

## Identity and authorization

- Job and brief revision: I0057/J002, r1. This is read-only research; the implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. The operator decided on 2026-11-15 that J002 ships as a distributed skill `isswf-handoff` backed by a tool, review mode first.
- Role: `.agents/roles/researcher.md`, read-only. The coordinator writes the findings to `jobs/J002/A001.md`.

## Objective

Settle the design inputs for J002 (plan acceptance), so that r2 can be a single implementation brief.

- Size: S (read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified and what is inferred, and the open limits.

1. **Current reviewer handoff.** What do `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/skills/isswf-review/SKILL.md`, `.agents/roles/reviewer.md`, `.agents/roles/references/review.md` and `.agents/hosts/{claude-code,pi}.md` require an unbound reviewer handoff to contain (diff source, byte count, digest, base, candidate, brief, required resources, prior reviews)? Which of these are mechanical and which are judgment?
2. **Existing tooling.** What do `tools/isswf-review-launch.mjs`, `tools/git-evidence.mjs` and the `isswf_git_evidence` MCP server (`identity`, `diff`, `content`) already produce, and where do they overlap with a generated handoff? What does `tools/isswf-record-new.mjs` (J007, now in main) provide that the handoff should reuse (identity fields, `next`, V record skeleton)?
3. **Dispatch guard.** How does `tools/isswf-dispatch-guard-core.mjs` recognise a reviewer dispatch and what does it check today? What is the smallest extension that refuses a reviewer dispatch without the generated handoff (for example a handoff file path plus its SHA-256 in the prompt that the guard re-verifies)? Cover Claude (`hooks/register.tsx`) and Pi.
4. **Unreviewed commits.** How can delivery detect commits that change non-record paths after the last reviewed candidate without a recorded delta review, before push or in CI? Which data exists: V records' `Candidate commit SHA` lines, the plan, `git rev-list`, record paths under `.factory/initiatives/` or `.isswf/initiatives/`? Where would the check run (`tools/check-quality.mjs`, `.github/workflows/quality.yml`, a push-time hook), and what does `REVIEW.md` say about paths that need a person? Include the PR322 incident (plan J002 evidence) as the test case, and coordinator-applied docs-only fixes such as J007's d6b9844 (recorded as an override in V002) as a case the check must handle.
5. **Skill shape.** Using Matt Pocock's handoff skills as reference only (`mattpocock/skills`: `handoff`, `claude-handoff`; reference, do not copy), propose the `isswf-handoff` skill layout under `.agents/skills/isswf-handoff/` with its thin Claude and Pi entries (`skills/`, discovery manifests), naming rules from `AGENTS.md`, and which packaging and discovery files must list it. Keep the session-handoff mode out of scope but say where it would plug in.
6. **Interface.** Propose the tool's command shape and JSON output, how the coordinator calls it, and which docs (`docs/{en,es}/...`) and methodology pointers r2 would touch, marking the paths `REVIEW.md` lists as needing a person.

## Sources

- The files named above, `tools/factory-package.mjs`, `tools/build-release.mjs`, `REVIEW.md`, `AGENTS.md`, `docs/durable-work.md`, `docs/en/operations.md`.
- The plan's J002, J004 and J007 sections, and `jobs/J007/V001.md` and `V002.md` as real handoff examples.

## Inputs and bases

- Target base: main at d1d3ded10f8eb6a203c93d43bfd2919a8c889bcf. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J002.

## Budget and limits

- One researcher call: `isswf:isswf-researcher` with the selection file's model and effort. No retries.
- Read-only: no edits and no shell. If a question cannot be answered from these sources, say so and name the evidence that would settle it. Report required-resource consumption honestly.
