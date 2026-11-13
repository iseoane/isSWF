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

- Status: completed
- Objective: Retire the plugin's session-tools note: Engram and Codegraph install their own hooks and instructions; isSWF keeps only the coordinator skill step.
- Depends on: J001
- Brief: [brief-r2.md](jobs/J002/brief-r2.md)
- Blocker: None.
- Next step: None.

### Acceptance

- hooks/coordinator-tools.tsx, its test, its register.tsx handler and its packaging entries are removed; the pane behaves as before J001.
- The coordinator skill step no longer refers to a plugin note; user docs say Engram and Codegraph are set up with their own installers.
- The operator's decisions are recorded below.

### Evidence

- 2026-11-13: operator decisions: generic Engram behaviour belongs to Engram (its plugin/server instructions), Codegraph's to its own installer (`codegraph install`); the operator is fixing agent-depot because the local Codegraph install never wired Claude. Remove the plugin hook entirely (operator: "si elimina el hook tambien"), including the packaging allowlist entries.
- 2026-11-13: A001 complete at 9b62a22; code back to the reviewed pre-J001 state; accepted under delegated acceptance and merged through its PR.

## J003

- Status: pending
- Objective: Confirm in a live session that Codegraph is connected and used once the operator's agent-depot fix lands.
- Depends on: J002
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: Waits for the operator's agent-depot fix.
- Next step: Operator says the fix is installed; then run the live probe.

### Acceptance

- A fresh Claude session lists `codegraph` connected with `codegraph_explore`, and the result is recorded here.

### Evidence

- None.
