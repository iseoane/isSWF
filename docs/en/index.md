# Documentation

[isSWF](../../README.md) · [Español de España](../es/index.md)

Start with the current guides below. The implementation and its tests establish current behaviour; historical plans and demonstrations do not override them. Accepted objectives still define what a requested change must achieve.

## Use isSWF

- [Installation and updates](installation.md): prepare a local package, choose a host and initialise a repository.
- [Getting started](getting-started.md): make a bounded request through the coordinator.
- [How the factory works](reference.md): roles, project records, versions and limits.
- [Inspect work](operations.md): read initiative status and use the local panel without starting agents.

## Develop isSWF

- [Where things live](architecture.md): directories, executable responsibilities and state boundaries.
- [Development](development.md): build, test, lint and find unused code.
- [Glossary](../../GLOSSARY.md): the shared product vocabulary.
- [Possible future actions](future-actions.md): proposals kept separate from implemented behaviour.

## Published site

The interactive workflow flowchart is published at [https://iseoane.github.io/isSWF/](https://iseoane.github.io/isSWF/). Updates are manual: open **Actions → Publish workflow diagrams → Run workflow**, select `main`, and run it when publication is authorized. There is no automatic deployment on push. The staging step allowlists only the bilingual landing page and the two interactive flowcharts, never the overview images.

## Detailed resources and history

The coordinator's English technical resources remain at their stable paths because current instructions and packages refer to them. They are listed in [operations](operations.md). They are not a compulsory user workflow.

The compiled-release installation is a separate legacy path, not a prerequisite for native-host work: see [update the legacy path, then migrate a project](installation.md#update-the-legacy-path-then-migrate-a-project) and [host support](../host-portability.md).

Retired documentation is available in Git history.
