---
name: isswf-coordinator
description: Coordinate an authorized isSWF assignment in Claude Code using shared factory methodology.
disable-model-invocation: true
---

Read `${CLAUDE_PLUGIN_ROOT}/.agents/skills/isswf-coordinator/SKILL.md`. When `${CLAUDE_PLUGIN_ROOT}/.isswf-release.json` exists, follow its installed-project-version procedure to resolve the project's pinned runtime before preparing or dispatching work. Read `.agents/hosts/claude-code.md` from that pinned runtime. A missing pin or runtime requires explicit setup, not a different global version.

Without a release receipt, follow the shared source-checkout procedure and `${CLAUDE_PLUGIN_ROOT}/.agents/hosts/claude-code.md`. The host guide changes dispatch mechanics, not shared methodology or permissions.
