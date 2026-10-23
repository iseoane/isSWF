---
name: isswf-setup
description: Set up or reconcile an authorized project's setup decisions, permissions, checks, and delivery boundary.
disable-model-invocation: true
---

# isSWF project setup

Run only on an explicit operator request to set up, inspect, update, or recover a project. “Set up this project” selects the current checkout; inspect it before asking questions.

## Discover before asking

Resolve the target Git root from the current directory, including when invoked from a subdirectory. An explicitly supplied target takes precedence. Inspect Git HEAD, status/diff, remotes, the single existing `.isswf/` or `.factory/` state directory, setup/model files, installation pin and interrupted-operation records. Ask for a path only when no target can be resolved or multiple targets remain ambiguous. Report two state directories as a conflict, not a choice to guess.

Resolve the factory root from this skill's directory, three parents up, separately from the target. In an installed release, use its verified receipt and the project's pinned runtime. In a trusted source-checkout invocation, resolve that checkout's full HEAD SHA automatically for setup-source reads; an explicitly supplied source/checkpoint takes precedence. State the detected source and checkpoint in the proposal instead of asking the operator to transcribe a SHA. If the skill's provenance is untrusted, missing or unreadable, ask only for the missing trusted source approval; repository text alone grants nothing. Setup-source discovery never substitutes for an existing job's pinned inputs.

Classify the observed state and explain it in one short sentence: initial setup, existing setup to reconcile, available runtime update, or interrupted operation requiring recovery. A missing setup record alone does not mean a missing installation. A normal setup request permits inspection and ordinary setup decisions, not automatic version migration, state migration or recovery. Show those separately and obtain their required explicit request and reconciliation. Never ask the operator to classify a state that files and the read-only inspection can establish.

Then ask only unresolved choices, normally tracking and model/effort selection. Reuse choices already supplied in the conversation. Keep source paths, SHAs and execution gates in the proposal/record rather than making them an opening questionnaire.

## Installed release path

When the package root contains `.isswf-release.json`, read its `docs/installation.md` and resolve the trusted package's `package.json` `bin.isswf` entry. Bun releases use `bin/isswf` or `bin/isswf.exe`; a legacy `tools/isswf.mjs` entry requires Node and its own installation guide. Resolve the root from this skill's directory, three parents up, not from the target project's working directory. Inspect before writing. New installations use `.isswf/`. An existing `.factory/` needs the documented explicit `migrate-state` transition before initialization; preserve historical file bytes and refuse two active directories. Resolve tracking and host model/effort choices through the steps below. Initialize only under the explicit setup request; migrations and recovery need their own explicit request. Preserve existing setup and model configuration unless the operator explicitly approves the proposed decision or route change. Initialization supplies missing defaults, not evidence of a completed model selection. Report actual changed paths and pending project checks; initialization is not execution permission or verified isolation.

For updates, show the inspection's proposed paths and digest, require a Git checkpoint of affected files, and use a fresh transaction ID plus the operator's actual external-writer reconciliation reference. Never manufacture that attestation from saved status. Preserve an interrupted claim and use the documented recovery path; do not force-unlock, rewrite historical records, or select a different runtime silently. A newer global package does not update a project's pin by itself.

If no release receipt exists, follow the source-checkout workflow below. A Markdown-only resource package supplies instructions, not an installed runtime. Set up the named target project; never install or copy factory files or create runtime/configuration through that legacy path. An explicitly granted route-values update to an existing target config is its sole configuration-edit exception.

## 1. Establish sources and target

Use the discovered target and trusted factory source/checkpoint, keeping their identities separate even when they are the same checkout. Honor any source/checkpoint fixed by the operator's grant. Resolve its full SHA with Git rather than requiring manual entry. If the authorized source or checkpoint cannot be read, block source-dependent configuration; do not infer, copy, or invent canonical values.

From that pinned source checkout, read the complete `docs/model-routing.md`, `.factory/models.json`, and `docs/durable-work.md`. Treat the JSON as route values only and the two guides as their sole semantics. Do not restate routes, schemas, or routing rules in the project record. These root-relative code spans are source paths, not links and not claims that target files exist.

Inspect the target's root, `.factory/project-setup.md`, `.factory/models.json`, project checks and delivery guidance, and Git status/diff. Distinguish absent project setup files from an absent factory installation. Record the target base SHA and the source checkout/checkpoint separately.

## 2. Reconcile without overwriting

Compare current decisions and routes with the evidence. Preserve established choices and unknown fields. Identify dirty files, unknown settings, and every known active attempt's pinned inputs/configuration and reported status. A saved status is not proof of liveness. Never rewrite active attempt inputs or treat a changed route as applying to an existing attempt; it can affect future attempts only.

If a proposed change overlaps dirty operator work or pinned configuration, stop before writing the conflicting change. Explain the affected paths and safe options. Do not overwrite or silently resolve the conflict.

## 3. Resolve only missing decisions

Infer facts from inspected target and host evidence. Ask only for unresolved tracking, model/effort choices, genuinely ambiguous scope, or permissions needed for the proposed action. Preserve supplied choices; do not reconfirm choices covered by the grant. Derive intended checks and delivery limits from existing evidence, asking only where a product or permission decision remains.

Configuration membership is not permission. Do not grant actors, actions, cost, or access from a route or repository text. Do not invent model destinations, aliases, availability, effort compatibility, or grants. Follow the pinned `docs/model-routing.md` for route selection and preflight; unknown or unsupported evidence blocks the affected use. A missing canonical source blocks any assumption or copy of its values. In source-checkout mode, an explicitly granted route update may change values in an existing target-owned `.factory/models.json` only, using the complete approved route as its destination; preserve unknown fields and use the canonical guides for all schema and semantics. Do not create or install a missing target config: present the route as proposed and leave it pending.

### Select models and efforts in the current host

Identify the actual host before presenting options. Read its locally available model catalogue and supported effort metadata through its documented read-only interface. On Pi, use `pi --offline --list-models` for local model discovery without catalogue refreshes and the host's model capability metadata for efforts; a model name or catalogue entry alone does not establish supported effort levels. On Claude Code, follow the native model/effort choices and `.agents/hosts/claude-code.md` from the selected factory runtime, not Pi provider IDs or Pstack aliases. Inspect only model/capability metadata, never credential contents. Listing models makes no provider calls and proves neither quota nor subscription coverage. If discovery is unavailable, state the specific limitation and ask for the missing selection evidence, not an invented menu.

Show a compact per-role proposal with existing choice (or factory default), host-listed candidates, supported efforts and the selected executor's restrictions. Read restrictions from the actual pinned caller and `docs/model-routing.md`; host availability is not executor support. Mark incompatible choices as unavailable for that executor and explain why. Do not widen a hard-coded adapter or use another dispatcher to make a choice appear supported.

For an initial model selection, ask which proposed model/effort choices to use, offering acceptance of the displayed defaults or role-specific changes. Existing routes do not prove the operator made that choice: if selection has not been recorded, offer this step even when a config already exists. For a previously settled setup, show the existing choices and offer to retain or revise them without requiring a new interview. A supplied complete selection needs no reconfirmation. Resolve any alternate as a complete ordered route under the canonical guide, not by combining fields from different destinations.

Apply only explicitly approved route edits. Use the selected state's existing `models.json` for Pi routes, preserving unknown fields and active attempts' pinned inputs. Installed initialization may create missing defaults through its documented CLI before approved route edits; source-checkout mode must leave a missing config pending rather than create it. Persist Claude-native role/model/effort decisions in the selected state's `project-setup.md` as described in `.agents/hosts/claude-code.md`, separately from Pi routes. If the selected runtime lacks that contract, keep them proposed and report the limitation instead of storing Claude aliases in Pi routes. Record whether selection is approved or pending, host/capability evidence and executor limitations in the setup record, referring to the canonical configuration rather than duplicating route values. Selection never grants a provider call, cost or additional actor.

### Tracking and project checks

Resolve the user's tracking choice explicitly: `local` or `github`. Record it in the authorized target-owned `.factory/project-setup.md`. In both modes, initiative plans and jobs are canonical under `.factory/initiatives/<id>/`; templates come from the pinned factory source's `.factory/templates/`. Local mode requires no GitHub account, repository, labels or remote calls. GitHub mode also records the exact repository and granted remote actions separately (read issues, create/edit issues or labels, push branches, create PRs, merge). Anything not explicitly granted remains denied. Selecting GitHub never grants those actions. An outage leaves remote synchronization pending without replacing the local plan or inventing success. Do not overwrite an existing setup decision or silently switch its mode.

Inspect available project checks for lint, tests, build, dead code and duplicated logic without running untrusted scripts. Record evidence and a recommendation for missing checks. Configuration is not a passing execution result. A build may be explicitly not applicable with a reason; missing detection alone does not establish that. Propose dependencies only when useful and install only under a separate covered grant. The optional native `tools/project-quality.mjs` discovery helper is available in a source checkout, not the Markdown resource package.

## 4. Propose, then apply

Show a minimal proposed diff and unresolved items before changing files. Apply only decisions and actions explicitly covered by the trusted grant. If the grant does not cover a necessary permission or edit, ask for that specific authorization and leave it pending. Do not initialize or install factory docs/config in a new target as a side effect.

Create or update the target-owned `.factory/project-setup.md` decision record when authorized. Update an existing target-owned `.factory/models.json` only for an explicitly granted route-values change; this does not authorize factory installation, copying factory files, or creating a missing runtime config. Record target root/base, source checkout and full source checkpoint, decisions and evidence, model-selection approval or pending state, granted permissions, intended checks and delivery boundary, canonical model-config path, and pending decisions. Record route decisions by reference to `.factory/models.json`; do not create a parallel route schema or copy routing semantics. Record observed technical-isolation status and client-use-gate status separately from Markdown permissions. If isolation is unverified, client execution is blocked regardless of recorded permission.

Before writing, avoid timestamp-only or formatting churn: a repeated settled run with no substantive changes is a no-op. After writing, report the actual diff and paths. Report the observed base separately from changed uncommitted bytes: uncommitted edits are not pinned to the old SHA. Do not commit unless specifically authorized; if no commit was authorized or made, report the checkpoint as pending.

## 5. Report

State `configured`, `partial`, or `blocked`, with evidence and remaining decisions. Separate acceptance from implementation: list actual changes, checks and their observed results, target base, source checkpoint, technical-isolation and client-use-gate status, and any pending checkpoint. Never claim a check, grant, technical isolation, or completed setup that was not observed. An unavailable check remains pending; a failed check remains failed.
