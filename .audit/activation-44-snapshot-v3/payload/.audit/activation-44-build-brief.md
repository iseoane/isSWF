# Task 44 — fresh SOLE correction writer

**Status:** This fresh writer is authorized to make only the requested root-path correction, verifier fixture correction, and brief update. The existing candidate identity and independent review conclusions are accepted as tracked; they require no source diff change. This note does not claim overall Task 44 closure.

## Objective and exact write scope

Apply the accepted narrow corrections in this isolated checkout. The writable paths are exactly:

1. `tools/factory-package.mjs`
2. `.audit/verify-activation-44.mjs`
3. `.audit/activation-44-build-brief.md`

Provenance: the parent resolution accepted the tracked-patch and all scoped payload identity; the earlier patch complaint is dismissed, so no identity-source change is required. No other candidate or parent-owned file is in scope. No commit, integration, parent-harness edit, or cleanup is authorized.

## Accepted corrections

1. Refuse activation when project settings already declare a different version of the `isswf-pi-resources` factory package. Do not upgrade, replace, or append a second version; leave the settings bytes unchanged and preserve unrelated package entries.
2. Resolve existing filesystem aliases and ancestry before writing. Check canonical source/store and package/project separation, including a not-yet-created store beneath a symlinked existing ancestor. Refuse overlapping aliases. This is bounded path correctness, not a general security framework.
3. Make each negative verifier case assert its expected diagnostic and unchanged protected bytes in an independent fixture. Run tampered-package activation against a clean project so dirty-project rejection cannot mask a skipped integrity check. Exercise a second SHA of the same factory and aliased store/source paths; exercise package/project alias overlap as well.
4. Describe synthetic commits precisely: a verifier-created Git commit identifies the selected exported resource blobs only. It does not identify the complete seven-payload implementation candidate. The retained frozen seven-payload v1 identity is a pre-correction baseline; the corrected candidate must be identified separately from the exact seven payloads after this worker finishes, not by reusing that old identity or the synthetic resource SHA.

## Boundaries

The implementation uses only existing Node.js and Git. Do not add dependencies, Python, provider/model calls, network access, global configuration, remotes, agents, worktrees, commits, or cleanup. Parent-owned independent regression harness and evidence are not to be inspected or edited during this worker task. Keep the established exact two-skill package and durable-work/coordinator payload unchanged.

## Verification

This correction writer runs only Node syntax checks. The parent owns the root-helper pure test and full regression/RPC; those results are not claimed here. Inspect the exact three-path delta and report the checks actually run. No overall Task 44 closure, integration, or readiness is asserted.
