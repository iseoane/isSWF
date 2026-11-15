# I0057/J009 brief-r1: Research for the commit branch guard

## Identity and authorization

- Job and brief revision: I0057/J009, r1. This is read-only research; the implementation brief will be r2.
- Request mode: feature-to-PR continuation of I0057, under the operator's standing grant of 2026-11-14, confirmed on 2026-11-15.
- Role: `.agents/roles/researcher.md`, read-only. The coordinator writes the findings to `jobs/J009/A001.md`.

## Objective

Settle the design inputs for J009 (plan acceptance), so that r2 can be a single implementation brief.

- Size: S (read-only questions).

## Questions

For each one, give the mechanism, the exact source (path:line), what is verified and what is inferred, and the open limits.

1. **Where the expected branch is kept.**
   - Claude: can a hooks module keep per-session state that survives across tool calls and compaction (`$.state`, session-scoped storage, or another seam)? Use `.claude-plugin/types/claude-code/index.d.ts`. Is there a session start event where the module can read the current branch, given that a hooks module has no Node built-ins and no Git (J001/A006)? Can it read `.git/HEAD` through `$.fs`, including in a linked worktree where `.git` is a file?
   - Pi: which extension events and state let an extension record the branch at session start and keep it per session? Use the installed Pi `docs/extensions.md`.
2. **Observing the session's own switches.** How does the guard see the session's own `git switch` and `git checkout <branch>` calls, and their success, so that the expected branch follows them? In Claude, after `next(e)` in the single `tool.call` hook; in Pi, `tool_result`. How should `git checkout -- <path>`, `git checkout -b`, `git switch -c` and a failed switch be told apart?
3. **Refusing the commit.** Which command forms count as a commit (`git commit`, `git -C <dir> commit`, chained commands)? Which plumbing forms are left as known limits (`git commit-tree`, `git update-ref`, `git merge`, `git rebase`, `git cherry-pick`, `git stash`)? How does the guard read the current branch at refusal time on each host without spawning Git where it cannot?
4. **Child agents.** Should a child agent's commit be checked against the parent's expected branch, or against its own (a child may work in its own worktree)? What do the event shapes allow on each host?
5. **Overlap with J003.** J003 adds Bash command guards to the same hook. Name what both could share, for example one command-tokenising module.
6. **Paths that need a person.** Which files would r2 touch that REVIEW.md lists as "Always needs a person"?

## Sources

- `.claude-plugin/types/claude-code/index.d.ts`, `hooks/register.tsx`, `jobs/J001/A006.md`, `jobs/J001/A007.md`, `jobs/J004/A002.md`.
- `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `REVIEW.md`, `docs/durable-work.md`.
- The installed Pi documentation, `C:/Users/iseoane/.pi/agent/install/releases/1.5.2/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`.
- The working tree is on branch `feat/i0057-j001-record-guard`, where a worker is editing `hooks/register.tsx`. Do not depend on lines that may move.

## Inputs and bases

- Target base: main at dd02e1d9dd6ae68af12e64f5566aecb77e265c61. The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0057/plan.md`, job J009.

## Budget and limits

- One researcher call: `isswf:isswf-researcher`, opus/low, as the operator allowed on 2026-11-14. No retries.
- Read-only: no edits and no shell. If a question cannot be answered from these sources, say so and name the evidence that would settle it.
