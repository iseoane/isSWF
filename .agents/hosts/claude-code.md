# Claude Code host instructions

Use this guide only when the coordinator is actually running in Claude Code. Shared objective, grounding, plan ownership, authorization and review contracts remain in `.agents/skills/isswf-coordinator/SKILL.md`; this guide replaces only Pi-specific dispatch mechanics.

Claude Code native subagents replace Pi SDK dispatch for work explicitly approved for this host. Before work, the coordinator must obtain explicit assignment approval for Claude and the inherited/selected model, then observe and record the actual model metadata. `model: inherit` is not evidence of model identity or authorization. Pi route configuration does not configure Claude, and a configured Pi model is not automatically Claude-compatible. If model or capability is unavailable, stop that dispatch; never silently substitute a model or fall back to the Pi SDK.

Delegate with Claude's native agent mechanism and the plugin role definitions. The coordinator retains responsibility for authorization, plan ownership, grounding, budget, evidence and acceptance. Native delegation does not provide equivalent Pi sandboxing, persistence or recovery. Tool declarations are not a security boundary; reviewer agents must have only Read, Grep and Glob, never Bash or other mutating tools. Bash is capable of mutation and is not a sandbox guarantee. Do not use permission bypasses, hooks or MCP to imply enforcement.

An independent reviewer must judge the writer's exact retained candidate, including a stopped writer's partial candidate, not a substitute or later workspace. Provide its exact diff/snapshot identity and untracked contents, base, scope and checks. Reviewer reports are evidence, not acceptance.
