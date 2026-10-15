**PASS — Standards and Spec, activation scope only.**

Frozen v3 vs v2: exactly the three declared payloads changed — CLI line 108 `candidate.slice(...)` → `relative(parent, candidate)` (`relative` already imported); verifier fixture now a real newline (valid JSON seed); brief scoped to 3 writable paths, no closure claim. Other four payloads byte-identical. All 7 manifest hashes match the writer worktree; both JS files pass `node --check`.

Identity convention holds: `candidate.diff` byte-identical v2→v3 (88fbd3cd…) while CLI is untracked at base fc598ae — expected per README TRACKEDPATCH+ALLPAYLOAD, already recorded in the v2 resolution. No stale-identity flag.

Prior root block fixed. red-v2: `/fresh-store` → `/resh-store`. green-v3: `/fresh-store`, `/fresh/store`, `/a/b/c` exact; source sha e7c656c3… = v3 payload = worktree. regression-green-v3 PASS (second revision refused; store alias refused before publication); parent-v3-proof PASS full actual offline Pi RPC; retained fixtures exist.

Declared limits stand: helper unit is synthetic-FS, RPC is discovery-only, synthetic resource commit ≠ candidate identity. No integration/readiness claimed.
