# I0053: Coordinator use of Engram and Codegraph

Type: enhancement

Operator decision 2026-11-13: make the coordinator session actually use Engram and Codegraph when they are available, following the gentle-ai pattern (session-start reminder plus explicit coordinator guidance). Subagent prompt injection is out of scope: isSWF agents already grant the Codegraph and Engram tools in their frontmatter.

## J001

- Status: in-progress
- Objective: A coordinator session is told at start which of Engram and Codegraph are available and uses them before acting.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: Coordinator implements in worktree isSWF-worktrees/i0053-engram-codegraph (branch feat/i0053-j001-engram-codegraph, base 38b68dd); then bound review.

### Acceptance

- When the coordinator skill loads in Claude Code, the isSWF plugin appends to it a short reminder only for Engram and/or Codegraph tools connected to the session; nothing when neither is; no model, network or write. (Refined at start from "at session start": the plugin hook API cannot add context at session start, and the skill load targets exactly the coordinator and repeats after compaction reloads.)
- The coordinator skill has one explicit step on activation: recover project context with Engram when available, use Codegraph first for structural questions when available, and say so when a tool is not available in the session instead of silently skipping it.
- Linux and Windows are covered; Pi behaviour is either the equivalent mechanism or an explicit documented gap.

### Evidence

- 2026-11-13: in the I0052 session the coordinator used neither tool until the operator asked; Codegraph was not loaded in the main session although subagents grant it.
- 2026-11-13: I0014 completed; J001 started under the operator's conditional go.
