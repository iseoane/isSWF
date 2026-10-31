# Project setup

Read this quick reference for ordinary assignments. Inspect effective host settings; do not reconstruct configuration from historical trials. This is a source checkout, not an installed release.

## Startup lookup

| Need | Source of truth / action |
| --- | --- |
| Pi startup model and role selections | Trusted project `.pi/settings.json` is the native owner for project defaults and `subagents.agentOverrides`. Inspect user `~/.pi/agent/settings.json` only to determine precedence/effective mapping; a conflicting user override leaves the affected role pending, not a second selection to reconcile here. |
| Claude startup model and role selections | Use Claude Code's supported native model/configuration/profile/delegation mechanisms as the selection owner. This record holds approval/application status and points to that owner; do not create a second editable model table. Inspect user/project layers for effective selection and conflicts. |
| Shared role methodology | `.agents/roles/`; use `.agents/hosts/pi.md` or `.agents/hosts/claude-code.md` for the selected host. Roles are conditional, not a mandatory pipeline. |
| Worktree root | Read `git config --local --get isswf.worktreeRoot` in the canonical repository. Approved convention: sibling `<parent>/<repo>-worktrees/<feature>`, with a unique direct feature child. Validate the root and existing worktrees before authorized creation; bind the child's working directory explicitly. No global absolute root. |
| Current objective, acceptance and budget | The selected initiative's canonical plan and current brief, or a bounded operator handoff. Prior grants and spent budgets do not restart. |

`.factory/models.json` is legacy-only: it applies to explicitly selected legacy-executor assignments. Current Pi and Claude selections belong to their respective host-native configuration owners above. Do not copy native role defaults into JSON or treat offered presets/historical decisions as a second current selection. Preserve explicit project choices and unrelated settings.

## Project choices and boundaries

- Keep the single existing `.factory/` state root. Do not initialize `.isswf/`, migrate state or update an installed pin as a setup side effect.
- Tracking: GitHub `iseoane/isSWF`, integration branch `main`; ordinary selected feature delivery follows `.agents/roles/references/feature-delivery.md`. This setup record alone grants no commit, push or PR.
- **isSWF-only standing integration permission:** LOW-risk PRs may be merged through the normal protected PR path only after required review/checks and required CI pass on the exact current candidate, with expected-head protection. Uncertain risk, stale evidence, failed checks or open blockers prevent integration. MEDIUM/HIGH/undetermined risk needs a separate operator decision. Never downgrade risk to fit this permission; no direct-main push, admin bypass or auto-merge-queue grant. This exception does not apply to other projects.
- Preserve subscription/cost limits, no Anthropic in Pi, finite assignment budgets and independent review when required. Saved configuration grants no provider calls, installation, release, deployment, privilege change or cleanup.
- Preserve existing checkouts and historical attempts. This setup record does not authorize resetting, updating or removing another checkout.
- **Repository-only operator cleanup choice:** after the operator explicitly requested ongoing cleanup, retire branches and worktrees of integrated PRs only after checking actual merged head/ancestry, stopped ownership and retained evidence under `docs/durable-work.md` and `.agents/roles/references/worktrees.md`. Worktrees must have no unique tracked, untracked or ignored content before removal; unknown ownership blocks cleanup. Use normal deletion, never force/reset. Preserve the primary checkout, backups, handoff refs and parked PR87. This records the current repository-specific grant, not a factory-wide automatic cleanup policy or permission to remove active work.

## Readiness: verify only what the next assignment needs

- Pi: `pi --version` reports 1.4.0 and `pi list` confirms user-scoped `pi-subagents@0.83.0`. Loaded native tools and zero-model `subagent` role discovery were verified in this session: `isswf-worker`, `isswf-reviewer`, `isswf-planner` and `isswf-researcher` are available. Effective user role overrides were inspected without changes; selections remain configured/requested, not independently observed provider identity or proof of quota. This verifies native delegation availability, not OS isolation, process cessation or every future assignment's readiness. Follow `.agents/hosts/pi.md` for current preflight; registration alone is not loaded readiness.
- Claude: configured native profiles are not proof of actual model/effort availability. Verify the effective selection before delegation; do not silently substitute or clamp. Local version 2.1.314 was observed during I0010/J007 without model calls. Parallel binding to approved prepared external checkouts remains **unverified**: the inspected native Agent interface provides no supplied child working-directory parameter; worktree isolation, the local root setting, WorktreeCreate or EnterWorktree documentation alone do not establish an approved active per-child binding. No live Claude binding probe or hook configuration was performed. Plan sequential writers in the assigned checkout when parallelism is not required; block explicit parallel requirements or separate-checkout dispatch without verified binding. Preserve the approved external root and do not silently serialize an explicit concurrency requirement.
- Windows symbolic-link test: an accepted J018 verification limitation, not a general installation prerequisite. Do not change Windows permissions or add machinery just to run that case. The decision and reopening conditions belong to J018's existing delivery record, not startup configuration.

## Applied source-checkout methodology

- Reconciled against trusted source checkpoint `f81b8eb5c0200ea808a527987dd180a1d4f0ae80` under the operator's explicit local setup request. Factory source and target are this same checkout, not an installed release. Local setup edits are not part of that checkpoint until separately committed.
- Root `AGENTS.md` now includes the setup-managed coordinator entry from #90, referencing this existing `.factory/project-setup.md`. The actual host selects its supported skill interface and trusted resources; no duplicate `CLAUDE.md` bridge, private package path or new active state directory was created.
- For future assignments, consume the canonical coordinator/host/role resources containing #95 proportional delta verification, #92 pre-dispatch durable records, #94 selected-method transport and acknowledgement, #97 application evidence and #91 evidence-triggered role reclassification. These are instructions, not a migration of old jobs or a retrospective claim that every historical attempt complied. Preserve pinned inputs and remaining assignment budgets. I0010 used a maximum of two reviews per issue; that assignment-specific limit is not automatically a budget for new work.
- #89 capability disclosure is recorded above. No new native Claude external-checkout binding is implemented or claimed. No setup-driven changes to host settings, model choices, permissions, installed pins or worktree location were made.
- After local instruction changes, run `/reload` in Pi to reload skills and context files. Reload has not been observed as part of this reconciliation; it is not an installation or proof of future agent adherence. The known #84 CRLF test failure remains unresolved and is not a new setup prerequisite.

## Current Linux cross-machine reconciliation

Inspected the current Linux source checkout at `82a1338b35df578cbd749011b35278c17f995f61` under the operator's explicit setup-reconciliation request. The existing GitHub destination, single `.factory/` state root, managed coordinator entry and delivery boundaries remain unchanged. Historical readiness above describes the original host, not automatic readiness on this machine.

- Pi 1.4.0 and user-registered `pi-subagents@0.83.0` are present. After the reported reload, extension skills are visible, but neither `subagent` nor `subagents_enable` is exposed to this coordinator. Loaded role discovery and effective role mapping remain unverified; no model was launched or alternate dispatcher used.
- Current user settings have no `subagents.agentOverrides`, and no project `.pi/settings.json` exists. The four shared Pi agent profiles declare methodology/tools but no model or effort. The current coordinator startup selection is not an approved role selection. Historical machine-local role overrides have not been transferred or recreated.
- Offline model discovery lists OpenAI Codex candidates, including `gpt-6-luna` and `gpt-6.1-sol`; listing does not establish effort compatibility, subscription quota or execution permission. No credentials were read, host configuration changed or new provider selected.
- A repository-local external worktree-root preference exists, but its directory is absent on this machine. Preserve the preference; validate or prepare an authorized workspace before using it. This does not block read-only preparation or sequential work in an exclusively owned checkout.
- For the four selected Windows issues, preserve order #84 -> #83 -> #85 -> #86 and the consumed historical #86 worker. Its reviewer was unused; no finite new actor/correction budget or role mapping is inferred from this setup request. Current implementation/feature-PR authorization is separate from those unresolved delegation prerequisites.

Readiness is **partial**: project methodology and delivery choices are retained; loaded native tools, effective approved role model/effort and finite assignment capacity remain unresolved. Do not repeat a full setup interview, rewrite legacy routing, reactivate the parked executor or infer that another machine's user configuration is shared through Git.

## Approved portable preset for this repository

The current operator explicitly accepts the factory preset in `.agents/skills/isswf-setup/SKILL.md`, section “Confirm portable factory defaults”, for both hosts and requests its application here. This supersedes the missing-selection observation in the Linux reconciliation above, without rewriting historical execution inputs or budgets.

- Pi coordinator startup and the four `isswf-` role model/thinking overrides are persisted in ignored project-local `.pi/settings.json`. User-global settings are unchanged. The source-host isolation helper's project filters were applied and preserved so the installed resource package does not shadow source resources in this checkout. Offline discovery lists both requested Codex model IDs; live tool mapping and effective effort verification remain pending until the host exposes native delegation tools after reload.
- Claude Code model selection: the complete portable preset is approved. It has not been applied to or verified in a running Claude host from this Pi session. Use the native host guide to persist/verify supported model and per-role effort; unsupported Haiku high or any other selection stays pending rather than silently clamped or replaced.
- Worktree location: the operator explicitly replaced the old local choice with the factory sibling layout. Validated repository-local `isswf.worktreeRoot` is configured; no directory or checkout was created, moved or removed. Keep its absolute value out of shared records.
- Review allowance: up to two rounds per functional unit by default, not two mandatory reviews. For this repository only, the operator permits additional rounds when the coordinator judges them necessary; record each reason and candidate. This is not a shipped unlimited-review default or a reset of prior consumed actors. Resolve the concrete finite call/time/cost boundary before dispatch; no automatic retries, model substitutions, paid API use or legacy executor resumption follows.

Requested local Pi configuration is applied; live native-delegation readiness remains **partial**. Claude preferences are approved but application/capability checks remain pending on that host. Static factory instruction tests are not evidence that a real setup or model call ran on Windows or Claude.

## History: read only when investigating the relevant work

- The pre-simplification setup/trial record is retained in `.factory/initiatives/I0009/setup-history.md`, including the original source-checkpoint reference and later observations. Read it only for historical investigation, not current configuration or grants. J007's existing briefs own the related worker/reviewer trial evidence; failures and inconclusive results are unchanged.
- J018 evidence and the accepted symbolic-link limitation belong to `.factory/initiatives/I0009/jobs/J018/delivery.md`. The canonical initiative plan still owns job status; recording the accepted limitation does not mark the broader job complete.
