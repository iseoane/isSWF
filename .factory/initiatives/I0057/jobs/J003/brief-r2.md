# I0057/J003 brief-r2: Probe Claude shell directory and error behaviour

## Identity and authorization

- Job and brief revision: I0057/J003, r2.
  - r1 was the research ([A001](A001.md)).
  - The implementation brief will be r3.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
- This revision is a bounded execution probe. It changes nothing in the repository: no edits, no commits, no staging and no branch switch. The worker returns its findings, and the coordinator writes `jobs/J003/A002.md`.
- Profile: `.agents/roles/worker.md`.

## Questions

1. **`cd` persistence.** Run a Bash call `cd ..`, then a separate Bash call `pwd`, in one headless Claude session. Does the second call print the parent directory?
2. **Session directory.** From a throwaway hooks module, log `$.session.cwd()` and `$.session.root()` in `tool.call` before and after each of those calls. Does `cwd()` follow the shell `cd`? Is `root()` unchanged?
3. **Nonzero exit.** For a Bash call `exit 3`, log the `ran` value after `next(e)`. Is `isError` true? Which keys carry the exit status and the output?
4. **PowerShell tool.** On this Windows host, does the session list a PowerShell tool? If it does, give its exact tool name and the field that holds the command, from one logged `tool.call` event. If it does not, say so.

For each question, give the probe code, the command, quotes of what was observed, and the verdict: observed, inconclusive or not possible.

## Method and constraints

- Follow the [J001/A006](../J001/A006.md) and [J004/A002](../J004/A002.md) probe constraints:
  - Use a probe directory outside the repository, loaded with `--plugin-dir` only.
  - Do not change settings or plugin registration, and install nothing.
  - Use haiku for the session.
  - In Git Bash, set `MSYS_NO_PATHCONV=1` for `claude`.
  - A hooks module has no Node built-ins, so log through `$.fs.write`.
  - Use `--input-format stream-json` when one session needs several turns.
- Use at most 3 headless invocations.
- Delete the probe directory and the probe-session transcript directories afterwards.

## Inputs and bases

- Target base: dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J003. Research: [A001](A001.md).

## Dependencies, ownership and budget

- This probe runs while another probe and a CI wait are active. It must not edit, stage, commit or switch branches in the primary checkout.
- Budget: 1 worker, sonnet/medium. Probe sessions use haiku. No retries.
- Independent review: not required for a probe with no candidate change.
