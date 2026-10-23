# Work on isSWF

[Home](../../README.md) · [Español de España](../es/development.md)

This page is for changing the factory itself. To use it in another project, start with [installation](installation.md).

## Find the relevant source

| Location | Contents |
| --- | --- |
| `.agents/skills/` | The shared setup, coordinator, and source-only triage instructions. |
| `.agents/roles/` | Agent responsibilities and supporting references. |
| `tools/` | The factory's executable tools. |
| `skills/`, `agents/`, `.claude-plugin/` | Claude Code integration files. |
| `tests/`, `tooling/` | Development checks and maintenance tools. |
| `docs/en/`, `docs/es/` | Matching current user and development guides. |
| `docs/` root | Stable English technical resources. |

The development repository may still keep its own records under the legacy `.factory/`. That is not a reason to migrate them as part of an unrelated code or documentation change.

Read [AGENTS.md](../../AGENTS.md) before making changes. Keep the work bounded and preserve existing operator edits.

## Build a local release

If you have repository access, obtain the source:

```bash
git clone https://github.com/iseoane/isSWF.git
cd isSWF
```

Keep source development on Node.js and `.mjs`. Install a trusted Bun compiler for release construction only. Bun 1.4.3 is the locally tested compiler. The builder defaults to Bun, while `--runtime node` retains the original development-fixture layout. Choose a commit that contains the complete release tools. The builder reads that commit, not uncommitted edits. If the installation work has not yet been committed in your checkout, do not expect the earlier commit to contain it.

Use the full commit SHA in place of `FULL_COMMIT_SHA` and an absent output folder outside the source repository:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release --runtime bun
```

That folder is what the [installation commands](installation.md) use. Building it does not publish to npm, register a marketplace, or change another project's version. The SHA identifies the chosen source; installing the prepared folder does not create a new source revision.

The compiler enables `--compile-autoload-package-json` so generated tasks can resolve the existing host SDK's package entry and transitive dependency exports. This does not bundle or install that SDK. The executable also resolves relative `.mjs` task paths from the working directory.

Use `--target` to select a separate Linux, macOS, or Windows artifact. These are compile targets, not verified platform parity. The complete installed mutation and isolation workflow remains Linux-only.

The [technical installation guide](../installation.md) covers tarballs and the exact package checks.

## Quality checks

Use Node.js 24 or later with npm and Git. Run the portable checks from the repository root:

```bash
node tools/check-quality.mjs
```
The portable check includes `node tooling/quality/check-docs.mjs`: it checks current guide mirrors, local links, section coverage and identical shell examples. It also rejects obsolete audit procedures copied into current technical guides. It does not prove translation quality or execute the examples.


When Bun is available, the portable check also builds and installs a real Bun package in temporary directories. It tests external SDK-style package exports and transitive dependencies, absolute and relative `.mjs` tasks, pinned binary handoff and, when available, Linux Bubblewrap with a synthetic SDK. Without Bun, the artifact check reports SKIP. Set `ISSWF_TEST_BUN` to a compiler path to require it; `ISSWF_TEST_BUN_WORKER=1` also requires the sandbox check. CI installs the pinned Bun compiler and requires both the artifact and Linux sandbox checks. Locally, `ISSWF_TEST_BUN_TMPDIR` can place large binary fixtures on a separate disk without changing the diagnostic evidence root policy. These fixtures do not execute Claude or real providers.

Some checks use the current files, while committed-source packaging checks use a Git revision. A passing run does not mean every uncommitted file has been packaged or every live model integration has been tested.

If you need the separate static-analysis tools and they are not installed, prepare the development dependencies:

```bash
npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund
```

Then run:

```bash
node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs
node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress
```

ESLint performs lint and static checks; Knip reports unused files, dependencies, exports, and unresolved references within its configured scope. Neither is a proof that every dead-code path has been found. Source checks have no separate compilation or type-check step. Constructing a standalone release adds the explicit Bun compilation step.

These tools help find mistakes and unused code. They do not replace the checks needed for a particular feature or prove that a real agent run succeeded.

## Platform and host discovery checks

The Quality workflow keeps the full Linux quality and Bubblewrap job. A separate matrix defines native Linux and Windows checks for Bun construction, npm tarball installation, exact resource receipts, CLI version and read-only inspection, paths with spaces and Unicode, and external Git worktrees. Windows does not assert POSIX permission modes. These checks do not establish Windows mutation, recovery or worker isolation support.

The matrix installs development-only hosts from `tooling/host-tests/package-lock.json`, with lifecycle scripts disabled. Pi 1.4.0 installs the package in temporary user and project scopes; its real resource loader must discover all six skills from the installed artifact, with an empty pre-install control. Claude Code 2.1.299 installs the local marketplace/plugin and must report those skills through its native component inventory. The test invokes the platform-native binary supplied by Claude's optional dependency, without running its installer script. No prompt, agent session, login or provider credential is supplied. Temporary home/config directories and disabled telemetry limit incidental activity; they are not proof of network isolation. These are installation/discovery checks, not live task or delegation evaluations.

To run the additional checks locally, select an absent output directory outside the repository. These examples use a Bash-compatible shell; on Windows supply an absolute Windows path for the output directory:

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
export ISSWF_PLATFORM_ROOT="/absolute/absent/platform-output"
npm exec --offline -- node tests/platform-package.mjs .
node tests/host-discovery.mjs .
```

The artifact builder reads committed HEAD, while static source checks read the working tree. The tests require the pinned host dependencies and Bun; missing tools or missing skills fail rather than silently skip. Re-running needs a fresh output path. CI retains platform/discovery reports and Claude's observed skill inventory for 14 days. A configured matrix is not evidence that every platform passed; inspect the exact run before claiming support.

## Documentation conventions

Keep active factory instructions and operational resources in English. User-facing guides have matching English and Spanish-from-Spain versions; update both when changing their meaning or examples. Preserve user-authored records and historical evidence in their original language.

Keep the README approachable. Put exact execution, model, and recovery rules in their existing operational guides instead of repeating them across pages.

## Source of truth and history

Check actual tools, manifests, and tests before documenting current behaviour. Use [the source map](architecture.md) to find the owner. Keep accepted objectives distinct from implementation evidence and [future proposals](future-actions.md).

Retired documentation is available in Git history.

## Before publication

Check the actual candidate, the required review, and the permission to publish. Keep the package, core, and plugin version aligned. Do not claim npm availability, platform equivalence, or successful live integrations without evidence.

The project uses the MIT License. Publication remains a separate authorised action.
