# How the factory works

[Home](../../README.md) · [Español de España](../es/reference.md)

isSWF combines instructions for agents with tools that record, run, and inspect authorised work. A Markdown profile alone does not create a running agent.

## Skills you use

| Skill | Purpose |
| --- | --- |
| `isswf-setup` | Prepare a project or inspect a proposed installation update. |
| `isswf-coordinator` | Clarify an assignment, choose the next step, coordinate authorised work, and explain the result. |
| `isswf-writing` | Create, revise, or review documents with the right approach for humans or agents, in any project. |
| `isswf-understanding` | Understand a topic or system, clarify an explanation, or learn through practice and feedback. |
| `isswf-pr` | Prepare PR descriptions and authorized updates with evidence and a mandatory risk assessment. |
| `isswf-issue` | Report independent bugs or propose features and improvements, with verified routing and mandatory `needs-triage`. |
| `isswf-e2e` | Create, run or maintain executable tests of critical user journeys, with Playwright or another driver suitable for the real interface. |
| `isswf-debug` | Reproduce defects, investigate causes and return a causal diagnosis or explicit uncertainty. |
| `isswf-review` | Review an exact candidate against Standards and Spec with proportionate evidence. |
| `isswf-retrospective` | Learn from completed features or bugs, or an explicit session close, through local improvement drafts. |
| `isswf-tdd` | Use an observed red-green-refactor loop for explicitly requested TDD or a selected useful regression seam. |

In Pi, invoke them with `/skill:`. In Claude Code, use `/isswf:`. There is also a source-only `isswf-triage` skill for the historical intake prototypes; it is not a normal entry point in the complete installed package.

The writing skill determines the audience from the request and document context. It asks you when the audience is unclear and follows the target project’s language and documentation conventions. Use `/skill:isswf-writing` in Pi or `/isswf:isswf-writing` in Claude Code. It does not require project activation.

The understanding skill selects reformulation, explanation, or practical learning from your request. It adapts to your demonstrated knowledge and asks only when an ambiguity would change the response. Use `/skill:isswf-understanding` in Pi or `/isswf:isswf-understanding` in Claude Code. It works across subjects and projects without creating courses or progress records by default.

The PR skill works directly or through Delivery. It inspects the candidate, explains scope and verification limits, and assesses risk even for documentation-only changes. Delivery supplies its identities and evidence and reuses the same assessment. Use `/skill:isswf-pr` in Pi or `/isswf:isswf-pr` in Claude Code. Drafting does not authorize publication or merge.

The issue skill distinguishes independent findings from errors in the current implementation. It routes a sanitized report to the project or factory repository, checks duplicates, and requires the existing `needs-triage` label before creation. Missing destination access, publication permission, or label support leaves a draft or explicit blocker. Use `/skill:isswf-issue` in Pi or `/isswf:isswf-issue` in Claude Code. Creating a report does not authorize implementation.

The E2E skill inspects the target's existing harness and selects a small set of useful user journeys. It supports browser, CLI, terminal and API paths; Playwright is optional, not a dependency for every project. It creates runnable tests, fixtures, a journey map and local/CI commands rather than relying on an agent to perform the checks manually. Use `/skill:isswf-e2e` in Pi or `/isswf:isswf-e2e` in Claude Code. Dependency installation, real accounts, provider calls and publication still require their own permission. Unrun tests are draft coverage, not a verified suite.

The debug, review, retrospective and TDD skills expose existing procedures without making them compulsory stages. The coordinator and applicable role profiles select them conditionally. Use `/skill:isswf-debug`, `/skill:isswf-review`, `/skill:isswf-retrospective` or `/skill:isswf-tdd` in Pi; Claude Code exposes the same names under `/isswf:`. Independent review still requires a separate authorized context. Retrospectives preserve active jobs and produce drafts, not policy changes or execution grants.

Installed workers receive the pinned debug and TDD skills as read-only methodology alongside E2E when the release supplies them. Native diagnostic and review callers include their selected skill from the same methodology checkpoint as their role; historical pins keep their original resources. Text-only callers do not gain tools, global skills or parent integrations. These resources do not add a retrospective dispatcher or change host isolation guarantees.

Skills expose independently requested tasks with an observable outcome. Role references supply conditional guidance inside those tasks, such as design principles, test quality and permissions. They remain references rather than becoming mandatory standalone workflows. If a guide later gains its own entry point, keep the detailed rules in one canonical resource instead of copying them into a second skill.

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
