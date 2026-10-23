# Project setup

## Scope and provenance

- Status: partial; tracking decision recorded, verification and checkpoint pending.
- Target root: `/home/iseoane/Work/isSWF`.
- Observed target base: `bb5db6509ca6102b7f620ed0d2bca6757eda8d25`.
- Authorized source checkout: `/home/iseoane/Work/isSWF`.
- Authorized source checkpoint: `bb5db6509ca6102b7f620ed0d2bca6757eda8d25`.
- Operator authorization: current setup conversation explicitly selects this project, approves this source/checkpoint, and chooses GitHub tracking.
- This record is an uncommitted addition, not content pinned by the observed base.

## Tracking and preserved configuration

- Tracking mode: `github`.
- Repository: `iseoane/isSWF`, evidenced by origin `https://github.com/iseoane/isSWF.git`.
- Canonical plans and jobs remain under `.factory/initiatives/<id>/`; existing historical `.factory/jobs/` paths remain unchanged.
- Template source: `.factory/templates/` at the authorized source checkpoint.
- Canonical model configuration: `.factory/models.json`; inspected values match the authorized source checkpoint. Preserve all existing routes and fields.
- Routing semantics: `docs/model-routing.md` at the authorized source checkpoint. Durable records: `docs/durable-work.md` at that checkpoint. This record introduces no route overrides.
- Existing legacy `.factory/` is retained. No `.isswf/` directory or release receipt was observed; no installation, initialization, migration, or runtime copy is performed.

## Authorization and delivery boundary

- Granted: local inspection and creation of this target-owned setup decision record.
- GitHub issue reads, issue/label creation or editing, branch pushes, PR creation, and merges: not granted. No remote calls performed.
- Provider calls, additional actors, paid API use, dependency installation, execution of project scripts, publication, deployment, and cleanup: not granted by this setup.
- No commit authorized or made; the setup checkpoint remains pending.
- Deliver this local record and inspection results only. Future work requires its own applicable authorization.

## Existing work and reconciliation

- Initial Git status: untracked `.claude/`; preserve it without modification.
- No tracked diff was observed before this record was created.
- Existing initiative plans I0001 through I0006 and historical job records are present. Nonterminal declared states include I0003/J001 in-review, I0005/J001 awaiting-human, and I0006/J005 in-review; saved statuses are not process evidence.
- Active process state and private attempt stores were not inspected; no claim that existing attempts are stopped or live is made. Their pinned inputs, model configuration, and reports remain unchanged. Reconcile exact attempt identities, pinned inputs, and actual process state before any dispatch or replacement.

## Intended checks and observed results

Evidence: `docs/en/development.md`, `tools/check-quality.mjs`, `tooling/quality/package.json`, `tooling/quality/knip.json`, and `.github/workflows/quality.yml`.

- Portable runtime tests: `node tools/check-quality.mjs`; identified, not run during setup.
- Documentation checks: `node tooling/quality/check-docs.mjs`; identified, not run during setup.
- Lint/static checks: `node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs`; identified, not run during setup.
- Dead code/unresolved references: `node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress`; identified, not run during setup. Knip's duplicates category is not evidence of general duplicated-logic detection.
- Build: no separate source compilation/type-check step for the JavaScript modules; standalone release construction requires Bun and committed-source packaging. No release build requested or run.
- Duplicated logic: no dedicated detector identified in the inspected quality configuration. Recommendation: assess a bounded duplication check if recurring duplication justifies its feedback cost; no dependency installation authorized.
- Setup verification: actual new-file diff inspected; `git diff --no-index --check /dev/null .factory/project-setup.md` passed without whitespace diagnostics. These checks do not establish runtime behavior or passing project checks.

## Isolation and pending gates

- Technical isolation: unverified; no sandbox or client execution tested.
- Client-use gate: blocked pending required technical-isolation evidence and separately scoped execution authorization.
- GitHub synchronization: pending any separately granted remote action; choosing tracking mode does not authorize synchronization.
- Pending: Git checkpoint authorization, applicable project checks for future work, and execution-specific reconciliation/preflight. No model availability, subscription coverage, or effort compatibility is inferred from configuration.
