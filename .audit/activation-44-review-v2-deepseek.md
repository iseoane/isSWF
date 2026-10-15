**Delta verdict (v2 vs v1): the three v1 blockers are implemented; one confirmed defect must be fixed before freezing v2.**

**1. Version identity — PASS.** `activate` scans every declared entry, canonicalizes it, and refuses another `isswf-pi-resources` version before any settings write; the second-SHA case asserts the exact reason plus unchanged bytes, and parent `regression-green-v2` observed it (`independent-v1` RED superseded).

**2. Canonical paths — PASS for tested cases.** `realpath` source/project plus `canonicalPath` for store/declared entries, separation asserted before publication or settings write; alias, missing-store-beneath-alias, and package/project overlap are GREEN in `parent-v2-proof`/`regression-green-v2`. **Confirmed defect:** line 108 `candidate.slice(parent.length + 1)` drops the first character when parent is `/` (pure check: `/fresh-store` → `/resh-store`, agreeing with `rootpath-v2.json`). Since `destination = join(storeRoot, revision)`, a missing first-level store publishes to the wrong path. `basename` is shadowed by the local helper (line 325). Exact minimal fix: line 108 → `missing.push(relative(parent, candidate));` (`relative` already imported at line 13).

**3. Negative reasons / clean fixtures — PASS.** String `expectFailure` asserts stderr; tampered activation now uses a clean project, so the hash-mismatch reason cannot be masked by dirty refusal. The `TamperedProject` literal is raw `\\n` (invalid JSON), but `verifyPackage` precedes settings parsing, so no masking; a `\n` fix is trivial and non-blocking.

**Identity note:** manifest `files[]` hashes match all seven payloads, but `candidate.diff` is byte-identical to v1, covers only SKILL.md and durable-work.md, and lacks every correction — `diffSha256` does not describe v2. Regenerate or relabel it.

No repo writes, providers, network, Python, agents, or deps were used.
