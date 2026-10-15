# Task 44 — minimal shared-version activation (design B)

**Caller first:** the user runs ordinary `pi` in the target project. Project `.pi/settings.json` enables the two skills; discovery is not execution or a grant.

## Design

Use Pi’s configured `skills` resource paths directly, pointing to exactly the `SKILL.md` files for `.agents/skills/isswf-coordinator` and `.agents/skills/isswf-setup` inside an already-present, shared, read-only factory tree checked out at a full immutable Git SHA. Store those absolute paths in the project’s `.pi/settings.json`. Do not point at the whole `.agents/skills` tree: unrelated skills (including triage) are out of this payload, and activation does not claim every factory skill is usable. Keep supporting payload to the files those skills name: `.agents/roles/{worker,diagnostician,reviewer}.md`, `.agents/roles/references/{design-principles,execution-principles,verification-principles}.md`, `docs/{durable-work,model-routing}.md`, and canonical `.factory/models.json`. These are read-on-demand support files, not additional Pi skills; omit unrelated roles, docs, scripts, and repository content. This avoids copying the factory and does not require `pi install`, package installation, a package catalog, network access, or a package manifest. Pi documents project resource paths and skill files. Resource arrays combine, so activation must preserve other settings and existing skill paths.

Input: target project, shared-tree path, expected full SHA. Require exact `HEAD`, clean worktree and accessible skills; never resolve a moving ref or fetch. Verify the shared tree’s identity at activation/discovery. The path is project-pinned; SHA is provenance, not authorization.

A future implementation could be one Node CLI (existing Node/Git) and a short usage document. Edit only `.pi/settings.json`, intentionally adding two paths; refuse malformed settings or conflicting/dirty edits. Preserve every other key and choice; separately assert `.factory/models.json` and `AGENTS.md` byte-identical. Add each path once; repeat is a no-op. Deactivation, upgrades, recovery, multiproject orchestration, and installation are excluded.

Keep SHA/path/status metadata separate from grants; record it in the existing setup decision record when authorized. Do not store permissions in Pi settings, duplicate model routes, overwrite `AGENTS.md`, or change global settings. Activation grants no permissions and provides no isolation.

## Why not a Pi package manifest?

Pi supports local packages and explicit `pi.skills` manifests. Existing proof shows shared package discovery, not settings preservation. Two exact `skills` paths are smaller and exclude unrelated skills; reconsider a manifest only for multiple resource types.

## Evidence and limits

**Observed:** `docs/arranque-por-proyecto.md` and `docs/next-operational-cut.md` establish shared fixed-version source and project activation, without factory copying or `AGENTS.md` replacement. #62 preserves project decisions and refuses to create missing model config. `.audit/project-package-proof.md` and `verify-project-package.mjs` prove shared-path Pi 1.2.0 RPC discovery, not exact-file selection or settings preservation. Pi `skills.md`, `settings.md`, and `cli.md` document skill paths and trust. #65 proves a bounded SDK/tool boundary, not client-runtime isolation, MCP authority, lifecycle, or runtime44. No Python workflow, triage skill, or whole-repo audit is in scope.

## Offline verification plan (future, no model/runtime claim)

Use independent parent fixture `.audit/activation-44-fixture.json`, not generated from this design. On a disposable local full-SHA tree/project, offline and without credentials, model call, or worker runtime, activate twice. Assert only the intended two-path `.pi/settings.json` change; preserve other keys/choices, model config and `AGENTS.md` bytes, and shared-tree bytes. Pi 1.2.0 RPC `get_commands` (`--offline --no-session --no-mcp`) must discover exactly the two skills with project approval and neither without; no prompt/model request. This proves resource discovery only, not skill behavior, installer, model execution, or isolation. Dirty state, SHA mismatch, missing settings, or discovery failure blocks.

**Boundary:** this is a design proposal, not implementation or installation authorization. It covers only fixed shared source plus local project activation.