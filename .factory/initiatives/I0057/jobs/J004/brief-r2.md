# I0057/J004 brief-r2: Probe the delegation call's model and effort fields

## Identity and authorization

- Job and brief revision: I0057/J004, r2. r1 was read-only research ([A001](A001.md)); the implementation brief will be r3.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant. On 2026-11-15 the operator approved integrating J004, on the condition that each agent has its own model and effort in the selection file.
- This revision is a bounded execution probe. It changes nothing in the repository: no edits, no commits, no staging. The worker returns its findings, and the coordinator writes `jobs/J004/A002.md`.
- Profile: `.agents/roles/worker.md`.

## Questions

1. **Claude.** In a throwaway plugin hooks module (the method of [J001/A006](../J001/A006.md)), log the full input of:
   - `tool.call` for an `Agent` call that passes `subagent_type`, `model`, `effort` and `run_in_background`;
   - `agent.spawn` for the same call.

   Which fields carry the requested model and effort, and under which exact keys?
2. **Claude refusal.** If an `agent.spawn` hook returns `{ deny: "PROBE-DENY" }`, does the child stay unstarted, and does the parent model see the text?
3. **Pi (code only, no live run needed).** Where does pi-subagents 0.83.0 parse a thinking or effort level from the `subagent` call: a model suffix such as `model:high`, or a separate field? Cite path:line in the installed package under `C:/Users/iseoane/.pi/agent/npm/node_modules/pi-subagents/`.

For each question, give the probe code, the command, quotes of what was observed, and the verdict: observed, inconclusive or not possible.

## Method and constraints

- Follow the J001/A006 probe constraints:
  - Use a probe directory outside the repository, loaded with `--plugin-dir` only.
  - Do not change settings or plugin registration, and install nothing.
  - Use haiku for the parent session.
  - In Git Bash, set `MSYS_NO_PATHCONV=1` for `claude`, but not for `pi`.
  - A hooks module has no Node built-ins, so log through `$.fs.write`.
- Use at most 3 headless invocations.
- The child that the probe starts must be cheap: haiku, with one trivial task.
- Delete the probe directory and the probe-session transcript directories afterwards.

## Inputs and bases

- Target base: dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J004. Research: [A001](A001.md).

## Dependencies, ownership and budget

- This probe runs while the J001 review reads the checkout. It must not edit, stage, commit or switch branches in the primary checkout.
- Budget: 1 worker, sonnet/medium. Probe sessions use haiku. No retries.
- Independent review: not required for a probe with no candidate change.
