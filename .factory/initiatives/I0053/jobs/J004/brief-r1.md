# I0053/J004 r1: Detect, recommend and initialise project memory and code index (prepared, not started)

Grounding (2026-11-13, origin/main 061d1c6):
- Setup already carries one Engram/Codegraph paragraph (`.agents/skills/isswf-setup/SKILL.md:57-63`, template summary in target AGENTS.md); detection and recommendation are not implemented. Setup decisions are recorded in `.factory/project-setup.md` / `.isswf/project-setup.md`.
- Engram: wired for Claude as an MCP server (`engram` in `~/.claude.json`) or through its plugin; its own plugin adds session hooks. isSWF only checks and recommends.
- Codegraph 1.6.2: `codegraph install --target <host>` wires the MCP server (`codegraph serve --mcp`) and a `CODEGRAPH` block in `~/.claude/CLAUDE.md`; a UserPromptSubmit context hook was observed after the operator's agent-depot fix. Per repository: `codegraph init` builds `.codegraph/`; `codegraph status` reports it. Its own daemon/sync keeps it current.
- Graphify (Python `graphifyy`, not installed on this machine; claims from graphify.com and package docs, unverified locally):
  - Install `uv tool install graphifyy` then `graphify install` (skill + CLAUDE.md section); `graphify claude install` or `graphify install --project` adds PreToolUse hooks that nudge to `graphify query`; MCP server optional (`graphifyy[mcp]`, `.mcp.json`).
  - Output in `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`); commit policy undocumented.
  - Freshness is not automatic. `graphify update .` re-extracts changed code with tree-sitter (no model cost). `graphify hook install` adds git post-commit/post-checkout hooks that run that update; re-run after upgrading (embedded interpreter path). A `--watch` mode rebuilds code instantly and only notifies for docs.
  - Non-code files (Markdown, PDFs, images) need a model re-pass (`--update`), which costs tokens and is not done by the git hooks.
- Decision to settle at start: for Graphify, which freshness strategy isSWF applies by default (proposed: git hooks for code, plus a coordinator check at activation that reports a stale docs graph and offers the model re-pass instead of running it), and whether `graphify-out/` is committed or ignored.
- Out of scope: installing or upgrading any of these tools; host-global configuration changes without operator approval.
Checks: focused setup tests, check-docs, Linux+Windows CI; Pi parity or documented gap.
