# Install and update isSWF

Install one package for Pi, Claude Code, or both. Initialize each target repository separately. Installation loads instructions and tools; it starts no agents or background service and grants no execution permissions.

This guide describes the complete release package. The older Markdown-only materialization remains documented in [project activation](source-activation.md).

## Build a release before publication

From the development checkout, use a full committed revision:

```sh
node tools/build-release.mjs --source /absolute/isSWF --revision FULL_COMMIT_SHA --output /absolute/releases/isswf-1.4.0 --runtime bun
```

The builder defaults to `--runtime bun`. Building needs Node.js, Git, and a trusted Bun compiler on PATH. Bun 1.4.3 is the locally tested compiler; `--bun /absolute/bun` selects it explicitly. The installed core executable needs neither Node.js nor Bun on PATH. The compiler enables `--compile-autoload-package-json` so generated tasks can resolve the existing host SDK and its transitive dependencies. Host applications, project checks, SDKs, Git, and isolation tools retain their own prerequisites. The output must not exist and must be outside the source repository. The builder reads committed blobs, not dirty working files. The output includes the runtime, English shared instructions, Claude entry points, selected guides, templates, model defaults, and preserved historical methodology sources. New releases set `methodologySha` to their committed source revision, so new installed jobs consume the English profiles and references. Historical sources remain pinned to their original bytes for provenance; existing attempts and retained releases are not rewritten. It excludes Git history, project initiatives, tests, development dependencies, audit archives, and credentials.

Each Bun release contains `bin/isswf` on Unix or `bin/isswf.exe` on Windows, bundled tool code, and agent-readable resources. Original `.mjs` files remain as verified provenance, dynamic helpers, and inputs for immutable task/lifecycle snapshots; they are not a second installed CLI to select instead of the executable. Generated tasks are interpreted by the embedded Bun engine. Development remains Node.js with `.mjs`. The release receipt records the source revision, file hashes including the executable, and Git blob identities for packaged source reads. It detects accidental damage; it is not a signature, permission grant, or proof that an untrusted publisher is safe.

Pinned source batches perform one fresh, complete release verification, then check each selected payload against its SHA-256 and Git blob identity. There is no persistent integrity cache: a later batch or singleton read verifies the release again, including unrelated inventory. Missing or corrupt released sources remain fatal rather than falling back to a checkout or latest revision.

To produce a local npm tarball, run:

```sh
npm pack /absolute/releases/isswf-1.4.0 --ignore-scripts --pack-destination /absolute/releases
```

No public npm package or remote marketplace is published by these commands. The package retains the name `isswf-pi-resources`; the executable is `isswf` when an npm installation exposes its bin. Pi and Claude users invoke the bundled executable directly without a second npm installation. The generated package manifest records its operating system, architecture, Bun version, and target. The same package version is used by the core and both integrations.

## Choose a target and preserve older runtimes

`--target` accepts `bun-linux-x64`, `bun-linux-arm64`, `bun-darwin-x64`, `bun-darwin-arm64`, `bun-windows-x64`, or `bun-windows-arm64`. Omit it for the build host. Build a separate package per target and keep npm tarballs in separate target directories, because npm names them by package name and version. Cross-compilation can require a target-runtime download by Bun; it does not prove target execution or authorize network access. The native Linux x64 artifact is tested locally. Other targets are build options, not verified support claims. The current complete installed workflow, mutation recovery, and isolated workers still require Linux. Read-only observation does not establish native Windows or macOS mutation support.

For development fixtures or retained legacy consumers, `--runtime node` produces the original Node-based layout. New binary launchers select a pinned binary from its retained release. A legacy Node pin still requires Node on PATH when invoked from Bun; it is not silently reinterpreted with a different engine or replaced with the newest binary. Updating that pin requires explicit migration. A binary for another operating system or architecture is refused.

The examples below use a Bun release. On Windows, use `bin/isswf.exe` instead of `bin/isswf`. For a legacy Node release, use `node RELEASE/tools/isswf.mjs` only according to that release's own guide.

## Install for Pi

Install the trusted built directory globally or for the current project:

```sh
pi install /absolute/releases/isswf-1.4.0
pi install /absolute/releases/isswf-1.4.0 --local
```

Choose one scope. Project scope changes `.pi/settings.json` and requires Pi project trust. Global scope makes the skills available across repositories but creates no project `.isswf`.

After a release is published to npm, Pi also supports `pi install npm:isswf-pi-resources@VERSION`, with `--local` for project scope. That is a publication-dependent command, not a claim that this version exists in the registry. Loading the development checkout is not the complete release installation.

Invoke `/skill:isswf-setup` in the target repository. The skill resolves its bundled CLI path; a Pi package installation need not put `isswf` on your shell PATH.

## Install for Claude Code

The built release contains a local marketplace and plugin. Register and install it with Claude's own manager:

```sh
claude plugin marketplace add /absolute/releases/isswf-1.4.0
claude plugin install isswf@isswf --scope user
```

Use `--scope project` instead of `user` for shared project settings, or `--scope local` for private project settings. Each collaborator still needs the plugin installed. Invoke `/isswf:isswf-setup`.

For a one-session evaluation without installation:

```sh
claude --plugin-dir /absolute/releases/isswf-1.4.0
```

These commands do not configure Pi models as Claude models. Claude's native delegation still has the limitations in [host portability](host-portability.md).

## Initialize a repository

The setup skill first discovers the current Git root, existing state, pin and interrupted operations. It resolves trusted source identity locally rather than requesting a manually entered path or SHA. It asks for unresolved tracking and model/effort choices, showing host capabilities separately from pinned-executor restrictions. Existing selections are preserved unless changes are approved. Missing discovery, unsupported executors or unavailable host-specific persistence leave the affected selection pending; model discovery does not make provider calls or prove account coverage. Migration and recovery are detected, never implicitly authorized by setup.

Setup also resolves the stable workspace, supported executor/isolation, finite execution/correction limits, protected checks and delivery destination for [normal feature-to-PR work](../.agents/roles/references/feature-delivery.md). Missing required choices or readiness evidence leave it partial; existing settled choices do not need a new interview for every feature. The current trusted feature start supplies its bounded assignment authorization, not the saved setup record. Current availability and ownership preflight still apply, and integration into the base remains a separate human decision.

Use the setup skill for that guided flow, or the bundled CLI for noninteractive inspection and initialization with defaults. The CLI does not implement the host model-selection interview. In the following examples, `RELEASE` means the absolute installed release directory, not the source checkout:

```sh
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf init --project /absolute/project --tracking local
```

For GitHub tracking, explicitly select `--tracking github --repository owner/repo`. This records a tracking choice, not permission to access GitHub. An existing `.isswf/project-setup.md` is preserved; reconcile its choices separately instead of supplying replacements during initialization.

The target must be an existing Git root. Initialization creates `.isswf/install.json` and only missing setup/model-default files. It does not replace existing model choices, initialize a Git repository, authenticate a provider, install system dependencies, or run project scripts. Inspect the returned changed paths and checkpoint the intended shared files in Git.

The default private runtime store is `~/.local/share/isswf`. Override it with `ISSWF_STORE` or an absolute `--store` on every command. It must be outside the project and installed package. Bun releases use receipt format 2. Their portable `runtimeId` binds the committed source/resource inventory, original committed package manifest, and Bun version. The generated target manifest and executable have separate full-receipt `artifactId` hashes. The project pin records `runtimeFormat: 2` without an operating system or machine-specific path. Initialization retains the native package under `releases/<runtimeId>/<platform>-<arch>` and writes its exact artifact hash to the sibling `<platform>-<arch>.sha256` anchor. Every retained lookup checks that anchor, even if someone changes both the binary and its receipt consistently. Rebuilding the same logical release does not replace an already retained artifact.

On another machine, use its trusted native artifact from the same source revision and Bun version to restore the local variant without changing the shared pin, subject to that platform's existing capability limits. An interrupted retention with a published anchor must resume from the identical artifact; a different artifact is refused. Preserve incomplete staging and the anchor for inspection rather than deleting them. Alternatively restore that host's exact runtime directory and anchor into its selected store. A missing retained runtime blocks rather than selecting another version. Format-1 Node receipts and legacy pins without `runtimeFormat` keep the original `releases/<receipt-sha256>` layout and identity.

Private migration journals, backups, and cooperative activity records live under `.isswf/local`. New projects receive `.isswf/.gitignore` containing `local/`. If an existing ignore file does not exclude that directory, add the exclusion before committing project files. No credentials are copied there. Store backups according to your own retention policy; isSWF does not remove older runtimes or migration records automatically.

## Move an existing `.factory` to `.isswf`

New installations use `.isswf`. Existing source-checkout projects can keep their legacy `.factory` until an explicit transition. The tools refuse to select between two directories if both exist.

From a built release, inspect the legacy inventory without changing files:

```sh
RELEASE/bin/isswf inspect --project /absolute/project
```

Checkpoint the legacy state in Git and reconcile its writers. Move it with the exact inventory digest returned under `stateMigration.expected`:

```sh
RELEASE/bin/isswf migrate-state --project /absolute/project --id S0001 --expected INVENTORY_DIGEST --quiescent-ref OPERATOR_RECONCILIATION_REFERENCE
```

This operation renames the whole directory on the same filesystem. It changes no file contents, modes, historical links, or Git checkpoints and creates no second active state directory. Its private journal lives in the selected runtime store. Symlinks, special files, interrupted claims, known legacy activity, dirty/untracked files, and inventory drift block the move. The inventory is bounded to 10,000 entries and 64 MiB of regular file data; larger projects require a separately designed migration.

Initialize afterward to add only missing installation/configuration files. Existing setup decisions and models remain unchanged. Historical `.factory` references still identify their original Git checkpoints; they are not rewritten to pretend old records were created elsewhere. Old copied tools are retained as bytes, not upgraded in place; use the new pinned launcher for ongoing work.

If the move process stops with `.isswf-transition` retained, inspect its journal and run `recover-state --project /absolute/project --id S0001` through the same release/store. Recovery requires a stopped owner and exact unchanged inventory at one location. It reconciles a completed rename or an unchanged original directory. It never merges directories or guesses over drift. Claims are published with complete owner and recovery metadata. Recovery can reconstruct an absent journal from that claim; malformed metadata remains blocked for manual inspection.

## Run with the project's version

A newer globally installed package can coexist with an older project pin. Locate the selected runtime or run a supported tool through the launcher:

```sh
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

The launcher verifies the retained package and selects the project's pinned runtime, not the latest global runtime. Use the selected runtime's own guides and profiles when preparing work. The launcher supplies the target project; forwarding a different `--project` or `--repo` is refused.

Execution still requires the existing native job contracts, external grants, SDK/authentication, supported routes, and Linux isolation where applicable. Installing every caller does not make every route or host capability available.

## Update the installation, then migrate a project

Update the Pi package with `pi update <configured-source>`, or install a newly built version. Fixed Git/npm references remain fixed until you explicitly select another reference. For Claude, refresh its marketplace and update the installed plugin with `claude plugin update isswf@isswf`. A marketplace pointing at an immutable local release must first be switched to the intended new release through Claude's manager.

Restart or reload the host to load updated skills. Neither package update nor host reload writes `.isswf/install.json`.

Inspect from the new release:

```sh
NEW_RELEASE/bin/isswf inspect --project /absolute/project
```

The result includes the current and available versions, proposed managed paths, `expected` digest, known execution blockers, and any interrupted operation. Inspection writes neither project nor store files. For this first release, migration changes only the installation pin. No project-data format conversion is needed; unknown schema versions are refused instead of guessed.

Before migration, checkpoint `.isswf/install.json` in Git and reconcile all external writers, including native Claude agents and source-checkout jobs not launched through this CLI. Then explicitly migrate:

```sh
NEW_RELEASE/bin/isswf migrate --project /absolute/project --id M0001 --expected DIGEST_FROM_INSPECT --quiescent-ref OPERATOR_RECONCILIATION_REFERENCE
```

`--quiescent-ref` records an operator attestation, not technical proof or authentication. The CLI additionally blocks its registered active or unreconciled leases and native workers without verified cessation evidence. An unknown state is not idle. Native workers currently require the existing successful worker-cessation proof to clear this gate; failures and interrupted attempts stay blocked for separate reconciliation. No saved Markdown status can clear it.

Migration verifies the old and new runtimes, preserves the old runtime, saves exact before/after bytes in a private journal, and publishes the pin through same-directory rename. It preserves unknown pin fields and records a new generation. Repeating a settled migration is a no-op. A conflicting ID, dirty affected file, changed digest, corrupted runtime, or unresolved operation refuses without overwriting operator work.

Historical plans, briefs, attempts, reviews, and evidence are outside the migration allowlist. Model routes and tracking choices are not changed during version migration. A future data-schema change needs a deterministic, explicit migration added to this contract, not a model-generated conversion.

## Roll back or recover an interruption

After checking the migrated pin into Git, restore its prior installation with:

```sh
NEW_RELEASE/bin/isswf rollback --project /absolute/project --id M0001 --quiescent-ref OPERATOR_RECONCILIATION_REFERENCE
```

Rollback requires exact matching post-migration bytes and the old verified runtime. It does not overwrite subsequent edits or a later generation. It records a separate rollback journal and never deletes the original migration or historical project work.

If a migration process stops between publication steps, its cooperative claim and backup remain. Run `inspect`, review the journal, and explicitly recover:

```sh
NEW_RELEASE/bin/isswf recover --project /absolute/project --id M0001
```

Recovery requires evidence that the migration owner is no longer the same live Linux process. An incomplete migration restores its recorded before-bytes; a fully published migration verifies its after-bytes before clearing its leftover claim. Operator drift blocks recovery. The atomically published claim retains a complete recovery record, so recovery can reconstruct a journal not yet published. Malformed or mismatched metadata remains blocked for manual inspection.

This is cooperative coordination on trusted local directories, not protection against hostile writers or a system-wide scheduler. A killed tool lease is deliberately retained. Reconcile that process and any children before an operator retires the lease; there is no force-unlock command. Keep external host writers stopped during migration and recovery. No power-loss-wide multi-file transaction or cross-store execution isolation is claimed.

## Remove the integration

Use `pi remove <configured-source>` or Claude's plugin manager. Removal does not delete project `.isswf`, private migration backups, or retained runtimes. No automatic garbage collection is part of uninstall.
