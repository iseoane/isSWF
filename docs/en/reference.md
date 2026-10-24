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
| `isswf-security` | Model threats, assess a bounded security surface or implement explicitly authorized hardening. |
| `isswf-performance` | Diagnose measured slowness, evaluate a performance budget or optimize a demonstrated bottleneck. |
| `isswf-observability` | Design, assess or implement focused logs, metrics, traces and alerts with privacy and cost limits. |

In Pi, invoke them with `/skill:`. In Claude Code, use `/isswf:`. There is also a source-only `isswf-triage` skill for the historical intake prototypes; it is not a normal entry point in the complete installed package.

The writing skill determines the audience from the request and document context. It asks you when the audience is unclear and follows the target project’s language and documentation conventions. Use `/skill:isswf-writing` in Pi or `/isswf:isswf-writing` in Claude Code. It does not require project activation.

The understanding skill selects reformulation, explanation, or practical learning from your request. It adapts to your demonstrated knowledge and asks only when an ambiguity would change the response. Use `/skill:isswf-understanding` in Pi or `/isswf:isswf-understanding` in Claude Code. It works across subjects and projects without creating courses or progress records by default.

The PR skill works directly or through Delivery. It inspects the candidate, explains scope and verification limits, and assesses risk even for documentation-only changes. Delivery supplies its identities and evidence and reuses the same assessment. Use `/skill:isswf-pr` in Pi or `/isswf:isswf-pr` in Claude Code. Drafting does not authorize publication or merge.

The issue skill distinguishes independent findings from errors in the current implementation. It routes a sanitized report to the project or factory repository, checks duplicates, and requires the existing `needs-triage` label before creation. Missing destination access, publication permission, or label support leaves a draft or explicit blocker. Use `/skill:isswf-issue` in Pi or `/isswf:isswf-issue` in Claude Code. Creating a report does not authorize implementation.

The E2E skill inspects the target's existing harness and selects a small set of useful user journeys. It supports browser, CLI, terminal and API paths; Playwright is optional, not a dependency for every project. It creates runnable tests, fixtures, a journey map and local/CI commands rather than relying on an agent to perform the checks manually. Use `/skill:isswf-e2e` in Pi or `/isswf:isswf-e2e` in Claude Code. Dependency installation, real accounts, provider calls and publication still require their own permission. Unrun tests are draft coverage, not a verified suite.

The debug, review, retrospective and TDD skills expose existing procedures without making them compulsory stages. The coordinator and applicable role profiles select them conditionally. Use `/skill:isswf-debug`, `/skill:isswf-review`, `/skill:isswf-retrospective` or `/skill:isswf-tdd` in Pi; Claude Code exposes the same names under `/isswf:`. Independent review still requires a separate authorized context. Retrospectives preserve active jobs and produce drafts, not policy changes or execution grants.

Code review starts from the accepted behavior and relevant tests before tracing the implementation and affected consumers. It examines the resulting structure, prioritises evidence-backed findings by impact, and checks dependency changes at their installation boundary. A targeted fault-injection experiment is optional and requires an authorized disposable copy; it never modifies the reviewed candidate or gives a text-only reviewer tools. A coverage gap is distinct from a defect in the unchanged candidate.

Installed workers receive the pinned debug and TDD skills as read-only methodology alongside E2E when the release supplies them. Native diagnostic and review callers include their selected skill from the same methodology checkpoint as their role; historical pins keep their original resources. Text-only callers do not gain tools, global skills or parent integrations. These resources do not add a retrospective dispatcher or change host isolation guarantees.

Security, performance and observability are optional specialised workflows, not extra stages for every job. Use `/skill:isswf-security`, `/skill:isswf-performance` or `/skill:isswf-observability` in Pi, or the same names under `/isswf:` in Claude Code. Security starts with assets, trust boundaries and plausible abuse; it does not authorize exploitation or certify compliance. Performance requires a correctness-checked baseline and comparable measurements before a speedup claim. Observability starts from operational questions and bounds sensitive fields, metric cardinality, export and retention. It does not turn telemetry into proof of current process state.

The applicable coordinator and role profiles select these resources conditionally. New installed workers receive them as pinned read-only methodology; text-only diagnostic/review callers receive selected resources from the same checkpoint as their role, and planners receive the selected design reference. Historical checkpoints retain their original resources. A supplied skill does not add tools, production access or provider permission.

The shared design reference also covers domain language, useful interfaces, resulting complexity and significant decision records. It preserves each target's glossary and existing decision mechanism; it does not require a new architecture skill, an ADR for every choice or renamed persisted fields.

Skills expose independently requested tasks with an observable outcome. Role references supply conditional guidance inside those tasks, such as design principles, test quality and permissions. They remain references rather than becoming mandatory standalone workflows. If a guide later gains its own entry point, keep the detailed rules in one canonical resource instead of copying them into a second skill.

## Default feature delivery

In a prepared project, a trusted request to start or implement a feature selects the coordinator-led path through implementation, checks, required review and corrections, feature-branch commit/push, PR creation or update, required exact-head CI and PR delivery. You do not need to authorize those same covered steps again at every phase. The current request supplies the bounded authority; setup policy, an issue label or a passing test alone does not. Prepare-only, read-only, local-only and explicit project restrictions override this default. Other assignment types use it only when selected.

Setup resolves stable runtime/model, execution-budget, workspace, check and delivery choices before normal work. Later availability and integrity checks still apply. A human-only definition or setup decision becomes `awaiting-human` with a concrete question; a technical wait is recorded as a technical blocker rather than generic approval. The delivered verified PR also becomes `awaiting-human` for integration into `main` or the selected base. No merge, auto-merge, direct integration-branch push, deployment or release is included.

The coordinator owns this continuity through existing tools; returning from a prepare-only helper is not a reason to wait for another prompt. This is not a new background service, automatic scheduler or promise of recovery while the session is closed. See [your first request](getting-started.md) and the [agent workflow contract](../../.agents/roles/references/feature-delivery.md).

## People and agents

You decide the product goal and what is permitted. The coordinator owns the plan and selects help when useful:

| Role | What it contributes |
| --- | --- |
| Worker | Implements a bounded change and checks it. |
| Researcher | Investigates a technical question and returns evidence. |
| Planner | Proposes useful units of work and their dependencies. |
| Diagnostician | Investigates a defect whose cause is unclear. |
| Reviewer | Assesses the chosen change and its evidence independently when that judgment is required. |

Setup configures the agent composition as well as models and effort. It records enabled or conditional roles, selection triggers, supported executors and tool boundaries, total and concurrent actor limits, correction/review budgets and independence requirements in the existing project setup record. Unsupported combinations remain pending rather than silently using another dispatcher. A settled composition is reused; each assignment still needs its concrete authorization.

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
