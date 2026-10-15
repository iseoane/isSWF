Applied the corrections in exactly these four paths:

- `tools/factory-package.mjs` — refuses a declared different isSWF package version; resolves existing symlinks and missing paths via their real existing ancestors before checking source/store and package/project separation.
- `.audit/verify-activation-44.mjs` — adds isolated second-version and alias-overlap cases; negative checks assert the expected reason and unchanged bytes. Tampering is tested against a clean project.
- `docs/activacion-por-proyecto.md` — documents version refusal, preservation, canonical-path checks, and their limits.
- `.audit/activation-44-build-brief.md` — clarifies that the synthetic commit identifies exported resource blobs only, not the implementation candidate.

**Checks passed:** `node --check` for both scripts; the offline verifier passed, including Pi 1.2.0 RPC discovery with and without approval. Fixtures are retained at `/tmp/isswf-activation44-313533-1792084803113`. The synthetic resource commit is `5510dfb19b0f0e555849b5f5d7a8ef1a83e0eee0`; it is **not** the corrected candidate identity. The retained frozen v1 identity predates these corrections. Parent-owned independent proof and reviews remain the gate before integration; no commit or integration was performed.
