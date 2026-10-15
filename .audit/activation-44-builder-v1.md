**Complete — implementation verified, not independently reviewed.** Base: `fc598ae8543711241c4ba5de16188dffce9257cd`. No commit created.

Changed exactly the seven authorized paths: `package.json`, `tools/factory-package.mjs`, `docs/activacion-por-proyecto.md`, `.agents/skills/isswf-coordinator/SKILL.md`, `docs/durable-work.md`, `.audit/verify-activation-44.mjs`, and `.audit/activation-44-build-brief.md`.

Materialization exports an explicit allowlist from a supplied full Git SHA, records and verifies payload hashes, and refuses conflicting versions. Activation adds the absolute package path to an existing tracked, clean project settings file while preserving other settings; malformed, dirty, or conflicting state is refused unchanged. Documentation clarifies that the materialized package is **not a Git checkout or a job-input checkpoint**.

**Checks passed:** Node syntax checks, `git diff --check`, and the offline verifier. The verifier used a synthetic candidate commit distinct from both the implementation base and the fixture repository’s later `HEAD`. Pi 1.2.0 RPC discovered exactly the two skills with `--approve` and neither with `--no-approve`; no prompt or model call was made. Preservation, repeat/no-op behavior, and refusal cases passed.

Retained fixture: `/tmp/isswf-activation44-308846-1792083911372/` (source repo, shared store, and target project); selected synthetic commit: `1fd89a004dd92530c97a05e9fddaac132724ba5f`. These checks establish resource discovery and local activation—not role execution, sandboxing, lifecycle, recovery, or client readiness. The parent-referenced build brief was absent, so I followed the authoritative decision and recorded the bounded brief in the authorized local path.
