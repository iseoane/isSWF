# I0053/J002 r2: Retire the plugin session-tools note (started 2026-11-13)

Supersedes r1 (discussion) after the operator decisions recorded in the plan.

- Revert the J001 plugin pieces from PR #292: hooks/coordinator-tools.tsx and .test.tsx, the always-on skill.prompt handler in hooks/register.tsx (restore the pane-only handler), and the entries in package.json, tools/factory-package.mjs, tools/build-release.mjs, tests/release-package.mjs.
- Keep the coordinator SKILL.md activation step, without the reference to the plugin note.
- Docs EN/ES installation.md: drop the note paragraph; say Engram and Codegraph are configured with their own installers.
- Packaging files need a person (REVIEW.md); the operator requested this removal explicitly.
Checks: claude plugin test, release-package, check-docs, check-quality; Linux+Windows CI.
