# I0057/J005 brief-r2: Probe the remaining Claude routes into the post-compaction turn

## Identity and authorization

- Job and brief revision: I0057/J005, r2. r1 was the first probe ([A001](A001.md)). The implementation brief will be r3.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant.
- This revision is a bounded execution probe. It changes nothing in the repository: no edits, no commits, no staging and no branch switch. The worker returns its findings, and the coordinator writes `jobs/J005/A002.md`.
- Profile: `.agents/roles/worker.md`.

## Questions

Each route must put a marker text, for example `PROBE-R2-<letter>`, in front of the model on the first turn after a manual `/compact`. Then ask the model to quote every PROBE line it sees.

1. **`$.session.append`** (`.claude-plugin/types/claude-code/index.d.ts` near 3091-3098). From a `session.compact` hook, after `next(e)`, append one user message with the marker. Does the model see it?
2. **SessionStart `reloadSkills`** (`index.d.ts:1378-1380`, `:1428`). Use a plugin hooks entry for `SessionStart` with the `compact` source, through the plugin's supported hook form, not user or project settings. Have it return `hookSpecificOutput.reloadSkills: true` together with an `additionalContext` marker. After the compaction, is a probe skill's text, or the marker, in front of the model?
3. **`skill.prompt` after compaction.** If a skill is invoked again after the compaction, does its text reach the model? A plain skill reload is the fallback the coordinator would point to.
4. **Trigger values.** Which `trigger` values appear for an automatic compaction? Answer from the types only; do not force one live.

For each question, give the probe code, the command, quotes of what was observed, and a verdict: observed, inconclusive or not possible.

## Method and constraints

- Follow the probe constraints in [J005/A001](A001.md) and [J009/A002](../J009/A002.md):
  - Use a probe directory outside the repository, loaded with `--plugin-dir` only.
  - Do not change settings or plugin registration, and install nothing.
  - Use haiku for the session.
  - In Git Bash, set `MSYS_NO_PATHCONV=1` for `claude`.
  - Log through `$.fs.write`.
  - Stage the turns with stdin held open and bounded waits between them.
- Use at most 3 headless invocations.
- Delete the probe directory and the probe-session transcript directories afterwards.
- Script with node, not python heredocs (two of those hung today).

## Inputs and bases

- Target base: 3f18562fa84c1db05468807e184a433124935727. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J005.

## Dependencies, ownership and budget

- This probe runs while a read-only review of J004 is active. It must not edit, stage, commit or switch branches in the primary checkout.
- Budget: 1 worker, sonnet/medium. Probe sessions use haiku. No retries.
- Independent review: not required for a probe with no candidate change.
