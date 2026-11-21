# I0058 J008 brief r3: one canonical definition per record field

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058" and "coordinador, ok adelante!" (batch 2). Standing grant; host-guide and role-profile edits approved in scope (REVIEW.md person approval, not HIGH risk). Merge per the standing rule.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J008, first acceptance item (unit 1). Unit 2 (stale-statement search) merged in #377. Research: brief r1 report (definitions repeated across templates, roles, skills, host guides and docs).

## Changes

1. For each field of the attempt and review record templates under `.factory/templates/`, pick one canonical home (the template or the reference it links to). Other files that restate the definition link to it or name the field without redefining it. Keep persisted keys and field names unchanged.
2. A test asserts the key phrases of each canonical definition, so dropping part of a definition fails.
3. Add each removed restatement that could reappear to `tooling/quality/stale-statements.json` when a literal phrase is stable enough.
4. Wording from J004 V002: in docs/es, render "detached worktree" as "worktree desacoplado (`--detach`)" instead of "separado"; in EN, ES and the host guides, say the base worktree is read-only by instruction, not enforced.
5. Spanish mirrors stay equivalent.

## Scope

- In: templates, roles, skills, host guides and docs that restate record fields; the test; the phrase list.
- Out: changing what a field means, renaming keys, historical records under `.factory/initiatives/`.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. The new test, `node tests/stale-statements.mjs .`, the tests that read edited skills, profiles and guides (find them with grep), `node tooling/quality/check-docs.mjs`, `git diff --check`, then `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final code head (report its stamp path). If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`. Record wall-clock times. Write A001 with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

isswf-writing for the definitions; TDD for the phrase test. One opus/medium reviewer, 2 rounds, 1 correction.
