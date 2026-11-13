# Job brief J004 / r1

## Identity and authorization

- Job: I0046 J004, brief r1, Size M. Actor ID: A001 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Operator start: "coordinador adelante con el J004" (Claude Code session, 2026-11-12). Request mode: local-only.
- Workspace: worktree /home/iseoane/Work/isSWF-j004 (branch feat/i0046-j004-snapshot). Write only there. No writes to /home/iseoane/Work/isSWF, the mod folder or any state directory. No commits, pushes, network or installs (except `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund` if analysis deps are missing).

## Objective and acceptance

Plan I0046 J004 is canonical. Move the prototype reader `/home/iseoane/Work/isswf-pane/lib/snapshot.mjs` (read-only source; tests and fixtures in its `test/`) into isSWF as `tools/isswf-snapshot.mjs`:
- Exports `readSnapshot(project, fs?)` (default fs = node) and a CLI `--project <abs>` printing JSON. Output carries `schemaVersion: 1`. Reuse `stateDirectory` (tools/project-state.mjs) and `parsePlan` (tools/isswf-plan.mjs) instead of duplicating parsing where behavior matches; keep the injected-fs seam so the mod can pass `$.fs`.
- Unknown or malformed records degrade to explicit `unknown` fields, never throw for one bad record.
- Read-only, no model calls, no network. Paths handled with node:path so Windows works.
- Contract documented in the existing canonical technical docs (pick the right place, e.g. docs/en/reference.md and its docs/es mirror; architecture.md tool table if appropriate). Keep en/es equivalent.
- Packaging: add it to installed tools if the mod will need it installed (tools/factory-package.mjs installedToolNames) and any test that pins that list.
- Tests: tests/initiative-snapshot.mjs (follow existing tests/ conventions and how they are run) with fixtures, incl. a malformed record and Windows-style path input.

## Checks

From the worktree: focused test, `node tooling/quality/check-docs.mjs`, eslint and knip commands from AGENTS.md, `git diff --check`; run full `node tools/check-quality.mjs` since packaging changes.

## Execution

- Model/effort inherited. Budget: 1 run, max 1 correction. Stop and report if the change grows past ~400 lines excluding fixtures.
- Return: changed paths, check outputs, limits (Windows only via CI), resources actually read.
