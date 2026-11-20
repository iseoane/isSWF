# I0061 J003 brief r1 (research)

- Authorization: operator, 2026-11-20, "Dale" to the J003 research. Read-only research; no code changes.
- Researcher: one isswf-researcher.
- Objective and acceptance: [plan.md](../../plan.md) J003.

## Questions

1. Which project types should the run recipe support first (for example CLI tool, HTTP service, web app with a dev server, library with no runnable surface)? Rank by how often factory-driven projects have them and by how cheaply a recipe can verify them.
2. What is the smallest recipe shape inside the existing `verification.json` (schemaVersion 1, argv without a shell, `node` mapped to process.execPath, npm/npx refused) that covers start, readiness probe, smoke steps with expected output, and stop, on Linux and Windows? Note what the current runner (`tools/isswf-verify.mjs`) already provides (timeouts, status vocabulary, refusal codes) and what is missing (background process lifetime, port or output readiness, process-tree stop on Windows).
3. How does this repository itself fit: does isSWF have a runnable surface worth a recipe (for example the local panel described in docs/en/operations.md), or is it a library-only case?
4. Risks: orphaned processes, port collisions, secrets in smoke output, flaky readiness. Propose mitigations that fit the runner.

## Output

A short report: recommended first project types, a recipe sketch (JSON) with field meanings, runner changes needed, risks, and a size estimate for the implementation job (split if over M). Cite file paths and lines for claims about current code.
