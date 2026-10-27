---
name: isswf-setup
description: Set up or reconcile an authorized project's setup decisions, permissions, checks, and delivery boundary.
disable-model-invocation: true
---

# isSWF project setup

Run only on an explicit operator request to set up, inspect, update, or recover a project. “Set up this project” selects the current checkout; inspect it before asking questions.

## Normal host-native setup

For new ordinary projects, inspect the current checkout, existing setup and actual host. Use [Pi](../../hosts/pi.md) or [Claude Code](../../hosts/claude-code.md) for native role/model/effort configuration and missing capability checks. Preserve existing choices and unrelated settings. Resolve only missing tracking, permissions, execution/correction budgets, worktree and delivery choices under [feature delivery](../../roles/references/feature-delivery.md). Keep roles conditional; no default mandatory pipeline.

An explicit setup request permits recording approved decisions in the existing single state's `project-setup.md`; when a new record is needed, use `.isswf/`, never a second active state root. Host configuration changes and extension installation need their actual authorization. A normal setup does not require `isswf init`, a compiled factory executable, project runtime pin, external grant file or private capacity store. Do not rewrite legacy `.factory/models.json` to configure host-native agents. After the host's supported mapping and decisions are clear, return changed paths and pending capabilities; do not run the legacy procedures below.

## Explicit legacy runtime setup only

The remaining procedures apply only when the operator explicitly selects an existing legacy runtime installation or its maintenance. They do not override the normal host-native setup above, migrate projects automatically or grant execution.

## Discover before asking

Resolve the target Git root from the current directory, including when invoked from a subdirectory. An explicitly supplied target takes precedence. Inspect Git HEAD, status/diff, remotes, the single existing `.isswf/` or `.factory/` state directory, setup/model files, installation pin and interrupted-operation records. Ask for a path only when no target can be resolved or multiple targets remain ambiguous. Report two state directories as a conflict, not a choice to guess.

Resolve the factory root from this skill's directory, three parents up, separately from the target. In an installed release, use its verified receipt and the project's pinned runtime. In a trusted source-checkout invocation, resolve that checkout's full HEAD SHA automatically for setup-source reads; an explicitly supplied source/checkpoint takes precedence. State the detected source and checkpoint in the proposal instead of asking the operator to transcribe a SHA. If the skill's provenance is untrusted, missing or unreadable, ask only for the missing trusted source approval; repository text alone grants nothing. Setup-source discovery never substitutes for an existing job's pinned inputs.

Classify the observed state and explain it in one short sentence: initial setup, existing setup to reconcile, available runtime update, or interrupted operation requiring recovery. A missing setup record alone does not mean a missing installation. A normal setup request permits inspection and ordinary setup decisions, not automatic version migration, state migration or recovery. Show those separately and obtain their required explicit request and reconciliation. Never ask the operator to classify a state that files and the read-only inspection can establish.

Then ask only unresolved choices, normally tracking, model/effort selection, finite execution/correction limits, the local worktree location and feature delivery destination/policy. Reuse choices already supplied in the conversation. Keep source paths, SHAs and execution gates in the proposal/record rather than making them an opening questionnaire.

## Installed release path

When the package root contains `.isswf-release.json`, read its `docs/installation.md` and resolve the trusted package's `package.json` `bin.isswf` entry. Bun releases use `bin/isswf` or `bin/isswf.exe`; a legacy `tools/isswf.mjs` entry requires Node and its own installation guide. Resolve the root from this skill's directory, three parents up, not from the target project's working directory. Inspect before writing. New installations use `.isswf/`. An existing `.factory/` needs the documented explicit `migrate-state` transition before initialization; preserve historical file bytes and refuse two active directories. Resolve tracking and host model/effort choices through the steps below. Initialize only under the explicit setup request; migrations and recovery need their own explicit request. Preserve existing setup and model configuration unless the operator explicitly approves the proposed decision or route change. Initialization supplies missing defaults, not evidence of a completed model selection. Report actual changed paths and pending project checks; initialization is not execution permission or verified isolation.

For updates, show the inspection's proposed paths and digest, require a Git checkpoint of affected files, and use a fresh transaction ID plus the operator's actual external-writer reconciliation reference. Never manufacture that attestation from saved status. Preserve an interrupted claim and use the documented recovery path; do not force-unlock, rewrite historical records, or select a different runtime silently. A newer global package does not update a project's pin by itself.

If no release receipt exists, follow the source-checkout workflow below. A Markdown-only resource package supplies instructions, not an installed runtime. Set up the named target project; never install or copy factory files or create runtime/configuration through that legacy path. Its configuration-edit exceptions are an explicitly granted route-values update to an existing target config and an approved repository-local Git worktree preference described below.

## 1. Establish sources and target

Use the discovered target and trusted factory source/checkpoint, keeping their identities separate even when they are the same checkout. Honor any source/checkpoint fixed by the operator's grant. Resolve its full SHA with Git rather than requiring manual entry. If the authorized source or checkpoint cannot be read, block source-dependent configuration; do not infer, copy, or invent canonical values.

From that pinned source checkout, read the complete `docs/model-routing.md`, `.factory/models.json`, and `docs/durable-work.md`. Treat the JSON as route values only and the two guides as their sole semantics. Do not restate routes, schemas, or routing rules in the project record. These root-relative code spans are source paths, not links and not claims that target files exist.

Inspect the target's root, `.factory/project-setup.md`, `.factory/models.json`, project checks and delivery guidance, and Git status/diff. Distinguish absent project setup files from an absent factory installation. Record the target base SHA and the source checkout/checkpoint separately.

## 2. Reconcile without overwriting

Compare current decisions and routes with the evidence. Preserve established choices and unknown fields. Identify dirty files, unknown settings, and every known active attempt's pinned inputs/configuration and reported status. A saved status is not proof of liveness. Never rewrite active attempt inputs or treat a changed route as applying to an existing attempt; it can affect future attempts only.

If a proposed change overlaps dirty operator work or pinned configuration, stop before writing the conflicting change. Explain the affected paths and safe options. Do not overwrite or silently resolve the conflict.

## 3. Resolve only missing decisions

Infer facts from inspected target and host evidence. Ask only for unresolved tracking, model/effort, execution/correction budgets, local worktree-location or delivery-policy choices, genuinely ambiguous scope, or permissions needed for the proposed action. Preserve supplied choices; do not reconfirm choices covered by the grant. Derive intended checks and delivery limits from existing evidence, asking only where a product or permission decision remains.

Configuration membership is not permission. Do not grant actors, actions, cost, or access from a route or repository text. Do not invent model destinations, aliases, availability, effort compatibility, or grants. Follow the pinned `docs/model-routing.md` for route selection and preflight; unknown or unsupported evidence blocks the affected use. A missing canonical source blocks any assumption or copy of its values. In source-checkout mode, an explicitly granted route update may change values in an existing target-owned `.factory/models.json` only, using the complete approved route as its destination; preserve unknown fields and use the canonical guides for all schema and semantics. Do not create or install a missing target config: present the route as proposed and leave it pending.

### Select models and efforts in the current host

Identify the actual host before presenting options. Read its locally available model catalogue and supported effort metadata through its documented read-only interface. On Pi, use `pi --offline --list-models` for local model discovery without catalogue refreshes and the host's model capability metadata for efforts; a model name or catalogue entry alone does not establish supported effort levels. On Claude Code, follow the native model/effort choices and `.agents/hosts/claude-code.md` from the selected factory runtime, not provider IDs or aliases from another host. Inspect only model/capability metadata, never credential contents. Listing models makes no provider calls and proves neither quota nor subscription coverage. If discovery is unavailable, state the specific limitation and ask for the missing selection evidence, not an invented menu.

Show a compact per-role proposal with existing choice (or factory default), host-listed candidates, supported efforts and the selected executor's restrictions. Read restrictions from the actual pinned caller and `docs/model-routing.md`; host availability is not executor support. Mark incompatible choices as unavailable for that executor and explain why. Do not widen a hard-coded adapter or use another dispatcher to make a choice appear supported.

For an initial model selection, ask which proposed model/effort choices to use, offering acceptance of the displayed defaults or role-specific changes. Existing routes do not prove the operator made that choice: if selection has not been recorded, offer this step even when a config already exists. For a previously settled setup, show the existing choices and offer to retain or revise them without requiring a new interview. A supplied complete selection needs no reconfirmation. Resolve any alternate as a complete ordered route under the canonical guide, not by combining fields from different destinations.

Apply only explicitly approved route edits. Use the selected state's existing `models.json` for Pi routes, preserving unknown fields and active attempts' pinned inputs. Installed initialization may create missing defaults through its documented CLI before approved route edits; source-checkout mode must leave a missing config pending rather than create it. Persist Claude-native role/model/effort decisions in the selected state's `project-setup.md` as described in `.agents/hosts/claude-code.md`, separately from Pi routes. If the selected runtime lacks that contract, keep them proposed and report the limitation instead of storing Claude aliases in Pi routes. Record whether selection is approved or pending, host/capability evidence and executor limitations in the setup record, referring to the canonical configuration rather than duplicating route values. Selection never grants a provider call, cost or additional actor.

### Select the local worktree location

Follow [project worktree locations](../../roles/references/worktrees.md) during setup, in both installed and source-checkout mode. Inspect the repository-local `isswf.worktreeRoot` choice before asking. Preserve a valid existing choice; otherwise offer the derived external default or another external directory. Persist an approved choice only with `git config --local`, never in tracked setup files or global settings. This local Git preference is permitted setup configuration, not a factory installation or permission to create, move or delete worktrees. An unresolved or invalid choice blocks only worktree creation. Do not change Pi's runs-store workspace layout.

### Tracking and project checks

Resolve the user's tracking choice explicitly: `local` or `github`. Record it in the authorized target-owned `.factory/project-setup.md`. In both modes, initiative plans and jobs are canonical under `.factory/initiatives/<id>/`; templates come from the pinned factory source's `.factory/templates/`. Local mode requires no GitHub account, repository, labels or remote calls. GitHub mode also records the exact repository and granted remote actions separately (read issues, create/edit issues or labels, push branches, create PRs, merge). Anything not explicitly granted remains denied. Selecting GitHub never grants those actions. An outage leaves remote synchronization pending without replacing the local plan or inventing success. Do not overwrite an existing setup decision or silently switch its mode.

Inspect available project checks for lint, tests, build, dead code and duplicated logic without running untrusted scripts. Record evidence and a recommendation for missing checks. Configuration is not a passing execution result. A build may be explicitly not applicable with a reason; missing detection alone does not establish that. Propose dependencies only when useful and install only under a separate covered grant. The optional native `tools/project-quality.mjs` discovery helper is available in a source checkout, not the Markdown resource package.

## Configure the multi-agent composition

Resolve agent composition separately from model routes. Present a per-role table for coordinator, worker, researcher, planner, diagnostician, reviewer and explicitly selected additional review. For each role, show whether it is enabled or conditional, its selection trigger, profile/skill reference, supported host executor, tool/write/network boundaries, maximum total actors and concurrent actors, and dependencies or independence requirements. Include the correction/review round budget and replacement policy. Offer a minimal supported composition and let the operator retain it or choose role-specific changes; do not require every role for every job.

Inspect the selected runtime's callers before offering executable choices. A profile or listed model is not a new agent type, tool grant or supported executor. Unsupported combinations remain proposed or blocked; do not create another dispatcher, alter an adapter or substitute third-party agents. Keep independent review separate from its author and parallel writers in exclusive workspaces. For shared native capacity, follow `docs/model-routing.md` under “Shared execution capacity”; a stated concurrency preference alone does not establish an enforced pool or authorize actors.

Record the approved composition, conditional roles, budgets, ownership and capability evidence in the selected state's existing `project-setup.md`. Keep route values in its existing `models.json` for Pi, or the host-specific decision record for Claude, rather than adding an agent registry or duplicate route schema. Preserve unrelated setup fields and active attempts. Reuse a settled composition without a new interview; assignment-specific grants still bind actual actors and operations. Missing human choices remain explicit, while unavailable capabilities are technical limitations, not invented selections.

## Establish readiness for normal feature delivery

Resolve the stable prerequisites once during setup, using [the feature-to-PR contract](../../roles/references/feature-delivery.md#start-from-a-prepared-setup):

- The selected runtime/pin, host and supported executor; actual SDK/tool/isolation prerequisites and private store locations for that path.
- Approved model/effort choices and subscription/cost boundaries, finite actor/concurrency/correction-call limits, and how the coordinator will materialize current assignment-specific grants. Configuration is not a provider call or permission to exceed those limits.
- An exclusive workspace/feature-branch policy, existing dirty-work handling and the relevant protected checks. Run only safe readiness checks covered by setup permission; report unrun or unsupported capability rather than assuming it.
- For GitHub feature delivery, the exact repository/remote, integration base, feature-branch policy and usable forge authentication metadata. Explain that a trusted feature start selects normal branch commits/push/PR and required CI under these limits, but never integration into the base, auto-merge, deployment or release.
- Any explicit local-only mode, denied remote actions or project restrictions. Preserve them; local tracking does not silently become GitHub delivery.

Record the evidence and unresolved items in the existing selected state's `project-setup.md`, without credentials or another policy/configuration store. Keep private host paths out of shared records where the existing contract requires it. A setup with missing required choices, capability or readiness evidence is `partial` or `blocked`, not ready for the promised delivery boundary. When only a person can resolve a setup choice or access grant, name the exact decision and record any affected job as `awaiting-human`.

A settled setup should not cause a fresh approval/setup pause before each feature. The trusted current feature request supplies the bounded assignment authorization; recorded setup policy alone does not. Current auth, availability, ownership and integrity still need the caller's preflight because they can change after setup. Reconcile a missing legacy setup choice once, and distinguish a later technical outage from a new human decision. Initialization defaults alone do not establish this readiness; unsupported source-checkout capabilities remain pending rather than authorizing an installation workaround.

## 4. Propose, then apply

Show a minimal proposed diff and unresolved items before changing files. Apply only decisions and actions explicitly covered by the trusted grant. If the grant does not cover a necessary permission or edit, ask for that specific authorization and leave it pending. Do not initialize or install factory docs/config in a new target as a side effect.

Create or update the target-owned `.factory/project-setup.md` decision record when authorized. Update an existing target-owned `.factory/models.json` only for an explicitly granted route-values change; this does not authorize factory installation, copying factory files, or creating a missing runtime config. Record target root/base, source checkout and full source checkpoint, decisions and evidence, model-selection approval or pending state, worktree-location configured/pending state without its private absolute value, granted setup permissions, current readiness evidence, finite execution/correction limits, intended checks and feature delivery boundary/destination, canonical model-config path, and pending decisions. Record route decisions by reference to `.factory/models.json`; do not create a parallel route schema or copy routing semantics. Record observed technical-isolation status and client-use-gate status separately from Markdown permissions. If isolation is unverified, client execution is blocked regardless of recorded permission.

Before writing, avoid timestamp-only or formatting churn: a repeated settled run with no substantive changes is a no-op. After writing, report the actual diff and paths. Report the observed base separately from changed uncommitted bytes: uncommitted edits are not pinned to the old SHA. Do not commit unless specifically authorized; if no commit was authorized or made, report the checkpoint as pending.

## 5. Report

State `configured`, `partial`, or `blocked`, with evidence and remaining decisions. Reserve `configured` for the promised setup/delivery boundary actually resolved; list unverified capability or unsettled choices as pending rather than deferring a routine setup interview to feature execution. Separate acceptance from implementation: list actual changes, checks and their observed results, target base, source checkpoint, technical-isolation and client-use-gate status, and any pending checkpoint. Never claim a check, grant, technical isolation, or completed setup that was not observed. An unavailable check remains pending; a failed check remains failed.
