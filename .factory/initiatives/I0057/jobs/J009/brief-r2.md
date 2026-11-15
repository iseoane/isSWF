# I0057/J009 brief-r2: Probe Claude session state, process access and worktree HEAD

## Identity and authorization

- Job and brief revision: I0057/J009, r2. r1 was the research ([A001](A001.md)); the implementation brief will be r3.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
- This revision is a bounded execution probe. It changes nothing in the repository: no edits, no commits, no staging, and no branch switch. The worker returns its findings, and the coordinator writes `jobs/J009/A002.md`.
- Profile: `.agents/roles/worker.md`.

## Questions

1. **State across compaction.** In a throwaway hooks module, declare one `$.state` key through `PluginState` merging. Set it on the first `tool.call`, then compact the session (send `/compact` as a user turn through `--input-format stream-json`), and read it on the next `tool.call`. Does the value survive?
2. **Process access.** In the same module, call `$.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])` from `tool.call`, inside a throwaway Git repository. Does it run without a permission prompt in a headless session, and what does it return?
3. **Worktree HEAD.** In a throwaway repository with one linked worktree (`git worktree add`), read `<worktree>/.git` with `$.fs.read`. Then read the `gitdir:` target's `HEAD`. Do both reads work on Windows? Give the exact path forms observed.

For each question, give the probe code, the command, quotes of what was observed, and a verdict: observed, inconclusive or not possible.

## Method and constraints

- Follow the [J001/A006](../J001/A006.md) and [J004/A002](../J004/A002.md) probe constraints:
  - Use a probe directory outside the repository, loaded with `--plugin-dir` only.
  - Do not change any settings or plugin registration, and install nothing.
  - Use haiku for the session.
  - In Git Bash, set `MSYS_NO_PATHCONV=1` for `claude`.
  - Hooks modules have no Node built-ins, so log through `$.fs.write`.
- The throwaway Git repository and worktree live under the probe directory, never in the primary checkout.
- Use at most 3 headless invocations.
- Delete the probe directory, the throwaway repository and the probe-session transcript directories afterwards.

## Inputs and bases

- Target base: dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J009. Research: [A001](A001.md).

## Dependencies, ownership and budget

- This probe runs while another probe and a CI wait are active. It must not edit, stage, commit or switch branches in the primary checkout.
- Budget: 1 worker, sonnet/medium. Probe sessions use haiku. No retries.
- Independent review: not required for a probe with no candidate change.
