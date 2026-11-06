---
name: isswf-howto
description: Tell the operator which isSWF skill, role or flow fits their situation and what to send the coordinator, without starting work. Use when the operator asks how to use isSWF, which skill or flow to pick, or what to say next.
---

# Route the operator to the right isSWF resource

Answer the operator's "how do I...?" or "which one do I use?" question and hand over a prompt. This skill only answers: it does not start work, dispatch agents, edit files, change setup or publish. Its scope differs from [isswf-understanding](../isswf-understanding/SKILL.md), which explains a topic or system; this one chooses an isSWF resource.

## 1. Classify the request

- Help question (which skill, role or flow, how to start, what to say next): answer it with steps 2 to 4.
- Request for work (implement, fix, review, plan, publish): do not do it here. Say it is a coordinator task, then give the prompt from step 4. If the operator wants the work done now, point them to `/skill:isswf-coordinator` in Pi or `/isswf:isswf-coordinator` in Claude Code.
- Explanation of a topic: hand over to `isswf-understanding`.

If the situation is too vague to pick a route, ask one question that would change the answer.

## 2. Find the matching resource

Open the canonical file before you name or quote it. Never answer from memory, and do not copy contracts; link the file and state its purpose in one line.

| Situation | Resource to read and link |
| --- | --- |
| Skill list and purposes | Each `../isswf-*/SKILL.md` frontmatter `description` |
| Start, resume or plan an assignment | [isswf-coordinator](../isswf-coordinator/SKILL.md) |
| Build a feature through to a PR | [feature-delivery.md](../../roles/references/feature-delivery.md) |
| Unclear scope or acceptance before planning | [isswf-interview](../isswf-interview/SKILL.md) |
| Unknown cause or intermittent failure | [isswf-debug](../isswf-debug/SKILL.md) |
| Review an exact change | [isswf-review](../isswf-review/SKILL.md) |
| PR text or an independent bug or feature report | [isswf-pr](../isswf-pr/SKILL.md), [isswf-issue](../isswf-issue/SKILL.md) |
| Assess an existing issue | [isswf-triage](../isswf-triage/SKILL.md) |
| Tests, security, performance, telemetry | [isswf-e2e](../isswf-e2e/SKILL.md), [isswf-tdd](../isswf-tdd/SKILL.md), [isswf-security](../isswf-security/SKILL.md), [isswf-performance](../isswf-performance/SKILL.md), [isswf-observability](../isswf-observability/SKILL.md) |
| Documents or agent instructions | [isswf-writing](../isswf-writing/SKILL.md) |
| Close-out lessons | [isswf-retrospective](../isswf-retrospective/SKILL.md) |
| Prepare or update a project | [isswf-setup](../isswf-setup/SKILL.md) |
| Which role does what | [worker](../../roles/worker.md), [reviewer](../../roles/reviewer.md), [planner](../../roles/planner.md), [researcher](../../roles/researcher.md), [diagnostician](../../roles/diagnostician.md), [delivery](../../roles/delivery.md), [retrospective](../../roles/retrospective.md) |
| Inspect work without starting agents, or run with the project's pinned version | [installation](../../../docs/installation.md#run-with-the-projects-version) |

If nothing fits, say so and suggest the coordinator. Do not invent a skill or flow.

## 3. Check state only when it changes the answer

Look at the target project only if the answer depends on it:

- Active state directory: `.isswf/` (current) or `.factory/` (legacy). If both exist, the state is ambiguous; tell the operator to reconcile before work, as [project-state.mjs](../../../tools/project-state.mjs) refuses to choose.
- `<state>/project-setup.md`: whether the project is set up. If it is missing, `isswf-setup` comes first.
- `<state>/install.json` present: the project is pinned to an installed release, so route inspection through its pinned launcher ([installation](../../../docs/installation.md#run-with-the-projects-version)). Not relevant to host-native delegation. Do not run the launcher from here.

Mention state in the answer only when it matters. Reading these files is allowed; changing them is not.

## 4. End with a prompt for the coordinator

Every answer ends with one copyable prompt, in the operator's language, that the operator can send to the coordinator. It states the goal, the target (issue, path or initiative), the delivery scope the operator wants, and any limit such as local-only or prepare-only. Take only the scope the operator has stated; a prompt that asks for work does not grant more than its words say. Mark anything you could not verify as an assumption.

The coordinator prompt is the default ending. When the routed skill's own text says it can be used directly (re-read its opening lines first), also offer that as an option: `/skill:isswf-<name>` in Pi or `/isswf:isswf-<name>` in Claude Code. The skill's text confirms direct use for isswf-debug, isswf-e2e, isswf-issue, isswf-observability, isswf-performance, isswf-pr, isswf-retrospective, isswf-review, isswf-security, isswf-tdd, isswf-writing and isswf-understanding. Do not offer direct use for the coordinator, [isswf-setup](../isswf-setup/SKILL.md), [isswf-triage](../isswf-triage/SKILL.md) or [isswf-interview](../isswf-interview/SKILL.md), or for the feature-to-PR flow: their text does not say so, and they go through the coordinator.

Complete when you have answered the question, linked each file you relied on, and given the prompt. If a file is unreadable or the state is ambiguous, say what is missing and give the prompt that resolves it.
