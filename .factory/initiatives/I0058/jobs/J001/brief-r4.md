# I0058 J001 brief r4: observed reads and commands, brief comparison

- Authorization: operator, 2026-11-21, "ataca la iniciativa completa I0058", "coordinador, ok adelante!" and "preparamos y desplegamos mas rapido y mas en paralelo" (batch 2). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J001, acceptance items 1 and 2. Research: brief r1 report. Stamp and gate merged in #376, pane in #377.

## Changes

1. Observed reads and commands: extend `tools/isswf-run-usage-core.mjs` to return, per child run, the file paths read (Read tool, and Pi read tools) and the shell commands run (Bash and Pi shell tool), from the same transcripts the pane already parses. Bound the lists and keep paths relative to the project when inside it. Where a host does not expose a field, return it as `unavailable` and document the gap per host.
2. Brief comparison: a tool or function that, given a job's brief and its attempt's child run, reports each selected skill or required reference the brief names (paths under `.agents/` and `skills/`) that the run never read. Surface it as one line in the pane's job view and as a non-blocking note when an attempt record is created or checked; do not refuse.
3. Docs EN/ES (installation, Agents tab; operations, attempt close) with the per-host gaps.

## Scope

- In: the core, the comparison, pane line, tests on recorded transcript fixtures for Claude and Pi (Linux and Windows paths), docs.
- Out: the SHA-on-check record rule (later brief), changing what is recorded by hooks at runtime, blocking anything.

## Checks

In a new worktree first `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`. `node tests/run-usage.mjs .`, new tests, a jiti ts+jsx transform of `hooks/register.tsx` (jiti is in `tooling/host-tests/node_modules`), `node tooling/quality/check-docs.mjs`, `git diff --check`, then `node tools/isswf-verify.mjs --project <checkout> --tier job` on your final code head (report its stamp path). If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`. Record wall-clock times. Write A003 with full SHAs. Commit only in your assigned checkout and branch. Leave no background shells.

## Method

TDD for the core and the comparison. One opus/medium reviewer, 2 rounds, 1 correction.
