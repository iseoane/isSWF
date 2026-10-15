Proposed one-file change: create `.factory/project-setup.md` in the target only. It will record the supplied owner, checkout scope, approved local check and draft-only delivery, refer to canonical routes without copying them, and leave the absent model config pending. It will record the source checkpoint and target base separately, plus isolation unverified/client execution blocked. No installation or commit is proposed.

Unresolved items stay pending: the target model config is absent, technical isolation is unverified, and there is no commit checkpoint. The earlier check invocation ran from the wrong directory, so I’m running the approved check from the target root before writing.

**Partial setup completed.** Created only `/tmp/isswf-setup62-kyQXJd/new-project/.factory/project-setup.md`. It records the supplied decisions and references canonical routes without installing a model config.

- **Check:** `node check.mjs` from the target root passed.
- **Settled rerun:** no file change; SHA-256 remained `1ba2671b09edad090d50f956f0ef02f367d5ef43b25bd9751e2b6b6abadf463a`.
- **Target base:** `297ef38ee509fbbac74d43829006b03549fdf28e`
- **Source checkpoint:** `9dc64bb34411f18f7ac01ee6fdb3443eced3b002`
- **Pending:** model config remains proposed, not installed; technical isolation is unverified, so client execution is blocked. No commit was made; a checkpoint for the changed bytes is pending.
