# Task 44 — fresh SOLE correction writer

**Status:** implementation of the three accepted material findings is authorized by the operator's Task 44 instruction. The frozen v1 candidate and its independent reviews remain retained; this correction does not reopen the broader Task 44 design or edit the existing two-skill package, durable-work, or coordinator payload.

## Objective and exact write scope

Correct only the fixed-version package activation behavior, its isolated offline verifier, its user guide, and this brief. The writable paths are exactly:

1. `tools/factory-package.mjs`
2. `.audit/verify-activation-44.mjs`
3. `docs/activacion-por-proyecto.md`
4. `.audit/activation-44-build-brief.md`

No other candidate or parent-owned file is in scope. No commit, integration, parent-harness edit, or cleanup is authorized.

## Accepted corrections

1. Refuse activation when project settings already declare a different version of the `isswf-pi-resources` factory package. Do not upgrade, replace, or append a second version; leave the settings bytes unchanged and preserve unrelated package entries.
2. Resolve existing filesystem aliases and ancestry before writing. Check canonical source/store and package/project separation, including a not-yet-created store beneath a symlinked existing ancestor. Refuse overlapping aliases. This is bounded path correctness, not a general security framework.
3. Make each negative verifier case assert its expected diagnostic and unchanged protected bytes in an independent fixture. Run tampered-package activation against a clean project so dirty-project rejection cannot mask a skipped integrity check. Exercise a second SHA of the same factory and aliased store/source paths; exercise package/project alias overlap as well.
4. Describe synthetic commits precisely: a verifier-created Git commit identifies the selected exported resource blobs only. It does not identify the complete seven-payload implementation candidate. The retained frozen seven-payload v1 identity is a pre-correction baseline; the corrected candidate must be identified separately from the exact seven payloads after this worker finishes, not by reusing that old identity or the synthetic resource SHA.

## Boundaries

The implementation uses only existing Node.js and Git. Do not add dependencies, Python, provider/model calls, network access, global configuration, remotes, agents, worktrees, commits, or cleanup. Parent-owned independent regression harness and evidence are not to be inspected or edited during this worker task. Keep the established exact two-skill package and durable-work/coordinator payload unchanged.

## Verification

Run syntax checks and the bounded offline verifier against disposable retained fixtures. Verify that ordinary preservation and exact-version repeat activation still pass; same-factory second-version activation refuses with the expected reason and unchanged settings; symlinked or ancestor-aliased store/source overlap refuses before publication; aliased package/project overlap refuses before settings writes; and tampering refuses for the hash-mismatch reason against a clean project without changing its settings. Inspect the actual four-path diff. Report exact commands, observed results, retained fixture locations, and limits. Offline Pi RPC, if rerun by the verifier, remains discovery-only evidence—not execution, sandboxing, lifecycle, recovery, or readiness proof.
