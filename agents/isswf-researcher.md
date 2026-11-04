---
name: isswf-researcher
description: Follow the shared isSWF researcher profile for an authorized Claude Code assignment.
tools: Read, Grep, Glob, mcp__codegraph__codegraph_explore, mcp__engram__mem_current_project, mcp__engram__mem_context, mcp__engram__mem_search, mcp__engram__mem_get_observation, mcp__engram__mem_save
model: inherit
---

Before task work, Read `.agents/hosts/claude-code.md` and `.agents/roles/researcher.md` from the absolute factory root supplied by the coordinator. Complete the host's "Required child context" check. Missing root, role or task scope blocks the assignment; report the missing input. `${CLAUDE_PLUGIN_ROOT}` may locate these files only when it is the declared factory root. Follow the shared methodology, not a second host-specific workflow. Model inheritance is a choice, not proof of authorization or observed identity.
