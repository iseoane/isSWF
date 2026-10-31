# J023: Claude route decisions after worker host findings

Operator decisions (2026-10-31), supersede brief-r18 where they differ:

- Option A: the Claude reviewer with git-evidence tools runs as a separate coordinator-launched `claude -p --agent isswf:isswf-reviewer` process; binding (`ISSWF_GIT_EVIDENCE_BINDINGS`) and `MAX_MCP_OUTPUT_TOKENS` set only in that process environment. In-session Agent-tool dispatch shares the session's server and is not a per-review binding. Shell-exported variables bind every session from that shell; the recipe states this limit honestly. Unset/literal `${...}` binding fails closed.
- Completeness: no partial evidence. Server refuses any response that does not fit the configured bound; the host truncation marker is a failure. Large diffs are delivered as numbered chunks each carrying the full-patch SHA-256 and total length; completeness only when all chunks concatenate to that digest. Same chunking contract offered on Pi if shared code makes it free; otherwise Pi keeps its current fail-closed bound.
- Include the Pi reviewer profile gap: `.agents/hosts/pi/agents/isswf-reviewer.md` lacks `isswf_git_content`; add it and make `tests/host-native-delegation.mjs` assert the real profile instead of overriding tools.
- Verified host names: `mcp__plugin_isswf_isswf_git_evidence__{identity,diff,content}` on the `--plugin-dir` route (marketplace route unverified).
- File writes: operator authorizes the worker to write files via Bash heredoc for this task when the Write tool's auto-mode classifier gives no verdict.
- Status remains the next separate unit.
