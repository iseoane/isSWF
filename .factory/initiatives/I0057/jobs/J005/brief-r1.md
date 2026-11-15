# I0057/J005 brief-r1: Probe compaction steering and post-compaction context

## Identity and authorization

- Job and brief revision: I0057/J005, r1. The implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
- This revision is a bounded execution probe and code reading. It changes nothing in the repository: no edits, no commits, no staging and no branch switch. The worker returns its findings, and the coordinator writes `jobs/J005/A001.md`.
- Profile: `.agents/roles/worker.md`.

## Questions

1. **Claude `session.compact`.** The event can rewrite `instructions` on the way down and the returned `messages` on the way up (`.claude-plugin/types/claude-code/index.d.ts:4706-4716`, `SessionCompactInput` near 12083, `SessionCompactResult` near 12121).
   - In a throwaway hooks module, add a line to `instructions`, for example "Keep the token PROBE-KEEP-7 verbatim". Does the summary contain it?
   - After `next(e)`, append one user message to `messages`, for example "PROBE-AFTER: reload the coordinator skill". Does the model see it on the first turn after the compaction? Ask the model to quote any PROBE text it sees.
   - Is the hook called for a manual `/compact`, and what `trigger` value does it carry?
2. **Claude, coordinator-only.** Can a hooks module tell whether the coordinator skill was active in the session? Look for a skill-load event or a field in the types; `$.state` survives compaction (J009/A002). Code reading is enough here. Give the event name and fields, or say that none exists.
3. **Pi, code only.** In the installed Pi 1.5.2 `docs/extensions.md`, find the event to use for each step and its fields, citing path:line:
   - steering the compaction summary: `session_before_compact` or the equivalent;
   - adding a message or context to the first turn after it: `before_agent_start`, `context`, `pi.sendMessage` or the equivalent;
   - detecting that a skill was loaded.

   No live Pi run is needed.

For each question, give the probe code or citation, the command, quotes of what was observed, and the verdict: observed, inconclusive or not possible.

## Method and constraints

- Follow the J001/A006, J004/A002 and J009/A002 probe constraints:
  - Use a probe directory outside the repository, loaded with `--plugin-dir` only.
  - Do not change settings or plugin registration, and install nothing.
  - Use haiku for the session.
  - In Git Bash, set `MSYS_NO_PATHCONV=1` for `claude`.
  - A hooks module has no Node built-ins, so log through `$.fs.write`.
- Staged stream-json turns need a stdin that stays open and bounded sleeps between turns (J009/A002), so that `/compact` lands between the turns.
- Use at most 3 headless invocations.
- Delete the probe directory and the probe-session transcript directories afterwards.

## Inputs and bases

- Target base: dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J005.

## Dependencies, ownership and budget

- This probe runs while other work is active. It must not edit, stage, commit or switch branches in the primary checkout.
- Budget: 1 worker, sonnet/medium. The probe sessions use haiku. No retries.
- Independent review: not required for a probe with no candidate change.
