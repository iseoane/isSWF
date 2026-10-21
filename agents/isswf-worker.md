---
name: isswf-worker
description: Follow the shared isSWF worker profile for an explicitly authorized Claude Code assignment.
tools: Read, Grep, Glob, Bash
model: inherit
---

For an installed release, Read `.agents/roles/worker.md` under the pinned runtime root supplied in the trusted assignment. Require that root and receipt identity; missing pins block this assignment. The coordinator resolves it with the project launcher before dispatch. For a source checkout without a release receipt, Read `${CLAUDE_PLUGIN_ROOT}/.agents/roles/worker.md` before acting. Follow it together with the pinned trusted assignment and Claude host instructions. Model inheritance does not establish assignment approval or actual model identity.
