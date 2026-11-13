# Job brief J002 / r1

## Identity and authorization

- Job: I0046 J002, brief r1, Size S. Actor ID: A001 (do not reuse). Role: isswf-worker, profile /home/iseoane/Work/isSWF/.agents/roles/worker.md.
- Operator start: "dale!" (Claude Code session, 2026-11-12). Request mode: local-only.
- Writes only under `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/`. No writes to /home/iseoane/Work/isSWF or any state directory. No commits, network, installs.

## Objective

Turn `/home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane` into a Claude Code mod that opens a side pane rendering the J001 snapshot (`lib/snapshot.mjs`) with the approved static layout.

## Scope and acceptance

- Files: `.claude-plugin/plugin.json` (name isswf-pane), `hooks/hooks.json`, `hooks/register.tsx`, `types/index.d.ts` if $.state is used, a `*.test.tsx`. Reuse lib/snapshot.mjs logic; the hooks module has no Node APIs, so read records through `$.fs` (adapt the reader to take a file-access interface if needed, keeping its node tests green).
- Layout (mockup: /tmp/claude-1000/-home-iseoane-Work-isSWF/d9c79ff9-7b95-4990-86f7-d89f71286d91/scratchpad/initiatives-pane.html): one bordered card per open initiative (id · title, closed/total jobs, pending count; completed jobs one line each; current job with R1..Rn rows of pills; pending jobs dim); one card "Sin abrir" listing id · title. Pill colors: passed green, changes-requested orange, running dashed, unknown dim.
- Hover on a pill reveals model, effort, verdict and any usage the snapshot has, else "desconocido". Hover is style-only (Box display none + hover display flex); precompute.
- Out of scope (J003): coordinator-only activation, active dot logic, pin command, event refresh. For now open the pane at session.start and add a slash command `/initiatives` to reopen/refresh; project = session cwd.
- No model calls, no prompt.compose, no tool.call interception.
- Checks: `claude plugin validate /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane`, `claude plugin test /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane`, `node --test /home/iseoane/.claude/dev-mods/d9c79ff9-7b95-4990-86f7-d89f71286d91/isswf-pane/test`.

## Mod mechanics (read before writing)

- Skill: /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring/SKILL.md and /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring/reference.md; API types /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring/types/claude-code.d.ts (grep, do not read whole); examples /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring/examples/pane.tsx, pane-state.d.ts, pane.test.tsx.
- Hot reload is on: the mod reloads when the coordinator turn ends.

## Execution

- Model/effort inherited (effort not observed). Budget: 1 run, max 1 correction. Stop at M size (300 lines); if it grows past, stop and report.
- Return: changed paths, check outputs, limits, resources actually read.
