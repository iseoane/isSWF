# Inspect work without starting agents

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/operations.md)

Use the coordinator to understand the next step. The commands below inspect recorded work or open its local panel; they do not call a model. Replace example paths and initiative IDs with existing values. They do not initialise a repository or create a plan.

## Normal host-native work

New ordinary tasks use the host's delegation with shared isSWF roles: Pi with the separately installed `pi-subagents` extension, or Claude Code with native agents. See [host support](../host-portability.md) for the configuration example and boundaries. Configure model and effort in the selected host, not in the legacy executor's route file. A missing extension requires an installation decision, not a new supervisor.

The coordinator supplies scope, working directory, budget and checks, then verifies the actual change. No compiled factory executable, project runtime pin, external grant file or capacity store is required for this path. Windows and Linux are both targets; report actual host/platform evidence separately. Do not reinterpret existing interrupted runtime jobs as new tasks to bypass claims. The inspection commands below remain available for recorded legacy work.

## From a source checkout

Run from the isSWF repository root:

```bash
node tools/isswf-status.mjs --project /absolute/project --initiative I0001
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

The first command reads an initiative's plan and supporting records. The second starts a foreground server on `127.0.0.1` and prints its URL. Stop it with Ctrl-C. It lists initiatives and lets you inspect their jobs, evidence, and recorded decisions.

The panel can record local notes when the displayed evidence still matches. A note is not automatically applied, authenticated operator acceptance, or permission to dispatch work. Do not expose the panel publicly or put secrets in its records.

## From a prepared installation

`RELEASE` below means the absolute directory of an already prepared, trusted package. It is not a download address. No public release is assumed.

Use `bin/isswf.exe` on Windows. For a retained legacy Node release, follow that release's installation guide and Node prerequisite. These commands do not establish native mutation or isolation support outside Linux.

```bash
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

`inspect` shows installation and migration information without changing the project or store. `locate` verifies and locates the selected retained runtime. `exec` uses that project's pinned runtime, not automatically the newest globally installed package. Missing or damaged retained code blocks the operation.

## Understand the result

`awaiting-human` means a specific decision is needed, whether during definition, setup, acceptance or PR integration. The record should name the question and what answer allows work to resume; a definition question does not need a delivery first. `blocked` describes a technical condition needing resolution, not automatically a request for your approval. Notes in the panel do not apply either decision; the coordinator reconciles your actual instruction.

A plan status describes recorded work, not a heartbeat or a fresh GitHub query. Missing or inconsistent evidence remains unknown. A completed worker does not prove independent review, operator acceptance, publication, or merge.

Before retrying interrupted work, inspect the actual process identity and partial files. Do not free claims, change stores, or invent a new job ID to bypass an unresolved writer. Execution callers require their own exact inputs, model and budget checks, and current permission. The status command and this guide grant none of them.

For installation and recovery, read [installation](installation.md). The coordinator's detailed English execution resources remain [worker lifecycle](../local-worker-lifecycle.md), [model routing](../model-routing.md), [durable records](../durable-work.md), [dependency admission](../worker-admission.md), and [original review evidence](../review-original-evidence.md). These are implementation contracts, not a getting-started checklist or permission to reproduce old runs.
