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
| `docs/` root | Stable English technical resources; historical material is catalogued separately. |

The development repository may still keep its own records under the legacy `.factory/`. That is not a reason to migrate them as part of an unrelated code or documentation change.

Read [AGENTS.md](../../AGENTS.md) before making changes. Keep the work bounded and preserve existing operator edits.

## Build a local release

If you have repository access, obtain the source:

```bash
git clone https://github.com/iseoane/isSWF.git
cd isSWF
```

Choose a commit that contains the complete release tools. The builder reads that commit, not uncommitted edits. If the installation work has not yet been committed in your checkout, do not expect the earlier commit to contain it.

Use the full commit SHA in place of `FULL_COMMIT_SHA` and an absent output folder outside the source repository:

```bash
node tools/build-release.mjs --source "$PWD" --revision FULL_COMMIT_SHA --output /path/to/isswf-release
```

That folder is what the [installation commands](installation.md) use. Building it does not publish to npm, register a marketplace, or change another project's version. The SHA identifies the chosen source; installing the prepared folder does not create a new source revision.

The [technical installation guide](../installation.md) covers tarballs and the exact package checks.

## Quality checks

Use Node.js 24 or later with npm and Git. Run the portable checks from the repository root:

```bash
node tools/check-quality.mjs
```
The portable check includes `node tooling/quality/check-docs.mjs`: it checks current guide mirrors, local links, section coverage, identical shell examples, and the archived originals' bytes and modes. It also rejects retired paths reintroduced into active documentation and archived audit procedures copied into current technical guides. It does not prove translation quality or execute the examples.


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

ESLint performs lint and static checks; Knip reports unused files, dependencies, exports, and unresolved references within its configured scope. Neither is a proof that every dead-code path has been found. There is no separate compile or type-check step for these JavaScript modules.

These tools help find mistakes and unused code. They do not replace the checks needed for a particular feature or prove that a real agent run succeeded.

## Documentation conventions

Keep active factory instructions and operational resources in English. User-facing guides have matching English and Spanish-from-Spain versions; update both when changing their meaning or examples. Preserve user-authored records and historical evidence in their original language.

Keep the README approachable. Put exact execution, model, and recovery rules in their existing operational guides instead of repeating them across pages.

## Source of truth and history

Check actual tools, manifests, and tests before documenting current behaviour. Use [the source map](architecture.md) to find the owner. Keep accepted objectives distinct from implementation evidence and [future proposals](future-actions.md).

Earlier specifications, pilot notes, and research are retained in the [history catalogue](../history/README.md), not the active usage path. Do not rewrite pinned records or existing operator edits to match a new guide.

## Before publication

Check the actual candidate, the required review, and the permission to publish. Keep the package, core, and plugin version aligned. Do not claim npm availability, platform equivalence, or successful live integrations without evidence.

The project uses the MIT License. Publication remains a separate authorised action.
