# Job brief J003 / r1

## Identity and authorization

- Job: I0046 J003, brief r1, Size M. Actor ID: A001 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Operator start: "ok adelante" (Claude Code session, 2026-11-12). Request mode: local-only.
- Writes only under `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/`. No writes to /home/iseoane/Work/isSWF or any state directory. No commits, network, installs.

## Objective and acceptance

Plan I0046 J003 acceptance is canonical. Concretely:
- Pane opens only after the `isswf:isswf-coordinator` skill loads (hook `skill.prompt`; match skill names ending in `isswf-coordinator`). Before that: no pane, no reads, no timers. Remove the J002 session.start auto-open; keep `/initiatives` to reopen/refresh once activated (before activation it replies that the coordinator is not active).
- Active initiatives: ids whose `<stateDir>/<ID>/` paths appear in this session's tool calls (Read/Edit/Write file_path, Bash command text) after activation, plus `/initiatives pin <ID>` / `/initiatives unpin <ID>`. Keep in $.state (contract in types/index.d.ts) so reloads keep it.
- Active initiatives get full cards (with active dot). All others go in a bottom card "No activas": started ones (any job not pending, or any records) as `◐ ID · title` plus a short count (e.g. "2 bloqueados", "3 pendientes"); unopened as `○ ID · title`. Completed initiatives stay hidden.
- Inside a card, completed jobs collapse into one line `✓ N completados`; other jobs as in J002.
- Refresh: on tool.call results touching the state dir, debounced (~1 s), plus a slow fallback timer (~60 s) only while activated. No model calls, no prompt changes.
- Tests: plugin tests for activation gating, active detection from a tool call, pin/unpin, "No activas" grouping, completed collapse. Keep node tests green.
- Checks: `claude plugin validate /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane`, `claude plugin test /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane`, `node --test /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/test`.

## Mod mechanics

reference.md and types in /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring (grep types/claude-code.d.ts for 'skill.prompt', 'tool.call', $.clock, $.state). No SKILL.md there.

## Execution

- Model/effort inherited (effort not observed). Budget: 1 run, max 1 correction. Stop if the change grows past ~300 lines and report.
- Return: changed paths, check outputs, limits, resources actually read.
