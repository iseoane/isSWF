# I0057/J003 brief-r1: Research for the shell command guards

## Identity and authorization

- Job and brief revision: I0057/J003, r1. This is read-only research; the implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant of 2026-11-14, confirmed on 2026-11-15.
- Role: `.agents/roles/researcher.md`, read-only. The coordinator writes the findings to `jobs/J003/A001.md`.

## Objective

Settle the design inputs for J003 (plan acceptance), so that r2 can be a single implementation brief.

- Size: S (read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified and what is inferred, and the open limits.

1. **Claude Bash interception.**
   - Since J001 r4, `hooks/register.tsx` has a single unmatched `tool.call` hook, and the engine refuses a second one (J001/A006, A007). How would a Bash guard join that hook and deny before `next(e)`? Which field holds the command text?
   - Does the same hook see child agents' Bash calls? A006 says the parent handler sees them with `agentId`; confirm the shape from A006 and the types.
   - Is there a way to observe or reset the session working directory after a `cd`, for example a `cwd` field on the event, `$.session`, or the Bash tool's own result? Use `.claude-plugin/types/claude-code/index.d.ts`.
2. **Pi bash interception.**
   - Which event and fields does a Pi extension use to block a `bash` call with a reason, in the main session and in child agents? Use the installed Pi `docs/extensions.md` and, for children, the J001 r4 mechanism (`subagentOnlyExtensions`).
   - Does Pi keep a persistent shell working directory across bash calls at all? If not, say that the `cd` acceptance does not apply to Pi.
3. **Command matching.** For each acceptance pattern, propose a matcher over the command text and list the evasions it cannot see:
   - `cd` that leaves the project root: an absolute or relative target, `cd ..`, `pushd`, chained commands (`&&`, `;`), and subshells `( cd x && ... )`, which do not persist. Is it better to refuse the `cd` or to allow it and restore the directory after the call?
   - continuous CI waiting: `gh pr checks --watch`, `gh run watch`, and `until`/`while` loops with `sleep` around `gh`. One bounded `sleep N; gh pr checks` must stay allowed (feature-delivery.md:63).
   - package acquisition: `npx`, `npm install`/`npm i`/`npm ci`, `pnpm dlx`/`pnpm add`, `yarn dlx`, `bunx`, `pip install`, `uvx`. Should `npm ci --prefix tooling/quality --ignore-scripts`, which the development guide documents, stay allowed? Cite `docs/en/development.md` "Quality checks".
4. **Refusal text.** What alternatives must each refusal name? Use feature-delivery.md for the CI wait, and the development guide for the local lint commands.
5. **Overlap with J009.** J009 guards `git commit` against an unexpected branch in the same Bash hook. Name anything J003 r2 should leave open so that both can share one matcher module.
6. **Paths that need a person.** Which files would r2 touch that REVIEW.md lists as "Always needs a person"?

## Sources

- `.claude-plugin/types/claude-code/index.d.ts`, `hooks/register.tsx`, `tools/isswf-record-guard-core.mjs`, `tools/isswf-record-guard-pi-extension.mjs`, `jobs/J001/A006.md`, `jobs/J001/A007.md`.
- `.agents/roles/references/feature-delivery.md`, `docs/en/development.md`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `REVIEW.md`.
- The installed Pi documentation, `C:/Users/iseoane/.pi/agent/install/releases/1.5.2/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`, and the installed `pi-subagents` package under `C:/Users/iseoane/.pi/agent/npm/node_modules/pi-subagents/`.
- The working tree is on branch `feat/i0057-j001-record-guard`, where a worker is editing `hooks/register.tsx` and `.agents/hosts/pi/agents/isswf-planner.md`. Read those as of the J001 r4 candidate described in A007; do not depend on lines that may move.

## Inputs and bases

- Target base: main at dd02e1d9dd6ae68af12e64f5566aecb77e265c61, with J001 r4 merged later. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J003.

## Budget and limits

- One researcher call: `isswf:isswf-researcher`, opus/low, as the operator allowed on 2026-11-14. No retries.
- Read-only: no edits and no shell. If a question cannot be answered from these sources, say so and name the evidence that would settle it.
