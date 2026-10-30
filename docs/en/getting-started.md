# Your first request

[Home](../../README.md) · [Español de España](../es/getting-started.md)

Start with a small change in a repository you know. You do not need to name every agent or design the whole workflow yourself.

## 1. Set up the project

Complete [installation](installation.md), open the target repository, and invoke:

```text
/skill:isswf-setup
```

In Claude Code, use `/isswf:isswf-setup` instead. Setup resolves the runtime, model/effort and execution limits, workspace policy, checks and delivery destination before normal feature work. For GitHub delivery it records the repository, base and feature-branch policy. On this explicit setup request, it also prepares the bounded coordinator entry in the root `AGENTS.md`. Once prepared, explicitly address the coordinator/coordinador or ask for an isSWF workflow to activate its canonical coordinator and actual host guide; unrelated requests do not activate a mandatory pipeline. Missing required choices or capability evidence leave setup partial, not silently ready. For Claude Code, setup records whether the native child interface can bind parallel workers to the approved prepared external checkout. If that binding is unavailable or unverified, sequential work can still proceed in the assigned checkout; an explicitly parallel assignment is blocked rather than silently serialized. Setup records alone do not start work or grant future actions.

## 2. Start a feature through the coordinator

For example:

```text
/skill:isswf-coordinator Implement a clear-filter button that restores the existing unfiltered list. Keep the current pagination behaviour unchanged.
```

In Claude Code, replace the command prefix with `/isswf:isswf-coordinator` and keep the request.

In a prepared project this feature start selects the bounded default path: define the outcome, implement, test, obtain required review, correct findings, commit on the feature branch, push that branch, open or update its PR, verify required CI and deliver the PR. You do not need to append those operations to every feature request. The coordinator records the current authorization, destination and finite budgets; the feature start does not authorize integration into `main`, auto-merge, deployment or release.

If a decision only you can make is missing, the affected work becomes `awaiting-human` with the specific question and the answer needed to resume. This can happen during definition, before any implementation or delivery exists. Technical facts that can be investigated are the coordinator's job, not an opening questionnaire for you.

## 3. State any narrower boundary

You can override the default, for example:

> Prepare the scope and checks for this feature. Do not edit code yet.

Or:

> Implement and test this feature locally. Do not commit, push or create a PR.

Discussion, diagnosis, plan preparation and PR drafting are not feature starts. A bug or another assignment uses the same feature-to-PR path only when you select it. Existing project restrictions and an explicitly selected local-only mode remain in effect; GitHub tracking alone never grants publication. The coordinator should not ask again for steps already covered by your current request.

## 4. Follow progress without driving every phase

The coordinator consumes worker and review results and continues covered actions without waiting for your next prompt. Ask when useful:

> What has been checked, what is technically blocked, and what decision needs me?

A later outage, failed check, full execution capacity or unknown process state can still stop an affected step. The coordinator records the real technical reason and continues independent work when possible. It asks you only for a concrete decision or uncovered action, not generic permission to continue. An expired credential is not proof that initial setup should be repeated in full.

The local panel shows reported plans, evidence and decisions. It is not live process telemetry, an automatic scheduler or a way to authorize work by recording a note.

## 5. Decide what to do with the delivered PR

Expect the actual PR URL and head/base, observed checks and required review, risk, limitations and the next decision. A published PR alone is not proof that required CI passed. After the verified PR is delivered, integration into `main` is `awaiting-human`; the feature start does not approve merge, auto-merge or a direct push to the integration branch.

Request a concrete correction if something is missing. Product acceptance and permission to integrate remain separate decisions. The coordinator drives the workflow while its session and tools are available; interruptions use existing reconciliation rather than a promised background recovery service.

## Other requests to try

### A feature that needs decisions

> I want a Markdown viewer. Help me decide which files it can open and what to do with unsafe content before proposing the work.

This is definition work. Unresolved product decisions belong to you; technical options should be investigated within scope. It does not publish a PR by itself.

### A bug with an unclear cause

> Investigate why saving sometimes loses the last edit. Find a repeatable signal before proposing a fix, and tell me if you cannot reproduce it.

Diagnosis can be separate when uncertainty warrants it. Simple bugs can stay with the worker. Research, planning, TDD, E2E and deeper review are selected for the task, not compulsory phases. See [how the factory works](reference.md).
