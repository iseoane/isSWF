# Project setup

Read this quick reference for ordinary assignments. Inspect effective host settings; do not reconstruct configuration from historical trials. This is a source checkout, not an installed release.

## Startup lookup

| Need | Source of truth / action |
| --- | --- |
| Pi startup model and role selections | User `~/.pi/agent/settings.json`: `defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `subagents.agentOverrides`; inspect any trusted project `.pi/settings.json` overrides. |
| Claude startup model and role selections | User `~/.claude/settings.json` and native `~/.claude/agents/isswf-{worker,researcher,reviewer,planner}.md`; inspect trusted project overrides. |
| Shared role methodology | `.agents/roles/`; use `.agents/hosts/pi.md` or `.agents/hosts/claude-code.md` for the selected host. Roles are conditional, not a mandatory pipeline. |
| Worktree root | Read `git config --local --get isswf.worktreeRoot` in the canonical repository. Approved convention: sibling `<parent>/<repo>-worktrees/<feature>`, with a unique direct feature child. Validate the root and existing worktrees before authorized creation; bind the child's working directory explicitly. No global absolute root. |
| Current objective, acceptance and budget | The selected initiative's canonical plan and current brief, or a bounded operator handoff. Prior grants and spent budgets do not restart. |

Legacy `.factory/models.json` applies only to explicitly selected legacy-executor assignments; do not copy native role defaults into it. Preserve explicit project choices and unrelated settings.

## Project choices and boundaries

- Keep the single existing `.factory/` state root. Do not initialize `.isswf/`, migrate state or update an installed pin as a setup side effect.
- Tracking: GitHub `iseoane/isSWF`, integration branch `main`; ordinary selected feature delivery follows `.agents/roles/references/feature-delivery.md`. This setup record alone grants no commit, push or PR.
- **isSWF-only standing integration permission:** LOW-risk PRs may be merged through the normal protected PR path only after required review/checks and required CI pass on the exact current candidate, with expected-head protection. Uncertain risk, stale evidence, failed checks or open blockers prevent integration. MEDIUM/HIGH/undetermined risk needs a separate operator decision. Never downgrade risk to fit this permission; no direct-main push, admin bypass or auto-merge-queue grant. This exception does not apply to other projects.
- Preserve subscription/cost limits, no Anthropic in Pi, finite assignment budgets and independent review when required. Saved configuration grants no provider calls, installation, release, deployment, privilege change or cleanup.
- Preserve existing checkouts and historical attempts. This setup record does not authorize resetting, updating or removing another checkout.

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

## History: read only when investigating the relevant work

- The pre-simplification setup/trial record is retained in `.factory/initiatives/I0009/setup-history.md`, including the original source-checkpoint reference and later observations. Read it only for historical investigation, not current configuration or grants. J007's existing briefs own the related worker/reviewer trial evidence; failures and inconclusive results are unchanged.
- J018 evidence and the accepted symbolic-link limitation belong to `.factory/initiatives/I0009/jobs/J018/delivery.md`. The canonical initiative plan still owns job status; recording the accepted limitation does not mark the broader job complete.
