# Install and update isSWF

[Home](../../README.md) · [Español de España](../es/installation.md)

Install isSWF once, then initialise each repository where you want to use it. A global installation shares the factory's tools, not the projects' records.

## Before you start

You need:

- Git and a trusted executable release for your operating system and architecture. The factory core needs no Node.js or Bun installation; Pi, Claude, SDKs, and project checks retain their own prerequisites.
- An existing Git project.
- Pi or Claude Code already installed.
- A supported, authenticated model account before running agent jobs.
- Linux for the current complete installed workflow. Isolated Pi workers also need bubblewrap.

Engram and Codegraph are optional. The historical Python and SQLite prototypes are not required.

## Get a prepared release folder

The complete package currently uses local distribution. This guide does not announce an npm release or a public plugin marketplace.

Use a trusted release folder provided by the maintainer, or follow [build a local release](development.md#build-a-local-release). Cloning the repository alone does not prepare the complete installed package.

The package supplies `bin/isswf`, or `bin/isswf.exe` on Windows, plus the resources for both hosts. Source files are retained for provenance and task snapshots. Native Linux x64 is verified; the complete installed mutation and worker workflow still requires Linux. Other target builds do not establish equivalent platform support.

Replace `/path/to/isswf-release` in the commands below with that folder's absolute path.

## Install in Pi

For your own global installation:

```bash
pi install /path/to/isswf-release
```

Or, from the target repository, install only for that project:

```bash
pi install /path/to/isswf-release --local
```

Choose one scope. Review the project configuration before granting Pi's project trust. Restart Pi or reload its resources after installation.

## Install in Claude Code

Add the local marketplace and install the plugin for your user:

```bash
claude plugin marketplace add /path/to/isswf-release
claude plugin install isswf@isswf --scope user
```

For project scope, use this installation command instead:

```bash
claude plugin install isswf@isswf --scope project
```

Restart or reload Claude Code after installation. Project configuration does not install the plugin on every collaborator's machine.

The plugin uses Claude's own delegation. It does not provide the same execution and recovery features as Pi. See [current support](reference.md#current-support) before using it for important work. These commands are documented here; no Claude execution was used to verify this documentation change.

## Initialise a project

Open the target repository and invoke the setup skill:

| Host | Command |
| --- | --- |
| Pi | `/skill:isswf-setup` |
| Claude Code | `/isswf:isswf-setup` |

Ask to set up this project. Setup detects the repository root, existing configuration and selected runtime before asking questions. It identifies initial setup, existing setup, an available update or an interrupted operation; you do not need to supply paths or commit hashes that it can resolve locally. Migration and recovery still require an explicit request. On an explicit setup request, it also creates or reconciles a small marked isSWF coordinator section in the target root `AGENTS.md`, preserving unrelated content. The section routes explicit coordinator/coordinador or isSWF workflow requests to the canonical coordinator and the actual host guide; it does not turn unrelated tasks into a mandatory pipeline or grant actions. It uses the single selected project setup record as the decision reference. Conflicting or unsafe existing content is reported for manual resolution instead of overwritten. Pi and Claude Code share this `AGENTS.md` entry; no separate `CLAUDE.md` bridge is needed.

Choose local tracking or GitHub tracking if no choice is recorded. Setup also shows the current host's model and supported effort options by role, alongside existing choices or factory defaults. Choose the proposed settings or request role-specific changes. Host-listed models may be unsupported by a particular isSWF executor; setup explains that restriction instead of silently substituting. Pi choices use the project's model configuration; Claude-native choices are recorded separately in the setup record. If discovery or persistence is unavailable in the selected runtime, model selection remains explicitly pending. Model selection does not call a provider or grant costs. GitHub tracking does not grant permission to publish, push, or merge.

Setup resolves the stable execution/correction limits, supported runtime/isolation, checks and feature delivery policy before normal feature work. For GitHub delivery it records the repository/remote, integration base and feature-branch policy. A later trusted feature start selects the covered commit/push/PR/CI path, not merge or release; the setup record alone grants none of those actions. Missing required choices or capability evidence leave setup partial. Initialization defaults are not proof of readiness, and later preflight still checks conditions that can change. Existing settled choices are reused without another setup interview per feature.

Setup also offers an external directory for Git worktrees when no local choice exists. Accept the proposed per-repository location under your local data directory or choose another external directory. The choice uses repository-local Git configuration (`isswf.worktreeRoot`), so your personal path is not committed or shared with GitHub. Existing choices are preserved. Coordinators use that location for future authorized worktrees; existing checkouts are not moved automatically. Native Pi task snapshots keep their runs-store layout. This is an agent procedure, not an automatic host hook. During Claude Code setup, record whether its native child interface is verified to bind parallel workers to the approved prepared checkout; an external-root choice or host-managed worktree alone does not prove it. If unavailable or unverified, sequential work can use the assigned checkout, but an explicitly parallel assignment is blocked rather than silently serialized. Do not install/configure hooks or change the approved root to claim support.

Setup creates `.isswf/` and records the project's selected factory version. New Bun pins identify the shared source and engine version, while each machine retains and verifies its own platform artifact. The pin does not embed a native binary hash that collaborators must change for another platform. It preserves existing model settings and setup decisions unless you explicitly approve changes. Authentication and execution permissions still need to be valid for the work you later request.

If the repository already uses `.factory/`, ask to inspect and migrate that existing state. Do not create a second factory directory beside it.

## Update without changing every repository

First update the package or plugin using your host's manager. For local releases, replace the old registration with the new prepared release folder. A fixed version stays fixed until you select another one.

Then ask setup:

> Check what would change if I updated this project. Do not apply it yet.

Updating the installed package does not update every project's records. Each project keeps its selected version until you explicitly migrate it.

Before migrating, save the affected files in Git and finish or reconcile running work. The migration checks the proposed change, keeps the previous version, and records how to recover. Do not delete retained versions or interrupted-operation records to force an update.

For exact commands, rollback, and recovery, use the [technical installation guide](../installation.md).

## Remove the integration

Use `pi remove` or Claude Code's plugin manager. Removing the integration does not remove your project's `.isswf/`, migration records, or retained factory versions.

Continue with [your first request](getting-started.md).
