**DONE** in the existing checkout `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a707e6c3cfb75a7e8`. Only the four authorized paths changed; parent v1 reviews, snapshots, regression evidence, and fixture were left untouched.

Fixed the four parent regressions: duplicate normalized options, UTF-8 byte limits with truncation markers on both streams, bounded deadline/pipe closure with explicit incomplete-capture and uncertain-descendant state, and PID/nonce validation. The verifier now accepts an explicit fixture path and exercises these cases.

**Checks passed:**
- `node --check tools/worker-lifecycle.mjs`
- `node --check .audit/verify-lifecycle-44.mjs`
- `node .audit/verify-lifecycle-44.mjs /home/iseoane/Work/isSWF/.audit/lifecycle-44-fixture.json` — PASS; output and disposable test project: `/tmp/isSWF-lifecycle44-HLzywH/`

No self-review or independent-review PASS is claimed. This remains a deterministic trusted local process runner—not native model/chat orchestration, exactly-once execution, or proof that every descendant is dead.
