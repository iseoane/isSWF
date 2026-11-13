# I0053: Coordinator use of Engram and Codegraph

Type: enhancement

Operator decision 2026-11-13: make the coordinator session actually use Engram and Codegraph when they are available, following the gentle-ai pattern (session-start reminder plus explicit coordinator guidance). Subagent prompt injection is out of scope: isSWF agents already grant the Codegraph and Engram tools in their frontmatter.

## J001

- Status: completed
- Objective: A coordinator session is told at start which of Engram and Codegraph are available and uses them before acting.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None.
- Next step: None.

### Acceptance

- When the coordinator skill loads in Claude Code, the isSWF plugin appends to it a short reminder only for Engram and/or Codegraph tools connected to the session; nothing when neither is; no model, network or write. (Refined at start from "at session start": the plugin hook API cannot add context at session start, and the skill load targets exactly the coordinator and repeats after compaction reloads.)
- The coordinator skill has one explicit step on activation: recover project context with Engram when available, use Codegraph first for structural questions when available, and say so when a tool is not available in the session instead of silently skipping it.
- Linux and Windows are covered; Pi behaviour is either the equivalent mechanism or an explicit documented gap.

### Evidence

- 2026-11-13: in the I0052 session the coordinator used neither tool until the operator asked; Codegraph was not loaded in the main session although subagents grant it.
- 2026-11-13: I0014 completed; J001 started under the operator's conditional go.
- 2026-11-13: A001 complete at 422cebc; bound review V001 FAIL (fixed), V002 PASS. Live probe confirmed the Engram line in a real session.
- 2026-11-13: operator approved the packaging allowlist change ("ok"); accepted under the delegated acceptance for I0053 and merged through its PR.

## J002

- Status: pending
- Objective: Talk through the coordinator tools note and Codegraph with the operator and record decisions.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: Needs the operator conversation.
- Next step: Operator discussion after J001 merges; keeps I0053 open as requested.

### Acceptance

- The operator's decisions on the hook and Codegraph are recorded, with any follow-up jobs planned.

### Evidence

- None.
