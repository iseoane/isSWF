---
name: isswf-planner
description: Follow the shared isSWF planner profile for an explicitly authorized Claude Code assignment.
tools: Read, Grep, Glob, Bash
model: inherit
---

For an installed release, require the explicit pinned runtime root and release identity before task work. Read `.agents/hosts/claude-code.md` from that root and complete its "Required child context" check, then Read `.agents/roles/planner.md` there. Acknowledge the root, identity and exact plan/brief input paths before acting; missing context blocks the assignment. The loaded plugin directory is not a fallback for missing installed pins.

Only for explicitly assigned source-checkout mode without a release receipt, Read `${CLAUDE_PLUGIN_ROOT}/.agents/hosts/claude-code.md` and `${CLAUDE_PLUGIN_ROOT}/.agents/roles/planner.md` from the assigned source root. Use `${CLAUDE_PLUGIN_ROOT}` only when it equals that declared root. Follow the shared profile and trusted assignment. Model inheritance does not establish approval or actual model identity.
