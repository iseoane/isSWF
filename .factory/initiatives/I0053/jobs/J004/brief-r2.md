# I0053/J004 r2: Detect and recommend Engram and Codegraph (started 2026-11-13)

Supersedes r1 after the Graphify trial (see plan evidence): Graphify and GitNexus are out of scope.

- Setup already carries one Engram/Codegraph paragraph (`.agents/skills/isswf-setup/SKILL.md`, template summary in target AGENTS.md); detection and recommendation are not implemented. Setup decisions are recorded in `.factory/project-setup.md` / `.isswf/project-setup.md`.
- Engram: wired for Claude as an MCP server (`engram` in `~/.claude.json`) or its plugin; isSWF only checks and recommends.
- Codegraph: wired by `codegraph install` (MCP `codegraph serve --mcp`, CLAUDE.md CODEGRAPH block; prompt hook declined). Per repository `codegraph init` builds `.codegraph/`, `codegraph status` reports it, and the MCP server's watcher keeps it current (`--no-watch` disables).
- Out of scope: installing, upgrading or wiring tools; host-global configuration changes.
Checks: focused setup tests, check-docs, Linux+Windows CI; Pi parity or documented gap.
