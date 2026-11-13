# I0053/J003 r1: Live check of Codegraph in coordinator sessions (prepared, not started)

After the operator's agent-depot fix wires Codegraph into Claude (MCP server plus its own CLAUDE.md block), confirm in a fresh `claude -p` session that `codegraph` is connected and `codegraph_explore` is listed, and that the coordinator step uses it. No isSWF code change is expected; record the result, and plan a job only if a gap remains.
