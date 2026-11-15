# I0057/J004 brief-r1: Research for the pre-dispatch guard

## Identity and authorization

- Job and brief revision: I0057/J004, r1. This is read-only research; the implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant of 2026-11-14, confirmed on 2026-11-15.
- Role: `.agents/roles/researcher.md`, read-only. The coordinator writes the findings to `jobs/J004/A001.md`.

## Objective

Settle the design inputs for J004 (plan acceptance), so that r2 can be a single implementation brief:

- Size: S (read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified and what is inferred, and the open limits.

1. **Claude delegation event.**
   - Which fields does a plugin `tool.call` handler see for an `Agent` call? Cover the subagent type, prompt, model, effort, background flag and isolation. Use `.claude-plugin/types/claude-code/index.d.ts`.
   - How does a handler refuse the call and give a reason the model sees?
2. **Pi delegation event.**
   - What is the `pi-subagents` tool name, and which argument fields carry the agent, prompt, model and effort or thinking level? Use the installed package under the Pi agent directory.
   - How does a Pi `tool_call` handler block the call with a reason?
3. **The structured source for the approved model and effort.**
   - Where is the approved selection held today? Cover `.factory/project-setup.md:57`, the `isswf-setup` skill's "Confirm portable factory defaults" table, `.pi/settings.json` and `agents/*.md` `model: inherit`.
   - What did `.factory/models.json` hold, and why did it become legacy (50b502e)?
   - Propose one project-local structured file that a guard on both hosts can parse. Give its path under the state directory (`.isswf/` or `.factory/`), its schema, and how `isswf-setup` would write it.
   - Show how it relates to Pi's own settings without duplicating them, and how a one-dispatch operator override is expressed. The legacy routing must not come back.
4. **The refusal conditions.** For each condition in `.agents/skills/isswf-coordinator/SKILL.md` "Pre-dispatch refusal conditions" (near 152-160), say how a guard checks it mechanically from the call's prompt and the repository:
   - the initiative status is not `observed`;
   - the named brief is not committed;
   - a full checkpoint SHA or base SHA is missing;
   - the job is not `in-progress`.

   For each one, also say which reads a hooks module (`$.fs`, no Node) or a Pi extension can make. Name any condition that needs Git and cannot be checked without running it.
5. **Paths that need a person.** Which files would r2 have to touch that REVIEW.md lists as "Always needs a person"? Does the guard count as "grant and authority code"?

## Sources

- `.claude-plugin/types/claude-code/index.d.ts`, `hooks/register.tsx`, `jobs/J001/A002.md`, `jobs/J001/A006.md`.
- `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/skills/isswf-setup/SKILL.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `.factory/project-setup.md`, `REVIEW.md`.
- The installed Pi documentation, `C:/Users/iseoane/.pi/agent/install/releases/1.5.2/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`, and the installed `pi-subagents` package.
- Git history (`git log` is not available to you; use the A001 and A002 citations, and `.factory/models.json` as read-only legacy evidence).

## Inputs and bases

- Target base: main at dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J004.

## Budget and limits

- One researcher call: `isswf:isswf-researcher`, opus/low, as the operator allowed on 2026-11-14. No retries.
- Read-only: no edits and no shell. If a question cannot be answered from these sources, say so and name the evidence that would settle it.
