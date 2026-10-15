# Task 44 — shared fixed-version Pi package and project activation

**Status:** scoped implementation authorized by the operator's Task 44 instruction. This brief is subordinate to the authoritative contract at `/home/iseoane/Work/isSWF/.audit/activation-44-decision.md`. The referenced parent `activation-44-build-brief.md` was absent at dispatch; this file records the worker's bounded implementation and verification contract. No commit is authorized.

## Objective

Provide one existing-Node command to materialize an explicit local Git commit into an operator-supplied shared store and activate that package in one named project. Pi exposes exactly the `isswf-coordinator` and `isswf-setup` skills from the package. Activation edits only an existing project's `.pi/settings.json` and preserves all other settings.

## Base, ownership, and model

- Writable checkout: `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a79874a42b1bb0ec7`.
- Implementation base: `fc598ae8543711241c4ba5de16188dffce9257cd`.
- One worker owns this checkout. No agents, commits, network, package installation, Python, providers, remotes, global settings, or parent fixture changes.
- Profile: `.agents/roles/worker.md`; applicable references: design, execution, verification, code quality, comments, and TDD principles.
- Requested and observed route: `worker` → `openai-codex/gpt-6-luna`, high effort. Runtime metadata observed in this session: `openai-codex`, `gpt-6-luna`, high.

## Authorized write set — exactly seven paths

1. `package.json`
2. `tools/factory-package.mjs`
3. `docs/activacion-por-proyecto.md`
4. `.agents/skills/isswf-coordinator/SKILL.md`
5. `docs/durable-work.md`
6. `.audit/verify-activation-44.mjs`
7. `.audit/activation-44-build-brief.md`

No other path is to be written.

## Contract and exclusions

- Materialize committed regular blobs from a local source repository at an explicitly supplied full SHA. Never use `HEAD`, a branch, a tag, a fetch, or the source working tree as payload.
- Use an explicit absolute store. Export only the two skill directories, their approved role/reference closure, durable-work/routing guides, three templates, `.factory/models.json`, and the package manifest. No extensions, dependencies, additional skills, Python, audit history, or project files.
- Record revision and payload SHA-256 values in a receipt. Verify all files on repeat and before activation. Refuse malformed or conflicting package state; do not replace a version. Sequential stage/rename only; no concurrency lock, recovery, hostile-writer guarantee, authorization claim, or security boundary.
- Activation requires a separate absolute project path and an existing, valid, Git-tracked, clean settings file. Add one package entry, preserve every other setting, and make exact repeat activation byte-identical. Refuse malformed, dirty, duplicate/conflicting state without changing project bytes. Never change `AGENTS.md`, models, active attempt pins, or global settings.
- The package's full-SHA directory and receipt identify installed resources, **not** a target job's document-input checkpoint. The package is not a Git checkout. A trusted grant must still identify the source checkout and full SHA for checkpoint-pinned reads with existing Git. Do not alter durable pin rules or add a resolver/runtime.
- Do not upgrade, replace, deactivate, orchestrate multiple projects, claim role execution/client readiness, or claim sandboxing/lifecycle/recovery.

## Grounding

- `docs/arranque-por-proyecto.md` and `docs/next-operational-cut.md`: fixed shared source and explicit activation boundary; no whole-factory copy or `AGENTS.md` overwrite.
- `.agents/skills/isswf-setup/SKILL.md`: explicit source/target, source checkpoint and preservation of unknown settings; target config is not initialized implicitly.
- `.agents/skills/isswf-coordinator/SKILL.md`: historical U1/U2 use of `isswf-triage`, role profiles, contextual references and workflow boundaries. Only the historical triage reference paragraph changes to an English code-span/unavailable-package boundary; preserve the conditional source-checkout flow.
- `.agents/roles/{worker,diagnostician,reviewer}.md`, `.agents/roles/references/{bug-diagnosis,design-principles,execution-principles,verification-principles,tdd,code-quality,comments,review}.md`, `docs/{durable-work,model-routing}.md`, `docs/templates/{job-brief,attempt,review}.md`, and `.factory/models.json`: explicit approved payload closure.
- `docs/durable-work.md`: keep checkpoint semantics unchanged; convert initiative-specific spec/plan links to code spans and clarify that package version/receipt is not a Git checkpoint.
- `.audit/project-package-proof.md` and `.audit/verify-project-package.mjs`: prior real Pi RPC pattern only. The old verifier is not run because it invokes Python and uses a different candidate.
- Installed Pi 1.2.0 docs read completely where relevant: `docs/packages.md`, `skills.md`, `settings.md`, `security.md`, `cli.md`, `configuration.md`, `rpc.md`, `rpc-commands.md`, and `environment-variables.md`. In particular: local package path identity is resolved absolute path; project package declarations are trust-gated; RPC `get_commands` reports skill source paths; project trust is not a process boundary.

## Acceptance and checks

- A verifier creates a unique synthetic local Git repository and candidate commit from the exact current seven-path package candidate plus excluded audit/Python decoys. It reports that SHA separately from the implementation base; no claim that uncommitted candidate files exist at the base.
- Exercise exact allowlisted export; repeat and conflicting/tampered materialization; settings preservation; dirty, malformed, and conflicting activation refusal; byte-identical repeat; unchanged `AGENTS.md`, project models, and attempt bytes.
- Run actual installed Pi 1.2.0 RPC `get_commands` with `--approve` and `--no-approve`, offline, without prompts/model/provider/auth, with isolated `HOME` and `PI_CODING_AGENT_DIR`, bounded process time/output, and exact skill source paths.
- Retain the verifier's unique fixtures for independent inspection. Do not touch parent fixture-v2. Report checks, exact fixture paths, observed outcomes, and limits.
