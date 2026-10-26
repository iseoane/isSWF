# Project setup

Current status: partial. The original setup snapshot below is historical; the current Windows reconciliation at the end records later evidence and pending decisions without granting execution.

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

## Current Windows reconciliation

- Observed target/source checkpoint: 2160dfdb11d6b7efff11da29ff27ecaba05371fb in the current trusted source checkout. This is source development, not an installed project or a request to migrate state. Keep the single existing `.factory/` root. Private host paths stay outside this shared record.
- Current conversation covers local implementation, reversible synthetic tests, isolated dependency preparation and functional commits for Linux/Windows readiness. It does not grant live/provider calls, paid use, global host changes, push, PR, merge, publication or cleanup. Earlier setup-only restrictions above describe that historical request, not today's separate local grant.
- Preserve GitHub tracking and the existing repository choice. Current delivery is local-only; no normal feature-to-PR publication authority is inferred from this readiness assignment. Preserve existing model routes and active immutable inputs.
- Points1/2 have native compiled tool/lifecycle and read-only recovery evidence in I0009/J007. The exact committed point2 is2160dfd. Recovery can expose unconfirmed profile/ACL cleanup and retain capacity; it is not automatic cleanup or client acceptance.
- Actual Pi1.4 SDK loads under selected compiled Bun, including the worker's Typebox dependency. Offline metadata recognizes all current configured tuples and supports their requested efforts. The probe created no SDK session, intercepted network fetches and observed zero. It is capability evidence, not quota, subscription coverage or provider integration.
- Under the executor's minimal environment, the tested default SDK profile reports no configured authentication for the configured Codex/Go providers. The offline host catalogue lists an OpenAI route, which is not permission or adapter support to replace the fixed Codex worker route. Need the operator-selected opaque auth location or operator-managed authentication, never secret contents in this record/chat.
- Text caller portability corrections and native injected contracts pass as a separate functional setup prerequisite; installed compiled reviewer transport/readback/replay controls also pass with a synthetic backend. Candidate3ae7710607cab775aff7bb8b94bdb64772c12ca8 has full Linux mandatory-isolation quality PASS. These are not live provider results. Injected diagnostic/review probes do not establish actual Windows read-only diagnostic isolation; those probe paths remain Linux-specific. Do not offer them as verified Windows capabilities.

### Proposed minimal composition, not an execution grant

| Role | Proposed use and boundary | Native entry | Proposed actor ceiling |
| --- | --- | --- | --- |
| Coordinator | Current host; owns decisions, not independent review | Existing coordinator profile | Existing session |
| Worker | One exclusive workspace, provider through trusted SDK, LPAC model tools | `isswf-job.mjs` | One original attempt |
| Reviewer | Independent supplied-evidence assessment; no model tools or Windows workspace probes | `reviewer-task.mjs` | One review |
| Researcher | Conditional supplied-source research; disabled without separate role grant/auth evidence | `researcher-task.mjs` | Zero in minimal composition |
| Planner | Conditional text proposal; disabled without separate role grant | `planner-task.mjs` | Zero in minimal composition |
| Diagnostician | Conditional; actual Windows read-only probes not yet supported | `diagnostic-task.mjs` | Zero in minimal composition |
| Additional review | Not automatically enabled or substituted for canonical reviewer | Explicit supported assignment required | Zero |

Proposed minimal total: one worker plus one independent reviewer, serial concurrency1; no automatic replacement, retry or correction round. The worker's one SDK prompt may have multiple provider turns within its existing time/tool boundary; this is not a two-HTTP-request guarantee. No live actors are currently authorized. Route values remain only in `.factory/models.json`; the operator must approve retaining them and the composition/budgets before normal live use. Shared capacity must be materialized under a genuine assignment grant, not inferred from this table.

### Outstanding setup decisions and exit condition

- Select the existing host authentication/profile by opaque path, or authenticate outside this task; do not send tokens. Confirm the intended subscription/cost boundary. Account availability and coverage remain unknown until supported preflight; a catalogue entry is insufficient.
- Approve retaining canonical routes and the proposed minimal composition/budgets, or supply changes. This is configuration selection, not permission to make live calls.
- Repository-local worktree preference is absent. Approve the documented derived external default or another external location before creating worktrees. No local/global Git setting has been changed.
- Keep `Client-use gate: blocked`. Setup becomes configured only for the actually supported, approved delivery boundary after missing choices, authentication evidence and remaining checks are resolved. The real public worker/provider journey, installation maintenance and independent final review remain separately scoped gates.
