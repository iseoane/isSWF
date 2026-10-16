**Complete — bounded output-publication correction** in `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a707e6c3cfb75a7e8` at base `f1316072c5447e857fe16caa4804990ac8e6d741`.

Changed only:
- `tools/worker-lifecycle.mjs`: replaced repeated string reconstruction with a linear, UTF-8-safe suffix clip. Render-time omissions now set the existing truncation flag and marker.
- `.audit/verify-lifecycle-44.mjs`: added exact-64-KiB invalid-UTF-8 coverage for both streams.
- `.audit/lifecycle-44-build-brief.md`: added a historical, additive correction note without claiming prior hashes describe this candidate.

**Checks passed:** both `node --check` commands; the verifier with the explicit parent fixture path reported `PASS` (15 checks); the public-CLI binary control reported terminal publication and `passed: true`. No parent fixture or frozen v1/v2 artifact was changed.

This remains an uncommitted generic trusted-process runner—not model/client-ready or exactly-once. **No self-review or review PASS is claimed.** Parent freeze/public-CLI controls and a fresh bounded review remain before integration.
