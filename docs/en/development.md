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

The repository's `.gitattributes` keeps text checkouts in LF on Windows and Linux, even with `core.autocrlf=true`; detected binary files remain unchanged. This preserves exact runtime-to-Git byte checks and resource frontmatter. Do not normalize bytes inside integrity verification or disable its checks. Adding attributes does not rewrite an existing working copy: if an older checkout still has CRLF runtime files, preserve local work and use a fresh clone of a revision containing this policy. Do not force-reset a dirty checkout or change global Git settings to hide the mismatch.

Keep source development on Node.js and `.mjs`. Install a trusted Bun compiler for release construction only. Bun 1.4.3 is the locally tested compiler. The builder defaults to Bun, while `--runtime node` retains the original development-fixture layout. Choose a commit that contains the complete release tools. The builder reads that commit, not uncommitted edits. If the installation work has not yet been committed in your checkout, do not expect the earlier commit to contain it.

Use the full commit SHA in place of `FULL_COMMIT_SHA` and an absent output folder outside the source repository:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release --runtime bun
```

That folder is what the [installation commands](installation.md) use. Building it does not publish to npm, register a marketplace, or change another project's version. The SHA identifies the chosen source; installing the prepared folder does not create a new source revision.

The compiler enables `--compile-autoload-package-json` so generated tasks can resolve the existing host SDK's package entry and transitive dependency exports. This does not bundle or install that SDK. The executable also resolves relative `.mjs` task paths from the working directory.

Use `--target` to select a separate Linux, macOS, or Windows artifact. The native platform matrix verifies one bounded installed mutation journey on Linux and Windows: initialize a project, invoke the pinned plan tool to prepare/repeat a plan, and refuse an uncertain write claim without changing protected bytes. This does not establish complete Windows migration/recovery or worker-executor/isolation support.

The [technical installation guide](../installation.md) covers tarballs and the exact package checks.

## Quality checks

Use Node.js 24 or later with npm and Git. Run the portable checks from the repository root:

```bash
node tools/check-quality.mjs
```
The portable check includes `node tooling/quality/check-docs.mjs`: it checks current guide mirrors, local links, section coverage and identical shell examples. It also rejects obsolete audit procedures copied into current technical guides. It does not prove translation quality or execute the examples.

For local verification of a change, run the focused tests for the changed behavior (`node tests/<name>.mjs .`) and `node tooling/quality/check-docs.mjs`. Run the full `node tools/check-quality.mjs`, which includes `tests/release-package.mjs`, once per initiative at its closing head, and earlier only when the change touches packaging: `tools/build-release.mjs`, `tools/factory-package.mjs`, `tools/bun-release.mjs`, `tools/release-source.mjs`, `package.json`, plugin manifests, or new, renamed or removed shipped files. CI runs the full check on every pull request, so packaging breakage from any change still blocks delivery. A local run that skips the full check must say so in its report.

A change to a documented contract adds its old statement to `tooling/quality/stale-statements.json` in the same change (`phrase`, optional `regex` and `scope` glob, `reason`, `since`). `node tests/stale-statements.mjs .` then searches every text the package can ship, as `packagedFileSet` in `tools/factory-package.mjs` selects them, for each listed phrase after normalizing CRLF, and `check-docs` applies the same list to `docs/*.md`. `regex` is a boolean flag (the phrase is then a regular expression), `scope` is a path glob, and matching ignores case. It finds a statement only when it is written the way the entry says: a paraphrase of the old behavior is not found.

When a brief selects TDD, each behavioral RED commit is test-only and intentionally fails; the following GREEN commit contains the passing change. If `git bisect` lands on a RED commit, use `git bisect skip` because that commit is expected to fail. A syntax or setup failure is not a valid RED result.

Git commands that hooks, guards, the pane and their runners start set `GIT_OPTIONAL_LOCKS=0` (the Claude hook, whose process call takes no environment here, passes `--no-optional-locks`), so a read never takes `index.lock` while someone commits; `node tests/git-optional-locks.mjs .` fails on a Git spawn in those sources that sets neither. A test creates its fixture repository with `initRepository` or `cloneRepository` from `tests/support/git-fixture.mjs`, which turns `core.fsmonitor` off for the new repository, and `node tests/fixture-repositories.mjs .` fails on a test that runs `git init` or `git clone` directly. Both run in `tools/check-quality.mjs`. A global `core.fsmonitor=true` otherwise leaves one `git fsmonitor--daemon` per fixture running. On Windows, this command runs the job-tier verification and reports by process ID any daemon that was not running before it and still is afterwards; it only lists processes and never stops one, and on another platform it prints `not-applicable`:

```bash
node tooling/quality/fsmonitor-daemons.mjs --project /absolute/checkout
```

Both scans are heuristics with known limits. `tests/git-optional-locks.mjs` recognizes a Git call only as a literal `git` command passed to `execFile`, `execFileSync`, `spawn`, `spawnSync`, `run`, `runAsync` or `$.process.run`, and only in the listed hook, guard, pane, plan, intake, verify and record-check sources; a Git call through another runner or a computed executable is not seen. `tests/fixture-repositories.mjs` matches a quoted `init` or `clone` argument on the same line as a runner named like git, sh, run or command, so a repository created through another line shape is not seen.

`tooling/quality/fsmonitor-orphans.mjs` is a separate check. On Windows and Linux, it lists any `git fsmonitor--daemon` whose worktree no longer exists, by process ID, and exits 1 when it finds one. Coordinators stop a daemon with `git -C <worktree> fsmonitor--daemon stop` before `git worktree remove`; the shell command guard cannot enforce that order because it sees one command at a time, so this listing is the mechanical check. It only reads and never stops a process. The daemon's own working directory is not its worktree on either platform, so the check identifies its Git directory by its IPC endpoint: on Windows the named pipe, on Linux the `fsmonitor--daemon.ipc` socket listed in `/proc/net/unix` and held in the process's `/proc/<pid>/fd`. A Linux daemon with `fsmonitor.socketDir` set has no such socket and is reported as `unknown`, never as an orphan. A daemon is an orphan when its Git directory is gone or a linked worktree's `gitdir` file names a checkout that no longer exists:

```bash
node tooling/quality/fsmonitor-orphans.mjs
```

When Bun is available, the portable check also builds and installs a real Bun package in temporary directories. It tests external SDK-style package exports and transitive dependencies, absolute and relative `.mjs` scripts and pinned binary handoff. Without Bun, the artifact check reports SKIP. Set `ISSWF_TEST_BUN` to a compiler path to require it. CI installs the pinned Bun compiler and requires the artifact check. Locally, `ISSWF_TEST_BUN_TMPDIR` can place large binary fixtures on a separate disk. These fixtures do not execute Claude or real providers.

CI also runs two host checks outside the portable check: `tests/host-prerequisites.mjs` and `tests/source-host-isolation.mjs`. Run both locally with one command:

```bash
node tooling/quality/host-checks.mjs
```

The command never installs dependencies or builds the platform output. It prints `SKIPPED` with the reason when a prerequisite is missing and exits nonzero only when a check that ran fails, so a skip is not a pass. The isolation check needs `tooling/host-tests` dependencies (`npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund`) and `ISSWF_PLATFORM_ROOT` pointing to a fresh `tests/platform-package.mjs` output.

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

`node tools/check-quality.mjs` runs both commands when they are installed and otherwise reports each as `SKIPPED`. It also fails when a top-level `tests/*.mjs` file is run by neither `check-quality` nor a CI workflow nor imported or run by path by another test; a test that needs an external tool is exempted, with its reason, in `tooling/quality/unrun-tests.mjs`.

ESLint performs lint and static checks; Knip reports unused files, dependencies, exports, and unresolved references within its configured scope. Neither is a proof that every dead-code path has been found. Source checks have no separate compilation or type-check step. Constructing a standalone release adds the explicit Bun compilation step.

These tools help find mistakes and unused code. They do not replace the checks needed for a particular feature or prove that a real agent run succeeded.

The portable review-guidance check verifies four executable fixtures: two behavioral defects with passing but insufficient checks, and two valid changes. It checks the fixture ground truth, not a model's review quality. To retain an evaluation bundle, select an absent directory outside the repository:

```sh
node tests/review-guidance.mjs . /absolute/absent/review-fixtures
```

Keep `oracle.json` and `probes/` out of a blinded review package. Live comparisons require separately authorized native calls with the same candidate, context, model and effort. Report missed defects and false alarms, preserve inconclusive results, and do not infer general improvement from one small sample.

## Tiered CI for private repositories

Private repositories pay for runner minutes, so run the full suite once instead of on every push. A tiered layout keeps feedback fast:

- **Fast tier, every pull request.** Run the focused checks, such as lint, the documentation check and the tests whose paths the change touches. Use `paths` filters so a documentation-only change skips code jobs, and set `concurrency` with `cancel-in-progress: true` so a new push cancels the run it replaces. A path-filtered required check needs a skip-aware design; see GitHub's documentation on required status checks and path filters.
- **Full tier, on `main`, by manual dispatch or on a schedule.** Run the complete suite, the end-to-end harness and the Windows and macOS jobs through `push` to `main`, `workflow_dispatch` or `schedule`.
- **Runner minutes.** GitHub bills Windows and macOS runners at higher per-minute multipliers than Linux, so put the cross-platform matrix in the full tier. Read the current multipliers in GitHub's [billing documentation for GitHub Actions](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions); they can change.
- **Records-only pushes.** The `Quality` workflow's `push` trigger ignores a push whose changed paths are all under `.factory/initiatives/` or `.isswf/initiatives/`, so a records-only push to `main` or `ci/**` starts no run. Pull requests, and pushes to `main` or `ci/**` that change any other path, still run it, and the `pull_request` trigger is not filtered because a skipped required check would stay pending.

`node tools/isswf-verify.mjs --project /absolute/project --base HEAD --table` prints which approved checks each kind of change requires, which is a starting point for choosing the fast and full tiers. The initiative close can run as a manually dispatched workflow instead of locally. The workflow checks out the closing head, runs the project's full suite and E2E on it, and the coordinator then records the passing run (`source: "ci"`, `runUrl` and head SHA) as described under "Verification runner" in the operations guide. A minimal shape:

```yaml
on:
  workflow_dispatch:
jobs:
  close-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: <pinned-launcher: the project's pinned command for isswf-verify> --project "$PWD" --tier initiative --record I0001
```

The placeholder stands for the pinned launcher form that the operations guide describes for installed projects; the source-checkout path is not a version-selection shortcut. A record written in the runner is discarded with it: after the run passes, the coordinator writes the `source: "ci"` record in the project and commits it. Use the project's own full-suite and E2E commands in place of the `isswf-verify` step when they do not fit the approved checks, and add Windows or macOS jobs only when the close needs them. The per-pull-request fast tier stays automatic. This repository's own workflows are unchanged by this guide.

## Platform and host discovery checks

The host-native integration check uses the locked host dependencies, an isolated profile and a loopback synthetic provider. It discovers the packaged roles and checks worker/reviewer model and effort, tools, workspace effects, returned errors and cancellation without real model calls. Missing required host prerequisites are reported as structured `BLOCKED` with exit code 2; existing but broken dependencies remain failures. Pi-only mode does not require the unused Claude executable. The portable quality summary explicitly marks this separate required check `NOT_RUN`; the CI native-host check must pass and a `BLOCKED` result cannot pass its gate. It does not certify Claude live delegation, background execution or OS containment.

```bash
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
node tests/host-native-delegation.mjs .
```

The Quality workflow keeps the full Linux quality and Bubblewrap job. Its native Linux/Windows matrix runs the focused source-writer fault checks and builds and installs one Bun artifact per platform. Each installed artifact exercises initialization and the pinned plan tool's successful prepare/repeat and uncertain-claim refusal; a Node release-launcher journey checks the same shared path. Windows owner records bind PID, process-creation time and OS boot time; unknown evidence fails closed. Linux retains its existing owner format and fatal directory-sync checks. Windows omits unsupported directory flushes and does not claim equivalent directory-entry persistence after power loss. `tests/state-interruption.mjs` stops a real Node release-launcher `migrate-state` owner at three migration steps on both platforms, terminates it and runs public `recover-state`, with refusal controls; the compiled Bun artifact is not covered there. These checks cover the shared CLI path used with Pi and Claude resources, not live model execution, power-loss durability, worker execution or OS isolation. The matrix also covers exact release receipts, CLI version and read-only inspection, paths with spaces and Unicode, external Git worktrees and native host discovery. Windows does not assert POSIX permission modes.

The matrix installs development-only hosts from `tooling/host-tests/package-lock.json`, with lifecycle scripts disabled. Pi 1.4.0 installs the package in temporary user and project scopes; its real resource loader must discover all sixteen skills from the installed artifact, with an empty pre-install control. Claude Code 2.1.299 installs the local marketplace/plugin and must report those skills through its native component inventory. The test invokes the platform-native binary supplied by Claude's optional dependency, without running its installer script. No prompt, agent session, login or provider credential is supplied. Temporary home/config directories and disabled telemetry limit incidental activity; they are not proof of network isolation. These are installation/discovery checks, not live task or delegation evaluations.

To run the additional checks locally, select an absent output directory outside the repository. These examples use a Bash-compatible shell; on Windows supply an absolute Windows path for the output directory:

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
export ISSWF_PLATFORM_ROOT="/absolute/absent/platform-output"
node tests/platform-package.mjs .
node tests/host-discovery.mjs .
```

The artifact builder reads committed HEAD, while static source checks read the working tree. The tests require the pinned host dependencies and Bun; missing tools or missing skills fail rather than silently skip. Re-running needs a fresh output path. CI retains platform/discovery reports and Claude's observed skill inventory for 14 days. A configured matrix is not evidence that every platform passed; inspect the exact run before claiming support.

## Keep this source checkout separate from an installed release

This repository should use its source skills, not a second copy from your installed release. Its shared `.claude/settings.json` disables the distributed `isswf@isswf` plugin only here. Other projects and plugins retain their settings. To inspect the source plugin explicitly, run Claude with `--plugin-dir` pointing to this checkout. Personal `settings.local.json` overrides can still take precedence.

Pi identifies a local package by its installation path, not its manifest name. A shared JSON rule cannot identify every possible release directory. The versioned helper below uses the locked Pi SDK's installed-package inventory to generate local filters for external packages named `isswf-pi-resources`. It does not resolve, download or install packages, or change user settings. It refuses custom package-manager commands and conflicting project choices instead of executing or overwriting them.

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
node tooling/maintenance/source-host-isolation.mjs
node tooling/maintenance/source-host-isolation.mjs --apply
```

The first helper invocation previews changes; `--apply` writes only `.pi/settings.json`. That file is ignored by Git because it contains machine-specific paths. The shared policy is the helper and Claude's project settings, not those paths. Existing unrelated settings and packages are preserved, and a repeated settled run changes no bytes. If there is no external installation, no Pi settings file is created. Re-run the helper after registering a release at a new location, before starting Pi in this checkout. Project trust is required for Pi's project filters; it is not granted automatically. Explicit temporary-package or personal overrides remain host-controlled. This is resource selection, not a security boundary or an installed runtime update.

The platform matrix also runs `tests/source-host-isolation.mjs` with temporary source and neighbour repositories. It checks a positive collision control, source-only selection, unchanged neighbour/global settings, unrelated resources, invalid-setting refusal and explicit Claude source discovery. It retains `source-isolation-report.json`; a local Linux pass is not proof of a Windows or remote CI run.

## Documentation conventions

Keep active factory instructions and operational resources in English. User-facing guides have matching English and Spanish-from-Spain versions; update both when changing their meaning or examples. Preserve user-authored records and historical evidence in their original language.

Keep the README approachable. Put exact execution, model, and recovery rules in their existing operational guides instead of repeating them across pages.

### Maintain the interactive workflow flowchart

[`docs/diagrams/flow.json`](../diagrams/flow.json) is the single source of the two interactive pages `docs/en/workflow.html` and `docs/es/workflow.html` and of the two README images `docs/en/workflow.svg` and `docs/es/workflow.svg`. Each node, question, automatic check and edge has a stable `id` and English and Spanish text, and each question cites the repository files that support its answer. Edit the data, never the generated pages, and keep each answer true to the cited file. Exact role, skill and file names stay the same in both languages.

```sh
node tooling/maintenance/workflow-flow.mjs
node tooling/maintenance/workflow-flow.mjs --check
```

The first command rewrites both pages and both images. The pages are single files with inline CSS and JavaScript that work offline; the images are described below. The second needs only Node.js and git. It writes nothing and fails when a field lacks its English or Spanish text, an ID repeats, an edge or question destination names an unknown node, a cited path does not exist at `HEAD`, or a page or image differs from what the data produces. `node tools/check-quality.mjs` runs it, and `tests/workflow-flow.mjs` tests each failure with disposable fixtures. These checks do not open a browser or verify that a translation or an answer is accurate: read both pages after a change.

### Maintain the workflow diagrams

The README shows `docs/en/workflow.svg` or `docs/es/workflow.svg`, which the same command writes from the same data file as the interactive pages. The image has one box per node and one arrow per edge, and no script, link or question text. It paints its own light panel, so it stays readable on GitHub's light and dark backgrounds. Edit `docs/diagrams/flow.json`, never an SVG by hand, and rerun the generator after a change to the flow.

`--check` fails when an image differs from what the data produces. `tests/workflow-flow.mjs` covers a stale image, escaped markup and the absence of script, but nothing renders an image: a box grows with its wrapped text, so a long label can collide with an arrow label. Open both SVGs in a browser after a change. `.github/workflows/pages.yml` publishes only the two interactive pages and the landing page, never the images.

### Maintain the first-session animations

[`docs/diagrams/first-session.json`](../diagrams/first-session.json) is the single source of four README images: `docs/en/first-session.svg` and `docs/es/first-session.svg` (a simulated terminal session) and `docs/en/initiatives-panel.svg` and `docs/es/initiatives-panel.svg` (a simulated Claude Code initiatives panel). Each step has English and Spanish text, a delay and the repository file that supports what it says; the panel data lists its jobs, frames and the labels it copies from `hooks/register.tsx`. A frame whose job is pending shows the initiative only under Inactive, as the panel does, and a caption too long for the image is refused. Edit the data, never an image, and keep each step true to its cited file. Both images carry a visible "simulated" label, use demo data and are not recordings.

```sh
node tooling/maintenance/first-session.mjs
node tooling/maintenance/first-session.mjs --check
```

The first command rewrites the four images; the second needs only Node.js and git, writes nothing and fails when a field lacks its English or Spanish text, a step ID repeats, a cited path does not exist at `HEAD`, or an image differs from what the data produces. `node tools/check-quality.mjs` runs it and `tests/first-session.mjs` tests each failure with disposable fixtures. The images animate with CSS only (no script), follow the viewer's light or dark setting and, with reduced motion requested, show every step or the last panel frame at once. Nothing renders them in a test: open both languages in a browser, in light and dark, after a change.

To measure CI wall-clock minutes per pull request branch and per push (development only; the script makes no network calls):

```sh
gh run list --limit 100 --json event,headBranch,conclusion,createdAt,updatedAt,databaseId | node tooling/maintenance/ci-minutes.mjs
```

It prints the run count, cancelled count and total minutes for each `<event> <branch>` group, and a grand total.

To measure what one initiatives-pane snapshot read costs a project (development only; direct Node reads, so the Claude pane, which routes each call through the host, is slower):

```sh
node tooling/maintenance/snapshot-cost.mjs --project /absolute/project --runs 5
```

It prints the file-system calls by kind and the median and minimum read time in milliseconds.

## Source of truth and history

Check actual tools, manifests, and tests before documenting current behaviour. Use [the source map](architecture.md) to find the owner. Keep accepted objectives distinct from implementation evidence and [future proposals](future-actions.md).

Retired documentation is available in Git history.

## Before publication

Check the actual candidate, the required review, and the permission to publish. Keep the package, core, and plugin version aligned. Do not claim npm availability, platform equivalence, or successful live integrations without evidence.

The project uses the MIT License. Publication remains a separate authorised action.
