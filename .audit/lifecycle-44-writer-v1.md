Implemented only the four authorized paths. The checkout remains uncommitted at base `f1316072c5447e857fe16caa4804990ac8e6d741`; no candidate commit is claimed.

- Added the local runner in `tools/worker-lifecycle.mjs` and usage/limits in `docs/local-worker-lifecycle.md`.
- Added `.audit/verify-lifecycle-44.mjs`, which copies the parent-pinned J601 fixture into its own `/tmp/isswf-lifecycle44-*` directory. It creates no commits or remotes and leaves the parent fixture untouched.
- Recorded implementation details and observed results in `.audit/lifecycle-44-build-brief.md`.

`node --check` passed for the runner and verifier; the verifier reported `PASS` using input and target SHA `98d1bce6baa7e4aca53fba3311d16d68f706574c`. It exercised the expected J601 red/green check, launch exit before completion, fresh reads, nonzero exit, timeout, repeat refusal, distinct workspaces, corrupt/torn state, identity mismatch, owner kill with partial preservation, and output bounds.

Runner SHA-256: `9715aada25f79fac4dbf44b83f692206232c3418e644718aacfa6bfef9bb82d9`.

This proves bounded local process mechanics only—not native Pi/model-worker behavior, actual chat teardown, or exactly-once effects. No self-review or independent review PASS is claimed; parent freeze, review, and committed-source replay remain pending.
