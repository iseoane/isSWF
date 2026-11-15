# I0057/J001 brief-r3: Runtime probes for the hook wiring

## Identity and authorization

- Job and brief revision: I0057/J001, r3. r1 was research ([A001](A001.md), [A002](A002.md)). r2 is merged in PR327 (591af03): the shared validator, its CLI and the strict status exit.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant of 2026-11-14. On 2026-11-15 the operator confirmed that advancing the plan's jobs needs no further go-ahead.
- This revision is a bounded execution probe. It changes nothing in the repository: no edits, no commits, no staging. All probe files live under the worker's session scratch directory or a fresh directory under the system temp directory. The worker returns findings; the coordinator writes `jobs/J001/A006.md` from them.
- Profile: `.agents/roles/worker.md`. The worker owns only its probe directory.

## Objective

- Outcome: observed answers to the three runtime questions that A002 left open. The hook and Pi wiring brief (r4) and the hook guards of J003, J004, J005 and J009 depend on them.
- Size: S (one flow: three probes, each one short headless session).

## Questions (one probe each)

1. **Feedback after a write.** In a Claude Code plugin hooks module, a `tool.call` handler awaits `next(e)` for an Edit or Write and returns the result with an added `context` string (`{ ...result, context }`). Does the model see that text in the same turn? Is the tool result kept unchanged?
2. **Child calls.** When an Agent-tool child runs Bash, does the parent session's plugin `tool.call` handler fire for it? Does the event carry an `agentId` (or an equivalent child identity) and the Bash command text?
3. **After compaction.** Is a `classic.SessionStart` (source `compact`) or the equivalent post-compaction event delivered to a plugin module, and can it add context to the next turn?

For each question, report:

- the exact probe code, or a pointer to it;
- the command line;
- what was observed, quoting output or transcript lines;
- whether the answer is **observed**, **inconclusive** (and why) or **not possible** in a headless run, and what would settle it.

## Method and constraints

- Build a minimal throwaway plugin (manifest plus one hooks module) in the probe directory, modelled on `.claude-plugin/plugin.json`, `hooks/hooks.json` and `hooks/register.tsx`, and typed by `.claude-plugin/types/claude-code/index.d.ts`. Write probe output to a log file in the probe directory, so the observation does not depend on the model's reply.
- Load it only for the probe session, with `claude -p ... --plugin-dir <probe dir>` or the equivalent per-invocation flag. Run from the probe directory, not from this repository.
- Do not change user or project settings or any plugin registration, and do not install anything. If loading needs a settings change, stop and report it as **not possible**.
- Model `haiku` for probe sessions. Use at most 6 headless invocations in total, and add flags that limit turns and tools where available.
- For question 3, if no compaction can be triggered headlessly within that budget, report inconclusive with the reason. Do not loop.
- Afterwards, delete the probe directory, or name it if it must stay as evidence (no secrets, no transcripts of other sessions).

## Required references

- `AGENTS.md`, `.agents/roles/worker.md`, `.agents/hosts/claude-code.md`.
- `docs/en/development.md` "Keep this source checkout separate from an installed release".
- `.factory/initiatives/I0057/jobs/J001/A002.md` (items 1, 2 and 4, and Next action).

## Inputs and bases

- Target base: main at 591af0372885199977a05dddbbeeaa1540ac41ae. The document-input checkpoint is the commit that adds this brief; its full SHA is given in the dispatch.
- Plan: `.factory/initiatives/I0057/plan.md`, job J001.

## Dependencies, ownership and budget

- Runs at the same time as the J006 worker, which is the only writer in the primary checkout. This worker must not edit, stage, commit or switch branches there.
- Budget: 1 worker call, sonnet/medium (preset, set in the dispatch); probe sessions use haiku; no retries.
- Independent review: not required for a probe with no candidate change. The r4 brief built on these findings gets its own review.
