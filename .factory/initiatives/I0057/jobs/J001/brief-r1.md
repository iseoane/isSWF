# I0057/J001 brief-r1 — Cross-host feasibility research for the I0057 guards

## Identity and authorization

- Job ID and brief revision: I0057/J001, r1. This revision is read-only research only; the implementation brief will be r2.
- Request mode: feature-to-PR start of I0057 (2026-11-14), within the operator's standing grant of the same day (everything except HIGH risk or a decision only the operator can take). The coordinator's skill requires a cross-host feasibility record before dispatching a writer whose outcome depends on host integration ("Check cross-host feasibility").
- Role: `.agents/roles/researcher.md`, read-only. It returns its findings in the hand-back; the coordinator writes them to `jobs/J001/A001.md`, naming the researcher as the observer.

## Objective

Establish, from installed documentation, type definitions and repository code (no model calls to other hosts, no installs, no configuration changes), how each guard in the I0057 plan can be built on each host. The findings shared with J003, J004, J005 and J009 are gathered here once.

- Size: S (one flow, no special risk: read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified versus inferred, and the known limits. Cover Claude Code 2.1.325 and Pi 1.5.2 on Windows; note anything that is Linux-specific or unknown.

1. **Feedback after a write (J001).**
   - Claude plugin: can a `tool.call` hook let an Edit or Write run and then add a message the model sees in the same turn, without withholding the tool's result?
   - Pi: can `tool_result` or a similar event do the same?
   - Can either host run a check on `git commit` without changing global Git configuration, for example a repository-local hook path the project opts into?
2. **Child agents (J003, J009).**
   - Does the Claude plugin's `tool.call` hook fire for tool calls made by Agent-tool children (`agentId`), and does it see their Bash command text?
   - For Pi `pi-subagents` children: does the parent's extension see their tool calls, or do children load the extension themselves?
3. **Delegation call shape (J004).** What arguments does a guard see for a Claude Agent call (subagent type, prompt, background flag) and for the Pi subagent tool call? Name the Pi tool and its argument fields from the installed `pi-subagents` package, if present.
4. **Compaction (J005).**
   - Claude: can a plugin add instructions to the compaction summary without skipping it, and can it add context or reload skills on the first turn after compaction?
   - Pi: the same with `session_before_compact` and `before_agent_start`.
5. **Existing seams.**
   - How are `hooks/register.tsx` and its test `hooks/register.test.tsx` structured and run in CI?
   - How is `tools/git-evidence-pi-extension.mjs` registered and loaded by Pi?
   - Which existing module should own the shared rules (for example next to `tools/isswf-plan-core.mjs` or `tools/isswf-snapshot-core.mjs`), given the "No Node imports" constraint noted at `tools/isswf-plan-core.mjs:1`?

## Sources

- `.claude-plugin/types/claude-code/index.d.ts` (ToolCallResult near line 14673, SessionCompactInput near 12083, SkillPromptInput near 13361, classic hook results near 1426-1452).
- `hooks/register.tsx`, `hooks/register.test.tsx`, `hooks/hooks.json`, `.claude-plugin/plugin.json`.
- `tools/git-evidence-pi-extension.mjs`, `tools/isswf-plan-core.mjs`, `tools/isswf-snapshot-core.mjs`, `.github/workflows/quality.yml`.
- Installed Pi documentation: `C:/Users/iseoane/.pi/agent/install/releases/1.5.2/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` and `compaction.md`. Locate the installed `pi-subagents` package under the Pi agent directory, if present.
- `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md` for current host contracts.

## Inputs and bases

- Target base: `7b4b682f05a5d841556dacd97a9eeb5dd0eec3d8`. The document-input checkpoint is the commit that adds this brief; its full SHA is given in the dispatch.
- Plan: `.factory/initiatives/I0057/plan.md`.

## Budget and limits

- One researcher call (`isswf:isswf-researcher`, sonnet, effort unknown), no retries. Read-only: no edits, no shell, no network.
- If a question cannot be answered from these sources, say so and name what evidence would settle it. Do not guess.
