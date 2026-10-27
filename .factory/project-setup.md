# Project setup

Current status: configured for the approved bounded native worker/reviewer trial; general client readiness remains partial. The original setup snapshot below is historical; the current Windows reconciliation at the end records later evidence and pending decisions without granting execution.

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

- Observed target/source checkpoint: b310505 after committed Windows lifecycle and text-role portability prerequisites, in the current trusted source checkout. This is source development, not an installed project or a request to migrate state. Keep the single existing `.factory/` root. Private host paths stay outside this shared record.
- Current conversation covers local implementation, reversible synthetic tests, isolated dependency preparation and functional commits for Linux/Windows readiness. It does not grant live/provider calls, paid use, global host changes, push, PR, merge, publication or cleanup. Earlier setup-only restrictions above describe that historical request, not today's separate local grant.
- Preserve GitHub tracking and the existing repository choice. Current delivery is local-only; no normal feature-to-PR publication authority is inferred from this readiness assignment. Preserve existing model routes and active immutable inputs.
- Points1/2 have native compiled tool/lifecycle and read-only recovery evidence in I0009/J007. The exact committed point2 is2160dfd. Recovery can expose unconfirmed profile/ACL cleanup and retain capacity; it is not automatic cleanup or client acceptance.
- The operator confirms the current Pi session and Luna/high availability. Safe host metadata identifies the active OpenAI provider. Actual Pi1.4 SDK metadata lists an OpenAI OAuth credential and reports configured authentication and subscription status for that provider; Codex/Go remain unconfigured in this profile. This narrows the blocker to explicit provider binding, not a missing login. No credential values are exposed or copied and no further operator path-hunting is needed.
- Local adapter compatibility now accepts either supported explicit Luna/high provider destination, without aliases/fallback or project-config migration. Worker and text callers bind pinned routes, grants and observed provider identity; real worker mode additionally rejects API-key or unknown billing before session creation. Existing project routes and historical pins remain unchanged.
- Candidate8bda5bdfa1c5502a9dfb6b2c10e2e540a4ce616e passes native installed compiled worker/reviewer synthetic tests for both destinations and full Linux mandatory-isolation quality, plus locked ESLint/Knip/docs. ArtifactId63f947ca0e43ce2d69036cf920270b97c10a36cc99a6f9c1b1105e99b715e258. Real installed Pi1.4 SDK offline worker creates the session, exposes only sandbox_shell and passes actual LPAC/file/network/protected-change controls without a model prompt. Instrumented fixture levraS observes0fetches; separate genuine unmodified generated task jGcpIp passes without fetch-count instrumentation. Both observe worker cessation. This proves local SDK integration, not provider response, quota or product acceptance.
- Original private probe wrapper/task identity mismatch and subsequent shebang instrumentation syntax failure are retained separately; both were fixture mistakes, not proven SDK defects. The first full Linux run hits the outer60-second bun-release timeout; explicit mandatory Bun and separate full rerun pass. No timeout cause is inferred.
- Final compatibility candidate6ffab1244079a47bca9a5549647c36472dccee09 also rejects explicit null route selection before SDK/platform work or task publication. Native package/artifact2c8e00a5883221ddb04a07217784ea5fa76e27865971552b97c7feeb9a7e099e, both-provider compiled controls, actual SDK offline lkW7LN (intercepted0fetches) and wvkUWP (unmodified task), full Linux mandatory-isolation quality and locked static/docs checks pass. Earlier8bda evidence and failures remain separate. No provider prompt or acceptance inferred.
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

Proposed minimal total: one worker plus one independent reviewer, serial concurrency1; no automatic replacement, retry or correction round. The worker's one SDK prompt may have multiple provider turns within its existing time/tool boundary; this is not a two-HTTP-request guarantee. No live actors are currently authorized. Effective route values remain in `.factory/models.json`; choosing the authenticated provider for the minimal roles and approving the composition/budgets remain explicit decisions before normal live use. Shared capacity must be materialized under a genuine assignment grant, not inferred from this table.

### Historical outstanding setup decisions and exit condition

- Host auth discovery and actual offline SDK/session integration are resolved for the existing authenticated provider. Do not ask the operator for credential files or secrets. Live access/quota still needs a separate finite test; SDK subscription metadata is not a live result or additional-cost authorization.
- Approve an explicit project configuration selecting the already authenticated provider for the minimal worker/reviewer, with Luna/high unchanged, plus the proposed serial composition/budgets. Retaining legacy provider destinations would need their own auth evidence instead. No selection has been changed silently. Configuration selection alone does not grant live calls.
- Repository-local worktree preference is absent. Approve the documented derived external default or another external location before creating worktrees. No local/global Git setting has been changed.
- Keep `Client-use gate: blocked`. Setup becomes configured only for the actually supported, approved delivery boundary after missing choices, authentication evidence and remaining checks are resolved. The real public worker/provider journey, installation maintenance and independent final review remain separately scoped gates.

### Operator-approved bounded boundary

The operator now approves worker/reviewer on the existing authenticated provider with Luna/high unchanged, one original worker followed by one independent reviewer serially, maximum120seconds each, no retries/replacements/correction rounds, no paid API, push or publication. Only those two current .factory/models.json bindings change; historical inputs and inactive-role routes stay intact. Native snapshots use an external private store in a small standalone target, not a Git worktree; no worktree-root setting or global host configuration is changed. Shared execution capacity limit1 is required for both roles. Preserve exact candidates and uncertain outcomes; no cleanup authorization.

The actual installed public caller additionally passes offline native admission after correcting external-path separators and directory publication, including durable claims, no replay and verified automatic capacity completion. Candidate96d5ef87126368725cf81aaa38525eb4af920521 artifact254e68c35c546394fd73f7f8a55689c44bae97b1b5952ce5b5902cd469f5038e, fixturecs1FsJ. Full Linux mandatory-isolation rerun and locked static/docs checks pass; preceding failing test fixtures remain historical. Point3 is configured for this narrow trial, not general feature-to-PR or client acceptance. The next point is actual provider-worker-reviewer execution under concrete external grants, initial counters worker0/1 reviewer0/1.

### Actual live trial result

The single approved real worker reached the configured SDK/model and made12tool calls with passing boundary/protected-file controls, but did not modify result.txt; the original protected check exits2 and the attempt is terminal failure, not acceptance. Worker1/1 consumed, reviewer0/1 unused. Root and13tool completion receipts show stopped/profile deletion, but failed capacity remains retained by policy. No review, retry, replacement, capacity bypass or cleanup is performed. The retained private trial and exact inputs are referenced in I0009/J007; no credential values are stored here.

A separate controlled regression proves the old compiled node alias rejects -e. The local correction adds same-engine -e/--eval with cwd-based require and forwarded arguments, and passes native LPAC controls and full Linux mandatory-isolation regression (candidate7225b30b4e54cb200b232eb7dcb14fce1a44e568). Actual failing commands were not retained; do not claim this proves why the real worker failed or that the corrected runtime has passed a live trial. Minimal setup stays configured, general client-use remains blocked. A new bounded trial/additional worker and capacity decision require new authority.
