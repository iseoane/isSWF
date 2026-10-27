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

The repository's `.gitattributes` keeps text checkouts in LF on Windows and Linux, even with `core.autocrlf=true`; detected binary files are unchanged. This preserves exact runtime-to-Git byte checks and resource frontmatter. Do not normalize bytes inside integrity verification or disable its checks. Adding attributes does not rewrite an existing working copy: if an older checkout still has CRLF runtime files, preserve local work and use a fresh clone of the revision containing this policy. Do not force-reset a dirty checkout or change global Git settings to hide the mismatch.

Keep source development on Node.js and `.mjs`. Install a trusted Bun compiler for release construction only. Bun 1.4.3 is the locally tested compiler. The builder defaults to Bun, while `--runtime node` retains the original development-fixture layout. Choose a commit that contains the complete release tools. The builder reads that commit, not uncommitted edits. If the installation work has not yet been committed in your checkout, do not expect the earlier commit to contain it.

Use the full commit SHA in place of `FULL_COMMIT_SHA` and an absent output folder outside the source repository:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release --runtime bun
```

That folder is what the [installation commands](installation.md) use. Building it does not publish to npm, register a marketplace, or change another project's version. The SHA identifies the chosen source; installing the prepared folder does not create a new source revision.

The compiler enables `--compile-autoload-package-json` so generated tasks can resolve the existing host SDK's package entry and transitive dependency exports. This does not bundle or install that SDK. The executable also resolves relative `.mjs` task paths from the working directory.

Use `--target` to select a separate Linux, macOS, or Windows artifact. These are compile targets, not verified platform parity. Native Windows tool and lifecycle checks are described below; complete setup, installation migration/rollback and real-provider journeys remain separate verification gates.

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

The portable review-guidance check verifies four executable fixtures: two behavioral defects with passing but insufficient checks, and two valid changes. It checks the fixture ground truth, not a model's review quality. To retain an evaluation bundle, select an absent directory outside the repository:

```sh
node tests/review-guidance.mjs . /absolute/absent/review-fixtures
```

Keep `oracle.json` and `probes/` out of a blinded review package. Live comparisons require separately authorized native calls with the same candidate, context, model and effort. Report missed defects and false alarms, preserve inconclusive results, and do not infer general improvement from one small sample.

## Platform and host discovery checks

The Quality workflow keeps the full Linux quality and Bubblewrap job. A separate matrix defines native Linux and Windows checks for Bun construction, npm tarball installation, exact resource receipts, CLI version and read-only inspection, initialization and first-plan publication/repeat, paths with spaces and Unicode, and external Git worktrees. Source checks also cover interrupted plan publication and retained-claim refusal. Windows does not assert POSIX permission modes. These package checks do not establish full Windows migration/recovery or worker isolation support.

The Windows-only `windows-state-migration.mjs` checks native directory publication, unchanged repeat, exact legacy bytes and paths, a single active state root, inventory guards and recovery drift/unknown refusal. Its recovery cessation predicate is injected, not a real killed-owner proof; mandatory regular-file flushes remain unchanged.

For subprocesses inside native Windows LPAC, inherit the controller-provided closed stdin handle and capture output with `stdio: ['inherit', 'pipe', 'pipe']`. Opening fresh `NUL` handles can be denied on hosted Windows. Inherited stdin is not a host terminal. Output remains captured through the bounded controller pipes; no ancestor ACL expansion is needed.

Three additional Windows-only suites exercise the native bounded-tool backend: `windows-tool-sandbox.mjs` checks LPAC access, environment, network, registry canaries, subprocesses, timeout, byte-bounded output and descendant cessation; `windows-sandbox-lifetime.mjs` checks alias refusal, interrupted startup and owner loss; `windows-worker-task.mjs` checks an actual installed compiled artifact's self-contained task with a synthetic SDK. They refuse legacy Node or implicit engine substitution. Run them after `platform-package.mjs`, retaining `ISSWF_PLATFORM_ROOT`. No provider calls are made. These are tool/task controls, not normal Windows job admission, lifecycle/recovery, complete setup or independent security acceptance. Abrupt owner loss may leave profile/ACL cleanup unconfirmed; preserve its ownership records. Output is bounded in memory, not written to unbounded capture files; writable filesystem scopes have no hard disk quota.

The selected compiled engine also accepts `-e`/`--eval` JavaScript with cwd-based `require` and forwarded arguments; `.mjs` execution remains supported. The sandbox's `node` alias uses that same pinned embedded Bun, not stock Node or an engine fallback. These are bounded runtime entry modes, not complete Node CLI compatibility. LPAC controls cover inline writes and outside-file refusal.

The Windows-only `windows-worker-admission.mjs` additionally exercises the installed pinned launcher and public worker caller with an external runs store/grant, synced exclusive admission, shared capacity, synthetic offline SDK task and bound capacity completion. It makes no provider call or independent product verdict.

Four further Windows suites cover strict worker identity, trusted SDK process containment, the existing detached lifecycle entry and actual compiled recovery/capacity integration. They bind boot, exact creation time, executable, native argv and nonce rather than PID alone. The trusted SDK task is not the model tool sandbox: its commands still use LPAC. Recovery requires a root Job receipt confirming zero descendants; owner disappearance alone is insufficient. After owner loss, reconciliation stays read-only and may return `stopped-review-required` with `profileCleanupRequired`, never silently clean up or retry. Successful capacity is archived only after bound task/tool/profile completion; interrupted attempts keep their slot. A separate same-runtime supervisor avoids detached PowerShell console/stdio loss without changing the selected engine or requesting host-job breakaway.

The native matrix also runs text-role caller contracts for reviewer, planner, diagnostician and researcher. These use injected transport/probe observations, not provider calls or actual Windows diagnostic isolation. Git roots are canonicalized, external scopes use native separators, and publication follows the shared directory-sync policy while regular-file flush failures remain fatal. The reviewer test injects such a failure before backend work and checks that the interrupted claim blocks replay. Positive fixture budgets allow native Git preparation time; explicit negative deadline controls remain separate.

The matrix installs development-only hosts from `tooling/host-tests/package-lock.json`, with lifecycle scripts disabled. Pi 1.4.0 installs the package in temporary user and project scopes; its real resource loader must discover all fourteen skills from the installed artifact, with an empty pre-install control. Claude Code 2.1.299 installs the local marketplace/plugin and must report those skills through its native component inventory. The test invokes the platform-native binary supplied by Claude's optional dependency, without running its installer script. No prompt, agent session, login or provider credential is supplied. Temporary home/config directories and disabled telemetry limit incidental activity; they are not proof of network isolation. These are installation/discovery checks, not live task or delegation evaluations.

To run the additional checks locally, select an absent output directory outside the repository. These examples use a Bash-compatible shell; on Windows supply an absolute Windows path for the output directory:

```sh
npm ci --prefix tooling/host-tests --ignore-scripts --no-audit --no-fund
export ISSWF_PLATFORM_ROOT="/absolute/absent/platform-output"
node tests/platform-package.mjs .
node tests/host-discovery.mjs .
node tests/windows-tool-sandbox.mjs
node tests/windows-sandbox-lifetime.mjs
node tests/windows-worker-task.mjs
node tests/windows-worker-admission.mjs
node tests/windows-state-migration.mjs
node tests/windows-worker-identity.mjs
node tests/windows-worker-host.mjs
node tests/windows-worker-lifecycle.mjs
node tests/windows-worker-recovery.mjs
node tests/windows-reviewer-task.mjs
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

### Maintain the workflow diagrams

The README previews and complete interactive diagrams share [one bilingual source](../diagrams/workflow.json). Keep node IDs, branches, source citations, and translations together. When the workflow changes, pin its repository revision and citations to the commit that supports the new behavior. Exact role, skill, and file names remain unchanged between languages. The overview omits detailed branches and references; the HTML retains them.

To regenerate both languages, use an existing Archify 3.2 CLI. Replace `/path/to/archify/bin/archify.mjs` with its installed path. This command uses a local browser for validation, writes the HTML and SVG files under `docs/en/` and `docs/es/`, and keeps local candidates and check receipts under `.archify/`. It does not install tools, enable GitHub Pages, or publish files.

```sh
node tooling/maintenance/workflow-diagrams.mjs /path/to/archify/bin/archify.mjs
node tooling/maintenance/workflow-diagrams.mjs --check
```

The second command needs only Node.js. It checks translation fields, preview references, generated SVG bytes, and HTML hashes against the portable generated manifest. The portable quality suite also tests these checks against disposable missing-translation, stale-source, invalid-reference, duplicate-ID, and modified-artifact fixtures. It does not rerun browser validation or verify translation meaning. Inspect both preview images and review the translations after regeneration. Local Archify delivery receipts contain machine paths and are ignored; the portable manifest is retained with the diagrams.

## Source of truth and history

Check actual tools, manifests, and tests before documenting current behaviour. Use [the source map](architecture.md) to find the owner. Keep accepted objectives distinct from implementation evidence and [future proposals](future-actions.md).

Retired documentation is available in Git history.

## Before publication

Check the actual candidate, the required review, and the permission to publish. Keep the package, core, and plugin version aligned. Do not claim npm availability, platform equivalence, or successful live integrations without evidence.

The project uses the MIT License. Publication remains a separate authorised action.
