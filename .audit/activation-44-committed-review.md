**Standards: PASS. Spec: PASS — closing the installation/activation unit only.**

Verified independently, read-only:
- Main HEAD is `737fc7b`; its five changed files hash-match frozen v3 payloads/manifest. `candidate.diff` reproduces bit-exact as `git diff --src-prefix=c/ --dst-prefix=w/ fc598ae 737fc7b` over the two tracked modifications (88fbd3cd…, manifest match); untracked additions ride payload overlay per README.
- Two audit payloads (build-brief, verify-activation-44.mjs) are untracked, absent from the commit, manifest-matching → 7-payload worktree vs 5 commit + 2 audit, as documented.
- Committed proof's receipt: 20 files; all 20 independently hash-match blobs at `737fc7b` (0 mismatches). Fixture preserves AGENTS.md, models.json, historical attempt baselines; settings keep unrelated choices and one SHA entry.
- RPC record: Pi 1.2.0 — approve → exactly coordinator/setup from the shared SHA path; no-approve → none. Not replayed (would launch an agent); record internally consistent, skill blob hashes verified.
- CLI has no provider/network code; verifier is offline, no prompt/model.

Exact weakening: repeat-byte identity and RPC are recorded assertions, not replayed here. Closure must keep stated limits — no native roles/transport, client readiness, MCP, lifecycle, or broader-44 runtime proof; doc reconciliation is not gated.
