# Task 44A — minimal fixed-version activation design

**Status: design only; no implementation grant.** Scope: materialize one fixed factory revision in an explicit operator-owned shared store and activate it in one named project. Excludes MCP, multiproject orchestration, recovery, job lifecycle, isolation/security claims, and the historical Python/SQLite/worktree candidate.

## Caller experience (proposed)

```text
node tools/factory-package.mjs materialize --source <local-repo> --revision <full-git-SHA> --store <absolute-operator-owned-store>
node tools/factory-package.mjs activate --package <absolute-store>/<full-git-SHA> --project <absolute-project>
```

The operator supplies the store path. Materialization reads the named local Git commit only (no fetch, remote, install, or mutable checkout), exports a small explicit resource allowlist into a staging directory, then publishes at a SHA-named path without replacing an existing version. Reject a bad/incomplete manifest, missing required blobs, or any conflicting destination. Use only Node filesystem operations and Git plumbing; no Python or new dependency.

Activation changes only the project’s `.pi/settings.json`: add the package’s absolute path to its `packages` list, preserving other settings and entries. Do not modify `AGENTS.md`, `.factory/models.json`, model choices, or global Pi configuration. If settings are dirty, malformed, or contain a conflicting activation, stop unchanged; an already-identical entry is a no-op. Write via same-directory temporary file and rename so a failed write does not leave partial JSON. These rules cover sequential retries, not concurrent activation or recovery.

## Small package boundary (proposed)

Commit one root `package.json` declaring Pi skills at `./.agents/skills`; export only the explicit dependency closure for the included `isswf-coordinator` and `isswf-setup` skills: their referenced role Markdown, role references, required docs/templates, and `.factory/models.json`. Keep paths/layout intact so relative links resolve. Exclude `.audit/`, `isswf/`, tests, unrelated docs, and historical implementation. Do not claim every exported skill is usable: the shipped setup/coordinator procedures can refer to models, tools, or runtime capabilities a receiving environment may lack. In particular, do not ship or advertise the Python CLI as part of this Pi resource package. `.factory/models.json` remains the canonical versioned route source inside the immutable package; never copy it into or overwrite project configuration.

Pi 1.2.0 supports explicit resource paths in a package manifest (`docs/packages.md` lines 42–72), local package directories without copying (`29–40`), and identifies local packages by resolved absolute path (`123–127`). Project declarations are trust-gated (`17–21`); trust is not a process boundary (`docs/security.md`, “Understand project trust”). Skills are instruction resources, not executable agent registration (`docs/skills.md` lines 3–5, 41–45).

## Grounding: observed facts and limits

`docs/arranque-por-proyecto.md` lines 29–33 records the shared-fixed-version/explicit-project direction, rejects whole-factory copies and `AGENTS.md` overwrite, and says #44 was paused. `docs/next-operational-cut.md` lines 3–9 separates activation from worker safety. `.agents/skills/isswf-setup/SKILL.md` lines 9–23 requires explicit source/target and preserving unknown settings. `.audit/project-package-proof.md` lines 3–9 and `.audit/verify-project-package.mjs` lines 69–108 show SHA-based Git archive, shared absolute package path, and real Pi RPC `--approve`/`--no-approve` resource discovery without a model call; however, that verifier injects its manifest (79–83), includes Python import/state checks (110 onward), and its temporary extracted tree is writable. It is not evidence that the whole repository is an appropriate package.

The parent-worktree fixture `.audit/activation-44-fixture.json` is already prepared at `/tmp/isswf-activation44-pnNtj3`; it records source commit `fc598ae8543711241c4ba5de16188dffce9257cd` and baseline hashes for `AGENTS.md`, `.pi/settings.json`, `.factory/models.json`, and a job attempt. Its stated scope is preservation only: no installation, activation, process state, or provider call. This design uses it only as a later preservation oracle; it does not assume an installer ran. `.audit/boundary-65-final-closure.md` lines 17–19 leaves runtime44, lifecycle, multiwriter, and client readiness unproven.

## Proof plan for separately authorized implementation

On the prepared disposable fixture, first verify its recorded baseline, then test export of the allowlist from the exact SHA, deterministic same-SHA materialization, failure on conflicting destination, and absence of audit/Python/runtime payload. Activate and assert only the intended `.pi/settings.json` package reference changes; all recorded preservation hashes remain unchanged. Repeat activation and require a byte-identical no-op; exercise dirty/malformed settings and interrupted-write failure as unchanged outcomes. Finally use installed Pi 1.2.0 RPC `get_commands` with `--approve` and `--no-approve`, without a model call, to prove the expected included skill resolves under the SHA directory. This proves package discovery/activation only—not universal skill usability, sandboxing, worker execution, lifecycle, recovery, or client readiness.
