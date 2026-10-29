# Historical project setup record

Retained pre-simplification snapshot from the operator-approved source checkout. Historical grants, model selections and readiness statements below are not current instructions. Use `.factory/project-setup.md` for startup and the owning job records for current work. The source checkout was at `ed39581cc0035fbff2a2c493802c9a2449d99173`; this snapshot also contains later uncommitted observations.

# Project setup

Current status: operator-approved native host defaults are configured; execution readiness remains partial until the selected host's current capabilities and assignment-specific preflight are verified. The historical trials below remain unchanged. The final user-defaults section supersedes their setup choices for future ordinary assignments, not their grants, results or pinned inputs.

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

## Second explicitly approved real trial outcome

The operator subsequently approves one additional isolated worker and the remaining reviewer under the same serial capacity1,120second, subscription-only and zero-retry limits. The first failed worker and its retained reservation are preserved, with cessation reconfirmed before the new genuine external scope. Corrected7225 runtime/artifact4270bfbd passes this second real worker technically: exact authorized mutation only, original protected check exit0, real OpenAI Luna/high model-origin tool calls, root/13tool cessation and automatic capacity release.

The independent tool-free reviewer completes one provider fetch and reports Standards pass, Spec inconclusive, aggregate inconclusive. Its evidence gap is exact model-origin node check.mjs invocation: the operation/exit receipts and final protected check result do not retain command arguments. Candidatee619f90f1c130738b4cceab6e481664c61b0f942 and bundle86595e55414dabd7a20eb81dfda6d161ce5152d9f80993499f394370c6719413 are retained; full scoped evidence is indexed in I0009/J007/brief-r2.md. Both second-scope leases complete normally; original failed reservation remains unchanged. Counters now worker2/2 and reviewer1/1. No further live call or verdict replacement is authorized. Setup remains narrowly configured, not general client acceptance; locally improving durable command evidence is the next reversible technical work.

## Operator-approved native defaults and project integration policy

### Scope and provenance

The operator explicitly requests these defaults across projects and applies them to this project. Target and trusted source are this source checkout, observed at `ed39581cc0035fbff2a2c493802c9a2449d99173` before this setup-record edit. This is not the latest integration checkout or an installed release. Preserve its branch and bytes; do not reset, pull, migrate state or rewrite existing attempts. The resulting setup changes are uncommitted and are not pinned to that source SHA. Keep the single existing `.factory/` root and all historical evidence.

### Pi model selection

The approved native Pi defaults are coordinator/planner `openai/gpt-6.1-sol` LOW, worker/researcher `openai/gpt-6-luna` HIGH, and reviewer `openai/gpt-6.1-sol` MEDIUM. Effective defaults live in user `~/.pi/agent/settings.json`: coordinator startup settings and `subagents.agentOverrides` for the four child roles. This project has no `.pi/settings.json` override, so these user defaults apply here. Do not copy the selections to legacy `.factory/models.json`.

Offline local Pi discovery lists both models; builtin model metadata admits the selected efforts. No credential contents or provider prompts were inspected. The operator subsequently authorized user-scoped installation of `pi-subagents` 0.83.0 through `pi install npm:pi-subagents@0.83.0`. Installation and `pi list` registration are verified; the existing packages and all model/role settings remain unchanged. The current running session still needs `/reload` or a new session followed by native capability/role discovery before delegation is declared ready. Do not install, activate another dispatcher, inherit or clamp silently to work around a missing capability. Previously completed Linux native tasks used their own approved settings and remain separate.

### Claude Code model selection

Approved native defaults: coordinator/planner Opus LOW, worker Sonnet MEDIUM, researcher Haiku HIGH, reviewer Opus MEDIUM. Coordinator startup selection lives in user `~/.claude/settings.json`; child selections use native `model`/`effort` frontmatter in user `~/.claude/agents/isswf-{worker,researcher,reviewer,planner}.md`. This project's `.claude/settings.json` has no model/effort override; preserve its source-plugin isolation settings. The user agents delegate methodology to the trusted shared profile root supplied in each handoff, rather than hard-coding a private checkout.

Observed Claude Code version is 2.1.312. Current host documentation supports per-agent effort and Haiku 5.5 HIGH; the actual alias resolution, account availability and supported effective effort must be checked before a future call. No provider or live agent evaluation was run. If an environment resolves Haiku to a version without HIGH, block that selection rather than changing the requested model/effort. Preserve unrelated user settings and other agents.

### Composition, costs and workspaces

Roles remain conditional: coordinator owns task decisions and delivery; worker owns an authorized implementation unit; researcher supplies needed research; planner handles actual planning uncertainty; reviewer supplies independent judgment when required. Native Pi/Claude host integrations own execution; no new dispatcher, role registry or mandatory pipeline is introduced. Only worker profiles permit writes/commands; researcher/planner/reviewer profiles are read/search oriented. Tool lists are not OS isolation.

The default selections do not authorize model calls, additional paid API use, new actors, time, retries, replacements or correction rounds. Budgets remain finite and assignment-specific; spent historical grants stay spent. Preserve existing subscription-only limits and no Anthropic use in Pi. Parallel writers need separately authorized capacity and exclusive checkouts; no default concurrent pool or client isolation is claimed.

The operator approves sibling worktree roots `<parent>/<repo>-worktrees` with unique direct feature children. This repository's derived root is configured only in local Git key `isswf.worktreeRoot`; do not put its private absolute value in shared records. The global host instructions apply the naming convention to other repositories when authorized setup/worktree work occurs, not one shared absolute Git configuration. No worktree was created, moved or deleted. Bind the prepared external checkout explicitly; do not substitute native automatic in-repository worktrees.

### Tracking and delivery

Recommend GitHub and delivery through a verified feature PR for new projects, preserving explicit existing choices. For this project, retain GitHub repository `iseoane/isSWF`, integration branch `main`, exclusive feature workspaces and the selected feature-to-PR contract. A trusted feature start selects its bounded coordinator-owned commit, feature push, PR and required CI under that assignment's budget. Setup alone runs none of those actions. Issue/label mutation, installation, release, deployment, privilege changes and cleanup remain separately scoped.

**isSWF-only standing integration authorization:** the operator explicitly permits integrating a PR into `main` without another confirmation when the exact retained candidate is classified LOW risk under the existing consequence-based risk assessment, required review/verification is satisfied, and required CI passes on its exact current head. Use the normal PR merge path with expected-head protection and repository rules; this is not a direct main-push, admin-bypass or auto-merge-queue grant. Reconcile the current base/candidate and affected evidence before merging. Do not downgrade risk merely to fit this exception, average away serious consequences or treat green CI as LOW risk. An uncertain classification, stale evidence, open blocker or failed check prevents this path. MEDIUM, HIGH and undetermined-risk PRs still need a separate explicit integration decision. No such standing permission applies to other projects.

### Verification and remaining boundary

User settings were changed only at the requested model/role fields; native Claude profiles and small user instruction blocks hold the preferences. Existing unrelated settings, managed instruction blocks, source-plugin isolation, legacy models, pins and historical failed reservations are preserved. Pre-change local backups were retained outside the repository. Source/host configuration checks and native profile discovery are distinct from live role execution; no model prompt, installation, Windows symlink-permission change, full test suite or remote write is part of this setup change. No Git commit is authorized by this setup request. Operational readiness stays partial where a required capability or assignment budget is not yet verified.

Subsequent installation observation: the operator explicitly authorized the Pi extension installation and requested an actionable prerequisite check in every Pi project setup. The pinned user installation succeeded; no model was dispatched. npm reported two HIGH advisories during installation; their baseline attribution was not established and no audit fix or unrelated upgrade was performed. The canonical Pi host guide now owns the installation/reload/verification commands and the setup skill requires showing them when the dependency is absent. Session loading is still pending, not inferred from package registration. Documentation and diff checks pass. The existing host-portability test advances past the retained no-automatic-install contract but fails on CRLF frontmatter in an untouched skill; no line-ending cleanup was performed. The attempted skill-methodology test is absent from this historical checkout (MODULE_NOT_FOUND), not a passing check. Neither result is proof of extension loading or an installation failure.

## Accepted Windows symbolic-link test limitation

The operator accepts the following limitation after the bounded diagnosis of the J018 cut-3 fixture. Consult this decision before proposing Windows setup changes to unblock that case.

- **Observed failure:** at retained candidate `ea136bb081b93716a636a6def7125a79daad5a6e`, native Windows Node 26.8.1 fails with `EPERM` in `tests/diagnostic-probes.mjs:21` while creating the file symbolic link. Execution stops before the assertion that the product rejects symbolic-link evidence. This is a blocked verification case, not a passing test or evidence of a product defect.
- **Confirmed prerequisite:** isolated Node attempts with both default and explicit file types fail too; native Windows `mklink` independently reports insufficient privileges. Ordinary writes and hard links work in the same temporary directory. The process is not elevated, its token lacks `SeCreateSymbolicLinkPrivilege`, and the Developer Mode registry property is absent. The reason for that host policy was not investigated further.
- **Threat-model distinction:** an agent running under the same effective permissions cannot create that file symbolic link either. Do not assume that the agent has privileges the test lacks. The product may still encounter a pre-existing link created elsewhere or by another principal; retain the rejection guard. This does not establish an exploitable path in the observed environment.
- **Operator decision:** leave Windows unchanged. Do not enable Developer Mode, grant symbolic-link privileges, elevate Pi or the test, or build additional machinery solely to make this one case run. Creating such links is not a general prerequisite for installing or using Pi, `pi-subagents`, or isSWF.
- **Verification honesty:** retain the failed result and the unverified Windows assertion. Do not silently skip the case, substitute a copy, hard link or junction, remove the product guard, or claim that Linux results prove this Windows case. No code, test, Windows setting or permission was changed by the diagnosis or this decision.
- **Reopening condition:** reconsider only if later authorized work changes the affected code or effective permissions, an actual supported user journey needs symbolic-link handling, or new evidence changes the risk. First check the existing evidence and current host; this record alone authorizes no configuration change, retry, new test or execution.

The retained private diagnostic artifacts are `assessment.json`, `native-mklink.json`, `existing-fixture.log`, `existing-fixture.json` and `host-prerequisites.log` in the operator's `isswf-symlink-diagnosis-Vs1cat` temporary evidence directory. Their local retention is not a committed artifact or a durable availability guarantee. The observations and decision above remain the shared record; broader J018 and Windows acceptance are unchanged.
