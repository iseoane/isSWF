# Job brief J005 / r1

## Identity and authorization

- Job: I0046 J005, brief r1, Size S. Actor ID: A001 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Operator start: "Haz pr encadenadas y sigue la j005" (Claude Code session, 2026-11-12). Request mode: local-only for the worker; the coordinator owns commits and the chained PR (base feat/i0046-j004-snapshot, never main).
- Workspace: worktree /home/iseoane/Work/isSWF-j005 (branch feat/i0046-j005-run-line, on top of J004). Write only there, plus your attempt record `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J005/A001.md`. No commits, pushes, network or installs.

## Objective and acceptance

Plan I0046 J005 is canonical. Concretely:
- Find where the coordinator is told how to write attempt (A) and review (V) records: coordinator skill `.agents/skills/isswf-coordinator/SKILL.md` and its references, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `.factory/templates/` record templates. Add one fixed line, defined once in the canonical place and referenced (not copied) elsewhere:
  `- Run: claude agent=<id>` (native Agent tool), `- Run: claude session=<id>` (`claude -p`, the session id from its output), `- Run: pi child=<id>` (pi-subagents child). Several runs on one record = several Run lines. The id is copied literally from the launch tool result; unknown -> line omitted, never guessed. No interpretation, no extra model calls.
- `tools/isswf-snapshot-core.mjs`: parse Run lines into each entry as `runs: [{ host, kind, id }]` (empty array when absent). Keep schemaVersion 1 if the change is additive, and say so in the docs. Records without the line keep working.
- Docs: contract update in docs/en/operations.md and docs/es/operations.md (equivalent). Keep agent instructions in English.
- Tests: tests/initiative-snapshot.mjs cases for each host form, multiple lines, malformed line ignored, CRLF.

## Checks and return

Focused snapshot test, any test that pins coordinator/host guide text, check-docs, eslint, knip, git diff --check, and full `node tools/check-quality.mjs` (methodology/docs tests live there). Stop and report if the change exceeds ~150 lines. Return changed paths, check outputs, limits, resources read.
