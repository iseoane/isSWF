# isSWF

English | [Español de España](README.es.md)

A personal software factory for turning ideas, bugs, and issues into small, checked changes with AI agents.

## Description

isSWF gives your coding assistant a way to organise work. A coordinator helps clarify what you want, chooses the right help, and keeps track of the result.

You stay in control of decisions and permissions. The factory keeps plans, jobs, and evidence with each project, so you can see what changed, what was checked, and what still needs your attention.

## Why this project?

Working with agents can mean large unfinished changes, repeated explanations, and uncertainty about whether something really works.

isSWF aims to make that work easier to follow:

- Break a request into useful changes you can review.
- Ask questions when a decision is missing, not at every step.
- Choose research, planning, tests, and review according to the task.
- Preserve the project's decisions and progress between conversations.

It is a workflow you use when needed, not a service that runs your repositories unattended.

## Who is it for?

- Developers already using Pi who want more organised work on an existing Git project.
- Maintainers who want to understand a proposed change and its checks before accepting it.
- People exploring agent-assisted development who want explicit control over what agents may do.

Pi is the reference execution environment. A Claude Code plugin is also included, with different execution and recovery capabilities.

## Installation

For now, use a **prepared local release folder**. These instructions do not assume that a package has been published to npm or a public marketplace. See [installation](docs/en/installation.md) if you need to prepare that folder.

### Pi

```bash
pi install /path/to/isswf-release
```

This makes the package available globally. Add `--local` to install it for the current project instead.

### Claude Code

```bash
claude plugin marketplace add /path/to/isswf-release
claude plugin install isswf@isswf --scope user
```

Use `--scope project` for a project installation. See [installation](docs/en/installation.md) for the differences between the two hosts.

### Dependencies

You need Node.js 24 or later, Git, and the host you choose. Running agent jobs also needs a supported model account and working authentication.

The complete installed workflow currently requires Linux. Isolated Pi workers additionally need bubblewrap. Python and SQLite are not requirements of the native workflow; Engram and Codegraph are optional.

Installing the package does not start agents or create factory state in every repository. You initialise each project explicitly.

## Getting started

Open your project in Pi and initialise it:

```text
/skill:isswf-setup
```

Then try a preparation-only request:

```text
/skill:isswf-coordinator Prepare a fix for the search filter resetting when I change pages. Keep the rest of its behaviour unchanged. Show me the proposed scope and checks before changing code.
```

The coordinator should explain the next step, ask about any missing product decision, and identify how the result will be checked. Authorised implementation can then use the appropriate agents and return a summary for your acceptance.

In Claude Code, use `/isswf:isswf-setup` and `/isswf:isswf-coordinator` instead.

The [getting-started guide](docs/en/getting-started.md) has examples for bugs, new features, and checking progress.

## Details

[All current documentation](docs/en/index.md), including the source map, local panel, and possible future actions.


- [Installation and updates](docs/en/installation.md): choose a host, initialise a project, and update deliberately.
- [Getting started](docs/en/getting-started.md): make your first request and understand the response.
- [How the factory works](docs/en/reference.md): skills, agents, project records, and current limits.
- [Development](docs/en/development.md): navigate the source and run the checks.

## Contributing

Start with a concrete problem or a small improvement. Describe the expected result and how you checked it. Read the [development guide](docs/en/development.md) before changing factory behaviour.

## License

This project is licensed under the MIT License.
