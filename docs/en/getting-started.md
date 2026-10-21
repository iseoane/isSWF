# Your first request

[Home](../../README.md) · [Español de España](../es/getting-started.md)

Start with a small change in a repository you know. You do not need to name every agent or design the whole workflow yourself.

## 1. Set up the project

Complete [installation](installation.md), open the target repository, and invoke:

```text
/skill:isswf-setup
```

In Claude Code, use `/isswf:isswf-setup` instead. Explain that you want to initialise this repository. The setup step records project choices; it does not start implementation.

## 2. Give the coordinator a goal

For a first try, ask it to prepare work without editing code:

```text
/skill:isswf-coordinator Prepare a fix for the search filter resetting when I change pages. Keep the rest of its behaviour unchanged. Show me the proposed scope and checks before changing code.
```

In Claude Code, replace the command prefix with `/isswf:isswf-coordinator` and keep the request.

A useful response should explain:

- What the coordinator understands the problem to be.
- What it will change and what it will leave alone.
- Any product decision it needs from you.
- How the result will be checked and what happens next.

It should investigate technical unknowns within its permissions rather than asking you to explain code it can read.

## 3. Authorise the work you actually want

Check the proposed scope and any limits before approving execution. State whether commits, GitHub actions, or additional model calls are allowed; do not assume they follow from preparing a plan.

For example, you can authorise a bounded local implementation and tests while keeping publication and merge outside scope. When its current permission already covers a step, the coordinator should not ask you to confirm that same step repeatedly.

## 4. Ask about progress

Use the coordinator to ask:

> What has been checked, what is blocked, and what needs my decision?

The answer should separate recorded progress from anything it cannot currently confirm. The local panel can also show plans, deliveries, and pending decisions; it must be started explicitly and is not a live view of every agent.

## 5. Review the result

Expect a summary of the change, the checks actually performed, remaining limits, and the decision requested from you. A passing test or finished process is not the same as your acceptance.

If something is missing, request a concrete change. If it meets the agreed goal, say that you accept it. Publication or merge still needs the relevant permission.

## Other requests to try

### A clear, small change

> Prepare a change to the empty-state message. Keep the layout and behaviour unchanged. Show the affected screen and how you would check it.

A small task should not automatically require a long interview or a planning agent.

### A feature that needs decisions

> I want a Markdown viewer. Help me decide which files it can open, what formatting it should support, and what to do with unsafe content before proposing the work.

Here the coordinator should clarify product choices and investigate technical options when needed.

### A bug with an unclear cause

> Investigate why saving sometimes loses the last edit. Find a repeatable signal before proposing a fix, and tell me if you cannot reproduce it.

Diagnosis can be separate when the uncertainty warrants it. Simple bugs can stay with the worker that fixes them.

Research, planning, TDD, and deeper review are selected for the task. They are not compulsory stages for every request. See [how the factory works](reference.md).
