# How the factory works

[Home](../../README.md) · [Español de España](../es/reference.md)

isSWF combines instructions for agents with tools that record, run, and inspect authorised work. A Markdown profile alone does not create a running agent.

## How work is decided and who decides it

You decide the goal, what the factory may do and whether to accept the result. The coordinator decides the path: it reads your request, checks the code and the project records, and picks the smallest route that fits. It can start the work, investigate first, interview you, or diagnose a bug whose cause is unknown. Only a decision that belongs to you stops the work, and then it is recorded as `awaiting-human` with the exact question.

| Decision | Who takes it |
| --- | --- |
| The goal, what is allowed, and accepting the result | You |
| The path, the plan and each job's brief | The coordinator |
| Doing the work and checking it | A worker |
| An independent judgment, when the risk calls for one | A reviewer, in a separate context |
| Integrating the finished pull request (PR) into the base branch | You |

The interactive flowchart shows the same decisions step by step, with the questions each step asks itself: [English](https://iseoane.github.io/isSWF/docs/en/workflow.html) or [Español](https://iseoane.github.io/isSWF/docs/es/workflow.html). To read it offline, open [the English page](workflow.html) or [the Spanish page](../es/workflow.html); the [overview image](workflow.svg) shows the same flow in one picture. The flowchart is a navigation aid, not the authority for current behavior: the guides it cites are. The site is published manually, and the [documentation index](index.md#published-site) says how.

## Splitting work into jobs by size

The coordinator splits an assignment into jobs, small slices that each deliver something you can verify. Each job gets a size, S, M or L, chosen by how costly it is to verify. Four questions decide it:

1. How many distinct user-visible flows or screens must the reviewer check?
2. Does the change carry concurrency, timing or security risk?
3. Can an independent reviewer read the whole change in one pass?
4. Would the worker have to improvise design decisions?

| Size | Meaning | What happens |
| --- | --- | --- |
| S | One flow, no special risk, one review pass. | Dispatched as it is. |
| M | Two or three related flows, or one well-bounded special risk. | Dispatched as it is. |
| L | Anything else. | Split into independently useful parts, or the plan records why it cannot be split. |

No line count or other number decides the size, and when in doubt the smaller size is chosen. Sizing is part of the plan text and adds no approval step. See [planning guidance](../../.agents/roles/references/planning.md#size-units-by-verification-cost).

## Which tests run and when

Checks are chosen by the risk of the change, not run in bulk. In this repository the rule has three levels, and the project's own setup records its checks:

| When | What runs |
| --- | --- |
| For each job | The focused tests of the changed behavior and the documentation check, plus the job-tier verification. |
| At the close of an initiative | The full quality check, once, at the closing commit. Earlier only when the change touches packaging. |
| On every PR | The full check in continuous integration (CI), which must pass on the exact head before an authorized merge. |

A local run that skips the full check says so in its report. See [quality checks](development.md#quality-checks) and the [verification runner](operations.md#verification-runner).

## Three kinds of review

The coordinator picks the least costly kind of verification that covers the acceptance criteria and the risk. [Review selection](../../.agents/roles/references/review.md#choose-sufficient-verification) defines each kind, and the [glossary](../../GLOSSARY.md) names them.

| Kind | What it checks | Typical use |
| --- | --- | --- |
| Mechanical (also called deterministic) | A fixed procedure gives the same result every time: bytes, hashes, links, references and tool output. | Moved files, generated indexes, link replacements. Tools and guards also run this kind. |
| Empirical | Tests or user journeys, run on the exact candidate, observe each acceptance criterion. Each relevant test must also have failed once under a deliberate fault. | Behavior that can be executed. |
| Semantic | A reviewer reads the change and its consumers and judges it. | Product decisions, permissions, shared contracts, methodology text, claims that running cannot establish. |

A change can combine them. A mechanical or empirical result can close a covered change without a model call, unless the risk or an explicit rule requires an independent reviewer. The author's own checks never count as independent.

Hooks and guards make some rules deterministic as well. The plugin's checks refuse, before it runs, a commit on the wrong branch, a record written outside the worker's checkout, a delegation that fails its conditions, or a shell command that waits on CI in a loop. See the [dispatch guard](operations.md#dispatch-guard), [shell command guard](operations.md#shell-command-guard), [branch guard](operations.md#branch-guard), [record location guard](operations.md#record-location-guard), [plan commit guard](operations.md#plan-commit-guard) and [records push guard](operations.md#records-push-guard). They are process rules, not permissions.

## Parallel work in worktrees

Independent jobs can run at the same time, each in its own Git worktree (a second checkout of the same repository) and on its own branch. A job that depends on another waits for it. Setup offers a folder for the worktrees, by default next to the repository as `../<repo>-worktrees/<feature>`, kept in your local Git configuration as `isswf.worktreeRoot`.

How many workers run at once is a limit local to your clone: `git config --local isswf.maxParallelWorkers`, which is 2 when absent or invalid. Setup asks for it. In the default `observe` mode a dispatch over the limit is allowed with a note; `isswf.parallelWorkersMode` set to `enforce` makes the dispatch guard refuse it. Each background worker is told its checkout and branch, and the branch guard refuses its commits anywhere else. Each branch is checked and reviewed on its own, then integrated as one PR per job or one batched PR.

This was observed with Claude Code background workers on Windows. Foreground workers, live Linux and Pi were not observed. See [parallel work](operations.md#parallel-work), [the worker limit](operations.md#parallel-worker-limit), the [installation guide](installation.md#initialise-a-project) and the coordinator's "Parallel jobs" section in its [skill](../../.agents/skills/isswf-coordinator/SKILL.md#parallel-jobs).

## Skills, roles, references and principles

The instructions in `.agents/` come in four kinds, each with its own folder:

| Kind | What it is | Where |
| --- | --- | --- |
| Skill | A task you can ask for by name, or the coordinator can select. It has an observable outcome. | [`.agents/skills/`](../../.agents/skills/) |
| Role | The responsibility a delegated agent takes: worker, researcher, planner, diagnostician, reviewer, delivery or retrospective. | [`.agents/roles/`](../../.agents/roles/) |
| Reference | Detailed rules that a skill or role reads only when they apply, such as [review](../../.agents/roles/references/review.md) or [planning](../../.agents/roles/references/planning.md). | [`.agents/roles/references/`](../../.agents/roles/references/) |
| Principle | A reference that holds general judgment rather than a procedure: [design](../../.agents/roles/references/design-principles.md), [execution](../../.agents/roles/references/execution-principles.md) and [verification](../../.agents/roles/references/verification-principles.md). The coordinator supplies one only when it applies; none is a checklist. | `.agents/roles/references/` |

The host guides in [`.agents/hosts/`](../../.agents/hosts/) describe how Pi and Claude Code launch each role. The next section lists the skills.

## Skills you use

| Skill | Purpose |
| --- | --- |
| `isswf-setup` | Prepare a project or inspect a proposed installation update. |
| `isswf-coordinator` | Clarify an assignment, choose the next step, coordinate authorised work, and explain the result. |
| `isswf-writing` | Create, revise, or review documents with the right approach for humans or agents, in any project. |
| `isswf-understanding` | Understand a topic or system, clarify an explanation, or learn through practice and feedback. |
| `isswf-howto` | Find which skill, role or flow fits your situation and get a prompt for the coordinator or a direct skill command, without starting work. |
| `isswf-pr` | Prepare PR descriptions and authorized updates with evidence and a mandatory risk assessment. |
| `isswf-issue` | Report independent bugs or propose features and improvements, with verified routing and mandatory `needs-triage`. |
| `isswf-triage` | Triage existing issues into native briefs: ready for an agent, needs information, duplicate, or technical grounding. |
| `isswf-interview` | Opt-in interview that asks one question at a time, with a recommended answer (two or three alternatives with trade-offs and a recommendation for open gaps), to close gaps in scope, product intent or acceptance. |
| `isswf-e2e` | Create, run or maintain executable tests of critical user journeys, with Playwright or another driver suitable for the real interface. |
| `isswf-debug` | Reproduce defects, investigate causes and return a causal diagnosis or explicit uncertainty. |
| `isswf-review` | Review an exact candidate against Standards and Spec with proportionate evidence. |
| `isswf-retrospective` | Learn from completed features or bugs, or an explicit session close, through local improvement drafts. |
| `isswf-tdd` | Use an observed red-green-refactor loop for explicitly requested TDD or a selected useful regression seam. |
| `isswf-security` | Model threats, assess a bounded security surface or implement explicitly authorized hardening. |
| `isswf-performance` | Diagnose measured slowness, evaluate a performance budget or optimize a demonstrated bottleneck. |
| `isswf-observability` | Design, assess or implement focused logs, metrics, traces and alerts with privacy and cost limits. |

In Pi, invoke them with `/skill:`. In Claude Code, use `/isswf:`.

The writing skill determines the audience from the request and document context. It asks you when the audience is unclear and follows the target project’s language and documentation conventions. Use `/skill:isswf-writing` in Pi or `/isswf:isswf-writing` in Claude Code. It does not require project activation.

The understanding skill selects reformulation, explanation, or practical learning from your request. It adapts to your demonstrated knowledge and asks only when an ambiguity would change the response. Use `/skill:isswf-understanding` in Pi or `/isswf:isswf-understanding` in Claude Code. It works across subjects and projects without creating courses or progress records by default.

The howto skill answers "which isSWF resource fits this?" without spending a run. It reads the canonical skill, role or flow file before pointing to it, checks the active `.isswf/` or `.factory/` state and the setup record only when they change the answer, and ends with a prompt you can send to the coordinator, plus a direct `/skill:` or `/isswf:` command when that skill documents direct use. A request for work is treated as a coordinator task, not done by the skill. It differs from the understanding skill, which explains a topic. Use `/skill:isswf-howto` in Pi or `/isswf:isswf-howto` in Claude Code. It does not authorize implementation, setup changes or publication.

The interview skill is opt-in. It investigates code, docs and the glossary first, then asks one question at a time in dependency order, each with a recommended answer (or two or three alternatives with trade-offs and a recommendation when a gap is open), with no fixed question count. Answers are recorded in the initiative plan as confirmed by the operator, and planning and briefs are prepared from that record; if you stop it ("enough, decide"), the remaining points are recorded as explicit assumptions. The coordinator proposes it in one line for new features, user-visible behavior changes, concepts missing from the glossary or unwritten acceptance; it is not needed when the specification has no gaps, meaning the agent does not have to presume, infer or decide anything. Use `/skill:isswf-interview` in Pi or `/isswf:isswf-interview` in Claude Code at any time. It does not authorize implementation or publication.

The PR skill works directly or through Delivery. It inspects the candidate, explains scope and verification limits, and assesses risk even for documentation-only changes. Delivery supplies its identities and evidence and reuses the same assessment. Use `/skill:isswf-pr` in Pi or `/isswf:isswf-pr` in Claude Code. Drafting does not authorize publication or merge.

The issue skill distinguishes independent findings from errors in the current implementation. It routes a sanitized report to the project or factory repository, checks duplicates, and requires the existing `needs-triage` label before creation. Missing destination access, publication permission, or label support leaves a draft or explicit blocker. Use `/skill:isswf-issue` in Pi or `/isswf:isswf-issue` in Claude Code. Creating a report does not authorize implementation.

The E2E skill inspects the target's existing harness and selects a small set of useful user journeys. It supports browser, CLI, terminal and API paths; Playwright is optional, not a dependency for every project. It creates runnable tests, fixtures, a journey map and local/CI commands rather than relying on an agent to perform the checks manually. Use `/skill:isswf-e2e` in Pi or `/isswf:isswf-e2e` in Claude Code. Dependency installation, real accounts, provider calls and publication still require their own permission. Unrun tests are draft coverage, not a verified suite.

The debug, review, retrospective and TDD skills expose existing procedures without making them compulsory stages. The coordinator and applicable role profiles select them conditionally. Use `/skill:isswf-debug`, `/skill:isswf-review`, `/skill:isswf-retrospective` or `/skill:isswf-tdd` in Pi; Claude Code exposes the same names under `/isswf:`. Independent review still requires a separate authorized context. Retrospectives preserve active jobs and produce drafts, not policy changes or execution grants.

Code review starts from the accepted behavior and relevant tests before tracing the implementation and affected consumers. It examines the resulting structure, prioritises evidence-backed findings by impact, and checks dependency changes at their installation boundary. A targeted fault-injection experiment is optional and requires an authorized disposable copy; it never modifies the reviewed candidate or gives a text-only reviewer tools. A coverage gap is distinct from a defect in the unchanged candidate.

Installed workers receive the pinned debug and TDD skills as read-only methodology alongside E2E when the release supplies them. Native diagnostic and review callers include their selected skill from the same methodology checkpoint as their role; historical pins keep their original resources. Text-only callers do not gain tools, global skills or parent integrations. These resources do not add a retrospective dispatcher or change host isolation guarantees.

Security, performance and observability are optional specialised workflows, not extra stages for every job. Use `/skill:isswf-security`, `/skill:isswf-performance` or `/skill:isswf-observability` in Pi, or the same names under `/isswf:` in Claude Code. Security starts with assets, trust boundaries and plausible abuse; it does not authorize exploitation or certify compliance. Performance requires a correctness-checked baseline and comparable measurements before a speedup claim. Observability starts from operational questions and bounds sensitive fields, metric cardinality, export and retention. It does not turn telemetry into proof of current process state.

The applicable coordinator and role profiles select these resources conditionally. The coordinator supplies each child the selected resources from the same checkpoint as its role. Historical checkpoints retain their original resources. A supplied skill does not add tools, production access or provider permission.

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
| Planner | Proposes useful units of work, each sized S/M/L by how costly it is to verify, and their dependencies. |
| Diagnostician | Investigates a defect whose cause is unclear. |
| Reviewer | Assesses the chosen change and its evidence independently when that judgment is required. |

Setup configures the agent composition as well as models and effort. It records enabled or conditional roles, selection triggers, supported executors and tool boundaries, total and concurrent actor limits, correction/review budgets and independence requirements in the existing project setup record. Unsupported combinations remain pending rather than silently using another dispatcher. A settled composition is reused; each assignment still needs its concrete authorization.

These are responsibilities, not a compulsory sequence or a promise that every host can launch every role. Clear work can take a short path. More uncertainty may require questions or investigation first.

## What stays with a project

New installations keep shared project records under `.isswf/`. They describe plans, jobs, decisions, and selected factory version. Private local records are kept separately from files intended for Git.

Older projects may still use `.factory/`. Migration is explicit and preserves existing records; do not keep both as active state directories.

When installed and available, Engram is used to recover and save project context and Codegraph is used first to locate and understand code. Neither is required, and neither is the job database or a source of permissions.

## How an initiative is recorded

An initiative is one tracked piece of work, with a stable ID such as `I0042`. The coordinator writes its records as plain Markdown files in the project's state directory, so you can read them and Git keeps their history. Small tasks need no planner and no fixed bundle of files.

```text
<state>/
  templates/
  initiatives/
    I0042/
      plan.md
      jobs/
        J001/
          brief-r1.md
          brief-r2.md
          A001.md
          V001.md
          delivery.md
        J002/
          brief-r1.md
```

| Record | What it holds |
| --- | --- |
| `plan.md` | One current plan per initiative, with one section per job: status, objective, dependencies, acceptance, blocker, next step and evidence. |
| `jobs/J001/` | A job, a small slice that delivers something you can verify. Its folder holds that job's records. |
| `brief-r1.md` | The curated brief of the job: what to do, the scope, the acceptance and the checks. When the criteria change, the new revision is `brief-r2.md` and the earlier one stays. |
| `A001.md` | An attempt record: what a worker did, checked and could not do. Written by the worker. |
| `V001.md` | A review record: the verdict and findings of one review round. Written by the reviewer. |
| `delivery.md` | A local summary of the delivered work, for the panel and for you. It does not publish anything. |

The templates in `.factory/templates/` (in a project, `<state>/templates/`) define two more kinds of record, written only when needed: a correction inbox `C001.md` in the job folder, for a correction you send to a running coordinator, and a retrospective under `<state>/retrospectives/`. A job prepared from an issue also has an `intake.json`. Statuses are `pending`, `in-progress`, `blocked`, `in-review`, `awaiting-human` and `completed`. The coordinator owns the plan and the briefs, a worker owns its attempt, a reviewer owns its review, and you record acceptance in the plan through the coordinator. See [plans, records and evidence retention](../durable-work.md#project-records) and the [planning guidance](../../.agents/roles/references/planning.md).

## Opening issues from other repositories

While working in one repository you may find a bug, or an idea, that belongs elsewhere. The `isswf-issue` skill reports it without expanding the current assignment and without starting a fix. It first decides whether the finding belongs to your product or to the factory, using evidence and not the folder you ran it from, and checks the exact repository and your access. It looks for duplicates, removes private material, and asks for the `needs-triage` label on every new issue. Without permission to publish, it hands you a draft. An issue asks for assessment; it does not approve implementation. A possible vulnerability is never published openly. See the [skill](../../.agents/skills/isswf-issue/SKILL.md) and [routing and publication](../../.agents/skills/isswf-issue/references/routing-and-publication.md).

## The initiatives panel

Claude Code has an optional initiatives panel, off by default, that shows the recorded work as cards. It reads your project's files and never starts agents. A similar panel for Pi is coming soon. Turn it on with **Initiatives pane** for the `isswf` plugin in `/config`. It opens when the coordinator skill loads, and `/isswf-initiatives` reopens it. It has three tabs:

- **Initiatives.** A card per initiative with its jobs and review rounds. A record's border shows its result: green for a passed review or complete attempt, yellow for requested changes or partial work, red for failed, blocked or cancelled, and grey when it states none.
- **Files.** The initiative's plan, briefs and records as a tree, each readable as Markdown.
- **Agents.** The coordinator and one row per delegated role, with the number of runs and which skills and references they used.

A row under the title shows whether Engram and Codegraph are available in the session. The panel shows recorded work, not live proof of every process. Everything it does is described in [initiatives pane](installation.md#initiatives-pane). A separate local browser panel (`tools/isswf-panel.mjs`) shows the same plans as a Kanban board; see [inspect work](operations.md).

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
- [Plans, records, and evidence retention](../durable-work.md).
- [Review selection](../../.agents/roles/references/review.md).
