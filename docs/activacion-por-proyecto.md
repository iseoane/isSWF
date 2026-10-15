# Activate the isSWF Pi resources in a project

This procedure publishes one fixed isSWF Pi resource version in an operator-owned local store and enables that package in one existing project. It does not install a runtime, register native agent roles, run a job, or grant permissions.

## Requirements

- Node.js and Git are already available; this command installs no dependencies.
- The source repository is a local Git repository and the requested revision is a full commit SHA.
- The store is an absolute path outside the source repository after resolving existing symlinks; it may not overlap the source tree, including when the store does not exist yet beneath an aliased ancestor.
- The target is an existing Git project with an existing, valid, Git-tracked, clean `.pi/settings.json`.
- The materialized package is stored outside the target project.

## Materialize one fixed version

From the source checkout, run:

```sh
node tools/factory-package.mjs materialize \
  --source /absolute/path/to/isSWF \
  --revision <full-commit-sha> \
  --store /absolute/path/to/shared-iswf-store
```

The command reads committed Git blobs at that exact SHA. It does not inspect `HEAD`, resolve a branch or tag, fetch, or use the working tree. It resolves the source and the store's existing path components before checking that their canonical trees do not overlap. The resulting package directory is `/absolute/path/to/shared-iswf-store/<full-commit-sha>`. It contains the package manifest, exactly the selected regular resource files, and a receipt containing the revision and SHA-256 payload hashes. A repeat verifies the receipt and every payload hash before returning without rewriting. Missing blobs, non-regular selected entries, an invalid manifest, tampering, or a conflicting destination fail without replacing it.

The package manifest exposes exactly the `isswf-coordinator` and `isswf-setup` skills. Their supporting role instructions, references, durable-work and routing guides, three templates, and canonical `.factory/models.json` are included. Other skills, extensions, prompts, themes, audit material, Python code, and project files are not exported. Model routing remains versioned resource data; it is never copied into project settings.

## Activate in one project

```sh
node /absolute/path/to/isSWF/tools/factory-package.mjs activate \
  --package /absolute/path/to/shared-iswf-store/<full-commit-sha> \
  --project /absolute/path/to/project
```

Activation resolves the package and project to canonical paths, refuses overlapping trees, and verifies the receipt and payload hashes before changing settings. It appends the package's absolute path to the existing `.pi/settings.json` `packages` array, preserving all unrelated settings and package entries. If this exact package is already declared, activation is a byte-preserving no-op. If another version of the `isswf-pi-resources` factory package is already declared, activation refuses without upgrading, replacing, or adding a second version. Malformed settings, a dirty settings file, a conflicting or duplicate declaration, or a missing settings file also causes refusal without changing project bytes. The update is written to a same-directory temporary file and renamed into place.

Pi loads project package declarations only after project trust is granted. Review the package and project declaration before approving trust. Project trust is not a process boundary or sandbox. Skill discovery means Pi can advertise the instructions; it does not prove the skills can complete a task, that `agent` is available, or that a worker runtime is safe or ready.

## Git checkpoint boundary

A materialized resource package is not a Git checkout. Its full-SHA directory name and receipt identify the packaged resource version; neither is the target job's document-input checkpoint. When a trusted grant requires checkpoint-pinned reads, it must still name the source checkout and full Git SHA. Read checkpoint files from that source with the existing Git workflow (for example, `git show <full-sha>:<path>`). Do not treat the extracted package as a Git source or add a resolver/runtime to bridge the two.

## Operational limits

This command supports one explicit materialization and one project activation. It refuses a different existing version of the same factory rather than upgrading, replacing, or adding another version. It does not deactivate packages; change model choices, `AGENTS.md`, global Pi configuration, or project model configuration; recover interrupted work; or coordinate concurrent writers. Canonical path checks prevent accidental source/store or package/project overlap through existing symlinks; they are not a defense against concurrent path replacement or hostile writers. Same-directory rename helps with sequential write failure only. The store is trusted operator-owned input; a SHA and receipt are integrity checks for accidental damage, not authorization or a security boundary. No claim is made about full role execution, client readiness, sandboxing, lifecycle, or recovery.
