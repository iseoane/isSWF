Changed only the three authorized paths in `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a79874a42b1bb0ec7`:

- `tools/factory-package.mjs`: use `relative(parent, candidate)` when collecting missing path components.
- `.audit/verify-activation-44.mjs`: fix the tampered-project fixture to use a real newline escape, producing valid JSON.
- `.audit/activation-44-build-brief.md`: record the three-path scope and accepted-identity provenance; make no overall-closure claim.

**Checks passed:** `node --check` on both `.mjs` files; parsed the corrected fixture as JSON; confirmed the canonical-path fix is present.

I did not run the full verifier: it creates Git commits, which this task forbids. The parent-owned helper and regression checks remain pending.
