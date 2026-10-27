# Where things live

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/architecture.md)

This guide describes the current source layout, not a proposed architecture. Start with the code and tests when checking what is implemented. A plan, an old demonstration, or a successful model response is not proof of today's behaviour.

## Instructions and host integrations

The shared instructions live in `.agents/skills/` and `.agents/roles/`. Role references explain how to investigate, implement, verify, and review work. They are used when relevant, not as a compulsory sequence.

The normal development workflow uses host-owned delegation on Windows and Linux: Pi with the separately installed `pi-subagents` extension and Claude Code with native agents. isSWF supplies methodology, not a process supervisor or equivalent cross-host sandbox. Pi profiles live in `.agents/hosts/pi/agents/`, declared through `pi.subagents.agents` in `package.json`; Claude profiles use its default `agents/` directory. See [host support](../host-portability.md) for configuration and observed verification limits.

Pi discovers the skills declared in `package.json`. The `skills/`, `agents/`, and `.claude-plugin/` directories adapt the shared instructions to Claude Code. They should not grow a separate copy of the methodology. A role file describes responsibilities; it is not a running agent or an execution permission.

## Executable tools

These retained tools support the legacy compiled-executor workflow and historical records. They are not prerequisites for new host-native assignments. Keeping them does not complete old readiness objectives or migrate installed projects.

| Area | Source |
| --- | --- |
| Build and verify a package | `tools/build-release.mjs`, `tools/bun-release.mjs`, `tools/release-source.mjs`, `tools/factory-package.mjs` |
| Initialise, select, update, and recover a project's installation | `tools/isswf.mjs`, `tools/project-state.mjs`, `tools/state-migration.mjs` |
| Prepare plans and issue intake | `tools/isswf-plan.mjs`, `tools/isswf-intake.mjs` |
| Read records and show the local panel | `tools/isswf-status.mjs`, `tools/isswf-panel.mjs`, `tools/isswf-response.mjs` |
| Prepare and observe a worker | `tools/isswf-job.mjs`, `tools/pi-worker-task.mjs`, `tools/worker-lifecycle.mjs` |
| Research, planning, diagnosis, and review | `tools/researcher-task.mjs`, `tools/planner-task.mjs`, `tools/diagnostic-task.mjs`, `tools/reviewer-task.mjs` |
| Capacity, recovery, and external-effect records | `tools/execution-capacity.mjs`, `tools/native-recovery.mjs`, `tools/recovery-review.mjs`, `tools/job-successor.mjs`, `tools/external-effect-journal.mjs` |

The release compiler bundles tool entrypoints into one Bun executable and supplies each module's original identity and package-root paths. Original source files remain verified provenance, dynamic helpers, and immutable task snapshots. Source development still runs on Node.js. `tools/sdk-package.mjs` resolves SDK dependency metadata without relying on a Node-only API.

These callers have different contracts. Do not assume one role's command, model support, recovery, or permissions apply to another.

## Project records and private runtime data

New target repositories use `.isswf/`. Existing repositories may use `.factory/` until an explicit migration. `tools/project-state.mjs` selects the state directory; it refuses ambiguous coexistence. Do not rename historical references to make old records look new.

Plans, briefs, and review records describe the work. The installation pin selects its runtime. Bun receipt format 2 separates the portable source/engine identity from the locally anchored native artifact hash. Legacy format-1 identities and stores remain valid. Private runtime stores retain execution records and exact released code separately from shared project files. A saved status is not proof of a live process.

The development repository's `.factory/models.json` and `.factory/templates/` are also source defaults distributed by explicit allowlists. Its initiatives are project records, not package contents. The `isswf/` Python code and `examples/` belong to earlier intake prototypes; the native installed flow does not depend on SQLite.

## Tests and documentation

`tests/` contains the portable JavaScript checks and historical tests. `tooling/quality/` contains locked development-only static-analysis tools. `.github/workflows/quality.yml` runs the portable, lint, and unused-code checks. Private fixtures and backups belong under ignored `tooling/.local/`, not in the installed package.

[Development](development.md) explains how to run these checks. [The glossary](../../GLOSSARY.md) defines the product's terms.
