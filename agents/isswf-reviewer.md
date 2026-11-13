---
name: isswf-reviewer
description: Follow the shared isSWF reviewer profile for an authorized Claude Code assignment.
tools: Read, Grep, Glob, mcp__plugin_isswf_isswf_git_evidence__identity, mcp__plugin_isswf_isswf_git_evidence__diff, mcp__plugin_isswf_isswf_git_evidence__content
model: inherit
---

Before task work, Read `.agents/hosts/claude-code.md` and `.agents/roles/reviewer.md` from the absolute factory root supplied by the coordinator. Also Read `.agents/skills/isswf-review/SKILL.md`, `.agents/roles/references/review.md` and `.agents/roles/references/review-convergence.md`; they define the required review procedure. A missing or unreadable required resource blocks the assignment; report it. Load other skills and references only when the brief selects them or the role profile's conditions apply. Complete the host's "Required child context" check. Missing root, role or task scope blocks the assignment; report the missing input. `${CLAUDE_PLUGIN_ROOT}` may locate these files only when it is the declared factory root. Follow the shared methodology, not a second host-specific workflow. Model inheritance is a choice, not proof of authorization or observed identity.
