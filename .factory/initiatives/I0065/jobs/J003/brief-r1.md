# I0065 J003 brief r1: README front page and reference page

- Authorization: operator, 2026-11-22, "al I0065". Standing grant: merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Base: the merge commit of J002. The coordinator records it at dispatch.
- Objective and acceptance: [plan.md](../../plan.md) J003.

## Operator outline (2026-11-22)

The README is a front page that a new reader understands in a couple of minutes. Reference topics live in `docs/en/reference.md` ("How the factory works") and its Spanish mirror. That guide already exists; extend it rather than creating a new page.

README, in this order:

1. **What it is.** Two plain sentences, then the J002 diagram.
2. **A first complete session.** Told as one story: install, with the supported hosts (Pi and Claude Code, Windows and Linux); run setup; make a first request to the coordinator; follow progress in the Claude Code initiatives panel, noting that a similar panel for Pi is coming soon; review, PR and the operator's approval; retrospective at close.
3. **How it works, in four lines.** Small verifiable jobs; tests chosen by risk; three kinds of review; nothing is published without the operator. Each line links to its section of the reference page.
4. **What it builds on.** Engram and Codegraph: what each one adds, that both are optional, their project URLs, and acknowledgements. Verify the URLs and what each tool does from `docs/en/installation.md` and the tools' own public pages. Do not guess them.
5. **More.** How it works, the glossary, contributing (`docs/en/development.md`) and the license.

Reference page sections to add or reshape, keeping its existing current content:

- How work is decided and who decides it. Link the J001 interactive flowchart.
- Splitting work into jobs by size (S/M/L by verification cost; an L job is split). Source: `.agents/roles/references/planning.md`.
- Which tests run and when: focused per job, full check at initiative close, and CI on every PR. Source: `AGENTS.md`, `docs/en/development.md` "Quality checks".
- Three kinds of review: deterministic, empirical and semantic. The source term is "mechanical"; use the glossary's canonical term. If the glossary has none, add one in both glossaries after checking `.agents/roles/references/review.md`. Mention that the hooks and guards make some rules deterministic. Source: `docs/en/operations.md`.
- Parallel work in worktrees, with a configurable limit. Sources: the coordinator's "Parallel jobs" section and `docs/en/installation.md`.
- Skills, roles, references and principles: what each is, with links.
- Opening issues from other repositories. Source: `.agents/skills/isswf-issue/SKILL.md`.
- The initiatives panel in detail. Source: `docs/en/installation.md`.

## Scope

- In: `README.md`, `README.es.md`, `docs/en/reference.md`, `docs/es/reference.md`, and the documentation index and glossaries only where a link or term requires it.
- Out: the diagram itself (J001 and J002), other guides' content, and the legacy installation guide's content.

## Checks

1. `node tooling/quality/check-docs.mjs`, `git diff --check`, `node tests/stale-statements.mjs .`
2. `node tools/isswf-verify.mjs --project <checkout> --tier job` on the final head. Report the stamp.
3. In A001, list each removed README paragraph and where it went. Record wall-clock times.

## Method

- `isswf-writing`: selected, for a human audience and plain language.
- `isswf-understanding`: selected for the restatement, so the text is not overly technical.
- Review: one reviewer, semantic. Its focus is accuracy against the canonical guides, that no current content is lost, and that the Spanish matches the English in meaning. One round, one correction. The operator reads both READMEs before merge: this is product acceptance.
