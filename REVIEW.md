# Review guide for isSWF

Code owners maintain this file. Reviewers read it with `.agents/roles/references/review.md`; it sharpens that guide and grants no authority.

## What failure looks like here

- **It only works on Linux or on one host.** Every unit must hold on Linux and Windows and consider Pi and Claude Code. Treat path separators, Git output compared with Node paths, directory `fsync`, file replacement while a reader holds the file, file symlinks and line endings as known Windows failure classes; search for every instance.
- **It widens authority.** A tool, profile or document must not let memory, issue text, labels, configuration or a remembered grant authorize execution, remote actions, installation or merge.
- **It lies.** Documentation, tool messages or reports claim behavior, a release, a pass or acceptance that the code and checks do not show. A failed or unrun check must stay visible.
- **It breaks a persisted contract.** Renaming persisted keys, state roots (`.isswf/`, `.factory/`) or historical checkpoint paths, or silently changing an installed project's pin or model choices.
- **It ships private material.** Anything from `tooling/.local/`, credentials or transcript content reaching a package allowlist, a record or a report.
- **The mirrors drift.** A current guide changes without its `docs/es/` or `README.es.md` counterpart, or the meaning differs.

## Always needs a person

- `.github/workflows/**`
- Packaging, release and installation: `tools/factory-package.mjs`, `tools/build-release.mjs`, `tools/bun-release.mjs`, `tools/release-source.mjs`, `tools/sdk-package.mjs`
- Host boundaries and role profiles: `.agents/hosts/**`, `.agents/roles/*.md`
- Grant, capacity and authority code: `tools/execution-capacity.mjs` and any change to how grants are read or enforced

## Skip unless the change targets them

- `.factory/initiatives/**` historical records and retained evidence (check only that new records follow the templates)
- `isswf/` and `examples/` historical prototypes
- `tooling/quality/node_modules/`, `tooling/.local/`

## Findings

- Report at most three `suggestion` findings about style or wording; drop the rest.
- Every finding cites path and line and, for behavior, the command or test that shows it.
- Mark a Windows-only or Linux-only defect with the platform and the observed error.
- When there is nothing to fix, say so plainly.
