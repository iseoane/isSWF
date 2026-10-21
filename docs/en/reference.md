# How the factory works

[Home](../../README.md) · [Español de España](../es/reference.md)

isSWF combines instructions for agents with tools that record, run, and inspect authorised work. A Markdown profile alone does not create a running agent.

## Skills you use

| Skill | Purpose |
| --- | --- |
| `isswf-setup` | Prepare a project or inspect a proposed installation update. |
| `isswf-coordinator` | Clarify an assignment, choose the next step, coordinate authorised work, and explain the result. |

In Pi, invoke them with `/skill:`. In Claude Code, use `/isswf:`. There is also a source-only `isswf-triage` skill for the historical intake prototypes; it is not a normal entry point in the complete installed package.

## People and agents

You decide the product goal and what is permitted. The coordinator owns the plan and selects help when useful:

| Role | What it contributes |
| --- | --- |
| Worker | Implements a bounded change and checks it. |
| Researcher | Investigates a technical question and returns evidence. |
| Planner | Proposes useful units of work and their dependencies. |
| Diagnostician | Investigates a defect whose cause is unclear. |
| Reviewer | Assesses the chosen change and its evidence independently when that judgment is required. |

These are responsibilities, not a compulsory sequence or a promise that every host can launch every role. Clear work can take a short path. More uncertainty may require questions or investigation first.

## What stays with a project

New installations keep shared project records under `.isswf/`. They describe plans, jobs, decisions, and selected factory version. Private local records are kept separately from files intended for Git.

Older projects may still use `.factory/`. Migration is explicit and preserves existing records; do not keep both as active state directories.

Engram can help recover useful context, but it is not the job database or a source of permissions. Codegraph can help locate code. Neither is required when the repository itself provides enough information.

## Versions and updates

The Pi package, core, and plugin share a release version. Installing a newer package does not silently switch every project to it.

A project keeps the exact version selected for its work. Internal hashes identify that code; reinstalling the same prepared release does not create a different code revision. New work uses a new version only after the relevant project update. Previous jobs retain their original references.

See [installation and updates](installation.md) for the user flow and the [technical guide](../installation.md) for exact recovery commands.

## Current support

Pi is the reference execution host. Its isolated workers require the documented Linux tools, supported model access, and explicit authority for the job.

The Claude Code plugin provides its own entry points and native delegation. This does not establish feature parity with Pi. The new installation flow does not claim fresh live validation in Claude.

The newer complete-package installation and migration work is being prepared for release. The repository's version number is not evidence of an npm publication or public marketplace availability.

The following limits remain important:

- The panel shows recorded work, not live verification of every process or GitHub change.
- Parallel work needs separate writers and available authorised capacity; this is not a machine-wide scheduler.
- Interrupted work must be inspected before retrying. Automatic resumption after every crash or restart is not promised.
- Model choices and call limits are explicit. An unavailable model does not permit an improvised substitute or extra spend.
- A checked change is not automatically accepted, published, or merged.
- Client projects and sensitive data require their own access and isolation checks.

## Does data leave my machine?

Project files and the local panel are on your machine, but your coding assistant may send instructions and source content to its model provider. Authorised GitHub operations use the configured account. Optional integrations have their own data boundaries.

Keep credentials out of briefs, notes, and shared evidence. A local panel is not a secure public hosting service.

## Where are the technical contracts?

Start with [inspect work](operations.md) for everyday commands. The detailed English agent resources below are implementation contracts; read them only when needed:

- [Installation, migration, and recovery](../installation.md).
- [Job execution and interruption](../local-worker-lifecycle.md).
- [Model choices and budgets](../model-routing.md).
- [Plans, records, and evidence retention](../durable-work.md).
- [Review selection](../../.agents/roles/references/review.md).
