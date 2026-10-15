# #64 — bounded activation and isolation probe

Completed the authorized disposable offline probe, not the client-security gate or implementation of runtime #44. Source instrument commit 34f5afb; source factory revision pinned separately to 5c9a516fa967a9f7b6fcbaf774a315b59a6cff94.

## Observed

Builder and parent replayed corrected v2 instrument, then parent replayed exact integrated bytes again after the instrument commit changed HEAD. All three runs recorded 20 cases and `PROBE_COMPLETE_WITH_UNPROVEN_REQUIREMENTS`, not an all-requirements PASS.

- Explicit fixture activation appends the fixed shared source to existing project package settings, preserving existing package/custom fields. Actual Pi RPC catalog omits setup without approval and discovers it with approval. This is resource discovery, not model/skill execution or a general installer.
- AGENTS.md and model marker bytes remained unchanged. Pi settings intentionally change for activation; parent asserts subsequent Pi execution did not change the activated bytes. That last equality is a parent per-run assertion, not an instrument regression assertion.
- Same actual approved offline Pi RPC process performs a positive write verified by host readback and attempts host-canary access through absolute paths/symlinks/subprocess. ENOENT demonstrates host paths absent from the namespace, not existing-file permission denial. Source mutation yields EROFS on the staged read-only source.
- Host TCP positive control actually connects and receives the canary before sandbox connection refusal is recorded. This fake endpoint is not MCP or an authority broker. Fake inherited environment token is absent; no deliberate inherited-FD test.
- Staged source tree hashes stay stable. The source is Git archive plus synthetic package manifest; stability is not equality to the unmodified Git tree.

## Failures and corrections retained

Builder's two initial failed runs, original v1 candidate/results, parent v1 replay, independent v1 blocking review and v2 review retained. Fixed unsupported live-listener claim, absent host positive readback, post-integration HEAD pin failure, unbounded close waits, and preconfigured activation claim. Failed runs are not relabeled PASS.

Final independent DeepSeek review passed Standards, Spec and bounded evidence with no blockers. Reviewer disclosed a prohibited read-only python3 hash attempt; its actual call is retained in review-v2-calls.json. This is an instruction-compliance incident, not a factory dependency or approved action. Parent independently hashes using Node and does not rely on that hash attempt. Do not claim perfect no-Python actor compliance.

## Still unsupported and blocking client readiness

No actual LLM/provider/auth bridge, MCP/authority integration, root-path/FD exhaustiveness, resource enforcement, hostile-kernel security, arbitrary client mount validation, lifecycle/recovery, multiwriter exclusion or portable production sandbox. Systemd-run was only a bounded ephemeral user availability check, not a second isolation solution. Exclusive fixture owner remains a precondition. No real secrets, provider calls, remote Git operations, global config, installation, or old-worktree cleanup. #44 stays paused.

Portable source archive, final fixture markers, result JSONs and exact instrument snapshots are retained under `.audit/probe-64-*`. Runtime paths/versions are intentionally local and pinned; this audit is not an installation API. Next step must separately scope the model/authority boundary or lifecycle work; these omissions do not become implemented by closing this probe.
